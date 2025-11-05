import { Transliterate } from './transliterate.mjs';
import { GitHubFunctions } from './githubfunctions.mjs';
import { ApparatusViewer } from './apparatus.mjs';
import { AlignmentViewer } from './alignment.mjs';
//import WordLookup from './wordlookup.mjs';
import './tooltip.mjs';
import './removehyphens.mjs';
import startEditMode from '../debugging/editmode.mjs';

const cachedContent = new Map();

const lookup = async (e) => {
    const apointer = e.target.closest('.alignment-pointer');
    if(apointer) {
        e.preventDefault();
        AlignmentViewer.viewer(apointer.href);
        return;
    }
    /*
    const word = e.target.closest('.word:not(.nolookup)');
    if(!word) return;
    const blackout = document.getElementById('blackout');
    blackout.style.display = 'flex';
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    blackout.appendChild(spinner);
    
    const lookupwindow = document.createElement('div');
    lookupwindow.id = 'lookupwindow';
    lookupwindow.innerHTML = (await WordLookup(word)) || '<p lang="en">Word not found.</p>';
    spinner.remove();
    blackout.appendChild(lookupwindow);
    Transliterate.refreshCache(lookupwindow);
    if(document.getElementById('transbutton').lang === 'en')
            Transliterate.activate(lookupwindow);
    blackout.addEventListener('click',cancelBlackout);
    */
};

const cancelBlackout = e => {
    const lookup = e.target.closest('#lookupwindow');
    if(lookup) return;
    document.getElementById('lookupwindow')?.remove();
    blackout.style.display = 'none';
    blackout.removeEventListener('click',cancelBlackout);
};

const cleanup = (doc) => {
    const breakup = doc.querySelectorAll('.word br');
    for(const b of breakup) {
        const next = b.nextSibling;
        const par = b.closest('.word');
        if(next) {
            const nextword = par.nextElementSibling;
            if(!nextword.dataset.norm) nextword.dataset.norm = visibleText(nextword);
            nextword.prepend(next);
        }
        par.after(b);
    }
};

