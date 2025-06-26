import Fs from 'fs';
import Path from 'path';
import Process from 'process';
import Jsdom from 'jsdom';
import sqlite3 from 'better-sqlite3';
import {Sanscript} from '../js/sanscript.mjs';
import {decodeRLE, findLines} from '../debugging/utils.mjs';
import {gramAbbreviations, gramMap, dbSchema} from '../debugging/abbreviations.mjs';

const CONCATRIGHT = Symbol.for('concatright');
const CONCATLEFT = Symbol.for('concatleft');

const dbValues = Object.values(dbSchema).reduce((acc,cur) => {
        for(const c of cur) acc.push(c);
        return acc;
    },[]);
dbValues.sort((a,b) => b.length - a.length);

const dbKeys = Object.keys(dbSchema);
const importantKeys = ['pos','number','gender','nouncase','person','aspect','voice'];
const dbops = {
    open: (f) => {
        const db = new sqlite3(f);
        db.pragma('journal_mode = WAL');
        db.pragma('foreign_keys = ON');
        return db;
    },

    close: (db) => {
        db.prepare('VACUUM').run();
        db.close();
    }
};

const dir = '../..';
var fulldb;

const go = () => {
    fulldb = dbops.open('../debugging/index.db');
    const db = dbops.open('../../wordindex.db');
    db.prepare('DROP TABLE IF EXISTS [citations]').run();
    db.prepare('DROP TABLE IF EXISTS [lemmata]').run();
    db.prepare('CREATE TABLE [lemmata] (lemma TEXT PRIMARY KEY, recognized INTEGER, form TEXT, formsort TEXT, definition TEXT)').run();
    db.prepare('CREATE TABLE [citations] ('+
        'form TEXT, '+
        'formsort TEXT, '+
        'sandhi TEXT, '+
        'islemma TEXT, '+
        'fromlemma TEXT, '+
        'def TEXT, '+
        'pos TEXT, '+
        'number TEXT, '+
        'gender TEXT, '+
        'nouncase TEXT, '+
        'person TEXT, '+
        'aspect TEXT, '+
        'voice TEXT, '+
        'precededby TEXT, '+
        'pregeminate INTEGER, '+
        'postgeminate INTEGER, '+
        'followedby TEXT, '+
        'syntax TEXT, '+
        'verbfunction TEXT, '+
        'particlefunction TEXT, '+
        'rootnoun TEXT, '+
        'misc TEXT, '+
        'proclitic TEXT, ' +
        'enclitic TEXT, ' +
        'context TEXT, ' +
        'citation TEXT, ' +
        'line INTEGER, ' +
        'filename TEXT' +
        ')').run();
    const regex = new RegExp(`^${Process.argv[2]}.*\\.xml$`);
    Fs.readdir(dir,(err, files) => {
        if(err) return console.log(err);
        const collator = new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'});
        files.sort(collator.compare);
        for(const f of files) {
            if(regex.test(f))
                addToDb(dir + '/' + f,db);
        }
    });
};

const cleanForm = (el,remove=['elided','geminated','glide']) => {
    const clone = el.cloneNode(true);
    for(const gap of clone.querySelectorAll('gap')) {
        const quantity = gap.getAttribute('quantity') || 1;
        gap.replaceWith('‡'.repeat(quantity));
    }
    for(const c of clone.querySelectorAll('c')) {
        const type = c.getAttribute('type');
        if(remove.includes(type))
                c.remove();
        else {
            if(type == 'uncertain') c.replaceWith(`(${c.textContent})`);
            //else c.replaceWith(c.textContent);
        }
    }

    return clone.textContent.trim()
                         .replaceAll(/\([ui]\)/g,'u')
                         .replaceAll(/[+~]/g,'');
};

