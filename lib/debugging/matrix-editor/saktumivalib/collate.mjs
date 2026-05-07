import { filterAll, unfilterAll } from './normalize.mjs';
import { slpish, wylish, aksaraSplit, graphemeSplit, charSplit } from './split.mjs';
import { parseString } from './browserutils.mjs';
import Sanscript from './sanscript.mjs';
import EwtsConverter from './EwtsConverter.mjs';

// TODO: make this work for CLI
const serializeXML = doc => {
  const serializer = new XMLSerializer();
  return serializer.serializeToString(doc);
};

const findSplitfunc = tok => {
    switch(tok) { // TODO: use whitespaceSplit?
        case 'whitespace': return (str) => str.split(/\s+/g).map((s,i,arr) => i > 0 ? ' ' + s : s);
        case 'aksara': return aksaraSplit;
        case 'grapheme': return graphemeSplit;
        default: return charSplit;
    }
};

const processTags = (text,tagstodelete,missingchar,spacechar) => {
    if(tagstodelete.length > 0)
      for(const todel of text.querySelectorAll(tagstodelete.join(',')))
          todel.remove();
    
    for(const gap of [...text.querySelectorAll('gap')]) {
        const reason = gap.getAttribute('reason');
        if(reason && reason === 'ellipsis') continue;
        gap.replaceWith(missingchar.repeat(gap.getAttribute('quantity') || 1));
    }

    for(const peyyala of [...text.querySelectorAll('metamark[function="peyyāla"]')]) {
      // TODO: figure this out
      peyyala.replaceWith(spacechar);
    }

	for(const nobreak of text.querySelectorAll('pb[break="no"],lb[break="no"]')) {
		const prev = nobreak.previousSibling;
		if(!prev || prev.nodeType !== 3) continue;
		prev.data = prev.data.trimRight();
	}

};
const detectScript = str => {
    const ranges = new Map([
        ['tamil', /[\u0b80-\u0bff]/u],
        ['devanagari', /[\u0900-\u097f]/u],
        ['bengali', /[\u0980-\u09ff]/u],
        ['telugu', /[\u0c00-\u0c7f]/u],
        ['malayalam',/[\u0d00-\u0d7f]/u],
        ['sarada',/[𑆃-𑆲]/u],
        ['grantha',/[𑌅-𑌹]/u],
        ['newa',/[𑐀-𑐴]/u],
        ['tibetan',/[ༀ-࿚]/u]
    ]);

    for(const [name,range] of ranges)
        if(range.test(str)) return name;

    return 'iast';
};

const witshave = (arr1, arr2) => {
  for(const a2 of arr2) {
    if(arr1.includes(a2)) return true;
  }
  return false;
};

const reduceDuplicateWits = (arr,app) => {
  // first item in arr is the actual ms siglum, rest are collective sigla
  const allwits = [...app.querySelectorAll('[wit]')].reduce((acc,cur) => {
      for(const wit of cur.getAttribute('wit').split(/\s+/)) acc.add(wit);
      return acc;
      
    },new Set());
  for(const a of arr)
    if(allwits.has(a)) return [a];
  return arr;
};

