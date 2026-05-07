import {gramAbbreviations} from './abbreviations.mjs';
import {countLines, decodeRLE, matchCounts} from './utils.mjs';

const serializeWordsplits = (standOff, serializer) => {
    const words = [];
    const doc = standOff.ownerDocument;
    const selected = standOff.getAttribute('corresp').slice(1);
    for(const child of standOff.children) {
        if(child.nodeName === 'entry')
            words.push(processEntry(child));
        else if(child.nodeName === 'superEntry')
            words.push(processSuperEntry(child));
    }

    const tamsplits = [];
    const engsplits = [];
    const allnotes = [];
    const cleanNote = n => {
        if(serializer)
            return serializer(n).replaceAll('<note xmlns="http://www.tei-c.org/ns/1.0">','<note>');
        const xs = new XMLSerializer();
        return xs.serializeToString(n).replaceAll('<note xmlns="http://www.tei-c.org/ns/1.0">','<note>');
    };

    for(const word of words) {
      //TODO: use tamlength (so that, e.g. celk(a) doesn't count as 6 characters)
        if(word.hasOwnProperty('strands')) {
            tamsplits.push(word.strands.map(arr => arr.map(w => w.tamil).join('|')).join('/'));
            engsplits.push(word.strands.map(arr => arr.map(w => w.note ? w.english + '*' : w.english).join('|')).join('/'));
            for(const strand of word.strands)
                for(const w of strand) 
                    if(w.note) allnotes.push(cleanNote(w.note));
        }
        else {
            tamsplits.push(word.tamil);
            engsplits.push(word.note ? word.english + '*' : word.english);
            if(word.note) allnotes.push(cleanNote(word.note));
        }
    }
    const block = doc.querySelector(`[*|id="${selected}"]`);
    const edtype= block.querySelector('[type="edition"]');
    const lines = (edtype || block).querySelectorAll('l');
    const linecounts = countLines(lines);
    
    const alignmentel = standOff.querySelector('interp[select="0"]');

    if(!alignmentel) {
        return {eng: engsplits.join(' '), tam: tamsplits.join(' '), notes: allnotes};
    }

    const alignment = alignmentel.textContent.trim().split(',').map(s => decodeRLE(s));

    const realcounts = matchCounts(alignment,linecounts);
    let tamout = '';
    let engout = '';
    let wordcount = 0;
    for(let n=0; n<tamsplits.length;n++) {
        wordcount = wordcount + firstOption(tamsplits[n]).length;
        if(wordcount >= realcounts[0]) {
            tamout = tamout + tamsplits[n] + '\n';
            engout = engout + engsplits[n] + '\n';
            realcounts.shift();
        }
        else {
            tamout = tamout + tamsplits[n] + ' ';
            engout = engout + engsplits[n] + ' ';
        }
    }
    return {eng: engout, tam: tamout, notes: allnotes};
};

const firstOption = str => str.replace(/\/.+$/,'').replaceAll(/\|/g,'');

const processEntry = (entry) => {
    const def = entry.querySelector('def');
    const grammar = getGrammar(entry);
    const {text, textlength} = retransformWord(entry.querySelector('form'));
    return {
        tamil: text,
        tamlen: textlength,
        english: def ? def.textContent.trim().replaceAll(/\s+/g,'_') + grammar : 
                       grammar || '()',
        note: entry.querySelector('note')
   };
};
const processSuperEntry = superEntry => {
    const ret = {
            type: superEntry.getAttribute('type'),
            strands: []
        };
    for(const strand of superEntry.querySelectorAll(':scope > entry')) {
        const strandentries = [];
        for(const entry of strand.querySelectorAll(':scope > entry')) {
            strandentries.push(processEntry(entry));
        }
        ret.strands.push(strandentries);
    }
    return ret;
};

const getGrammar = entry => {
    const ret = [];
    for(const gram of entry.querySelectorAll('gram[type="role"]'))
        ret.push(reverseAbbreviations.get(gram.textContent));
    const type = entry.getAttribute('type');
    if(type) ret.push(...type.split(' ').map(t => t + '.'));
    return ret.length > 0 ? '(' + ret.join('|') + ')' : '';
};
const retransformWord = el => {
    const clone = el.cloneNode(true);
    const tamlen = clone.textContent.length;
    const chars = clone.querySelectorAll('c');
    for(const c of chars) {
        const type = c.getAttribute('type');
        switch (type) {
            case 'elided':
                c.replaceWith('*');
                break;
            case 'geminated':
                c.replaceWith('+');
                break;
            case 'glide':
                c.replaceWith('~');
                break;
            case 'uncertain':
                c.replaceWith(`(${c.textContent})`);
                break;
            case 'inserted':
                c.replaceWith(`[${c.textContent}]`);
                break;
        }
    }
    return {text: getEditionText(clone).trim().replaceAll(/\s/g,'_'), textlength: tamlen};
};