const cleanParticle = (el,form) => {
    const proclitics = ['amma','koṉ','maṟṟu','yāḻa'];
    const proMap = new Map(
        proclitics.map(p => {
            const pp = p.slice(0,-1);
            if(/u$/.test(pp)) {
                const regex = pp.replace(/u$/,'[ui]');
                return [p, new RegExp(`^${regex}\\-`)];
            }
            else
                return [p, new RegExp(`^${p}-`)];
        })
    );
    const particle = el.textContent.trim();
    const partregex = proMap.get(particle);
    
    if(!partregex) return ['enclitic',particle];
    
    if(form.match(partregex))
        return ['proclitic',particle];

    return ['enclitic',particle];
};

const splitRoles = (str) => {
    let newstr = str;
    const ret = [];
    for(const val of dbValues) {
        const found = newstr.indexOf(val);
        if(found === -1) continue;

        newstr = newstr.slice(0,found) + newstr.slice(found + val.length);
        ret.push(val);
    }
    return ret;
};

const getRoles = roles => {
    const keys = dbKeys;
    const rs = [...roles].flatMap(r => splitRoles(r.textContent)).filter(r => r);
    const ret = Object.fromEntries(keys.map(s => [s,null]));

    for(const key of keys) {
        for(const r of rs) {
            if(dbSchema[key].has(r))
                ret[key] = r;
        }
    }
    return ret;
};

const prepWordEntry = entry => {
    const defel = entry.querySelector('def');
    if(!defel) return null;
    const def = defel.innerHTML.trim();
    const form = entry.querySelector('form');
    const sandhi = entry.querySelector('form[type="sandhi"]');
    const clean = cleanForm(form,['inserted','glide','geminated']);
    const simple = entry.querySelector('form[type="simple"]')?.innerHTML.trim();
    const particle = entry.querySelector('gramGrp[type="particle"]');
    const roles = entry.querySelectorAll('gram[type="role"]'); 

    const ret = {
        form: simple || clean,
        def: def,
        roles: roles ? getRoles(roles) : {},
    };

    if(sandhi)
        ret.sandhi = cleanForm(sandhi,['uncertain','geminated','elided','glide']);
    else if(!particle && simple) {
        const cleaner = cleanForm(form,['uncertain','geminated','elided','glide']);
        if(simple !== cleaner)
            ret.sandhi = cleaner;
    }
    if(particle) {
        const [ptype,pform] = cleanParticle(particle,clean);
        ret[ptype] = pform;
    }
    return ret;

};

const superSet = (arr1, arr2) => {
    const isSuperset = (a,b) => {
        for(const a1 of a) {
            if(!b.includes(a1)) return false;
        }
        return b;
    };
    return isSuperset(arr1,arr2) || isSuperset(arr2,arr1);
};
const setUnion = (arr1, arr2) => {
    const ret = new Set(arr1);
    for(const a2 of arr2)
        ret.add(a2);
    return JSON.stringify([...ret]);
};

const isSuperSetOf = (obj1, obj2) => {
    for(const key of importantKeys) {
        if(obj1[key] && obj2[key] && obj1[key] !== obj2[key]) return false;
        if(obj2[key] && !obj1[key]) return false;
    }
    return true;
};

const findLemma = (curword, candidates) => {
    if(!candidates || candidates.length === 0) return { islemma: null, fromlemma: null };
    
    if(candidates.length > 1)
        candidates.sort((a,b) => b.citations.length - a.citations.length);

    for(const candidate of candidates) {
        if(isSuperSetOf(candidate, curword)) {
            return { islemma: candidate.islemma, fromlemma: candidate.fromlemma, definition: candidate.definition };
        }
    }
    //return { islemma: candidates[0].islemma, fromlemma: candidates[0].fromlemma };
    return { islemma: null, fromlemma: null };
};
const isSameLine = (linenum, el,postspace) => {
    return linenum === el.closest('[linenum]').getAttribute('linenum') ? '' : 
        postspace ? '/ ' : ' /';
};