const scriptandfilter = (el,type,filters,lang) => {
  const clone = el.cloneNode(true);
  const dels = clone.querySelectorAll('del');
  const adds = clone.querySelectorAll('add');
  const rdgs = clone.querySelectorAll('rdg');
  if(type === 'ac') {
      for(const add of adds) add.remove();
      for(const rdg of rdgs) rdg.remove();
  }
  else if(type === 'pc') {
      for(const del of dels) del.remove();
      for(const rdg of rdgs) rdg.remove();
  }
  else if(type === 'lem') { // pc lemma reading
      for(const del of dels) del.remove();
      for(const rdg of rdgs) rdg.remove();
  }
  else if(type !== undefined) {
      const typearr = !Array.isArray(type) ? [type] : type;
      for(const del of dels) del.remove(); // pc variant reading
      for(const app of clone.querySelectorAll('app')) {
          const lem = app.querySelector('lem');
          const rdgs = app.querySelectorAll('rdg');
          const witaliases = typearr.length === 1 ? typearr :
            reduceDuplicateWits(typearr,app);

          let foundreading = false;
          for(const rdg of rdgs) {
              const wits = rdg.getAttribute('wit')?.split(/\s+/);
              if(!wits) {
                rdg.remove();
                continue;
              }
              if(witshave(wits,witaliases))
                foundreading = true;
              else
                rdg.remove();
          }
          if(foundreading) lem.remove();
      }
  }
  const str = clone.textContent;

  const script = detectScript(str);
  
  const charset = lang === 'bo' || lang.startsWith('bo-') ? wylish : slpish;
  
  let transliterated;
  if(script === 'tibetan') {
      const ewts = new EwtsConverter({fix_spacing: true, pass_through: true,fix_sloppy: false});
      transliterated = ewts.to_ewts(str.toLowerCase()
                 .replaceAll('ༀ','om̐'))
                 .replaceAll(/[rl]-[iI]/g,(m) => {
                      switch (m) {
                          case 'r-i':
                              return 'ṛ';
                          case 'r-I':
                              return 'ṝ';
                          case 'l-i': 
                              return 'l̥';
                          default:
                              return 'l̥̄';
                      }
                 }).replaceAll(/([gṭḍbd])\+h/g,'$1h');
  }
  else
    //transliterated = script !== 'iast' ? Sanscript.t(str,script,'iast') : str;
    transliterated = charset === wylish ? Sanscript.t(str.toLowerCase(),'wylie','wylish') :
                                         Sanscript.t(str.toLowerCase(),script,'slpish');
    return [...filterAll(transliterated.replaceAll(/\s+/g,' '),filters),charset];
};

const preProcess = (block, texts, opts) => {
    const selectedfilters = opts.selectedfilters;
    const splitfunc = opts.splitfunc;
    const idsel = opts.idsel || '*|id';
    const langsel = opts.langsel || '*|lang';
    const ignoretags = opts.ignoretags || [];
    const missingchar = opts.missingchar || '‡';
    const spacechar = opts.spacechar || '⊔';

    const ret = [];
    for(const text of texts) {
        const {textel, type, par} = text.text;
        const siglum = text.siglum;
        let blockel = textel.querySelector(`*[${idsel}="${block}"], *[corresp="#${block}"]`);
        if(!blockel) continue;

        const lang = blockel.closest(`[${langsel}]`)?.getAttribute('xml:lang');

        // TODO: is there a better way
        blockel = (blockel.querySelector('*[type="edition"]') || blockel).cloneNode(true);

        processTags(blockel,ignoretags,missingchar,spacechar);
        if(type) {
            if( (type === 'ac' || type == 'pc') ) {
                const acpc = blockel.querySelector('add, del');
                if(!acpc) {
                    if(type === 'ac') {
                        const [clean,filters,charset] = scriptandfilter(blockel,'lem',selectedfilters,lang);
                        ret.push({siglum: par, text: splitfunc(clean,charset), filters: filters, lang: lang});
                    }
                    continue;
                }
            }
            else if(type !== 'lem') {
                let rdg;
                if(text.text.collectives) {
                    for(const t of [type,...text.text.collectives]) {
                        rdg = blockel.querySelector(`rdg[wit~="${t}"]`);
                        if(rdg) break;
                    }
                }
                else
                    rdg = blockel.querySelector(`rdg[wit~="${type}"]`);
                if(!rdg) continue;
            }
        }
        const [clean,filters,charset] = text.text.collectives ?
          scriptandfilter(blockel,[type,...text.text.collectives],selectedfilters,lang) :
          scriptandfilter(blockel,type,selectedfilters,lang);
        ret.push({siglum: siglum, text: splitfunc(clean,charset), filters: filters, lang: lang});
    }
    return ret;
};

