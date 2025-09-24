import needlemanWunsch from './needlemanwunsch.mjs';
import {gramAbbreviations} from './abbreviations.mjs';
import lookupFeatures from './lookupfeatures.mjs';

/*
const _state = {
    worker: null
};
*/

const CONCATRIGHT = Symbol.for('concatright');
const CONCATLEFT = Symbol.for('concatleft');

const particlebare = ['amma',/*'amma-',*/'attai','arō','ā','ār','āl','ālamma','āṟṟilla','ikā','um','umār','ē','ēe','ēku','ēkamma','ēmaṉṟa','ēyum','ō','ōo','ōteyya','kol','kolō','kollō','kollē',/*'koṉ','koṉmaṟṟu','koṉ-',*/'til','tilla','tilamma','tillamma','teyya',/*'maṟṟu','maṟṟu-','maṟṟē','ēmaṟṟē','ōmaṟṟu','ōmaṟṟē',*/'maṟṟilla','maṉ','maṉṟa','maṉṟil','maṉṟilla','maṉṉō','maṉṉē','maṉṉum','maṉṉāl','maṉṟa','maṉṟamma','maṟkolō','maṟkollō','mātu','mātō','māḷa',/*'yāḻa','yāḻa-'*/];

particlebare.sort((a,b) => b.length - a.length);

const particles = particlebare.map(a => {
    /*
    if(a.endsWith('-')) {
        const aa = a.slice(0,-1);
        if(/u$/.test(aa)) {
            const regex = aa.replace(/u$/,'(?:[*\'’u]|\\(i\\))');
            return [a,new RegExp(`^\\+?~?${regex}\\+?-`)];
        }
        else
            return [a,new RegExp(`^\\+?~?${aa}\\+?-`)];
    }
    */
    if(/u$/.test(a)) {
        const regex = a.replace(/u$/,'[*\'u]');
        return [a,new RegExp(`\\+?~?${regex}\\+?$`)];
    }
    else
        return [a,new RegExp(`\\+?~?${a}\\+?$`)];
});

const caseAffixes = [
/*
    ['māṭṭu',{
        regex: /māṭṭ[*’u]$/,
        gram: 'locative',
        translationregex: /\(loc\.\)$/
    }],
    ['mutal',{
        regex: /mutal\+?$/,
        gram: 'locative',
        translationregex: /\(loc\.\)$/
    }],
    ['kaṇ',{
        regex: /kaṇ\+?$/,
        gram: 'locative',
        translatonregex: /\(loc.\.\)$/
    }],
    */
    ['iṉ',{
        regex: /iṉ\+?$/,
        gram: 'oblique',
        translationregex: /iṉ$/
    }],
    ['iṉum',{
        regex: /~?iṉum\+?$/,
        translationregex: /iṉum$/
    }],
    /*
    ['am',{
        regex: /~?am\+?$/,
        translationregex: /am$/
    }],
    ['a',{
        regex: /~?a\+?$/,
        translationregex: /a$/
    }],
    */
    ['oṭu',{
        regex: /~?[oō]ṭ[u’*]\+?$/,
        gram: 'sociative',
        translationregex: /-with$/
    }],
    ['āṅku',{
        regex: /~?[aā]ṅk[u’*]\+?$/,
        gram: 'comparative',
        translationregex: /-like$/
    }]
];
caseAffixes.sort((a,b) => b[0].length - a[0].length);

const gramKeys = gramAbbreviations.map(a => a[0]);

const gramMap = new Map(gramAbbreviations);
const revGramMap = new Map(gramAbbreviations.map(a => [a[1],a[0]]));

