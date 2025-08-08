import { loadDoc } from './fileops.mjs';
import { showSaveFilePicker } from './native-file-system-adapter/es6.js';
import { Sanscript } from '../js/sanscript.mjs';
import { cancelPopup, showPopup } from './popup.mjs';
import { serializeWordsplits } from './serializeStandOff.mjs';

const _NodeFilter = {
    SHOW_ALL: 4294967295,
    SHOW_TEXT: 4
};

const _state = {
    xsltsheet: null,
    curDoc: null,
    libRoot: ''
};

const newElement = (doc, name) => {
    return doc.createElementNS('http://www.tei-c.org/ns/1.0',name);
};

const exportLaTeX = async indoc => {
    const doc = indoc.cloneNode(true);

    processPreOptions(doc);

    for(const standOff of [...doc.querySelectorAll('standOff[type="apparatus"]')]) {
        const corresp = standOff.getAttribute('corresp').replace(/^#/,'');
        const div = doc.querySelector(`[*|id="${corresp}"]`);
        if(!div) continue;
        const ed = div.querySelector('[type="edition"]') || div;
        if(!ed) continue;
        //addSpacesInL(ed);
        //removeSpaceNodes(ed);
        
        const tagFilters = [...standOff.querySelectorAll('[type="tagfilters"] > tag')].map(t => t.textContent);

        const listApp = standOff.querySelector('listApp');
        let appnum = 0;
        if(!listApp) continue;
        for(const app of [...listApp.querySelectorAll(':scope > app')].reverse()) {
            const range = rangeFromCoords(
                app.getAttribute('loc').split(','),
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
        normalizeLg(lg);

    for(const noteblock of doc.querySelectorAll('standOff[type="notes1"], standOff[type="notes2"], standOff[type="notes3"], standOff[type="notes4"]')) {
            const xmlns = 'http://www.w3.org/XML/1998/namespace';
            noteblock.setAttributeNS(xmlns,'lang','en');
            toTamil(noteblock);
    }

    processPostOptions(doc);

    const xproc = new XSLTProcessor();
    if(!_state.xsltsheet)
        _state.xsltsheet = await loadDoc(`${_state.libRoot}debugging/latex.xsl`);
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

const normalizeLg = lg => {
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
    toTamil(lg);
};

const toTamil = el => {
    const xmlns = 'http://www.w3.org/XML/1998/namespace';
    const walker = document.createTreeWalker(el,NodeFilter.SHOW_ALL);
    const parlang = el.closest('[*|lang]').getAttribute('xml:lang');
    el.setAttributeNS(xmlns,'lang',parlang);
    let cur = walker.nextNode();
    while(cur) {
        if(cur.nodeType === 1 && cur.hasChildNodes()) {
            const curlang = cur.getAttributeNS(xmlns,'lang');
            if(!curlang) {
                cur.setAttributeNS(xmlns,'lang',cur.parentNode.getAttributeNS(xmlns,'lang'));
            }
            if(cur.getAttributeNS(xmlns,'lang') === 'ta') {
                if(cur.closest('[type="translation"]') ||
                  cur.closest('note')?.getAttributeNS(xmlns,'lang') === 'en')
                    cur.setAttributeNS(xmlns,'lang','ta-Latn');
            }
        }
        else if(cur.nodeType === 3) {
            if(cur.parentNode.getAttributeNS(xmlns,'lang') === 'ta') {
                const clean = cur.data.toLowerCase()
                                      .replaceAll(/(\S)·/g,'$1\u200C');
                cur.data = Sanscript.t(clean,'iast','tamil');
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
    par.children[1].setAttribute('corresp',`#${par.children[0].getAttribute('xml:id')}`);
    while(par.nextElementSibling && par.nextElementSibling.getAttribute('rend') === 'parallel') {
        par.nextElementSibling.children[0].setAttribute('type','edition');
        if(par.nextElementSibling.children[1])
            par.nextElementSibling.children[1].setAttribute('type','translation');
        else {
            const newkid = par.ownerDocument.createElement('lg');
            newkid.setAttribute('type','translation');
            par.nextElementSibling.appendChild(newkid);
        }
        par.nextElementSibling.children[1].setAttribute('corresp',`#${par.nextElementSibling.children[0].getAttribute('xml:id')}`);
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

const exportFile = async () => {
    const outdoc = await exportLaTeX(_state.curDoc);
    const thisFilename = window.location.pathname.split('/').pop();
    const basename = thisFilename.substring(0,thisFilename.lastIndexOf('.'));
    const fileHandle = await showSaveFilePicker({
        suggestedName: `${basename}.tex`,
        types: [
            { description: 'LaTeX', accept: { 'application/x-latex': [ '.tex'] } }
        ],
    });
    const file = new Blob([outdoc], {type: 'text/x-tex;charset=utf-8'});
    const writer = await fileHandle.createWritable();
    writer.write(file);
    writer.close();
    closePopup();
};

const showOptions = () => {
    const popup = showPopup('export-popup');
};

const processPreOptions = doc => {
    if(document.getElementById('export-lg-wordsplits').checked)
        addWordsplits(doc,'lg');
    if(document.getElementById('export-p-wordsplits').checked)
        addWordsplits(doc,'p');
};

const processPostOptions = doc => {
    if(document.getElementById('export-underline').checked)
        markUnderlines(doc);
    if(!document.getElementById('export-line-breaks').checked)
        for(const lb of doc.querySelectorAll('lb'))
            lb.remove();
    if(!document.getElementById('export-page-breaks').checked)
        for(const pb of doc.querySelectorAll('pb'))
            pb.remove();
};

const wavySurround = (doc,opts) => {
    const range = doc.createRange();
    if(opts.startBefore)
        range.setStartBefore(opts.startBefore);
    if(opts.startAfter)
        range.setStartAfter(opts.startAfter);
    if(opts.endBefore)
        range.setEndBefore(opts.endBefore);
    if(opts.endAfter)
        range.setEndAfter(opts.endAfter);

    const hi = newElement(doc,'hi');
    hi.setAttribute('rend','wavy-underline');
    range.surroundContents(hi);
};

const markUnderlines = doc => {
    const anchors = doc.querySelectorAll('anchor[type="lemma"]');
    for(const anchor of anchors) {
        const id = anchor.getAttribute('n');
        const app = doc.querySelector(`app[corresp="${id}"]`);

        const l1 = anchor.closest('l');
        if(!l1) {
            wavySurround(doc,{startAfter: anchor, endBefore: app});
            continue;
        }

        const l2 = app.closest('l');
        if(l1 !== l2) {
            wavySurround(doc,{startAfter: anchor, endAfter: l1.lastChild});
            wavySurround(doc,{startBefore: l2.firstChild, endBefore: app});
        }
        else
            wavySurround(doc,{startAfter: anchor, endBefore: app});
    }
};

const addWordsplits = (doc,type) => {
    const cleanText = str => str.replaceAll('~','\\char`~').replaceAll('*',"'");
    const makeL = line => {
        if(line === '') return null;
        const l = newElement(doc,'l');
        l.setAttribute('rend','italic');
        l.append(cleanText(line));
        return l;
    };
    for(const standoff of doc.querySelectorAll('standOff[type="wordsplit"]')) {
        const id = standoff.getAttribute('corresp').slice(1);
        
        const block = doc.querySelector(`[*|id="${id}"]`);
        if(block.nodeName !== type) continue;
        
        const parpar = block.closest('div[rend="parallel"]');
        if(!parpar) continue;
        
        const transblock = parpar.querySelector(`[*|lang="en"]`);
        if(!transblock) continue;

        const splits = serializeWordsplits(standoff).tam;
        if(type === 'lg') {
            const ls = splits.split('\n').map(makeL).filter(l => l);
            const br = newElement(doc,'l');
            transblock.prepend(...ls,br);
        }
        else {
            const l = newElement(doc,'hi');
            l.setAttribute('rend','italic');
            l.append(cleanText(splits));
            transblock.prepend(l,' \\medskip ');
        }
    }
};

const closePopup = e => {
    cancelPopup(e);
};

const init = (curDoc,libRoot) => {
    _state.curDoc = curDoc;
    _state.libRoot = libRoot;
    const popup = document.getElementById('export-popup');
    popup.querySelector('.closeicon').addEventListener('click',closePopup);
    popup.querySelector('button').addEventListener('click',exportFile);
};

const Exporter = {
    init: init,
    showOptions: showOptions
};

export default Exporter;