const visibleText = (node) => {
    const clone = node.cloneNode(true);
    const walker = document.createTreeWalker(clone,NodeFilter.SHOW_ELEMENT);
    while(walker.nextNode()) {
        const cur = walker.currentNode;
        if(cur.classList.contains('anno-inline') || cur.style.display === 'none') cur.remove();
    }
    return clone.textContent;
};
/*
const apparatusswitch = (e) => {
    const blocks = document.querySelectorAll('.wide');
    const target = document.getElementById('apparatusbutton');
    if(target.dataset.anno === 'apparatus of variants') {
        for(const block of blocks) {
            const trans = block.querySelector('.text-block.translation');
            if(trans) trans.style.display = 'none';
            const app = block.querySelector('.apparatus-block');
            if(app) app.style.display = 'block';
        }
        document.getElementById('translationsvg').style.display = 'revert';
        document.getElementById('apparatussvg').style.display = 'none';
        target.dataset.anno = 'translation';
    }
    else {
        for(const block of blocks) {
            const trans = block.querySelector('.text-block.translation');
            if(trans) trans.style.display = 'block';
            const app = block.querySelector('.apparatus-block');
            if(app) app.style.display = 'none';
        }
        document.getElementById('translationsvg').style.display = 'none';
        document.getElementById('apparatussvg').style.display = 'revert';
        target.dataset.anno = 'apparatus of variants';
    }
};
*/
const getEdition = standoff => {
    const target = document.getElementById(standoff.dataset.corresp.replace(/^#/,''));
    return target?.querySelector('.edition') || target;
};

const wordsplit = e => {
    if(e?.target.closest('#optionssvg')) return;

    const target = document.getElementById('wordsplitbutton');
    const script = document.getElementById('transbutton').lang === 'en' ? 'taml' : 'iast';
    const standoffs = document.querySelectorAll('.standOff[data-type="wordsplit"]');
    if(target.dataset.anno === 'word-split text') {
        for(const standoff of standoffs) {
            const target = getEdition(standoff);
            if(!target) continue; // TODO: add some kind of warning -- this means an orphaned standOff

            target.classList.add('animation');
            if(document.getElementById('transbutton').lang === 'en') {
                Transliterate.revert(target);
            }
            applymarkup(standoff);
            Transliterate.refreshCache(target);
            
            if(document.getElementById('transbutton').lang === 'en') {
                Transliterate.activate(target);
            }
            //target.classList.remove('animation');
            setTimeout(() => target.classList.remove('animation'),500);
        }
        document.getElementById('metricalsvg').style.display = 'revert';
        document.getElementById('wordsplitsvg').style.display = 'none';
        target.dataset.anno = 'metrical text';
    }
    else {
        for(const standoff of standoffs) {
            const target = getEdition(standoff);
            if(document.getElementById('transbutton').lang === 'en')
                Transliterate.revert(target);
            removemarkup(standoff);
            Transliterate.refreshCache(target);
            if(document.getElementById('transbutton').lang === 'en') {
                Transliterate.activate(target);
            }
        }
        document.getElementById('metricalsvg').style.display = 'none';
        document.getElementById('wordsplitsvg').style.display = 'revert';
        target.dataset.anno = 'word-split text';
    }
};
/*
const countpos = (str, pos) => {
    if(pos === 0) return 0;
    let realn = 0;
    for(let n=1;n<=str.length;n++) {
       if(str[n] !== '\u00AD')
           realn = realn + 1;
        if(realn === pos) return n;
    }
};
const nextSibling = (node) => {
    let start = node;
    while(start) {
        let sib = start.nextSibling;
        if(sib) return sib;
        else start = start.parentElement; 
    }
    return false;
};

const nextTextNode = (start,strand) => {
    let next = nextSibling(start);
    while(next) {
        if(next.nodeType === 3) return next;
        else {
            if(next.parentNode.classList.contains('choice') &&
               [...next.parentNode.children].indexOf(next) !== strand) {
                next = nextSibling(next,strand);
            }
            else next = next.firstChild || nextSibling(next);
        }
    }
    return null;
};
*/
const realNextSibling = (walker) => {
    let cur = walker.currentNode;
    while(cur) {
        const sib = walker.nextSibling();
        if(sib) return sib;
        cur = walker.parentNode();
    }
    return null;
};

const lineCounter = (el) => {
    const walker = document.createTreeWalker(el,NodeFilter.SHOW_ALL);
    let count = 0;
    let cur = walker.currentNode;
    while(cur) {
        if(cur.nodeType === 1) {
            if(cur.classList.contains('choiceseg') && 
               cur !== cur.parentNode.children[0]) {
                cur = realNextSibling(walker);
                continue;
            }
            if(cur.classList.contains('app-inline')) {
                cur = cur.querySelector('.lem-inline');
                continue;
            }
            if(cur.classList.contains('anno-inline')) {
                cur = realNextSibling(walker);
                continue;
            }
            if(cur.classList.contains('ignored')) {
                cur = realNextSibling(walker);
                continue;
            }
            /*
            else if(cur.classList.contains('gap')) {
                cur = realNextSibling(walker);
                continue;
            }
            */
        }
        else if(cur.nodeType === 3)
            count = count + cur.textContent.trim().replaceAll(/[\s\u00AD]/g,'').length;
        cur = walker.nextNode();
    }
    return count;
};

const wordLength = (lemma) => {
    const clone = lemma.cloneNode(true);
    for(const ignored of clone.querySelectorAll('.ignored'))
        ignored.remove();
    return clone.textContent.trim().replaceAll(/[\s\u00AD]/g,'').length; // remove spaces too?
};

const matchCounts = (alignment,linecounts) => {
    linecounts = [...linecounts];
    const realcounts = [];
    let matchcount = 0;
    for(let n=0;n<alignment[0].length;n++) {
        if(matchcount === linecounts[0]) {
            linecounts.shift();
            const line2 = alignment[1].slice(0,n);
            const matches = [...line2].reduce((acc, cur) => cur === 'M' ?  acc + 1 : acc,0);
            realcounts.push(matches);
        }
        if(alignment[0][n] === 'M') matchcount = matchcount + 1;
    }
    return realcounts;
};

const makeWord = (entry) => {
    const lemma = entry.querySelector('.f[data-name="lemma"]');
    const span = document.createElement('span');
    const clone = lemma.cloneNode(true);

    while(clone.firstChild) {
        if(clone.firstChild.nodeType === 1)
            clone.firstChild.lang = 'ta-Latn-t-ta-Taml'; // there's probably a better way
            // TODO: what's this for again?
        span.append(clone.firstChild);
    }
    for(const q of span.querySelectorAll('.character q'))
        q.lang = 'ta'; // TODO: better way?

    span.className = 'word split';
    const translation = entry.querySelector('.f[data-name="translation"]');
    const affix = entry.querySelector('.f[data-name="affix"]'); // TODO: DEPRECATED
    const particles = entry.querySelectorAll('.f[data-name="particle"]');
    const roles = entry.querySelectorAll(':scope > .f[data-name="role"], :scope > .f[data-name=""] > .f[data-name="role"]');
    const cleanlemma = entry.querySelector('.f[data-name="simple"]');
    if(cleanlemma) span.dataset.clean = cleanlemma.textContent;
    if(translation || affix) {
        span.dataset.anno = '';
        const annoel = document.createElement('span');
        annoel.className = 'anno-inline ignored';
        annoel.lang = 'en';
        if(translation) annoel.append(translation.textContent);
        let annohtml = translation ? translation.textContent : '';
        if(roles.length > 0) {
            annohtml = annohtml + ` (${[...roles].map(r => r.textContent).join(' ')})`;
            for(const role of roles)
                span.classList.add('role_' + role.textContent.replaceAll(/\s+/g,'_'));
        }
        if(affix) {
            const affixrole = affix.querySelector('[data-name="role"]')?.textContent || 'suffix';
            const form = affix.querySelector('[data-name="lemma"]');
            annohtml = annohtml + ` (${affixrole} <span lang="ta">${form.textContent}</span>)`;
        }
        for(const particle of particles) {
            const form = particle.querySelector('.f');
            annohtml = annohtml + ` (particle <span lang="ta">${form.textContent}</span>)`;
        }

        annoel.innerHTML = annohtml;
        span.prepend(annoel);
    }
    else span.classList.add('nolookup');
    const notes = entry.querySelectorAll('.note');
    for(const note of notes) {
        const noteel = document.createElement('span');
        noteel.className = 'footnote ignored';
        noteel.dataset.anno = '';
        noteel.append('*');
        const annoel = document.createElement('span');
        annoel.lang = note.lang;
        annoel.className = 'anno-inline';
        annoel.innerHTML = note.innerHTML;
        noteel.appendChild(annoel);
        span.appendChild(noteel);
    }
    return span;
};

const decodeRLE = s => s.replaceAll(/(\d+)([MLRG])/g, (_, count, chr) => chr.repeat(count));

const countLines = lines => {
    return lines.reduce((acc,cur) => {
        const count = lineCounter(cur);
        const add = acc.length > 0 ? acc.at(-1) : 0;
        acc.push(count + add);
        return acc;
    },[]);
};

const applymarkup = (standoff) => {
    const target = getEdition(standoff);
    if(!target) return;
    
    const cache = new Map();

    const alignmentel = standoff.querySelector('.alignment[data-select="0"]');
    const alignment = alignmentel.textContent.trim().split(',').map(s => decodeRLE(s));
    target.dataset.alignment = alignment.join(',');

    const entries = [...standoff.querySelectorAll(':scope > .fs')];

    const lines = [...target.querySelectorAll('.l')];
    if(lines.length > 0) {
        const linecounts = countLines(lines);
        const realcounts = matchCounts(alignment,linecounts);

        let wordcount = 0;
        let linenum = 0;
        cache.set(lines[linenum],lines[linenum].cloneNode(true));
        lines[linenum].innerHTML = '';
        for(const entry of entries) {
            if(wordcount >= realcounts[linenum]) {
                linenum = linenum + 1;
                cache.set(lines[linenum],lines[linenum].cloneNode(true));
                lines[linenum].innerHTML = '';
            }

            if(entry.classList.contains('superentry')) {
                const choice = document.createElement('span');
                choice.className = 'choice';
                if(entry.classList.contains('ambiguous'))
                    choice.classList.add('inline');

                for(const seg of entry.querySelectorAll(':scope > .fs')) {
                    const segel = document.createElement('span');
                    segel.className = 'choiceseg';
                    const subentries = seg.querySelectorAll('.fs');
                    if(subentries.length > 0) {
                        for(const subentry of subentries) {
                            const word = makeWord(subentry);
                            segel.appendChild(word);
                            //if(seg.dataset.select === '0')
                            if(seg === seg.parentElement.firstElementChild)
                                wordcount = wordcount + wordLength(word);
                        }
                    }
                    else {
                        const word = makeWord(seg);
                        segel.appendChild(word);
                        //if(seg.dataset.select === '0')
                        if(seg === seg.parentElement.firstElementChild)
                            wordcount = wordcount + wordLength(word);
                    }
                    choice.appendChild(segel);
                }
                lines[linenum].appendChild(choice);
            }

            else {
                const word = makeWord(entry);
                lines[linenum].appendChild(word);
                wordcount = wordcount + wordLength(word);
            }
        }
    } else {
        cache.set(target,target.cloneNode(true));
        target.innerHTML = '';
        for(const entry of entries) {

            if(entry.classList.contains('superentry')) {
                const choice = document.createElement('span');
                choice.className = 'choice';
                if(entry.classList.contains('ambiguous'))
                    choice.classList.add('inline');

                for(const seg of entry.querySelectorAll(':scope > .fs')) {
                    const segel = document.createElement('span');
                    segel.className = 'choiceseg';
                    const subentries = seg.querySelectorAll('.fs');
                    if(subentries.length > 0) {
                        for(const subentry of subentries) {
                            const word = makeWord(subentry);
                            segel.appendChild(word);
                            //if(seg.dataset.select === '0')
                        }
                    }
                    else {
                        const word = makeWord(seg);
                        segel.appendChild(word);
                        //if(seg.dataset.select === '0')
                    }
                    choice.appendChild(segel);
                }
                target.appendChild(choice);
            }

            else {
                const word = makeWord(entry);
                target.appendChild(word);
            }
        }
    }
    cachedContent.set(target,cache);
};

const removemarkup = (standoff) => {
    const target = getEdition(standoff);
    if(!target) return;

    const cached = cachedContent.get(target);
    if(!cached) return;
    for(const [el,oldContent] of cached) {
        while(el.firstChild) 
            el.firstChild.remove();
        while(oldContent.firstChild)
            el.appendChild(oldContent.firstChild);
    }
    delete target.dataset.alignment;
    target.normalize();
};

const EvaStyleGo = () => {
    for(const c of document.querySelectorAll('.character')) {
        if(c.classList.contains('elided'))
            c.textContent = '*';
        if(c.classList.contains('glide'))
            c.textContent = '~';
        else if(c.classList.contains('geminated'))
            c.textContent = '+';
    }
};

const findCorrespLine = e => {
    const line = e.target.closest('.l[data-corresp]');
    if(!line) return;
    const corresps = line.dataset.corresp.split('-');
    const corrints = corresps.map(c => parseInt(c,10));
    const corrarr = corrints.length === 1 || isNaN(corrints[1]) ? [corrints[0]] :
                    Array(corrints[1] - corrints[0] + 1).fill().map((_,i) => corrints[0] + i);
    
    const ed = line.closest('.text-block').parentNode.querySelector('.edition');
    if(!ed) return;
    
    const lines = ed.querySelectorAll('.l');
    if(!lines) return;

    const tounlight = [];
    for(const corresp of corrarr) {
        const sel = `.l:nth-of-type(${corresp})`;
        const found = ed.querySelector(sel);
        if(found) {
            found.classList.add('linenumbered');
            tounlight.push(found);
        }
    }
    line.classList.add('corresplit');
    line.addEventListener('mouseout',() => {
        line.classList.remove('corresplit');
        for(const el of tounlight)
            el.classList.remove('linenumbered');
    },{once: true});
};

const go = () => {
    const searchparams = new URLSearchParams(window.location.search);
    const islocal = ['localhost','127.0.0.1'].includes(window.location.hostname);
    if(searchparams.get('noedit') === null && (searchparams.get('edit') !== null || islocal)) {
        const libRoot = document.getElementById('editionscript').dataset.root;

        startEditMode(Transliterate,libRoot);
    }

    if(searchparams.get('evastyle') !== null)
       EvaStyleGo(); 

    const lineview = document.querySelectorAll('.line-view-icon');
    if(lineview) for(const l of lineview) l.style.display = 'none';

    const recordcontainer = document.getElementById('recordcontainer');

    for(const t of recordcontainer.querySelectorAll('.teitext > div > div:first-child')) {
        //tamilize(t);
        for(const b of t.querySelectorAll('ruby br')) {
            b.parentElement.after(b.nextSibling);
            b.parentElement.after(b);
        }
    }
    for(const teitext of recordcontainer.querySelectorAll('.teitext'))
        teitext.addEventListener('click',lookup);
    for(const transblock of recordcontainer.querySelectorAll('.translation'))
        transblock.addEventListener('mouseover',findCorrespLine);
    
    const wordsplitbutton = document.getElementById('wordsplitbutton');
    if(wordsplitbutton) {
        wordsplitbutton.addEventListener('click',wordsplit); // start this for editmode
        if(document.querySelector('.standOff[data-type="wordsplit"]'))
            wordsplitbutton.style.display = 'block';
    }

    //if(document.querySelector('.app')) { // init in case of editmode
        ApparatusViewer.init();
        ApparatusViewer.setTransliterator(Transliterate);
    //}

    Transliterate.init(recordcontainer);

    if(searchparams.get('wordsplit') !== null)
       document.getElementById('wordsplitbutton').click();

    const highlight = searchparams.get('highlight');
    if(highlight) {
        const found = document.querySelector(highlight);
        if(found) {
            found.scrollIntoView({behaviour: 'smooth', block: 'center'});
            found.classList.add('lightlit');
        }
        document.addEventListener('click',() => {
            found.classList.remove('lightlit');
        },{once: true});
    }

    GitHubFunctions.latestCommits();
};

window.addEventListener('load',go);