const wordsplitscore = (a,b) => {
    const vowels = 'aāiīuūoōeē'.split('');
    const punctuation = ['-','–','—','―','‘','’','“','”',',','.',';','!'];
    if(a === ' ' || b === ' ') return -2;
    if(a === b) return 1;
    if(a === 'i' && b === '[i]') return 1;
    if(['m','ṅ','n','ñ'].includes(a) && b === '[m]') return 1;
    if(punctuation.includes(a)) return -3;
    if(['-','*','\'','’','(',')','(a)','(m)'].includes(b)) return -2;
    if(['y','v'].includes(a) && b === '~') return 1; // is this needed?
    if(vowels.includes(a) && vowels.includes(b)) return -0.5;
    return -1;
};
/*
const warnTypos = (alignment) => {
    const ret = [];
    alignment[1].forEach((el, i) => {
        if(el === '') {
            const slice0 = alignment[0].slice(i-10,i+10).join('');
            const slice1 = alignment[1].slice(i-10,i).join('') + 
                '<mark>&nbsp;</mark>' +
                alignment[1].slice(i,i+10).join('');
            ret.push(`Missing sandhi: <span class="choice"><span>${slice0}</span><span>${slice1}</span></span>`);
        }
        else if(el === '~' && !['v','y'].includes(alignment[0][i])) {
                const slice0 = alignment[0].slice(i-10,i+10).join('');
                const slice1 = alignment[1].slice(i-10,i).join('') +
                    `<mark>${el}</mark>` + 
                    alignment[1].slice(i+1,i+10).join('');
                ret.push(`Unmatched sandhi: <span class="choice"><span>${slice0}</span><span>${slice1}</span></span>`);
        }
        else if(el === '+' && alignment[0][i] === '') {
                const slice = alignment[1].slice(i-10,i).join('') +
                    `<mark>${el}</mark>` + 
                    alignment[1].slice(i+1,i+10).join('');
                ret.push(`Unmatched sandhi: ${slice}`);
        }
    });
    return ret;
};
*/
const removeOptions = (words) => words.map(w => w.split('/')[0].replaceAll('|',''));

const tamilSplit = (str) => {
    const tokarr = ['ai','au','(m)','(a)','[i]','[m]'];
    const tokens = new Set(tokarr);
    const maxlength = Math.max(...tokarr.map(s => s.length));
    const ret = [];
    let cache = '';
    for(let n=0;n<str.length || cache !== '';n++) {
        const diff = maxlength - cache.length;
        if(diff > 0 && n < str.length) {
            cache = cache + str[n];
            if(diff > 1) continue;
        }
        for(let m=0;m<maxlength;m++) {
            const candidate = cache.slice(0,maxlength - m);
            if(tokens.has(candidate)) {
                ret.push(candidate);
                cache = cache.slice(maxlength-m);
                break;
            }
            if(m === maxlength - 1) {
                ret.push(candidate);
                cache = cache.slice(1);
            }
        }
    }
    //if(cache) for(const c of cache) ret.push(c);
    return ret;
};

const updateNotes = (obj,notes) => {
    if(obj.translation.endsWith('*')) {
        obj.translation = obj.translation.slice(0,-1);
        if(notes) obj.wordnote = notes.shift();
    }
};

const updateParticles = (obj) => {
    // we should remove punctuation from the wordlist so it aligns properly
    //obj.word = obj.word.replace(/[\.;]$/,'');
    //obj.translation = obj.translation.replace(/[\.;]$/,'');
    // BUT now punctuation is removed from the wordsplit completely
   
    // TODO: obj.translation parameter will be deprecated
    const particle = findParticle(obj.word,obj.translation);
    if(particle) {
        //console.log(`Found particle: ${particle.particle} in ${obj.word}, "${obj.translation}".`);
        obj.translation = particle.translation;
        obj.particle = particle.particle;
        obj.particletype = particle.particletype;
        obj.bare = particle.bare;
    }
    // TODO: findAffix will be deprecated
    const affix = findAffix(obj.bare||obj.word,obj.translation);
    if(affix) {
        //console.log(`Found affix: ${particle.affix} in ${obj.word}, "${obj.translation}".`);
        obj.translation = affix.translation;
        obj.affix = affix.affix;
        if(affix.gram) obj.affixrole = affix.gram;
    }
};

