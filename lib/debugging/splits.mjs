import { alignWordsplits, findGrammar, gramMap } from './aligner.mjs';
import Sanscript from '../js/sanscript.mjs';
import makeAlignmentTable from './alignmenttable.mjs';
import { init as cmWrapper } from './cmwrapper.mjs';
import { serializeWordsplits, getEditionText } from './serializeStandOff.mjs';
import { loadDoc, saveAs } from './fileops.mjs';
import previewDoc from './preview.mjs';
import { cancelPopup as cancelPopup2, showPopup } from './popup.mjs';

const _state = {
    noteCM: null,
    tamlines: null,
    wordsplits: null,
    wordlistsheet: null,
    changedBlocks: new Map(),
    changed: false,
//    Transliterator: null
};

const Preview = async () => {
    document.getElementById('splits-popup').style.display = 'none';
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    document.getElementById('blackout').appendChild(spinner);

    const ids = _state.changedBlocks.keys();
    updateChanged();
    const newDoc = await previewDoc(Splitter.sharedState.curDoc);
    for(const id of ids) {
        const standOff = newDoc.querySelector(`.standOff[data-type="wordsplit"][data-corresp="#${id}"]`);
        standOff.lang = 'en';
        const existingStandOff = document.querySelector(`.standOff[data-type="wordsplit"][data-corresp="#${id}"]`);
        if(existingStandOff)
            existingStandOff.parentNode.replaceChild(standOff,existingStandOff);
        else
            document.querySelector('article').appendChild(standOff);
        const block = document.getElementById(id);
        block.classList.add('edited');
        block.scrollIntoView({behavior: 'smooth',block: 'center'}); 
    }
    // keep clicking until the wordsplit appears... pretty hacky solution
    const wordsplitbutton = document.getElementById('wordsplitbutton');
    wordsplitbutton.style.display = 'block';
    wordsplitbutton.click();

    cancelPopup();
    spinner.remove();

    if(!document.querySelector('.word.split'))  {
        wordsplitbutton.click();
    }
};

const updateChanged = () => {
    for(const [id, xmlstr] of _state.changedBlocks.entries()) {
        let curStandOff = Splitter.sharedState.curDoc.querySelector(`standOff[type="wordsplit"][corresp="#${id}"]`);
        if(!curStandOff) {
            curStandOff = Splitter.sharedState.curDoc.createElementNS('http://www.tei-c.org/ns/1.0','standOff');
            curStandOff.setAttribute('corresp',`#${id}`);
            curStandOff.setAttribute('type','wordsplit');
            Splitter.sharedState.curDoc.documentElement.appendChild(curStandOff);
        }
        curStandOff.innerHTML = `\n${xmlstr}\n`;
    }
    _state.changedBlocks = new Map();
};

const saveThis = () => {
    updateChanged();
    saveAs(Splitter.sharedState.filename, Splitter.sharedState.curDoc);
};

const init = (/*transliterator*/) => {
    const popup = document.getElementById('splits-popup');
    if(!popup) return;

    const selector = popup.querySelector('select');
    for(const block of Splitter.sharedState.curDoc.querySelectorAll('text lg[*|id], text p[*|id], text div[*|id]')) {
        const option = document.createElement('option');
        const id = block.getAttribute('xml:id');
        option.value = id;
        option.append(id);
        selector.append(option);
    }
    document.getElementById('alignbutton').addEventListener('click',showSplits);
    document.getElementById('previewbutton').addEventListener('click',Preview);
    document.getElementById('saveasbutton').addEventListener('click',saveThis);
    popup.querySelector('.popup-output').addEventListener('click',listEdit.click);
    popup.querySelector('.popup-output').addEventListener('keydown',listEdit.keydown);
    popup.querySelector('.popup-output').addEventListener('focusin',listEdit.focusin);
    popup.querySelector('select').addEventListener('change',maybeFillWordSplits);
    for(const ta of popup.querySelectorAll('textarea'))
        ta.addEventListener('change',disableButtons);

    popup.querySelector('.closeicon svg').addEventListener('click',cancelPopup);

    document.getElementById('previewswitcher').addEventListener('click',codePreview);
    document.getElementById('notesswitcher').addEventListener('click',notesView);

    //_state.Transliterator = transliterator;
};