const toXML = (objs,tree,meta) => {
    const sanStr = str => {
        return str.replaceAll(/[<>&]/g,m => {
            if(m === '&') return '&amp;';
            else if(m === '<') return '&lt;';
            else if(m === '>') return '&gt;';
        });
    };
    const sanAttr = str => {
        return str.replaceAll(/[<>&"]/g,m => {
            if(m === '"') return '&quot;';
            if(m === '&') return '&amp;';
            else if(m === '<') return '&lt;';
            else if(m === '>') return '&gt;';
        });
    };
    const witList = makeWitList(meta.alltexts/*,objs.map(o => o.siglum)*/);
    let ret = `<?xml version="1.0" encoding="UTF-8"?>
<teiCorpus xmlns="http://www.tei-c.org/ns/1.0" xml:lang="${meta.lang}">
  <teiHeader>
${witList}
    <encodingDesc>
      <editorialDecl>
        <segmentation>
          <ab type="tokenization">${meta.tokenization}</ab>
          <ab type="blockid">${meta.block}</ab>
          <ab type="targetedition">${meta.targetedition}</ab>
          <ab type="scoring">
            <ab type="match">${meta.scoring.match}</ab>
            <ab type="mismatch">${meta.scoring.mismatch}</ab>
            <ab type="gapopen">${meta.scoring.gap_open}</ab>
            <ab type="gapextend">${meta.scoring.gap_extend}</ab>
            <ab type="recursive">${meta.scoring.recursive}</ab>
            <ab type="realigndepth">${meta.scoring.realigndepth}</ab>
            <ab type="distancefunction">${meta.scoring.distancefunc}</ab>
            ${meta.scoring.distancefunction === 'ngrams' ? '<ab type="ngramsize">' + meta.scoring.ngramsize + '</ab>' : ''}
          </ab>
        </segmentation>
        <normalization method="markup">
${meta.filtersnames.map(f => `<ab>${sanStr(f)}</ab>`).join('\n')}
        </normalization>
        <ab type="tagfilters">
${meta.tagfilters.map(f => `<tag subtype="ignore">${f}</tag>`).join('\n')}
        </ab>
      </editorialDecl>
    </encodingDesc>
    <xenoData>
      <stemma format="nexml" id="stemma0">${tree}</stemma>
    </xenoData>
  </teiHeader>
`;
    for(const obj of objs) {
        ret = ret + `<TEI n="${sanAttr(obj.siglum)}"><text>`;
        const text = obj.text.map((t,i) => Array.isArray(t) ? `<w n="${i}" lemma="${sanAttr(t[1])}">${sanStr(t[0])}</w>` : `<w n="${i}">${sanStr(t)}</w>`).join('');
        ret = ret + text + '</text></TEI>';
    }
    return ret + '</teiCorpus>';
};

const makeWitList = (alltexts/*,sigla*/) => {
    const newlist = new Map();
    for(const [witid, deets] of alltexts) {
        if(deets.par) {
            const witlist = newlist.get(deets.par) || [];
            witlist.push([witid,deets]);
            newlist.set(deets.par,witlist);
        }
        else {
            const witlist = newlist.get(witid) || [];
            witlist.unshift([witid,deets]);
            newlist.set(witid,witlist);
        }
    }
    let ret = '<listWit>';
    for(const [witid, witlist] of newlist) {
        ret = ret + `\n<witness xml:id="${witid}" source="${witlist[0][1].filename}">\n<abbr>${witid}</abbr>\n<expan>${witlist[0][1].title}</expan>`;

        if(witlist.length > 1)
            ret = ret + '\n<listWit>';

        if(witlist[0][1].type && witlist[0][1].type !== 'lem') 
            // this means there was only ac/pc, no parent
            ret = ret + `\n<witness xml:id="${witlist[0][0]}" n="${witlist[0][1].type}">\n<abbr>${witlist[0][0]}</abbr>\n<expan>${witlist[0][1].title} [${witlist[0][1].type === 'ac' ? 'ante' : 'post'} correctionem]</expan>\n</witness>`;

        for(let n=1;n<witlist.length;n++) {
            const type = witlist[n][1].type !== 'lem' ? witlist[n][1].type : null;
            const typestr = type ?
                ['ac','pc'].includes(type) ?
                    ` n="${type}"` :
                    ` select="${type}"` :
                    '';
            
            const poststr = type ?
                type === 'ac' ? ' [ante correctionem]' :
                type === 'pc' ? ' [post correctionem]' :
                ` [witness ${type.replace(/^#/,'')}]` :
                '';

            ret = ret + `\n<witness xml:id="${witlist[n][0]}"${typestr}>\n<abbr type="siglum">${witlist[n][0]}</abbr>\n<expan>${witlist[n][1].title}${poststr}</expan>\n</witness>`;
        }

        if(witlist.length > 1)
            ret = ret + '\n</listWit>';

        ret = ret + '\n</witness>';
    }
    return ret + '\n</listWit>';
};