const updateMarks = obj => {
    const sandhi = obj.sandhi;
    const nosandhi = obj.tokenized;
    for(let n=0;n<sandhi.length;n++) {
        switch (nosandhi[n]) {
            case '~':
               nosandhi[n] = `<c type="glide">${sandhi[n]}</c>`;
               sandhi[n] = `<c type="glide">${sandhi[n]}</c>`;
               break;
            case '+':
                nosandhi[n] = `<c type="geminated">${sandhi[n]}</c>`;
                sandhi[n] = `<c type="geminated">${sandhi[n]}</c>`;
                break;
            case '*':
            case '’':
            case '\'':
                nosandhi[n] = '<c type="elided">u</c>';
                break;
            case '(m)':
                nosandhi[n] = '<c type="uncertain">m</c>';
                break;
            case '(a)':
                nosandhi[n] = '<c type="uncertain">a</c>';
                break;
            case '[i]':
                nosandhi[n] = '<c type="inserted">i</c>';
                sandhi[n] = '<c type="inserted">i</c>';
                break;
            case '[m]':
                nosandhi[n] = '<c type="inserted">m</c>';
                sandhi[n] = `<c type="inserted">${sandhi[n]}</c>`;
        }
    }
};

const getSandhiform = (sandhisequence,start,end) => {
    const ret = sandhisequence.slice(start,end);

    const firstchar = ret.shift();
    if(firstchar === CONCATLEFT)
        ret.unshift(sandhisequence.at(start-1));
    else
        ret.unshift(firstchar);

    const lastchar = ret.pop();
    if(lastchar === CONCATRIGHT)
        ret.push(sandhisequence.at(end));
    else
        ret.push(lastchar);

    return ret;
};
/**
 * Returns a list of words as an Object {{word: string, sandhi: Array, translation: string}}
 * @param {[].<string>} tam Tamil wordsplit
 * @param {[].<string>} eng Word-by-word gloss
 * @param {[].<string,CONCATLEFT,CONCATRIGHT>} sandhisequence Aligned metrical text
 * @param {[].<string>} notes List of notes
 * @param {boolean} lookup Whether to do grammar lookup
 * @returns {words: [].<{}>, warnings: [].<string>}
 **/
const getWordlist = async (tam,eng,alignment,notes,lookup) => {
    const warnings = [];
    const ret = [];
    const jiggleSlice = (a,s,e) => {
        const ret = a.slice(s,e);
        if(ret[0] === CONCATLEFT)
            ret[0] = a[s-1];
        if(ret[ret.length-1] === CONCATRIGHT)
            ret[ret.length-1] = a[e];
        return ret;
    };
    let start = 0;
    for(let n=0;n<tam.length;n++) {
        // TODO: should we remove hyphens or not?
        
        let startchar = alignment[1][start];
        while(startchar === '') {
            start = start + 1; // better solution for this?
            startchar = alignment[1][start];
        }
        tam[n] = tam[n].replaceAll('_',' ');
        const entry = {word: tam[n], 
                       tokenized: tamilSplit(tam[n].split('/')[0].replaceAll('|','')), 
                       sandhi: null, 
                       translation: eng[n]
                      };

        let reallen = entry.tokenized.filter(c => c !== ' ').length;
        for(let m=0;m<reallen;m++) {
            const endchar = alignment[1][start + m];
            if(endchar === '') reallen = reallen + 1;
        }
        //let end = start + entry.tokenized.length;
        const end = start + reallen;
        
        entry.sandhi = getSandhiform(alignment[0],start,end);
        
        const wordsplit = entry.word.split('/');
        const getTransSplit = t => {
            if(!t) return ['',''];
            if(!t.includes('/')) return [t,''];
            return t.split('/');
        };
        if(wordsplit.length > 1) {
            const transsplit = getTransSplit(entry.translation);
            entry.superEntry = [];
            for(let n=0;n<wordsplit.length;n++) {
                const slice0 = jiggleSlice(alignment[0],start,end);
                const slice1 = jiggleSlice(alignment[1],start,end);
                const {words: strand, warnings: morewarnings} = await getWordlist(
                        wordsplit[n].split(/(?<!\.)\|/),
                        transsplit[n].split(/(?<!\.)\|/),
                        [slice0,slice1],
                        notes,
                        lookup
                    );
                for(const w of morewarnings) warnings.push(w);
                entry.superEntry.push(strand);
            }
        }
        else
            await cleanupWord(entry,lookup,notes,warnings);

        ret.push(entry);
        start = end;
    }

    evenMoreWarnings(ret, warnings);

    return {words: ret, warnings: warnings};
};

