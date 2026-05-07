import Transliterate from '../../../js/transliterate.mjs';

const _NodeFilter = {
    SHOW_ALL: 4294967295,
    SHOW_TEXT: 4
};

const _state = {
    xsltsheet: null
};

const XMLNS = 'http://www.w3.org/XML/1998/namespace';

const loadDoc = async (fn,cache='no-cache') => {
    const res = await fetch(fn, {cache: cache});
    if(!res.ok) return null;
    const xmltext = await res.text();
    return (new DOMParser()).parseFromString(xmltext, 'text/xml');
};

const newElement = (doc, name) => {
    return doc.createElementNS('http://www.tei-c.org/ns/1.0',name);
};

const getLang = doc => {
  const xmllang = doc.querySelector('text').getAttributeNS(XMLNS,'lang');
  if(xmllang) {
    if(xmllang === 'sa' || xmllang.startsWith('sa-')) return 'sanskrit';
    if(xmllang === 'ta' || xmllang.startsWith('ta-')) return 'tamil';
    if(xmllang === 'bo' || xmllang.startsWith('bo-')) return 'tibetan';
    if(xmllang === 'pi' || xmllang.startsWith('bo-')) return 'pali';
  }
  return 'english';
};

const expandLang = str => {
  if(str === 'sa') return 'sanskrit';
  if(str === 'ta') return 'tamil';
  if(str === 'pi') return 'pali';
  if(str === 'bo') return 'tibetan';
};