const findMatch = (arrarr,col,needle) => {
  for(const arr of arrarr) {
    const hay = arr.text[col];
    const norm = Array.isArray(hay) ? hay[1] : hay;
    if(norm === needle)
      return true;
  }
  return false;
};

const vowels = new Set(['a','ā','i','ī','u','ū','o','ō','au','e','ē','ai']);

const hangingVowels = arrarr => {
  for(let n=0;n<arrarr.length;n++) {
    let gapopen = false;
    const arr = arrarr[n].text;
    //let changed = false;
    for(let m=0;m<arr.length;m++) {
      const [unnorm, norm] = Array.isArray(arr[m]) ? [arr[m][0],arr[m][1]] : [arr[m],arr[m]];
      if(unnorm === '') {
        if(gapopen === false) gapopen = m;
        continue;
      }

      if(vowels.has(norm) && gapopen !== false && findMatch(arrarr,gapopen,norm)) {
        arr[gapopen] = norm === unnorm ? unnorm : [unnorm, norm]; 
        arr[m] = '';
        //changed = true;
      }

      gapopen = false;
    }
  }
};

const getCellVals = cell => {
  const ret = Array.isArray(cell) ? cell : [cell,cell];
  return {unnorm: ret[0], norm: ret[1]};
};

const hangingLetters = arrarr => {
  for(let n=0;n<arrarr.length;n++) {
    let gapopen = false;
    let endspace = false;
    const arr = arrarr[n].text;
    for(let m=0;m<arr.length;m++) {
      const cellval = getCellVals(arr[m]);
      if(cellval.unnorm === '' && cellval.norm === '') {
        if(gapopen === false)
          gapopen = m;
        continue;
      }

      if(gapopen !== false && endspace === false && findMatch(arrarr,gapopen,cellval.norm)) {
        arr[gapopen] = cellval.norm === cellval.unnorm ? 
          cellval.unnorm : 
          [cellval.unnorm, cellval.norm]; 
        arr[m] = '';
        gapopen = gapopen + 1;
        if(cellval.unnorm.endsWith(' ')) endspace = true;
      }
      else {
        endspace = cellval.unnorm.endsWith(' ') ? true : false;
        gapopen = false;
      }
    }
  }
};

const cleanup2 = (arrarr,meta) => {
  if(meta.tokenization === 'character') {
    // move hanging vowels to the left of a gap
    //hangingVowels(arrarr);
    hangingLetters(arrarr);
  }
    
};

const getNextWord = word => {
  const sib = word.nextElementSibling;
  if(sib) {
    if(sib.nodeName === 'w') return sib;
    else if(sib.nodeName === 'cl') return sib.firstElementChild;
  }
  const par = word.parentNode;
  if(par.nodeName === 'cl') {
    const nextcl = par.nextElementSibling;
    if(nextcl?.nodeName === 'cl')
      return nextcl.firstElementChild;
  }
  return false;
};

const getPrevNonGap = word => {
  const n = word.getAttribute('n');
  const row = word.closest('text');
  let m = parseInt(n) - 1;
  let prev = row.querySelector(`w[n="${m}"]`);
  while(prev) {
    if(prev.textContent !== '' || prev.hasAttribute('lemma'))
      return prev;
    m = m - 1;
    prev = row.querySelector(`w[n="${m}"]`);
  }
  return null;
};