const evenMoreWarnings = (wordlist, warnings) => {
    for(let n=0;n<wordlist.length-1;n++) {
        const e1 = wordlist[n];
        const w1 = e1.hasOwnProperty('superEntry') ?
            e1.superEntry[0][e1.superEntry[0].length-1].word :
            e1.word;
        if(!w1.endsWith('+')) continue;

        const e2 = wordlist[n+1];
        const w2 = e2.hasOwnProperty('superEntry') ?
            e2.superEntry[0][0].word :
            e2.word;
        if(/^[aāiīuūeēoō]/.test(w2))
            warnings.push(`${w1} ${w2}`);
    }
};

const alignWordsplits = async (text,tam,eng,notes,lookup=false) => {
    //const wl = restoreSandhi(removeOptions(tam).join(''));
    const wl = removeOptions(tam);
    const wordtokens = wl.map(w => tamilSplit(w.replaceAll('_','')));
    const wordjoin = wordtokens.flat();
    // split cīrs first, in case of "a u", "a i", etc.
    const toktext = text.split(/\s+/).map(c => tamilSplit(c)).flat();
    const aligned = needlemanWunsch(toktext,wordjoin,wordsplitscore);
    const realigned = jiggleAlignment(aligned,wordtokens);
    /*
    if(lookup && !_state.worker)
        _state.worker = await createSqlWorker('https://uhh-tamilex.github.io/lexicon/wordindex.db');
    */
    const {words: wordlist, warnings: warnings}  = await getWordlist(tam,eng,aligned,[...notes],lookup);
    //const warnings = await cleanupWordlist(wordlist,notes,lookup);
    const entries = makeEntries(wordlist);
    const rle = formatAlignment(aligned,0);
    const ret = {
        xml: rle + '\n' + entries.join('\n'), 
        alignment: aligned, 
        wordlist: wordlist,
        warnings: warnings
    };
    //if(lookup)
    //    ret.wordlist = wordlist;
    return ret;
};

/*
const cleanupTranslation = (str) => {
    return str.replace(/-(?=\w)/g, ' ');
};
*/
//const restoreSandhi = (s) => {
//    return s/*.replace(/[mṉ]$/,'x')*/ // need to share
//            .replaceAll(/([iīeē])~/g,'$1y')
//            .replaceAll(/([aāuūoō])~/g,'$1v')
//            .replaceAll(/[\[\]]/g,'');
//};

const formatAlignment = (arr) => {
    const getChar = s => {
            if(s === '') return 'G';
            else if(s === CONCATRIGHT) return 'R';
            else if(s === CONCATLEFT) return 'L';
            else return 'M';
    };
    let a0 = '';
    let a1 = '';
    for(let n=0;n<arr[0].length;n++) {
        const arr0len = arr[0][n].length;
        const arr1len = arr[1][n].length;
        //TODO: more general solution for longer elements?
        if(arr0len === 2) {
            a0 = a0 + 'MM';
            if(arr1len === 2)
                a1 = a1 + 'MM';
            else
                a1 = a1 + getChar(arr[1][n]) + 'G';
        }
        else if(arr1len === 2) {
            a1 = a1 + 'MM';
            a0 = a0 + getChar(arr[0][n]) + 'G';
        }
        else {
            a0 = a0 + getChar(arr[0][n]);
            a1 = a1 + getChar(arr[1][n]);
        }
    }
    const flatarrs = [a0,a1].map(a => a.replaceAll(/([GRLM])\1+/g,(match, chr) => match.length + chr));
    return `<interp type="alignment" select="0">${flatarrs[0]},${flatarrs[1]}</interp>`;
};