const addWordSplits = id => {
    const popup = showPopup('splits-popup');

    const selector = popup.querySelector('select');
    const options = selector.querySelectorAll('option');
    if(id) {
        for(const option of options) {
            if(option.value === id)
                option.selected = true;
            else
                option.selected = false;
        }
    } 
    
    else options[0].selected = true;

    fillWordSplits({target: selector});

};
const codePreview = e => {
    const targ = e.target.closest('.switcher > div');
    if(!targ || targ.classList.contains('selected')) return;
    
    const output = document.querySelector('#splits-popup .popup-output');

    targ.classList.add('selected');
    if(targ.textContent === 'Table') {
        targ.nextElementSibling.classList.remove('selected');
        output.querySelector('table').style.display = 'table';
        output.querySelector('.code').style.display = 'none';
    }
    else {
        targ.previousElementSibling.classList.remove('selected');
        output.querySelector('table').style.display = 'none';
        output.querySelector('.code').style.display = 'block';
    }

};

const notesView = e => {
    const targ = e.target.closest('.switcher > div');
    if(!targ || targ.classList.contains('selected')) return;
    
    const wbwbox = document.getElementById('wbwbox');
    const tbs = wbwbox.querySelectorAll('textarea');
    
    targ.classList.add('selected');
    if(targ.textContent === 'Splits') {
        targ.nextElementSibling.classList.remove('selected');
        tbs[0].style.display = 'block';
        //tbs[1].style.display = 'none';
        _state.noteCM.toTextArea();
    }
    else {
        targ.previousSibling.classList.remove('selected');
        tbs[0].style.display = 'none';
        //tbs[1].style.display = 'block';
        _state.noteCM = cmWrapper(tbs[1]);
        _state.noteCM.setSize(null,'auto');
    }

};

const realNextSibling = (walker) => {
    let cur = walker.currentNode;
    while(cur) {
        const sib = walker.nextSibling();
        if(sib) return sib;
        cur = walker.parentNode();
    }
    return null;
};
const countWalker = el => {
    const walker = document.createTreeWalker(el,NodeFilter.SHOW_ALL);
    let count = 0;
    let cur = walker.currentNode;
    while(cur) {
        if(cur.nodeType === 1) {
            if(cur.nodeName === 'choice' && 
               cur !== cur.parentNode.children[0]) {
                cur = realNextSibling(walker);
                continue;
            }
            else if(cur.nodeName === 'gap')
                count = count + parseInt(cur.getAttribute('quantity') || 1);
        }
        if(cur.nodeType === 3)
            count = count + cur.textContent
                               .trim()
                               .replaceAll(/[\s\u00AD]/g,'')
                               .length;
        cur = walker.nextNode();
    }
    return count;
};

const maybeFillWordSplits = (e) => {
    if(!_state.changed)
        fillWordSplits(e);
    else if(window.confirm('Are you sure? Changes will be lost.')) {
        fillWordSplits(e);
        _state.changed = false;
    }
};

const fillWordSplits = e => {
    const selected = e.target.options[e.target.options.selectedIndex].value;
    const standOff = Splitter.sharedState.curDoc.querySelector(`standOff[type="wordsplit"][corresp="#${selected}"]`);

    if(!standOff) {
        clearSplits();
        fillTempSplits(selected);
        return;
    }

    const ret = serializeWordsplits(standOff);
    
    const textareas = document.querySelectorAll('#splits-popup textarea');
    textareas[0].value = document.getElementById('transbutton').lang === 'en' ? 
        Sanscript.t(ret.tam,'iast','tamil') :
        ret.tam;
    unTemp({target: textareas[0]});
    textareas[1].value = ret.eng;
    textareas[2].value = ret.notes.join('\n\n');

    resetOutput();
};