const gapAfter = (xmldoc, n) => {
  const nURI = xmldoc.documentElement.namespaceURI;
  const starts = xmldoc.querySelectorAll(`w[n="${n}"]`);
  for(const start of starts) {
    const newcell = xmldoc.createElementNS(nURI,'w');
    start.parentNode.insertBefore(newcell,start.nextSibling);
    
    /* 
    const allcells = [...start.closest('text').querySelectorAll('w')];
    for(let m=parseInt(n)+1;m<allcells.length;m++)
      allcells[n].setAttribute('n',m);
    */
    let m = parseInt(n) + 1;
    let nextword = newcell;
    while(nextword) {
      nextword.setAttribute('n',m);
      nextword = getNextWord(nextword);
      m = m + 1;
    }
  }
};

const hangingAnusvara = xmldoc => {
  const rows = xmldoc.querySelectorAll('TEI > text');
  for(const row of rows) {
    const cls = row.querySelectorAll('cl');
    if(cls.length === 0) return;
    
    for(const cl of cls) {
      const firstw = cl.querySelector('w');
      const unnorm = firstw.textContent;
      const norm = firstw.hasAttribute('lemma') ? firstw.getAttribute('lemma') : unnorm;
      if(!(norm === 'ṃ') && !vowels.has(norm)) continue;
          
      const prevcl = cl.previousElementSibling;
      if(prevcl?.nodeName !== 'cl') continue;
        
      const prevfilledw = getPrevNonGap(firstw);
      if(!prevfilledw || prevfilledw.textContent.endsWith(' ')) continue;

      const prevw = prevcl.lastElementChild;
      if(prevw.textContent === '' && !prevw.hasAttribute('lemma')) {
        prevw.textContent = firstw.textContent;
        firstw.textContent = '';
        if(firstw.hasAttribute('lemma')) {
          prevw.setAttribute('lemma',norm);
          firstw.removeAttribute('lemma');
        }
      }
      else {
        gapAfter(xmldoc,prevw.getAttribute('n'));
        const newcell = prevw.nextElementSibling;
        newcell.textContent = firstw.textContent;
        firstw.textContent = '';
        if(firstw.hasAttribute('lemma')) {
          newcell.setAttribute('lemma',norm);
          firstw.removeAttribute('lemma');
        }
      }
    }
  }
};

const getNormalizedCl = cl => {
  let ret = '';
  for(const el of cl.children) {
    const txt = el.hasAttribute('lemma') ? el.getAttribute('lemma') : el.textContent;
    ret = ret + txt;
  }
  return ret;
};

const isVerb = str => {
  if(str.endsWith('ati') ||
     str.endsWith('anti') ||
     str.endsWith('āti') ||
     str.endsWith('enti') ||
     str.endsWith('oti') ||
     str.endsWith('onti') ||
     str.endsWith('osi') ||
     str.endsWith('esuṃ') ||
     str.endsWith('osuṃ') ||
     str.endsWith('esi')
  )
    return true;
  return false;
};

const matchGroup = (rows,firstn,needle) => {
  for(const row of rows) {
    const firstcell = row.querySelector(`w[n="${firstn}"]`);
    const cl = firstcell.parentNode;
    if(cl.nodeName !== 'cl') return false;

    if(needle === getNormalizedCl(cl)) return true;
  } 
  return false;
};

const moveGroup = (from, to) => {
  const fromws = from.children;
  const tows = to.children;
  if(tows.length < fromws.length) return; // this shouldn't happen
  
  for(let n=0;n < fromws.length; n++) {
    tows[n].textContent = fromws[n].textContent;
    fromws.textContent = '';
    const lemma = fromws[n].getAttribute('lemma');
    if(lemma !== null) {
      tows[n].setAttribute('lemma',lemma);
      fromws[n].removeAttribute('lemma');
    }
  }
};