const getEditionText = el => {
    const clone = el.cloneNode(true);
    for(const gap of clone.querySelectorAll('gap')) {
        const quantity = gap.getAttribute('quantity') || 1;
        gap.replaceWith('‡'.repeat(quantity));
    }
    for(const toremove of clone.querySelectorAll('rdg, note, trailer'))
        toremove.remove();
    return clone.textContent;
};

const reverseAbbreviations = new Map(
    gramAbbreviations.map(arr => [arr[1],arr[0]])
);
/*
const countLines = lines => {
    return lines.reduce((acc,cur) => {
        const count = countWalker(cur);
        const add = acc.length > 0 ? acc.at(-1) : 0;
        acc.push(count + add);
        return acc;
    },[]);
};
*/

const prettyWord = el => {
    const form = el.querySelector('form');
    const clone = form.cloneNode(true);
    const tamlen = clone.textContent.length;
    const chars = clone.querySelectorAll('c');
    for(const c of chars) {
        const type = c.getAttribute('type');
        switch (type) {
            case 'elided':
                c.replaceWith("'");
                break;
            case 'geminated':
                c.replaceWith('{\\color{gray}' + c.textContent + '}');
                break;
            case 'glide':
                c.replaceWith('{\\color{gray}' + c.textContent + '}');
                break;
            case 'uncertain':
                c.replaceWith('{\\color{gray}(' + c.textContent + ')}');
                break;
            case 'inserted':
                c.replaceWith('{\\color{gray}' + c.textContent + '}');
                break;
        }
    }
    return {text: getEditionText(clone).trim(), textlength: tamlen};
};

const prettySuperWord = superEntry => {
    const ret = {
            type: superEntry.getAttribute('type'),
            strands: []
        };
    for(const strand of superEntry.querySelectorAll(':scope > entry')) {
        const strandentries = [];
        for(const entry of strand.querySelectorAll(':scope > entry')) {
            strandentries.push(prettyWord(entry));
        }
        ret.strands.push(strandentries);
    }
    return ret;
};
const latexWordsplits = (standOff, serializer) => {
    const words = [];
    const doc = standOff.ownerDocument;
    const selected = standOff.getAttribute('corresp').slice(1);
    for(const child of standOff.children) {
        if(child.nodeName === 'entry')
            words.push(prettyWord(child));
        else if(child.nodeName === 'superEntry')
            words.push(prettySuperWord(child));
    }

    const tamsplits = [];
    // TODO: add notes
    /*
    const allnotes = [];
    const cleanNote = n => {
        if(serializer)
            return serializer(n).replaceAll('<note xmlns="http://www.tei-c.org/ns/1.0">','<note>');
        const xs = new XMLSerializer();
        return xs.serializeToString(n).replaceAll('<note xmlns="http://www.tei-c.org/ns/1.0">','<note>');
    };
    */
    /*
    for(const word of words) {
        if(word.hasOwnProperty('strands')) {
            tamsplits.push(word.strands.map(w => w.join(' ')).join('/'));
        }
        else {
            tamsplits.push(word);
        }
    }
    */
    const block = doc.querySelector(`[*|id="${selected}"]`);
    const edtype= block.querySelector('[type="edition"]');
    const lines = (edtype || block).querySelectorAll('l');
    const linecounts = countLines(lines);
    
    const alignmentel = standOff.querySelector('interp[select="0"]');

    if(!alignmentel) {
        return tamsplits.map(word => {
          if(word.hasOwnProperty('strands')) {
              return word.strands.map(w => w.tamil.join(' ')).join('/');
          }
          else return word;
        }).join(' ');
    }

    const alignment = alignmentel.textContent.trim().split(',').map(s => decodeRLE(s));

    const realcounts = matchCounts(alignment,linecounts);
    let tamout = '';
    let engout = '';
    let wordcount = 0;
    for(let n=0; n<words.length;n++) {
        const len = words[n].hasOwnProperty('strands') ? 
          words[n].strands[0].map(w => w.textlength).reduce((a,c) => a + c,0) : words[n].textlength;
        const word = words[n].hasOwnProperty('strands') ? 
          words[n].strands.map(s => s.map(w => w.text).join(' ')).join('/') : words[n].text;
        wordcount = wordcount + len;
        if(wordcount >= realcounts[0]) {
            tamout = tamout + word + '\n';
            realcounts.shift();
        }
        else {
            tamout = tamout + word + ' ';
        }
    }
    return tamout;
};
export {serializeWordsplits, latexWordsplits, getEditionText};