const resetOutput = () => {
    document.getElementById('alignbutton').innerHTML = 'Align';
    document.getElementById('saveasbutton').style.display = 'none';
    document.getElementById('previewbutton').style.display = 'none';
    const popup = document.getElementById('splits-popup');
    popup.querySelector('.output-boxen').style.display = 'none';
    popup.querySelector('.popup-output').innerHTML = '';
    popup.querySelector('.popup-warnings').innerHTML = '';
};

const clearSplits = () => {
    const popup = document.getElementById('splits-popup');
    for(const textarea of popup.querySelectorAll('textarea'))
        textarea.value = '';
};

const fillTempSplits = blockid => {
    const textblock = Splitter.sharedState.curDoc.querySelector(`[*|id="${blockid}"]`);
    const edition = textblock.querySelector('[type="edition"]');
    const origtext = edition || textblock;
    let lines = origtext.querySelectorAll('l');
    lines = lines.length > 0 ? [...lines] : [origtext];
    const filler = lines.map(l => getEditionText(l).trim().replaceAll(/\s+/g,' '));
    const tamsplits = document.querySelector('#splits-popup textarea');
    tamsplits.value = filler.join('\n');
    tamsplits.classList.add('tempsplits');
    tamsplits.addEventListener('focus',unTemp,{once: true});

};
const unTemp = e => e.target.classList.remove('tempsplits');

const cancelPopup = e => {
    for(const textarea of document.getElementById('splits-popup').querySelectorAll('textarea'))
        textarea.value = '';
    resetOutput();
    cancelPopup2(e);
};

const getNotes = str => {
    const tempdoc = (new DOMParser()).parseFromString(`<TEI xmlns="http://www.tei-c.org/ns/1.0">${str}</TEI>`, 'text/xml');
    const serializer = new XMLSerializer();
    return [...tempdoc.documentElement.children].map(c => serializer.serializeToString(c));
};