const realignVerbs = xmldoc => {
  const rows = xmldoc.querySelectorAll('text');
  for(const row of rows) {
    const groups = row.querySelectorAll('cl');
    let gapopen = null;
    for(const group of groups) {
      const txt = getNormalizedCl(group);
      if(txt === '') {
        if(!gapopen) gapopen = group;
        continue;
      }

      if(!isVerb(txt)) {
        gapopen = null;
        continue;
      }

      if(!gapopen) continue;

      const firstn = gapopen.firstElementChild.getAttribute('n');

      if(matchGroup(rows,firstn,txt)) {
        moveGroup(group,gapopen);
      };

      gapopen = null;
    }
  }
};

const cleanup3 = (xmldoc,meta) => {
    // move visarga and anusvāra to left of gap
    /*
    if(meta.tokenization === 'character') {
      hangingAnusvara(xmldoc);
    }
    */
    if(meta.lang === 'pi') realignVerbs(xmldoc);
};

const cleanup1 = arr => {
    // move open brackets and punctuation to the beginning of a cell
    const opening = /[\[(‘“]$/;
    for(let n=0;n<arr.length;n++) {
        const cell = arr[n];
        if(n < arr.length-1) {
            const endpunct = cell.search(opening);
            if(endpunct > -1) {
                arr[n+1] = cell.slice(endpunct) + arr[n+1];
                arr[n] = cell.slice(0,endpunct);
            }
        }
    }
    /*
    // move initial space to first non-empty cell
    if(arr[0] !== '' && arr[0].trim() === '') {
      const firstnonempty = (() => {
        for(let n=1;n<arr.length;n++) {
          if(arr[n] !== '') return n;
        }
        return null;
        })();
      if(firstnonempty !== null) {
        arr[firstnonempty] = arr[0] + arr[firstnonempty];
        arr[0] = '';
      }
    }
    */
    // TODO: check for doubled consonants separated by space, e.g.
    //       A: maṇakkum malai vs. B: maṇakku m_alai
    //       and shift the consonant in B one cell
    //       use full table for decision or just nearest neighbour(s)?
    // TODO: check for stuff that could be added to the end of a group, e.g.
    //      A: |bhutesu | vs. B: |bhutasm|iṃ |
    //      search a maximum 3? cells right for the next space
    //      then check if column consists of empty or ends with space
    return arr;
};

const untransliterate = (str, lang) => {
  const from = lang === 'bo' || lang.startsWith('bo-') ? 'wylish' : 'slpish';
  const targ = lang === 'bo' || lang.startsWith('bo-') ? 'wylie' : 'iast';
  if(Array.isArray(str))
      for(let m=0;m<str.length;m++)
        str[m] = Sanscript.t(str[m],from,targ);
  else
    str = Sanscript.t(str,from,targ);
  return str;
};

const postProcess = (alignment,filtersmap,meta,parser=parseString) => {
    const joined = alignment.alignment.map(arr => arr.map(a => Array.isArray(a) ? a.join('') : a));
    const lang = meta.lang;
    const clean = [];
    for(const row of joined) {
        const id = alignment.sigla.shift();
        const f = filtersmap.get(id);
        const unfiltered = cleanup1(unfilterAll(row,f));
        const ret = new Array(unfiltered.length);
        for(let n=0;n<unfiltered.length;n++) {
            if(unfiltered[n] === row[n])
                ret[n] = untransliterate(unfiltered[n],lang);
            else
                ret[n] = [untransliterate(unfiltered[n],lang),untransliterate(row[n],lang)];
        }
        clean.push({siglum: id, text: ret});
    }
    cleanup2(clean,meta);
    const xml = toXML(clean,alignment.tree,meta);
    const grouped = groupBySpace(parser(xml,meta.block),meta.targetedition);
    cleanup3(grouped,meta);
    return serializeXML(grouped);
    //return toXML(grouped,alignment.tree,meta);
};

const setOrAppendText = (textmap, id, obj) => {
    const existing = textmap.get(id);
    if(existing) {
      // subwits get counted twice if the text cites both the subwit siglum and the collective siglum
      if(existing.textel !== obj.textel)
        existing.textel = concatEls([existing.textel,obj.textel]);
      if(obj.collectives && !existing.collectives)
        existing.collectives = obj.collectives;
    }
    else
        textmap.set(id,obj);
};
const concatEls = els => {
    const first = els.shift().cloneNode(true);
    for(const el of els) {
        const clone = el.cloneNode(true);
        while(clone.firstChild)
            first.appendChild(clone.firstChild);
    }
    return first;
};

const getCollectives = wit => {
    const ret = [];
    let par = wit.closest('[n="collective"]');
    while(par) {
        ret.push(`#${par.getAttribute('xml:id')}`);
        par = par.parentNode.closest('[n="collective"]');
    }
    return ret;
};

const processFile = (teixml, filename, state, idsel = '*|id') => {
   
    const warnings = [];
    const texts = [...teixml.querySelectorAll('text')];
    const title = teixml.querySelector('titleStmt > title').innerHTML.trim();
    
    let overallsiglum = teixml.querySelector('idno[type="siglum"]')?.textContent || teixml.documentElement.getAttribute('n');
    const textsigla = texts.map(t => t.getAttribute('corresp')?.replace(/^#/,'')).filter(e => e);
    if(!overallsiglum && textsigla.length === 0) {
        warnings.push(`No siglum for ${filename}. Using filename as siglum.`);
        overallsiglum = filename;
    }

    for(const siglum of new Set([overallsiglum,...textsigla])) {
        if(state.alltexts.has(siglum) || state.alltexts.has(`${siglum}ac`))
            warnings.push(`Warning: ${siglum} used more than once.`);
    }

    const textmap = new Map();
    for(const text of texts) {
        const siglum = text.getAttribute('corresp')?.replace(/^#/,'') || overallsiglum;
        if(!textmap.has(siglum)) textmap.set(siglum,[text]);
        else textmap.set(siglum,[...textmap.get(siglum),text]);
    }
    for(const [id, texts] of textmap) {
        
        const text = texts.length === 1 ? texts[0] : concatEls(texts);

        const acpc = text.querySelector('add, del');

        const rdgs = [...text.querySelectorAll('rdg')];
        if(rdgs.length !== 0) {
            if(acpc) {
                setOrAppendText(
                    state.alltexts,
                    `${id}ac`,
                    {textel: text, filename: filename, title: title, type: 'ac', par: id});
                setOrAppendText(
                    state.alltexts,
                    `${id}pc`,
                    {textel: text, filename: filename, title: title, type: 'pc', par: id});
                //state.alltexts.set(`${id}ac`,{textel: text, filename: filename, title: title, type: 'ac', par: id});
                //state.alltexts.set(`${id}pc`,{textel: text, filename: filename, title: title, type: 'pc', par: id});
            }
            else {
                setOrAppendText(
                    state.alltexts,
                    id,
                    {textel: text, filename: filename, title: title, type: 'lem'});
                //state.alltexts.set(id,{textel: text, filename: filename, title: title, type: 'lem'});
            }
            const wits = rdgs.reduce((acc,cur) => {
                const w = cur.getAttribute('wit');
                if(!w) return acc;
                for(const ww of w.split(/\s+/))
                    acc.add(ww);
                return acc;
            },new Set());
            for(const wit of wits) {
                const witid = wit.replace(/^#/,'');
                const witel = teixml.querySelector(`[${idsel}="${witid}"]`);
                if(witel?.getAttribute('n') === 'collective') {
                    for(const subwit of witel.querySelectorAll('witness')) {
                        if(subwit.getAttribute('n') === 'collective') continue;
                        const subid = subwit.getAttribute('xml:id');
                        setOrAppendText(
                            state.alltexts,
                            `${id}-${subid}`,
                            {textel: text, filename: filename, title: title, type: `#${subid}`, par: id, collectives: getCollectives(subwit)});
                        //state.alltexts.set(`${id}-${subid}`,{textel: text, filename: filename, title: title, type: `#${subid}`, par: id, collectives: getCollectives(subwit)});
                    }
                }
                else
                    setOrAppendText(
                        state.alltexts,
                        `${id}-${witid}`,
                        {textel: text, filename: filename, title: title, type: wit, par: id});
                    //state.alltexts.set(`${id}-${witid}`,{textel: text, filename: filename, title: title, type: wit, par: id});
            }
        }
        else if(acpc) {
            setOrAppendText(
                state.alltexts,
                `${id}ac`,
                {textel: text, filename: filename, title: title, type: 'ac', par: id});
            setOrAppendText(
                state.alltexts,
                `${id}pc`,
                {textel: text, filename: filename, title: title, type: 'pc', par: id});
            //state.alltexts.set(`${id}ac`,{textel: text, filename: filename, title: title, type: 'ac', par: id});
            //state.alltexts.set(`${id}pc`,{textel: text, filename: filename, title: title, type: 'pc', par: id});
        }
        else
            setOrAppendText(
                state.alltexts,
                id,
                {textel: text, filename: filename, title: title});
            //state.alltexts.set(id,{textel: text, filename: filename, title: title});
    }
    const els = [...teixml.querySelectorAll(`p[${idsel}],p[corresp],lg[${idsel}],lg[corresp],l[${idsel}],l[corresp],div[${idsel}]`)];
    for(const el of els) {
        const id = el.getAttribute('xml:id');
        if(id) state.allblocks.add(id);
        const corresp =  el.getAttribute('corresp')?.replace(/^#/,'');
        if(corresp) state.allblocks.add(corresp);
    }
    return warnings;
};

const makeRange = (a,b) =>
    Array.from(Array(parseInt(b) - parseInt(a) + 1).keys(), x => x+a);

const groupBySpace = (doc,edsiglum) => {
    const nURI = doc.documentElement.namespaceURI;
    let groupstart = 0;
    const groups = [];
    const texts = doc.querySelectorAll('text');
    const emptyrows = new Set();
    let editiontext;

    for(const [n,text] of texts.entries()) {
        if(edsiglum && text.parentNode.getAttribute('n') === edsiglum)
            editiontext = text;
        if(text.textContent.trim() === '')
            emptyrows.add(n);
    }

    const maxlemma = [...texts[0].querySelectorAll('w[n]')].slice(-1)[0].getAttribute('n');
    for(let n=0; n< maxlemma; n++) {
        const ws = doc.querySelectorAll(`w[n='${n}']`);
        if(ws[0].parentNode.nodeName === 'cl') {
            groupstart = n+1;
            continue;
        }
        
        let total = ws.length - emptyrows.size;
        let spaced = 0;
        let empty = 0;
        let editionspace = false;

        for(let m=0;m<ws.length;m++) {
            if(emptyrows.has(m)) continue;
            
            const w = ws[m];
            const txt = w.textContent;
            if(/\s$/.test(txt.slice(-1))) {
                if(editiontext && editiontext.contains(w))
                    editionspace = true;
                spaced++;
            }
            else if(txt === '')
                empty++;
        }
        if(groupstart === n && empty + spaced === total && groups.length) {
            groups[groups.length-1].push(n);
            groupstart = n+1; 
        }
        else if(spaced / total >= 0.5 && (!editiontext || editionspace)) {
            if(groupstart === n) {
                // avoid groups of 1; add to previous group
                if(groups.length > 0) {
                  groups[groups.length-1].push(n);
                  groupstart = groupstart+1;
                }
                continue;
            }
            else {
                groups.push(makeRange(groupstart, n));
                groupstart = n+1;
            }
        }
    }
    
    // deal with last column
    if(groupstart !== maxlemma) {
            groups.push(makeRange(groupstart, maxlemma));
    }

    for(const group of groups) {
        for(const text of texts) {
            const nums = [...group];
            const cl = doc.createElementNS(nURI,'cl');
            const firstw = text.querySelector(`w[n='${nums.shift()}']`);
            firstw.parentNode.insertBefore(cl,firstw);
            cl.appendChild(firstw);
            for(const num of nums)
                cl.appendChild(text.querySelector(`w[n='${num}']`));
        }
    }

    return doc;
};

export { processFile, preProcess, postProcess, groupBySpace, detectScript, findSplitfunc, cleanup1, cleanup2, makeWitList };