const makeGaps = str => str.replaceAll(/‡+/g,m => `<gap quantity="${m.length}" unit="character" reason="lost"/>`);

const makeEntries = (arr) => {
    const formatWord = w => {
        const clean = w.join('');
        return makeGaps(clean);
    };
    const formatSandhi = w => {
        let slice;
        if(w.particle) {
            if(w.particletype === 'enclitic') // TODO: proclitics are deprecated
                slice = w.sandhi.slice(0,w.tokenized.lastIndexOf('-'));
            else
                slice = w.sandhi.slice(w.tokenized.indexOf('-')+1);
        }
        return formatWord(slice || w.sandhi);
    };
    const formatEntry = (e) => {
        const form = formatWord(e.tokenized);
        const bareformatted = e.bare ? makeGaps(e.bare) : undefined;
        const bare = bareformatted ? `<form type="simple">${bareformatted}</form>\n` : '';
        const sandhijoin = formatSandhi(e);
        const sandhi = sandhijoin !== (bareformatted || form) ?
            `<form type="sandhi">${sandhijoin}</form>\n` : ''; 
        const affixrole = e.affixrole ? 
            `<gramGrp><gram type="role">${e.affixrole}</gram></gramGrp>` : '';
        const affix = e.affix ?
            `<gramGrp type="affix"><m>${e.affix}</m>${affixrole}</gramGrp>\n` : '';
        const gram = e.gram ? 
            '<gramGrp>\n' + 
                e.gram.map(g => `  <gram type="role">${gramMap.get(g)}</gram>\n`).join('') +
                '</gramGrp>\n'
            : '';
        const particle = e.particle ? 
            `<gramGrp type="particle"><m type="${e.particletype}">${e.particle}</m></gramGrp>\n` : '';
        const def = e.translation ? 
            `<def>${e.translation.replaceAll(/_/g,' ')}</def>\n` : '';

        return `<entry>\n` +
               `<form>${form}</form>\n` +
               def +
               bare +
               sandhi +
               affix + 
               gram + 
               particle +
               (e.wordnote ? e.wordnote + '\n' : '') +
               '</entry>';
    };

    return arr.map(obj => {
        /*
        const wordsplit = obj.word.split('/');
        if(wordsplit.length > 1) {
            const transsplit = obj.translation.split('/');
            const newobj = [];
            for(let n=0;n<wordsplit.length;n++)
                newobj.push({word: wordsplit[n], translation: transsplit[n]});
            const formatted = newobj.map(f => `<entry>\n${formatEntry(f)}\n</entry>`).join('');
        */
        if(obj.superEntry) {
            const formatted = obj.superEntry.map(o => o.map(oo => formatEntry(oo)).join(''))
                                            .map(e => `<entry>${e}</entry>`)
                                            .join('\n');
            return `<superEntry type="ambiguous">\n${formatted}\n</superEntry>`;
        }
        else
            return formatEntry(obj);
    });
};