const showSplits = async () => {
    if(_state.noteCM) _state.noteCM.save();

    const popup = document.getElementById('splits-popup');
    popup.querySelector('.boxen').style.height = 'unset';

    document.getElementById('alignbutton').innerHTML = 'Re-align';
    const saveasbutton = document.getElementById('saveasbutton');
    saveasbutton.style.display = 'block';
    saveasbutton.disabled = false;
    saveasbutton.title = '';
    const previewbutton = document.getElementById('previewbutton');
    previewbutton.disabled = false;
    previewbutton.style.display = 'block';

    popup.querySelector('.output-boxen').style.display = 'flex';

    const output = popup.querySelector('.popup-output');
    output.innerHTML = '<div style="display: flex;width: 100%;justify-content:center"><div class="spinner"></div></div>';

    const debugbox = popup.querySelector('.popup-warnings');
    debugbox.innerHTML = '';

    const inputs = popup.querySelectorAll('textarea');
    const tamval = Sanscript.t(inputs[0].value.replaceAll(/[\d∞]/g,'').trim(),'tamil','iast').replaceAll(/u\*/g,'*');
    //const tam = tamval.split(/\s+/).map(s => s.replace(/[,.;?!]$/,''));
    const tamlines = tamval.replaceAll(/[,.;?!](?=\s|$)/g,'').split(/\n+/);
    _state.tamlines = tamlines;
    const tam = tamlines.reduce((acc,cur) => acc.concat(cur.trim().split(/\s+/)),[]);

    const engval = inputs[1].value.trim();
    const eng = engval ? engval.split(/\s+/) : //.map(s => s.replace(/[,.;?!]$/,'')) :
                         Array(tam.length).fill('');

    if(engval) {
        const englines = engval.split(/\n+/);
        for(let n=0;n<tamlines.length;n++) {
            if(tamlines[n].trim().split(/\s+/).length !== englines[n].trim().split(/\s+/).length) {
                
                debugbox.innerHTML = (`<div>Line ${n+1}: Tamil & English don't match.</div>`);
                output.style.border = 'none';
                output.style.display = 'none';
                return;
            }
        }
    }

    const blockid = popup.querySelector('select').value;
    const textblock = Splitter.sharedState.curDoc.querySelector(`[*|id="${blockid}"]`);
    const edition = textblock.querySelector('[type="edition"]');
    let text = edition ? getEditionText(edition) : getEditionText(textblock);

    const notes = getNotes(inputs[2].value);
    const lookup = popup.querySelector('input[name="lookup"]').checked;
    const ret = await alignWordsplits(text,tam,eng,notes,lookup);
    const tables = makeAlignmentTable(ret.alignment,tamlines.map(l => l.replaceAll(/\/.+?(?=\s|$)/g,'')),ret.warnings);
    
    for(const table of tables)
        debugbox.appendChild(table);
    
    _state.wordlist = ret.wordlist;

    if(lookup) inputs[1].value = refreshTranslation(tamlines,ret.wordlist);

    output.style.display = 'block';
    output.style.border = '1px solid black';

    const standOff =`<standOff xmlns="http://www.tei-c.org/ns/1.0" type="wordsplit" corresp="#${blockid}">\n${ret.xml}\n</standOff>`;
    const xproc = new XSLTProcessor();
    if(!_state.wordlistsheet)
        _state.wordlistsheet = await loadDoc(`${Splitter.sharedState.libRoot}debugging/wordlist.xsl`);
    xproc.importStylesheet(_state.wordlistsheet);
    const res = xproc.transformToDocument((new DOMParser()).parseFromString(standOff,'text/xml')).querySelector('table');
    if(document.getElementById('transbutton').lang === 'en')
        for(const th of res.querySelectorAll('[lang="ta-Latn"]')) {
            th.textContent = Sanscript.t(th.textContent,'iast','tamil');
            th.lang = 'ta-Taml';
        }

    output.innerHTML = '';
    output.appendChild(res);
    _state.changedBlocks.set(blockid, ret.xml);

    const code = document.createElement('div');
    code.classList.add('code');
    code.style.display = 'none';
    code.innerHTML = Prism.highlight(standOff,Prism.languages.xml,'xml');
    output.appendChild(code);
   
    const switches = document.getElementById('previewswitcher').children;
    switches[0].classList.add('selected');
    switches[1].classList.remove('selected');
    _state.changed = false;
    copyToClipboard(standOff,popup);
};

const refreshTranslation = (lines,wordlist) => {
    let ret = '';
    const makeSuperword = obj => {
        const arr = [];
        for(const strand of obj) {
            const strandarr = [];
            for(const w of strand)
                strandarr.push(makeWord(w));
            arr.push(strandarr.join('|'));
        }
        return arr.join('/');
    };
    const makeWord = (obj) => {
        if(obj.hasOwnProperty('superEntry')) return makeSuperword(obj.superEntry);
        let trans = obj.translation;
        if(obj.gram && obj.gram.length > 0)
            trans = trans + '(' + obj.gram.join('|') + ')';
        if(trans === '') trans = '()';
        if(obj.wordnote) trans = trans + '*';
        return trans;
    };

    let w = 0;
    for(const line of lines) {
        const wordsinline = line.trim().split(/\s+/).length;
        for(let n=0;n<wordsinline;n++) {
            ret = ret + makeWord(wordlist[w]) + ' ';
            w = w + 1;
        }
        ret = ret + '\n';
    }
    return ret;
};

const copyToClipboard = (xml,popup) => {
    navigator.clipboard.writeText(xml).then(
        () => {
            const par = popup.querySelector('.popup-output');
            const tip = document.createElement('div');
            tip.style.position = 'absolute';
            tip.style.top = 0;
            tip.style.right = 0;
            tip.style.background = 'rgba(0,0,0,0.5)';
            tip.style.color = 'white';
            tip.style.padding = '0.5rem';
            tip.append('Copied to clipboard.');
            par.appendChild(tip);
            tip.animate([
                {opacity: 0},
                {opacity: 1, easing: 'ease-in'}
                ],200);
            setTimeout(() => tip.remove(),1000);
        },
        () => {
            const par = popup.querySelector('.popup-output');
            const tip = document.createElement('div');
            tip.style.position = 'absolute';
            tip.style.top = 0;
            tip.style.right = 0;
            tip.style.background = 'rgba(0,0,0,0.5)';
            tip.style.color = 'red';
            tip.style.padding = '0.5rem';
            tip.append('Couldn\'t copy to clipboard.');
            par.appendChild(tip);
            setTimeout(() => tip.remove(),1000);
        }
    );
};