const getPrevEntry = (entries,n,linenum) => {
    const prevEntry = realPrev(entries,n);
    if(!prevEntry) return '';

    const ellipsis = n > 1 ? '…' : '';
    return ellipsis + cleanForm(prevEntry.querySelector('form'),[]) + isSameLine(linenum,prevEntry) + ' ';
    /*
    if(n > 0) {
        const ellipsis = n > 1 ? '…' : '';

        const superEntry = entries[n].closest('superEntry');
        if(superEntry && entries[n].parentNode.firstElementChild === entries[n]) {
            const prevEl = superEntry.previousElementSibling;
            if(!prevEl || (prevEl.nodeName !== 'entry' && prevEl.nodeName !== 'superEntry'))
                return '';

            const prevEntry = prevEl.nodeName === 'superEntry' ? prevEl.lastElementChild : prevEl;
            return ellipsis + cleanForm(prevEntry.querySelector('form'),[]) + isSameLine(linenum,prevEntry) + ' ';
        }
        return ellipsis + cleanForm(entries[n-1].querySelector('form'),[]) + isSameLine(linenum,entries[n-1]) + ' ';
    }
    return '';
    */
};
const realPrev = (entries, n) => {
    if(n === 0) return null;

    const superEntry = entries[n].closest('superEntry');
    if(superEntry && entries[n].parentNode.firstElementChild === entries[n]) {
        const prevEl = superEntry.prevElementSibling;
        if(!prevEl || (prevEl.nodeName !== 'entry' && prevEl.nodeName !== 'superEntry'))
            return null;

        const prevEntry = prevEl.nodeName === 'superEntry' ? prevEl.lastElementChild : prevEl;
        return prevEntry;
    }
    return entries[n-1];
};

const realNext = (entries, n) => {
    if(n === entries.length-1) return null;

    const superEntry = entries[n].closest('superEntry');
    if(superEntry && entries[n].parentNode.lastElementChild === entries[n]) {
        const nextEl = superEntry.nextElementSibling;
        if(!nextEl || (nextEl.nodeName !== 'entry' && nextEl.nodeName !== 'superEntry'))
            return null;

        const nextEntry = nextEl.nodeName === 'superEntry' ? nextEl.firstElementChild : nextEl;
        return nextEntry;
    }
    return entries[n+1];
};

