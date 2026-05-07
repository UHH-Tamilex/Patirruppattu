import { charSplit, aksaraSplit, graphemeSplit, slpish } from '../saktumivalib/split.mjs';
import { parseString, readOne } from '../saktumivalib/browserutils.mjs';
import { processFile, preProcess, findSplitfunc, cleanup1, cleanup2, makeWitList } from '../saktumivalib/collate.mjs';
import { filters, unfilterAll } from '../saktumivalib/normalize.mjs';
import tagstoignore from '../saktumivalib/tagfilters.mjs';
import Sanscript from '../saktumivalib/sanscript.mjs';
//import MultiAligner from '../saktumivalib/multialign.mjs';

var _state = {};

const getFilterIndices = doc => {
  const ret = [];
  const groups = ['general'];

  const langmap = new Map([
    ['ta','tamil'],
    ['ta-Latn','tamil'],
    ['ta-Taml','tamil'],
    ['sa','sanskrit'],
    ['sa-Latn','sanskrit'],
    ['pi','pali'],
    ['bo','tibetan']
    ]);

  const lang = langmap.get(doc.documentElement.getAttribute('xml:lang'));
  if(lang) groups.push(lang);

  const markupel = doc.querySelector('normalization[method="markup"]');
  const tagnames = markupel ? 
    [...markupel.querySelectorAll('ab')].map(ab => ab.textContent) : 
    undefined;  
  
  for(const [i, filter] of filters.entries()) {
    if(groups.includes(filter.group)) {
      if(!tagnames)
        ret.push(i);
      else if(tagnames.includes(filter.name))
        ret.push(i);
    }
  }

  return ret;
};

const getTagFilters = eddecl => {
  if(eddecl) {
    return [...eddecl.querySelectorAll('ab[type="tagfilters"] tag[subtype="ignore"]')].map(t => t.textContent);
  }
  else return tagstoignore;
};

const getScores = eddecl => {
  const scoringel = eddecl?.querySelector('segmentation > ab[type="scoring"]');
  if(scoringel) {
    return {
      match: parseFloat(scoringel.querySelector('ab[type="match"]').textContent),
      mismatch: parseFloat(scoringel.querySelector('ab[type="mismatch"]').textContent),
      gap_open: parseFloat(scoringel.querySelector('ab[type="gapopen"]').textContent),
      gap_extend: parseFloat(scoringel.querySelector('ab[type="gapextend"]').textContent),
      recursive: scoringel.querySelector('ab[type="recursive"]').textContent === 'true' ? true : false,
      //realigndepth: opts.hasOwnProperty('realigndepth') ? opts.realigndepth : parseInt(scoringel.querySelector('ab[type="realigndepth"]').textContent),
      realigndepth: 0,
      prop: 'norm'
    };
  }
  else return {
    match: 1,
    mismatch: -1,
    gap_open: -2,
    gap_extend: -0.25,
    recursive: false,
    realigndepth: 0,
    prop: 'norm'
  }
};

const arrayEqual = (a1, a2) => {
  if(a1.length !== a2.length) return false;
  for(let n=0;n<a1.length;n++)
    if(a1[n] !== a2[n]) return false;
  return true;
};

const detectTokenization = eddecl => {
  const specified = eddecl?.querySelector('segmentation > ab[type="tokenization"]')?.innerHTML;
  if(specified) return specified;

  const line = _state.xml.querySelector('text');
  const tokenized = [...line.querySelectorAll('w')].map(w => {
    const lem = w.getAttribute('lemma');
    if(lem) return Sanscript.t(lem,'iast','slpish');
    return Sanscript.t(w.textContent,'iast','slpish');
  },'').filter(w => w);

  const smushed = tokenized.join('');
  
  const char = charSplit(smushed);
  if(arrayEqual(char,tokenized)) return 'character';

  const aksara = aksaraSplit(smushed).map(c => c.join(''));
  if(arrayEqual(aksara,tokenized)) return 'aksara';

  const grapheme = graphemeSplit(smushed).map(c => c.join(''));
  if(arrayEqual(grapheme,tokenized)) return 'grapheme';
  
  return 'whitespace';
};

