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
    ['sa','sanskrit'],
    ['ta','tamil'],
    ['bo','tibetan'],
    ['pi','pali'],
    ['si','sinhalese'],
  ]);

  const doclang = doc.documentElement.getAttribute('xml:lang')?.split('-')[0];
  const lang = langmap.get(doclang);
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

const detectTokenization = (eddecl,lang='sa') => {
  const ish = lang === 'bo' ? 'wylish' : 'slpish';
  const charset = lang === 'bo' ? wylie : iast;
  const specified = eddecl?.querySelector('segmentation > ab[type="tokenization"]')?.innerHTML;
  if(specified) return specified;

  const line = _state.xml.querySelector('text');
  const tokenized = [...line.querySelectorAll('w')].map(w => {
    const lem = w.getAttribute('lemma');
    if(lem) return Sanscript.t(lem,'iast',ish);
    return Sanscript.t(w.textContent,'iast',ish);
  },'').filter(w => w);
  const smushed = tokenized.join('');
  
  const char = charSplit(smushed,charset);
  if(arrayEqual(char,tokenized)) return 'character';

  const aksara = aksaraSplit(smushed,charset).map(c => c.join(''));
  if(arrayEqual(aksara,tokenized)) return 'aksara';

  const grapheme = graphemeSplit(smushed,charset).map(c => c.join(''));
  if(arrayEqual(grapheme,tokenized)) return 'grapheme';
  
  return 'whitespace';
};

const getAcPcSigla = (revisedsigla,xml) => {
  const listwit = xml.querySelector('teiHeader > listWit');
  if(!listwit) return new Set();
  
  const acpcsigla = new Set();
  for(const siglum of revisedsigla) {
    const wit = listwit.querySelector(`witness[*|id='${siglum}']`);
      if(!wit) continue;
      const acsig = wit.querySelector('witness[n="ac"]')?.getAttribute('xml:id');
      const pcsig = wit.querySelector('witness[n="pc"]')?.getAttribute('xml:id');
      if(acsig) acpcsigla.add(acsig);
      if(pcsig) acpcsigla.add(pcsig);
  }
  return acpcsigla;
};

const realignPreflight = (selectedsigla,blockid) => {
  const lang = _state.xml.documentElement.getAttribute('xml:lang')?.split('-')[0];
  const eddecl = _state.xml.querySelector('editorialDecl');

  const targeted = eddecl?.querySelector('segmentation > ab[type="targetedition"]')?.textContent || _state.xml.querySelector('TEI').getAttribute('n');
  const tokenization = detectTokenization(eddecl,lang);
              'character';
  const tagfilters = getTagFilters(eddecl);
  const recursive = eddecl?.querySelector('segmentation > ab[type="scoring"] > ab[type="recursive"]')?.innerHTML || false;
  const scores = getScores(eddecl);

  const selectedtexts = [...selectedsigla].map(s => {return {siglum: s, text: _state.textsinfo.get(s)};});
  const toadd = preProcess(blockid, selectedtexts,
      {splitfunc: findSplitfunc(tokenization), selectedfilters: getFilterIndices(_state.xml), ignoretags: tagfilters}
  )

  const sigla = new Set(toadd.map(t => t.siglum)); 
  // ac/pc might get merged into main
  const ignoresigla = getAcPcSigla(sigla,_state.xml);

  const opts = { 
    scores: scores, 
    tokenization: tokenization, 
    recursive: recursive, 
    lang: lang,
    targeted: targeted
  };
  
  return [toadd, ignoresigla, opts];
  /*
  const oldtexts = [..._state.xml.querySelectorAll('TEI')].map(tei => {
    const siglum = tei.getAttribute('n');
    if(ignoresigla.has(siglum)) return null;

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
  */
  /*
  const ma = new MultiAligner(configfunc,scores);
  const alignment = ma.alignAppend(oldtexts,toaddobjs);
  */
};

const realign = (toadd,ignoresigla,opts) => {
  const toaddobjs = toadd.map(t => {
    return {siglum: t.siglum, textobj: 
      t.text.map(tt => {return {norm: tt};})
    };
  });

  const filtersmap = new Map(toadd.map(t => [t.siglum,t.filters]));

  const configfunc = opts.tokenization === 'character' ? 'character' :
      opts.recursive ? 'arr' : 'arr_simple';
  const revisedsigla = new Set(toaddobjs.map(t => t.siglum)); 
  const ish = opts.lang === 'bo' ? 'wylish' : 'slpish';
  const charset = opts.lang === 'bo' ? wylish : slpish;
  const oldtexts = [..._state.xml.querySelectorAll('TEI')].map(tei => {
    const siglum = tei.getAttribute('n');
    if(ignoresigla.has(siglum)) return null;

    const textobj = [...tei.querySelectorAll('w')].map(w => {
      const ret = {};
      const cl = w.closest('cl');
      if(cl) {
        if(cl.firstElementChild === w)
          ret.clstart = true;
        else if(cl.lastElementChild === w)
          ret.clend = true;
      }
      ret.unnorm = Sanscript.t(w.innerHTML,'iast',ish);
      const lemma = w.getAttribute('lemma');
      ret.norm = lemma === null ? ret.unnorm : lemma; 
      ret.norm = Sanscript.t(ret.norm,'iast',ish);
      if(opts.tokenization !== 'character' && opts.recursive === 'true')
        ret.norm = charSplit(ret.norm,charset);
      return ret;
    });
    return {siglum: siglum, textobj: textobj};
  }).filter(e => e);
  const alignWorker = new Worker(new URL('./realignworker.mjs',import.meta.url),{type: 'module'});
  alignWorker.postMessage([JSON.stringify(oldtexts),JSON.stringify(toaddobjs),configfunc,opts.scores]);

  const ret = {};

  const getFirstSiglum = (arr,ignoreset) => {
    for(const obj of arr) {
      if(!ignoreset.has(obj.siglum))
        return obj.siglum;
    }
    return arr[0].siglum;
  };

  alignWorker.onmessage = e => {
    if(e.data.hasOwnProperty('progress')) {
      // TODO: do something with e.data.message
      return;
    }
    const alignment = JSON.parse(e.data);
    const meta = {
      tokenization: opts.tokenization,
      lang: opts.lang,
      targeted: revisedsigla.has(opts.targeted) ? getFirstSiglum(oldtexts,revisedsigla) : opts.targeted
    };
    const clean = postProcess(alignment, 
                              filtersmap,
                              meta);
    const newwits = makeWitList(_state.textsinfo);

    ret.rows = clean;
    ret.tree = alignment.tree;
    ret.witnesses = newwits;
    const bc = new BroadcastChannel('realigner');
    bc.postMessage('done');
    bc.close();
  };
  return ret;
};

const postProcess = (alignment, filtersmap, meta) => {
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
    if(id === meta.targeted) targetrow = alignment.alignment[index];
    const f = filtersmap.get(id);
    if(!f) {
      const newrow = row.map(c => {
        if(Array.isArray(c))
          return c.map(cc => untransliterate(cc,meta.lang));
        return untransliterate(c,meta.lang);
      });
      newclean.push({siglum: id, text: newrow});
      continue;
    }
    const unfiltered = cleanup1(unfilterAll(row,f));
    const ret = new Array(unfiltered.length);
    for(let n=0;n<unfiltered.length;n++) {
      if(unfiltered[n] === row[n])
        ret[n] = untransliterate(unfiltered[n],meta.lang);
      else
        ret[n] = [untransliterate(unfiltered[n],meta.lang),untransliterate(row[n],meta.lang)];
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
  realign: realign,
  realignPreflight: realignPreflight
};

export default Realigner;