const getNextEntry = (entries,n,linenum) => {
    /*    
    if(n < entries.length-1) {
        const ellipsis = n < entries.length-2 ? '…' : '';
        const superEntry = entries[n].closest('superEntry');
        if(superEntry && entries[n].parentNode.lastElementChild === entries[n]) {
            const nextEl = superEntry.nextElementSibling;
            if(!nextEl || (nextEl.nodeName !== 'entry' && nextEl.nodeName !== 'superEntry'))
                return '';

            const nextEntry = nextEl.nodeName === 'superEntry' ? nextEl.firstElementChild : nextEl;
            return nextEntry ? 
                ' ' + isSameLine(linenum,nextEntry,true) + cleanForm(nextEntry.querySelector('form')) + ellipsis :
                '';
        }
        return ' ' + isSameLine(linenum,entries[n+1],true) + cleanForm(entries[n+1].querySelector('form')) + ellipsis; 
    }
    return '';
    */
    const nextEntry = realNext(entries,n);
    if(!nextEntry) return '';

    const ellipsis = n < entries.length-2 ? '…' : '';
    return ' ' + isSameLine(linenum,nextEntry,true) + cleanForm(nextEntry.querySelector('form'),[]) + ellipsis;
};
/*
const decodeRLE = (s) => {
    return s.replaceAll(/(\d+)([MLRG])/g, (_, count, chr) => chr.repeat(count));
};

const addGaps = (textarr, rle) => {
    const arrclone = [...textarr];
    const newtextarr = [];
    for(const s of rle) {
        switch (s) {
            case 'M': newtextarr.push(arrclone.shift()); break;
            case 'G': newtextarr.push(''); break;
            case 'L': newtextarr.push(CONCATLEFT); break;
            case 'R': newtextarr.push(CONCATRIGHT);
        }
    }
    return newtextarr;
};

const replaceSpaces = (textarr, wordsplitarr, wordsplitwithspaces) => {
    let m = 0;
    for(let n=0; n<wordsplitarr.length; n++) {
        if(wordsplitarr[n] === '' || wordsplitarr[n] === CONCATLEFT || wordsplitarr[n] === CONCATRIGHT)
            continue;
        if(wordsplitwithspaces[m] === ' ') {
            textarr.splice(n,0,'');
            wordsplitarr.splice(n,0,' ');
            m = m + 1;
            n = n + 1;
        }
        m = m + 1;
    }
};

const restoreAlignment = (textel,standOff) => {
    const textarrs = prepText(textel);

    const wordsplits = prepWordsplits(standOff);
    const rles = [...standOff('interp[type="alignment"]')].map(r => r.textContent.split(',').map(rr => decodeRLE(rr))); 
    
    const textsWithGaps = textarrs.map((a,i) => addGaps(a,rles[i][0]));
    const splitsWithGaps = wordsplits.map((a,i) => addGaps(a.replaceAll(/\s/g,''),rles[i][1]));
    
    return textsWithGaps.map((a,i) => {
        replaceSpaces(a, splitsWithGaps[i], wordsplits[i]);
        return {text: a, wordsplits: splitsWithGaps[i]};
    });
};

const prepText = (text, strand) => {
    const textclone = text.cloneNode(true);
    
    for(const note of textclone.querySelectorAll('note'))
        note.remove();

    if(!textclone.querySelector('choice')) {
        return [textclone.textContent.replaceAll(/[\n\s]/g,'').split('')];
    }
    else {
        const strand0 = textclone.cloneNode(true);
        for(const choice of strand.querySelectorAll('choice'))
            choice.lastChild.remove();

        const strand1 = textclone.cloneNode(true);
        for(const choice of textclone.querySelectorAll('choice'))
            choice.firstChild.remove();
        return [strand0,strand1].map(s => s.textContent.replaceAll(/[\n\s]/g,'').split(''));
    }
};

const prepWordsplits = (standOff) => {
    const cleanWordEntry = (entry) => {
        const cleanOne = (e) => {
            const form = e.querySelector('form');
            for(const pc of form.querySelectorAll('pc[type="ignored"]'))
                pc.remove();
            return form.textContent;
        };

        entry = entry.cloneNode(true);
        if(entry.nodeName === 'superEntry') {
            const firstsub = entry.querySelector(':scope > entry');
            return [...firstsub].map(cleanOne).join(' ');
        }
        else return cleanOne(entry);
    };

    const entries = standOff.querySelectorAll(':scope > entry, :scope > superEntry');
                          //.querySelectorAll('entry');
    const wordsplits = [];

    if(!standOff.querySelector('entry[select]')) {
        wordsplits[0] = [...entries].map(cleanWordEntry).join(' ').split('');
        return wordsplits;
    }

    wordsplits[0] = [];
    wordsplits[1] = [];
    for(const entry of entries) {
        if(entry.nodeName === 'superEntry' && entry.getAttribute('type') !== 'ambiguous') {
            for(const subentry of entry.querySelectorAll('entry[select="0"] entry'))
                wordsplits[0].push(cleanWordEntry(subentry));
            for(const subentry of entry.querySelectorAll('entry[select="1"] entry'))
                wordsplits[1].push(cleanWordEntry(subentry));
        }
        else {
            wordsplits[0].push(cleanWordEntry(entry));
            wordsplits[1].push(cleanWordEntry(entry));
        }
    }
    return wordsplits.map(w => w.join(' ').split(''));
};


const getContext = (entries,from,to,textAlignment) => {
    const entryselect = word.closest('entry[select]');
    const strand = entryselect ? entryselect.getAttribute('select') : 0;
    const alignment = textAlignment[strand];
    
};
*/