const realign = (newtexts,selectedsigla,blockid/*,opts*/) => {
  const eddecl = _state.xml.querySelector('editorialDecl');

  const targeted = eddecl?.querySelector('segmentation > ab[type="targetedition"]')?.textContent || _state.xml.querySelector('TEI').getAttribute('n');
  const tok = detectTokenization(eddecl);
              'character';
  const tagfilters = getTagFilters(eddecl);
  const recursive = eddecl?.querySelector('segmentation > ab[type="scoring"] > ab[type="recursive"]')?.innerHTML || false;
  const configfunc = tok === 'character' ? 'character' :
      recursive ? 'arr' : 'arr_simple';
  const scores = getScores(eddecl);

  const selectedtexts = [...selectedsigla].map(s => {return {siglum: s, text: newtexts.get(s)};});
  const toadd = preProcess(blockid, selectedtexts,
      {splitfunc: findSplitfunc(tok), selectedfilters: getFilterIndices(_state.xml), ignoretags: tagfilters}
  )
  const toaddobjs = toadd.map(t => {
    return {siglum: t.siglum, textobj: 
      t.text.map(tt => {return {norm: tt};})
    };
  });
  const revisedsigla = new Set(toadd.map(t => t.siglum)); // ac/pc might get merged into main

  const filtersmap = new Map(toadd.map(t => [t.siglum,t.filters]));

  const oldtexts = [..._state.xml.querySelectorAll('TEI')].map(tei => {
    const siglum = tei.getAttribute('n');
    if(revisedsigla.has(siglum)) return null;

    const textobj = [...tei.querySelectorAll('w')].map(w => {
      const ret = {};
      const cl = w.closest('cl');
      if(cl) {
        if(cl.firstElementChild === w)
          ret.clstart = true;
        else if(cl.lastElementChild === w)
          ret.clend = true;
      }
      ret.unnorm = Sanscript.t(w.innerHTML,'iast','slpish');
      const lemma = w.getAttribute('lemma');
      ret.norm = lemma === null ? ret.unnorm : lemma; 
      ret.norm = Sanscript.t(ret.norm,'iast','slpish');
      // TODO: deal with Tibetan 
      if(tok !== 'character' && recursive === 'true')
        ret.norm = charSplit(ret.norm,slpish);
      return ret;
    });
    return {siglum: siglum, textobj: textobj};
  }).filter(e => e);
  const alignWorker = new Worker('./lib/realignworker.mjs',{type: 'module'});
  alignWorker.postMessage([JSON.stringify(oldtexts),JSON.stringify(toaddobjs),configfunc,scores]);
  const ret = {};
  const meta = {
    tokenization: tok,
  };
  alignWorker.onmessage = e => {
    if(e.data.hasOwnProperty('progress')) {
      //console.log(e.data.progress);
      return;
    }
    const alignment = JSON.parse(e.data);
    const clean = postProcess(alignment, 
                              filtersmap,
                              meta,
                              revisedsigla.has(targeted) ? oldtexts[0].siglum : targeted);
    const newwits = makeWitList(newtexts);
    
    ret.rows = clean;
    ret.tree = alignment.tree;
    ret.witnesses = newwits;
    const bc = new BroadcastChannel('realigner');
    bc.postMessage('done');
    bc.close();
  };
  return ret;
  /*
  const ma = new MultiAligner(configfunc,scores);
  const alignment = ma.alignAppend(oldtexts,toaddobjs);
  */
};

const untransliterate = (str, lang='sa') => {
  // TODO: deal with Tibetan
  if(lang === 'bo') return str;
  if(Array.isArray(str))
    for(let m=0;m<str.length;m++)
      str[m] = Sanscript.t(str[m],'slpish','iast');
  else
    str = Sanscript.t(str,'slpish','iast');
  return str;
};

const postProcess = (alignment, filtersmap, meta, targeted) => {
  const clean = alignment.alignment.map(arr => arr.map(obj => {
    const norm = Array.isArray(obj.norm) ?  obj.norm.join('') : obj.norm;
    if(!obj.hasOwnProperty('unnorm')) return norm;

    const unnorm = Array.isArray(obj.unnorm) ? obj.unnorm.join('') : obj.unnorm;
    if(norm === unnorm) return unnorm;

    return [unnorm,norm];
  }));
  const newclean = [];
  let targetrow = alignment.alignment[0];
  for(const [index, row] of clean.entries()) {
    const id = alignment.sigla.shift();
    if(id === targeted) targetrow = alignment.alignment[index];
    const f = filtersmap.get(id);
    if(!f) {
      const newrow = row.map(c => {
        if(Array.isArray(c))
          return c.map(cc => untransliterate(cc));
        return untransliterate(c);
      });
      newclean.push({siglum: id, text: newrow});
      continue;
    }
    const unfiltered = cleanup1(unfilterAll(row,f));
    const ret = new Array(unfiltered.length);
    for(let n=0;n<unfiltered.length;n++) {
      if(unfiltered[n] === row[n])
        ret[n] = untransliterate(unfiltered[n]);
      else
        ret[n] = [untransliterate(unfiltered[n]),untransliterate(row[n])];
    }
    newclean.push({siglum: id, text: ret});
    cleanup2(newclean, meta);
  }
  const xml = restoreGroups(newclean, targetrow);
  //TODO: restore groups from targeted
  return xml;
};

const restoreGroups = (alignment, ref) => {
  const NS = _state.xml.documentElement.namespaceURI;
  const ret = [];
  for(const row of alignment) {
    let cl = null;   
    let forcecl = false;
    const text = _state.xml.createElementNS(NS,'text');

    for(const [index, entry] of ref.entries()) {
      const w = _state.xml.createElementNS(NS,'w');
      w.setAttribute('n',index);

      const item = row.text[index];
      if(Array.isArray(item)) {
        w.append(item[0]);
        w.setAttribute('lemma',item[1]);
      }
      else
        w.append(item);

      if(entry.hasOwnProperty('clstart') || forcecl) {
        if(cl) text.appendChild(cl);
        cl = _state.xml.createElementNS(NS,'cl');
        cl.appendChild(w);
        forcecl = false;
      }
      else if(entry.hasOwnProperty('clend')) {
          cl.appendChild(w);
          text.appendChild(cl);
          forcecl = true;
          cl = null;
      }
      else if(cl)
        cl.appendChild(w);
      else
        text.appendChild(w);
    }
    if(cl) text.appendChild(cl);
    ret.push({siglum: row.siglum, text: text});
  }
  return ret;
};

const Realigner = {
  init: state => {_state = state;},
  realign: realign
};

export default Realigner;