const listEdit = {};

listEdit.state = _state;

listEdit.keydown = e => {
    if(e.key === 'Enter') {
        e.preventDefault();
        e.target.blur();
    }
    else if(e.key === 'Tab' && e.target.classList.contains('gramGrp')) {
        e.preventDefault();
        const next = !e.shiftKey ?  
            e.target.closest('tr').nextElementSibling :
            e.target.closest('tr').previousElementSibling;
        e.target.blur();
        if(next)
            next.querySelector('.gramGrp').click();
    }
};

listEdit.blur = e => {
    if(listEdit.state.editState !== e.target.textContent)
        listEdit.state.changed = true;
    listEdit.state.editState = null;

    if(e.target.classList.contains('gramGrp')) {
        e.target.contentEditable = false;
        listEdit.updateGrams(e);
    }
    else
        listEdit.updateWord(e);

    document.getElementById('engsplit').value = refreshTranslation(listEdit.state.tamlines,listEdit.state.wordlist);
    e.target.blur();
    disableButtons();
};

const disableButtons = () => {
    const saveasbutton = document.getElementById('saveasbutton');
    if(saveasbutton) {
        saveasbutton.disabled = true;
        saveasbutton.title = 'Realign first';
    }
    const previewbutton = document.getElementById('previewbutton');
    if(previewbutton) {
        previewbutton.disabled = true;
        previewbutton.title = 'Realign first';
    }
    _state.changed = true;
};

listEdit.focusin = e => {
    if(e.target.spellcheck === true) {
        listEdit.state.editState = e.target.textContent;
        e.target.addEventListener('blur',listEdit.blur,{once: true});
    }
};

listEdit.getWordItem = (list, index) => {
    let count = 0;
    for(const item of list) {
        if(item.hasOwnProperty('superEntry')) {
            for(const strand of item.superEntry) {
                for(const entry of strand) {
                    if(count === index) return entry;
                    count = count + 1;
                }
            }
        }
        else {
            if(count === index) return item;
            count = count + 1;
        }
    }
};

listEdit.click = e => {
    if(e.target.classList.contains('gramGrp')) {
        const row = e.target.closest('tr');
        const index = [...row.parentNode.children].indexOf(row);
        const worditem = listEdit.getWordItem(listEdit.state.wordlist,index);
        const grams = worditem.gram;
        if(grams && grams.length > 0)
                e.target.innerHTML = '(' + grams.join('|') + ')';
        else
            e.target.innerHTML = '()';
        listEdit.state.editState = e.target.innerHTML;
        e.target.contentEditable = true;
        e.target.focus();
        const range = document.createRange();
        const sel = window.getSelection();
        range.setStart(e.target.firstChild,e.target.firstChild.data.length -1);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        
        e.target.addEventListener('blur',listEdit.blur,{once: true});
    }
    else if(e.target.firstElementChild?.spellcheck === true)
        e.target.firstElementChild.focus();
};


listEdit.updateGrams = e => {
    const row = e.target.closest('tr');
    const index = [...row.parentNode.children].indexOf(row);
    const worditem = listEdit.getWordItem(listEdit.state.wordlist,index);
    const transgram = worditem.translation + e.target.textContent.trim();
    const ret = findGrammar(transgram);
    const def = row.querySelector('[spellcheck="true"]');
    if(ret) {
        worditem.gram = ret.gram;
        //listEdit.state.wordlist[index].translation = ret.translation;
        //def.innerHTML = ret.translation;
        e.target.innerHTML = ret.gram.map(g => gramMap.get(g)).join('<br>');
    }
    else {
        worditem.gram = [];
        worditem.translation = transgram;
        def.innerHTML = transgram;
        e.target.innerHTML = '';
    }
};