const findPos = el => {
    const grams = el.querySelectorAll('gram[type="role"]');
    for(const gram of grams) {
        const gramtxt = gram.textContent;
        if(dbSchema.pos.has(gramtxt)) return gramtxt;
    }
    return 'undefined';
};

const findPost = (entry, next) => {
    if(!next) return {pos: null, geminates: 'FALSE'};

    const form = entry.querySelector('form');
    const gems = form.querySelectorAll('c[type="geminated"]');
    for(const gem of gems) {
        // geminate at beginning of form
        if(gem.parentNode.firstSibling === gem)
            continue;
        if(gem.previousSibling && 
           gem.previousSibling === gem.parentNode.firstChild &&
           gem.previousSibling.nodeType === 3 && 
           gem.previousSibling.data.trim() == '')
            continue;

        // geminate with enclitic particle
        // TODO: deal with compounds
        const postsib = gem.nextSibling;
        if(postsib && postsib.textContent.startsWith('-') && entry.querySelector('m[type="enclitic"]'))
            return {pos: 'particle', geminates: 'TRUE'};

        // geminate with following word
        if(gem.parentNode.lastChild === gem)
            return {pos: findPos(next), geminates: 'TRUE'};

        // if someone autoformatted and added newlines everywhere
        if(gem.parentNode.lastChild.nodeType === 3 &&
           gem.parentNode.lastChild.textContent === '' &&
           gem.parentNode.lastChild.previousSibling === gem)
            return {pos: findPos(next), geminates: 'TRUE'};
    }
    const nextgem = next.querySelector('form').querySelector('c[type="geminated"]');
    if(nextgem) {
        if(nextgem.parentNode.firstChild === nextgem)
            return {pos: findPos(next), geminates: 'TRUE'};

        // if someone autoformatted and added newlines everywhere
        if(nextgem.parentNode.firstChild.textContent === '' &&
           nextgem.parentNode.firstChild.nextSibling === nextgem)
            return {pos: findPos(next), geminates: 'TRUE'};
    }

    return {pos: findPos(next), geminates: 'FALSE'};
};
const findPre = (entry, prev) => {
    if(!prev) return {pos: null, geminates: 'FALSE'};

    const form = entry.querySelector('form');
    const gems = [...form.querySelectorAll('c[type="geminated"]')].toReversed();
    for(const gem of gems) {
        // geminate at end of form
        if(gem === gem.parentNode.lastSibling)
            continue;
        if(gem.nextSibling &&
           gem.parentNode.lastChild === gem.nextSibling &&
           gem.nextSibling.nodeType === 3 && 
           gem.nextSibling.data.trim() == '')
            continue;

        // geminate with proclitic particle
        // TODO: deal with compounds
        const presib = gem.previousSibling;
        if(presib && presib.textContent.startsWith('-') && entry.querySelector('m[type="proclitic"]'))
            return {pos: 'particle', geminates: 'TRUE'};

        // geminate with previous word
        if(gem.parentNode.firstChild === gem)
            return {pos: prev.querySelector('m[type="enclitic"]') ? 'particle' : findPos(prev), geminates: 'TRUE'};

        // if someone autoformatted and added newlines everywhere
        if(gem.parentNode.lastChild.nodeType === 3 &&
           gem.parentNode.lastChild.textContent === '' &&
           gem.parentNode.lastChild.previousSibling === gem)
            return {pos: prev.querySelector('m[type="enclitic"]') ? 'particle' : findPos(prev), geminates: 'TRUE'};
    }
    const prevgem = [...prev.querySelector('form').querySelectorAll('c[type="geminated"]')].pop();
    if(prevgem) {
        if(prevgem.parentNode.lastChild === prevgem)
            return {pos: prev.querySelector('m[type="enclitic"]') ? 'particle' : findPos(prev), geminates: 'TRUE'};

        // if someone autoformatted and added newlines everywhere
        if(prevgem.parentNode.lastChild.textContent === '' &&
           prevgem.parentNode.lastChild.previousSibling === prevgem)
            return {pos: prev.querySelector('m[type="enclitic"]') ? 'particle' : findPos(prev), geminates: 'TRUE'};
    }

    return {pos: findPos(prev), geminates: 'FALSE'};
};