const cleanBare = (str) => {
    //str = str.replaceAll(/[~+-.]/g,'').replace(/['’*]$/,'u');
    str = str.replaceAll(/[~+.]/g,'')
             .replaceAll(/\[[im]\]/g,'')
             .replace(/-$|^-/,'')
             .replaceAll(/['’*]/g,'u');
    /*
    if(str.match(/[iīeē]y$/))
        return str.slice(0,-1); // inserted glide
    if(str.match(/[aāuūoō]v$/))
        return str.slice(0,-1); // inserted glide; but what if it's vu?
    if(str.match(/[kcṭtpvṟ]$|ṉṉ$/))
        return str + 'u'; // probably elided overshort u
    if(str.match(/mm$/))
        return str.slice(0,-1); // probably geminated m (uyiram + ē -> uyirammē)
    */
    return str;
};

const findHyphen = (str, index,affix) => {
    if(affix.endsWith('-')) {
        return true;
    }
    for(let i=index-1;i>0;i--) {
        if(str[i] === '-') return i;
        if(['~','+'].includes(str[i])) continue;
        return false;
    }
    return false;
};

const findParticle = (word,translation) => {
    for(const [particle,regex] of particles) {
        //word = word.replaceAll(/[\[\]]/g,'');
        const wordmatch = word.match(regex);
        //const transmatch = translation.match(regex); // transmatch is deprecated
        if(wordmatch) {
            /*
            if(transmatch)
                return {
                    //translation: translation.slice(0,translation.length-transmatch[0].length),
                    translation: translation.replace(regex,''),
                    particle: cleanBare(particle),
                    // TODO: proclitics are deprecated
                    particletype: particle.endsWith('-') ? 'proclitic' : 'enclitic',
                    //bare: cleanBare(word.slice(0,word.length-wordmatch[0].length))
                    bare: cleanBare(word.replace(regex,''))
                };
            else { */
                const hyphen = findHyphen(word,wordmatch.index,particle);
                if(hyphen)
                    return {
                        translation: translation,
                        particle: cleanBare(particle),
                        // TODO: proclitics are deprecated
                        particletype: particle.endsWith('-') ? 'proclitic' : 'enclitic',
                        bare: cleanBare(word.replace(regex,''))
                    };
            //}
        }
    }
    return null;
};

const findAffix = (word,translation) => {
    for(const [affix,obj] of caseAffixes) {
        const wordmatch = word.match(obj.regex);
        const transmatch = translation.match(obj.translationregex);
        if(wordmatch && transmatch) {
            const ret = {
                translation: translation.slice(0,translation.length-transmatch[0].length),
                affix: affix,
                // don't clip affix for case affixes; the declined form goes into the dictionary
            };
            if(obj.gram) ret.gram = obj.gram;
            return ret;
        }
    }
};

const findGrammar = (translation) => {
    //const gram = translation.search(/\(.+?\)-?$/);
    //if(gram == -1) return null;
    const gram = translation.lastIndexOf('(');
    if(gram === -1) return null;

    //const hyphen = translation.endsWith('-') ? '-' : '';
    const trimmed = translation.slice(0,gram);// + hyphen;

    let hay = translation.slice(gram).replaceAll(/[\(\)]/g,'');
    
    const ret = [];
    let hayswarning = false;
    const hays = hay.split('|');
    if(hays.length > 1) {
        hayswarning = -1;
        for(const hh of hays) {
            let h = hh;
            for(const abbr of gramKeys) {
                const found = h.indexOf(abbr);
                if(found === -1) continue;
                
                h = h.slice(0,found) + h.slice(found + abbr.length);
                ret.push(abbr);
            }
            if(h.trim() !== '')
                hayswarning = true;
        }
    }
    else {
        for(const abbr of gramKeys) {
            const found = hay.indexOf(abbr);
            if(found === -1) continue;
            
            hay = hay.slice(0,found) + hay.slice(found + abbr.length);
            ret.push(abbr);
        }
    }

    const rett = {
        translation: trimmed,
        gram: ret
    };
    if(hayswarning === true) {
        const warning = translation.slice(gram);
        rett.warning = warning;
        rett.translation = rett.translation + warning;
    }
    else if(hayswarning === false && hay.trim() !== '') {
        const warning = translation.slice(gram);
        rett.warning = warning;
        rett.translation = rett.translation + warning;
    }
    return rett;

    /*
    for(const [affix,gram] of gramAbbreviations) {
       if(translation.endsWith(affix))
            return {
                translation: translation.slice(0,translation.length-affix.length),
                gram:  gram
            };
       else if(translation.endsWith(affix + '-'))
            return {
                translation: translation.slice(0,translation.length-affix.length-1) + '-',
                gram:  gram
            };
    }
    return null;
    */
};

const mostPopular = (arr) => {
    const ret = {
        el: null,
        max: 0
    };
    for(const a of arr) {
        const len = a[1].length;
        if(len > ret.max) {
            ret.el = a;
            ret.max = len;
        }
    }
    return ret.el;
};

const cleanForm = str => {
    return str.replaceAll(/([~+()])/g,'')
              .replaceAll(/['’*]/g,'u');
};

const reverseGramLookup = arr => {
    const ret = [];
    const neuter = arr.indexOf('neuter');
    if(neuter > -1) { // AAGGH
        const number = arr.indexOf('singular') || arr.indexOf('plural');
        if(number > -1) {
            arr[neuter] = 'neuter ' + arr[number];
            arr[number] = '';
        }
        //TODO: this fails if something is just neuter...
    }
    for(const term of arr) {
        const abbr = revGramMap.get(term);
        if(abbr) ret.push(abbr);
    }
    return ret;
};

const cleanupWord = async (obj,lookup,notes,warnings) => {

    updateMarks(obj);

    updateNotes(obj,notes);

    if(obj.translation === '()') // after removing note marker
            obj.translation = '';
    
    updateParticles(obj);

    const bare = obj.bare || obj.word;

    if(/^\+[kṅcñtnpmyrlv]/.test(obj.word))
        warnings.push(obj.word);
    if(/~[^aāiīuūoōeē]/.test(obj.word))
        warnings.push(obj.word);
    if(/[kcṅñṭtpvṟ]$/.test(obj.word))
        warnings.push(obj.word);
    if(bare !== obj.word && /[kcṅñṭtpvṟ]$/.test(bare))
        warnings.push(obj.word);
    if(/n$/.test(bare) && bare !== 'verin' && bare !== 'ven')
        warnings.push(obj.word);
    if(/[ōē]$/.test(bare) && bare.length > 2)
        warnings.push(obj.word);

    const grammar = findGrammar(obj.translation);
    if(grammar) {
        //console.log(`Found grammar: ${grammar.gram} in ${obj.translation}`);
        obj.translation = grammar.translation;
        obj.gram = grammar.gram;
        if(grammar.warning) warnings.push(grammar.warning);
    }
    if(lookup && (!grammar || obj.translation === '')) {
        const bare = cleanForm(obj.bare || obj.word);
        const features = await lookupFeatures(bare,obj.translation,obj.gram?.map(g => gramMap.get(g)));
        if(features) {
            if(!obj.gram) obj.gram = reverseGramLookup(features.grammar);
            if(!obj.translation) obj.translation = features.translation;
        }
        /*
        if(obj.translation === '') {
            const res = (await _state.worker.db.query('SELECT def FROM citations WHERE form = ? LIMIT 1',[bare]))[0];
            if(res && res.def) obj.translation = res.def.replaceAll(/\s+/g,'_');
        }
        */
    }
    /*
    if(!particle && !affix && !grammar) {
        const maybeParticle = obj.translation.match(/\(.+\)-?/);
        if(maybeParticle) console.log(`What about ${maybeParticle[0]} in "${obj.translation}"?`);
    }
    */
    
};

/*
const cleanupWordlist = async (list,notes,lookup) => {
    const warnings = [];
    const notescopy = [...notes];
    const worker = lookup ? await createSqlWorker('https://uhh-tamilex.github.io/lexicon/wordindex.db') : null;
    for(const entry of list) {
        const wordsplit = entry.word.split('/');
        if(wordsplit.length > 1) {
            const transsplit = entry.translation.split('/');
            entry.superEntry = [];
            for(let n=0;n<wordsplit.length;n++) {
                const strand = getWordlist(
                        wordsplit[n].split('|'),
                        transsplit[n].split('|'),
                        [...entry.sandhi] // so updateMarks won't run on the same object twice
                    );
                for(const obj of strand)
                    await cleanupWord(obj,lookup,notescopy,warnings,worker);

                entry.superEntry.push(strand);
            }
        }
        else
            await cleanupWord(entry,lookup,notescopy,warnings,worker);
    }
    return warnings;
};
*/
/*
const mergeWordlists = (doc, list1, list2) => {
    const newlist1 = markSegs(doc,list1,0);
    const newlist2 = markSegs(doc,list2,1);
    const merged = [...newlist1];
    
    for(const item of newlist2)
        if(item.hasOwnProperty('strand'))
            merged.push(item);
    
    merged.sort((a,b) => a.start - b.start);
    return merged;
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
const extracttext = (el, i) => {
    const clone = el.documentElement.cloneNode(true);
    const toremove = [];
    const choices = clone.querySelectorAll('choice');
    for(const choice of choices) {
        const segs = choice.querySelectorAll('seg');
        for(let n=0; n<segs.length; n++) {
            if(n !== i) toremove.push(segs[n]);
        }
    }
    for(const el of toremove) el.remove();
    return clone.textContent.replaceAll(/\s/g,'');
};
*/
const jiggleWord = (word, text, start, end) => {
    const wordend = word.at(-1);
    const wordstart = word.at(0);
    const textend = text[end-1];
    const textpostend = text[end];
    const textstart = text[start-1];
    const textprestart = text[start-2];
    if(textend === '') { // assimilated final

        if(['m','(m)'].includes(wordend) && ['m','n'].includes(textpostend))
            //end = end + 1;
            text[end-1] = CONCATRIGHT;
        /*
        else if(wordend === '(m)' && textpostend === 'm')
            text[end-1] = CONCATRIGHT;
        */
        else if(wordend === 'l' && ['ṟ','ṉ','n'].includes(textpostend))
            //end = end + 1;
            text[end-1] = CONCATRIGHT;

        else if(wordend === 'ḷ' && ['ṭ','ṇ'].includes(textpostend))
            //end = end + 1;
            text[end-1] = CONCATRIGHT;
    }

    if(textstart === '') { // assimilated initial
        if(wordstart === 'n' && ['ṉ','ṇ'].includes(textprestart))
            //start = start - 1;
            text[start-1] = CONCATLEFT;

        else if(wordstart === 't' && ['ṭ','ṟ'].includes(textprestart))
            //start = start - 1;
            text[start-1] = CONCATLEFT;

        else if(wordstart === 'm' && textprestart === 'm')
            //start = start - 1;
            text[start-1] = CONCATLEFT;
        else if(wordstart === 'y' && textprestart === 'y')
            text[start-1] = CONCATLEFT;
    }
    //return [start,end];
    return text;
};

const jiggleAlignment = (aligned, tokenizedwords) => {
    //aligned = [...aligned];
    const wordlist = [...tokenizedwords];
    const words = [];
    const nextWord = l => l.length > 0 ?
        l.shift().map(c => c.replaceAll(/[\[\]]/g,'')) : // AGGHHH
        undefined; // huh?
    let wordstart = 0;
    let curword = nextWord(wordlist);
    let curcount = 0;
    for(let n=0; n<=aligned[1].length; n++) {
        if(!curword) break; // huh?
        if(curcount === curword.length) {
            aligned[0] = jiggleWord(curword, aligned[0], wordstart, n);
            wordstart = n+1;
            curcount = 0;
            curword = nextWord(wordlist);
        }
        if(aligned[1][n] !== '')
            curcount = curcount + 1;
    }
    //return aligned;
};

export { alignWordsplits, tamilSplit, findGrammar, gramMap };