listEdit.updateWord = e => {
    const row = e.target.closest('tr');
    const index = [...row.parentNode.children].indexOf(row);
    const worditem = listEdit.getWordItem(listEdit.state.wordlist,index);
    worditem.translation = e.target.textContent.replaceAll(/\s/g,'_');

};
/*
const addcsvwordsplit = (e) => {
    Papa.parse(e.target.files[0], {
        complete: (res) => {
            const data = res.data;
            if(data[0][0] === 'Word') data.shift();
            showsplits(data);
        }
    });
};
const showsplits = (arr) => {
    const concated = arr.map(el => el[0]).join(' ');
    const textblock = document.querySelector('.text-block');
    const text = textblock.textContent.replaceAll('\u00AD','');
    const aligned = NeedlemanWunsch(text,concated);
    const splits = alignmentToSplits(aligned,arr.map(el => el[1]));
    const id = textblock.closest('[id]').id;
    
    const ret = `<standOff corresp="#${id}" type="wordsplit">\n` + 
        makeEntries(splits).join('\n') +
        '\n</standOff>';

    makepopup(ret);
};
const makepopup = (str) => {
    const popup = document.createElement('div');
    popup.className = 'popup';
    const code = document.createElement('code');
    code.className = 'language-xml';
    code.style.whiteSpace = 'pre';
    code.append(str);
    popup.append(code);
    const blackout = document.createElement('div');
    blackout.id = 'blackout';
    blackout.append(popup);
    Prism.highlightAllUnder(popup);
    document.body.appendChild(blackout);
    blackout.addEventListener('click',(e) => {
        const targ = e.target.closest('.popup');
        if(!targ)
            document.querySelector('#blackout').remove();
    });
};

const alignmentToSplits = (aligned, translations) => {
    let words = [];
    let wordstart = 0;
    let wordend = 0;
    let curword = '';
    for(let n=0; n<aligned[0].length;n++) {
        if(aligned[1][n].match(/[\n\s]/)) {
            const ret = {word: curword, start: wordstart, end: wordend};
            const translation = translations.shift();
            if(translation) ret.translation = translation;
            words.push(ret);

            curword = '';
            if(aligned[0][n].match(/[\n\s]/))
                wordstart = wordend + 1;
            else wordstart = wordend;
        }
        else {
            if(curword === '' && aligned[0][n].match(/[\n\s]/))
                wordstart = wordend + 1;
            curword += aligned[1][n];
        }

        if(aligned[0][n] !== '') wordend += 1;
    }
    if(curword) { // might be "" if wordsplit is only partial
        const ret = {word: curword, start: wordstart, end: wordend};
        const translation = translations.shift();
        if(translation) ret.translation = translation;
        words.push(ret);
    }

    return words;
};

const makeEntries = (list) => {
    const formatWord = (w) => {
        return w.replace(/([~+()])/g,'<pc>$1</pc>')
                .replaceAll(/['’]/g,'<pc>(</pc>u<pc>)</pc>')
                //.replaceAll(/\[(.+?)\]/g,'<supplied>$1</supplied>');
                .replaceAll(/\[(.+?)\]/g,'$1');
    };
    return list.map(e => {
        const select = e.hasOwnProperty('strand') ? ` select="${e.strand}"` : '';
        const translation = e.hasOwnProperty('translation') ? `\n    <def>${e.translation}</def>` : '';
        return `  <entry corresp="${e.start},${e.end}"${select}>\n    <form>${formatWord(e.word)}</form>${translation}\n</entry>`;
    });
};
*/

const Splitter = {
    addWordSplits: addWordSplits,
    listEdit: listEdit,
    refreshTranslation: refreshTranslation,
    init: init,
    sharedState: null
};

export default Splitter;