const addToDb = (fname,db) => {
    console.log(fname);
    const basename = Path.basename(fname);
    const f = Fs.readFileSync(fname,{encoding: 'utf-8'});
    const dom = new Jsdom.JSDOM('');
    const parser = new dom.window.DOMParser();
    const doc = parser.parseFromString(f,'text/xml');
    const standOffs = doc.querySelectorAll('standOff[type="wordsplit"]');
    for(const standOff of standOffs) {
        const citation = standOff.getAttribute('corresp').replace(/^#/,'');
        findLines(doc,citation,standOff);
        const entries = standOff.querySelectorAll('entry:has(> form)');
        //const textAlignment = restoreAlignment(doc.getElementById(citation), standOff);
        
        for(let n=0;n<entries.length;n++) {
            const entry = entries[n];
            const ins = prepWordEntry(entry);
            const linenum = entry.closest('[linenum]').getAttribute('linenum');
            if(ins === null) continue;
            const prev = getPrevEntry(entries,n,linenum);
            const next = getNextEntry(entries,n,linenum);
            const {pos: precededby, geminates: pregeminate} = findPre(entry,realPrev(entries,n));
            const {pos: followedby, geminates: postgeminate} = findPost(entry,realNext(entries,n));
            const context = prev + cleanForm(entry.querySelector('form'),[]) + next;
            /*
            const from = n > 0 ? n - 1 : n;
            const to = n < entries.length-1 ? n + 1 : n;
            const context = getContext(entries,from,to,textAlignment);
            */
            const rows = fulldb.prepare('SELECT islemma, fromlemma, definition, pos, number, gender, nouncase, person, aspect, voice, citations FROM dictionary WHERE word = ?').all(ins.form);

            const {islemma, fromlemma, worddef} = findLemma(ins.roles,rows);
            /*
            const islemma = rows[0]?.islemma || null;
            const fromlemma = rows[0]?.fromlemma || null;
            */

            const dbobj = Object.assign({form: ins.form, formsort: Sanscript.t(ins.form,'iast','tamil'), sandhi: ins.sandhi, islemma: islemma, fromlemma: fromlemma, def: ins.def, precededby: precededby, pregeminate: pregeminate, postgeminate: postgeminate, followedby: followedby, proclitic: ins.proclitic, enclitic: ins.enclitic, context: context, citation: citation, line: parseInt(linenum)+1, filename: basename},ins.roles);
            db.prepare('INSERT INTO citations VALUES (@form, @formsort, @sandhi, @islemma, @fromlemma, @def, @pos, @number, @gender, @nouncase, @person, @aspect, @voice, @precededby, @pregeminate, @postgeminate, @followedby, @syntax, @verbfunction, @particlefunction, @rootnoun, @misc, @proclitic, @enclitic, @context, @citation, @line, @filename)').run(dbobj);
            const lemmaform = islemma ? ins.form : fulldb.prepare('SELECT word FROM dictionary WHERE islemma = ?').get(fromlemma)?.word || ins.form;
            const lemmadef = islemma ? worddef : 
                fromlemma ? fulldb.prepare('SELECT definition FROM dictionary WHERE islemma = ?').get(fromlemma)?.definition :
                null;
            db.prepare('INSERT OR IGNORE INTO lemmata VALUES (@lemma, @recognized, @form, @formsort, @definition)').run({
                lemma: islemma||fromlemma||ins.form,
                recognized: (islemma || fromlemma) ? 'TRUE' : 'FALSE',
                form: lemmaform,
                formsort: Sanscript.t(lemmaform,'iast','tamil'),
                definition: lemmadef
            });
        }
        //const superentries = doc.querySelectorAll('standOff[type="wordsplit"] > superEntry');
        // TODO: Also do compounds
    }
};
go();