const exportLaTeX = async (indoc,libRoot,exportRoot) => {
    const doc = indoc.cloneNode(true);
    const scriptel = exportRoot.getElementById('export-script');
    const transc = scriptel && scriptel.checked ? {script: scriptel.dataset.script, lang: scriptel.dataset.lang} : undefined;
     
    const scriptopts = newElement(doc,'interp');
    scriptopts.setAttribute('type','script-options');
    if(transc)
      scriptopts.innerHTML = `<ab type="script">${transc.script}</ab><ab type="language">${expandLang(transc.lang)}</ab>`;
    else
      scriptopts.innerHTML = `<ab type="script">roman</ab><ab type="language">${getLang(doc)}</ab>`;
    doc.documentElement.appendChild(scriptopts);

    for(const standOff of [...doc.querySelectorAll('standOff[type="apparatus"]')]) {
        const corresp = standOff.getAttribute('corresp').replace(/^#/,'');
        const div = doc.querySelector(`[*|id="${corresp}"]`);
        if(!div) continue;
        const ed = div.querySelector('[type="edition"]') || div;
        if(!ed) continue;
        if(ed.textContent === '') ed.textContent = ' ';
        //addSpacesInL(ed);
        //removeSpaceNodes(ed);
        
        const tagFilters = [...standOff.querySelectorAll('[type="tagfilters"] > tag')].map(t => t.textContent);

        const listApp = standOff.querySelector('listApp');
        let appnum = 0;
        if(!listApp) continue;
        for(const app of [...listApp.querySelectorAll(':scope > app')].reverse()) {
            const range = rangeFromCoords(
                app.getAttribute('loc').split(',').map(l => parseInt(l)),
                ed,
                new Set(tagFilters)
                );
            //range.extractContents();
            //range.insertNode(app);
            const startanchor = newElement(doc,'anchor');
            const appid = `${corresp}-a${appnum}`;
            startanchor.setAttribute('n',appid);
            startanchor.setAttribute('type','lemma');
            range.insertNode(startanchor);
            range.collapse(false);
            app.setAttribute('corresp',appid);
            normalizeApp(app);
            range.insertNode(app);
            appnum = appnum + 1;
        }
        standOff.remove();
    }
    
    for(const par of doc.querySelectorAll('text div[rend="parallel"]'))
        concatParallel(par);
    
    for(const lg of doc.querySelectorAll('text lg, text p'))
        normalizeLg(lg,transc);

    for(const l of doc.querySelectorAll('text l')) {
      if(!l.closest('lg'))
        normalizeLg(l,transc);
    }

    for(const noteblock of doc.querySelectorAll('standOff[type="notes1"], standOff[type="notes2"], standOff[type="notes3"], standOff[type="notes4"]')) {
            noteblock.setAttributeNS(XMLNS,'lang','en');
            if(transc) toScript(noteblock,transc);
    }

    processPostOptions(doc,exportRoot);

    const xproc = new XSLTProcessor();
    if(!_state.xsltsheet)
        _state.xsltsheet = await loadDoc(`${libRoot}lib/latex.xsl`);
    xproc.importStylesheet(_state.xsltsheet);
    const res = xproc.transformToDocument(doc);
    return res.querySelector('pre')?.textContent || res.firstChild.textContent;
};

const normalizeApp = app => {
    const walker = document.createTreeWalker(app,NodeFilter.SHOW_TEXT);
    let cur = walker.nextNode();
    while(cur) {
        cur.data = cur.data.replaceAll(/\s+/g,' ');
        cur = walker.nextNode();
    }
};

const normalizeLg = (lg,transc) => {
    lg.normalize();
    if(lg.firstChild?.nodeType === 3) {
        if(lg.firstChild.data.trim() === '')
            lg.firstChild.remove();
        else
            lg.firstChild.data = lg.firstChild.data.slice(lg.firstChild.data.search(/\S/));
    }
    if(lg.lastChild?.nodeType === 3) {
        if(lg.lastChild.data.trim() === '')
            lg.lastChild.remove();
        else {
            const endspaces = lg.lastChild.data.search(/\s+$/);
            if(endspaces > -1)
                lg.lastChild.data = lg.lastChild.data.slice(0,endspaces);
        }
    }
    for(const l of lg.querySelectorAll('l')) {
        if(l.firstChild?.nodeType === 3) {
            if(l.firstChild.data.trim() === '')
                l.firstChild.remove();
            else
                l.firstChild.data = l.firstChild.data.slice(l.firstChild.data.search(/\S/));
        }
        if(l.lastChild?.nodeType === 3) {
            if(l.lastChild.data.trim() === '')
                l.lastChild.remove();
            else {
                const endspaces = l.lastChild.data.search(/\s+$/);
                if(endspaces > -1)
                    l.lastChild.data = l.lastChild.data.slice(0,endspaces);
            }
        }
    }
    if(transc) toScript(lg,transc);
    /*
    const walker = document.createTreeWalker(lg,NodeFilter.SHOW_TEXT);
    let cur = walker.nextNode();
    while(cur) {
        cur.data = cur.data.replaceAll('_','\\_').replaceAll(/\s+/g,' ');
        cur = walker.nextNode();
    }
    */
};

const toScript = (el, transc) => {
  const script = transc.script;
  const lang = transc.lang;
  const walker = document.createTreeWalker(el,NodeFilter.SHOW_ALL);
  const parlang = el.closest('[*|lang]').getAttributeNS(XMLNS,'lang');
  el.setAttributeNS(XMLNS,'lang',parlang);
  let cur = walker.nextNode();
  while(cur) {
      if(cur.nodeType === 1 && cur.hasChildNodes()) {
          const curlang = cur.getAttributeNS(XMLNS,'lang');
          if(!curlang) {
              cur.setAttributeNS(XMLNS,'lang',cur.parentNode.getAttributeNS(XMLNS,'lang'));
          }
          if(cur.getAttributeNS(XMLNS,'lang') === lang) {
              if(cur.closest('[type="translation"]') ||
                cur.closest('note')?.getAttributeNS(XMLNS,'lang') === 'en')
                  cur.setAttributeNS(XMLNS,'lang',`${lang}-Latn`);
          }
      }
      else if(cur.nodeType === 3) {
          const curlang = cur.parentNode.getAttributeNS(XMLNS,'lang');
          if(curlang === lang || curlang.startsWith(lang + '-Latn-t-')) {
          // TODO: distinguish between sa-Latn and sa-Latn-t-sa-Deva
              const clean = cur.data.toLowerCase()
                                    .replaceAll(/(\S)·/g,'$1\u200C');
              cur.data = Transliterate.to[script](clean);
          }
          cur.data = cur.data.replaceAll('_','\\_');
      }
      cur = walker.nextNode();
  }
};

const concatParallel = par => {
    if(par.children.length < 2) return;
    par.children[0].setAttribute('type','edition');
    par.children[1].setAttribute('type','translation');
    par.children[1].setAttribute('corresp',`#${par.children[0].getAttributeNS(XMLNS,'id')}`);
    while(par.nextElementSibling && par.nextElementSibling.getAttribute('rend') === 'parallel') {
        par.nextElementSibling.children[0].setAttribute('type','edition');
        if(par.nextElementSibling.children[1])
            par.nextElementSibling.children[1].setAttribute('type','translation');
        else {
            const newkid = par.ownerDocument.createElement('lg');
            newkid.setAttribute('type','translation');
            par.nextElementSibling.appendChild(newkid);
        }
        par.nextElementSibling.children[1].setAttribute('corresp',`#${par.nextElementSibling.children[0].getAttributeNS(XMLNS,'id')}`);
        while(par.nextElementSibling.firstElementChild)
            par.appendChild(par.nextElementSibling.firstElementChild);
        par.nextElementSibling.remove();
    }
};
/*
const addSpacesInL = node => {
    for(const line of node.querySelectorAll('l')) {
        const f = line.firstChild;
        if(f.nodeType === '3') {
            if(!f.startsWith(' '))
                f.data = ' ' + f.data;
        }
        else
            line.prepend(' ');

        const l = line.firstChild;
        if(l.nodeType === '3') {
            if(!f.endsWith(' '))
                f.data = f.data + ' ';
        }
        else
            line.append(' ');
    }
};
const removeSpaceNodes = node => {
    const walker = document.createTreeWalker(node,NodeFilter.SHOW_TEXT);
    let cur = walker.nextNode();
    const toremove = [];
    while(cur) {
        const trimmed = cur.data.trim();
        if(trimmed === '')
            toremove.push(cur);
        else cur.data = trimmed;
        cur = walker.nextNode();
    }
    for(const t of toremove)
        t.remove();
};
*/
const rangeFromCoords = (positions, target, ignoretags=new Set()) => {
    const document = target.ownerDocument;
    const range = document.createRange();
    
    if(positions[0] === 0 && positions[1] === 0) {
      range.setStart(target,0);
      range.setStart(target,1);
      return range;
    }

    const realNextSibling = (walker) => {
        let cur = walker.currentNode;
        while(cur) {
            const sib = walker.nextSibling();
            if(sib) return sib;
            cur = walker.parentNode();
        }
        return null;
    };

    const walker = document.createTreeWalker(target,_NodeFilter.SHOW_ALL);
    let start = 0;
    let started = false;
    let cur = walker.nextNode();
    while(cur) {
        if(cur.nodeType === 8) {
            cur = realNextSibling(walker);
            continue;
        }
        if(cur.nodeType === 1) {
            if(cur.nodeName === ('choice') && 
               cur !== cur.parentNode.firstChild) {

                cur = realNextSibling(walker);
                continue;
            }
            
            if(ignoretags.has(cur.nodeName)) {
                cur = realNextSibling(walker);
                continue;
            }
            if(cur.nodeName === 'gap') {
                start = start + (parseInt(cur.getAttribute('quantity')) || 1);
                cur = realNextSibling(walker);
                continue;
            }
        }
        
        else if(cur.nodeType === 3) {
            const texttrim = cur.data.trim();
            if(texttrim === '') {
                cur = walker.nextNode();
                continue;
            }

            const nodecount = texttrim.replaceAll(/[\s\u00AD]/g,'').length;
            const end = start + nodecount;
            if(!started && positions[0] <= end) {
                const realpos = countpos(cur.data,positions[0]-start);
                setStartPos(cur,realpos,range);
                started = true;
            }
            if(started && positions[1] <= end) {
                const realpos = countpos(cur.data,positions[1]-start);
                setEndPos(cur,realpos,range);
                break;
            }
            start = end;
        }
        cur = walker.nextNode();
    }
    return range;
};
const setStartPos = (cur, pos, range) => {
    const realNextSibling = node => {
        while(node) {
            const sib = node.nextSibling;
            if(sib) return sib;
            node = node.parentNode;
        }
        return null;
    };

    if(pos === cur.data.length || cur.data.slice(pos).trim() === '') {
        cur = realNextSibling(cur);
        pos = 0;
    }

    while(cur) {
        if(cur.nodeType === 8) {
            cur = realNextSibling(cur);
            continue;
        }
        if(cur.nodeType === 1) {
            cur = cur.firstChild || realNextSibling(cur);
            continue;
        }
        if(cur.data.trim() === '') {
            cur = realNextSibling(cur);
            continue;
        }
        const startspaces = cur.data.slice(pos).search(/\S/);
        if(startspaces > 0)
            range.setStart(cur,pos + startspaces);
        else
            range.setStart(cur,pos);
        break;
    }
};
const setEndPos =(cur, pos, range) => {
    const endspaces = cur.data.slice(0,pos).search(/\s+$/);
    if(endspaces > -1 && endspaces < pos)
        range.setEnd(cur,endspaces);
    else
        range.setEnd(cur,pos);
};

const matchCounts = (alignment,m,pos='start') => {
    let matchcount = 0;
    for(let n=0;n<alignment[0].length;n++) {
        if(matchcount === m) {
            if(pos === 'start' && alignment[0][n] === 'G') n = n + 1; // |vēḻa_|vēṇ|, |vēḻam|veḷ|

            const line2 = alignment[1].slice(0,n);
            const matches = [...line2].reduce((acc, cur) => cur === 'M' ?  acc + 1 : acc,0);
            return matches;
        }
        if(alignment[0][n] === 'M') matchcount = matchcount + 1;
    }
    
    // no match; go to end of the block
    const matches = [...alignment[1]].reduce((acc, cur) => cur === 'M' ?  acc + 1 : acc,0); //-1;
    // why was there -1 here??
    return matches;
};
const countpos = (str, pos) => {
    if(pos === 0) {
        return str[0].match(/[\u00AD\s]/) ? 1 : 0;
    }
    let realn = 0;
    for(let n=0;n<str.length;n++) {
        if(realn === pos) {
            if(str[n].match(/[\u00AD\s]/))
                return n+1;
            else 
                return n;
        }
        if(str[n].match(/[\u00AD\s]/) === null)
           realn = realn + 1;
    }
    return str.length;
};

const showOptions = () => {
    const popup = showPopup('export-popup');
};

const closePopup = e => {
    cancelPopup(e);
};

const processPostOptions = (doc,exportRoot) => {
    if(exportRoot.getElementById('export-underline').checked)
        markUnderlines(doc);
    if(!exportRoot.getElementById('export-line-breaks').checked)
        for(const lb of doc.querySelectorAll('lb'))
            lb.remove();
    if(!exportRoot.getElementById('export-page-breaks').checked)
        for(const pb of doc.querySelectorAll('pb'))
            pb.remove();
};

const wavySurround = (doc,opts) => {
    const range = doc.createRange();
    if(opts.startBefore)
        range.setStartBefore(opts.startBefore);
    if(opts.startAfter) {
      const nxt = opts.startAfter.nextSibling;
      if(nxt.nodeType === 3)
        range.setStart(nxt,0);
      else
        range.setStartBefore(nxt);
    }
    if(opts.endBefore) {
      const bef = opts.endBefore.previousSibling;
      if(bef.nodeType === 3)
        range.setEnd(bef,bef.data.length);
      else if(bef.lastChild)
        range.setEndAfter(bef.lastChild);
      else
        range.setEndAfter(bef);
    }
    if(opts.endAfter) {
      if(opts.endAfter.nodeType === 3)
        range.setEnd(opts.endAfter,opts.endAfter.length);
      else if(opts.endAfter.lastChild)
          range.setEndAfter(opts.endAfter.lastChild);
      else
          range.setEndAfter(opts.endAfter);
    }
    surroundRange(doc,range);
};

const findEls = range => {
  const container = range.cloneContents();
  if(container.firstElementChild) return true;
  return false;
};

const wrongSeg = txtnode => {
  /*
  const ignored = txtnode.parentNode.closest('.ignored');
  if(ignored) return ignored;
  */
  const el = txtnode.parentNode.closest('.choiceseg');
  return el && el !== el.parentNode.firstChild;
};

const nextSibling = node => {
    let start = node;
    while(start) {
        const sib = start.nextSibling;
        if(sib) return sib;
        else start = start.parentElement; 
    }
    return null;
};

const surroundOne = (doc,range) => {
    const hi = newElement(doc,'hi');
    hi.setAttribute('rend','wavy-underline');
    range.surroundContents(hi);
}
const surroundRange = (doc,range) => {
  if(!findEls(range)) {
      surroundOne(doc,range);
      return;
  }
  const toHighlight = [];
  const start = (range.startContainer.nodeType === 3) ?
      range.startContainer :
      range.startContainer.childNodes[range.startOffset];

  const end = (range.endContainer.nodeType === 3) ?
      range.endContainer :
      range.endContainer.childNodes[range.endOffset-1];
  if(start.nodeType === 3 && range.startOffset !== start.length && !wrongSeg(start)) {
      const textRange = document.createRange();
      textRange.setStart(start,range.startOffset);
      textRange.setEnd(start,start.length);
      toHighlight.push(textRange);
  }
  
  const getNextNode = (n) => n.firstChild || nextSibling(n);

  for(let node = getNextNode(start); node !== end; node = getNextNode(node)) {
      if(node.nodeType === 3 && !wrongSeg(node)) {
          const textRange = document.createRange();
          textRange.selectNode(node);
          toHighlight.push(textRange);
      }
  }

  if(end.nodeType === 3 && range.endOffset > 0 && !wrongSeg(end)) {
      const textRange = document.createRange();
      textRange.setStart(end,0);
      //const realend = range.endOffset > end.data.length ? end.data.length : range.endOffset;
      textRange.setEnd(end,range.endOffset);
      toHighlight.push(textRange);
  }
  
  //const firsthighlit = highlightfn(toHighlight.shift());
  
  const nodearr = [];
  for(const hiNode of toHighlight) {
    const node = surroundOne(doc,hiNode);
  }
};

const markUnderlines = doc => {
  const anchors = doc.querySelectorAll('anchor[type="lemma"]');
  const toSurround = [];
  for(const anchor of anchors) {
      const id = anchor.getAttribute('n');
      const app = doc.querySelector(`app[corresp="${id}"]`);

      const l1 = anchor.closest('l');
      if(!l1) {
          toSurround.push({startAfter: anchor, endBefore: app});
          continue;
      }

      const l2 = app.closest('l');
      if(l1 !== l2) {
          toSurround.push({startAfter: anchor, endAfter: l1.lastChild});
          toSurround.push({startBefore: l2.firstChild, endBefore: app});
      }
      else
          toSurround.push({startAfter: anchor, endBefore: app});
  }
  toSurround.reverse();
  for(const todo of toSurround) 
    wavySurround(doc,todo);
};

export { exportLaTeX };
