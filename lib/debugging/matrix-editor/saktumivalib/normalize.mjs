/*
import {Sanscript} from './sanscript.mjs';

const filters_slp1 = [
    {
        name: 'ignore long/short e',
        group: 'tamil',
        search: 'ē',
        replace: () => 'e'
    },
    {
        name: 'ignore long/short o',
        group: 'tamil',
        search: 'ō',
        replace: () => 'o'
    },
    {
        name: 'insert glide after back vowels',
        group: 'tamil',
        search: '([aAuUoōO])\\s+([aAiIuUeēEoōO])',
        replace: (match) => `${match[1]} v${match[2]}`
    },
    {
        name: 'insert glide after front vowels',
        group: 'tamil',
        search: '([iIeēE])\\s+([aAiIuUeēEoōO])',
        replace: (match) => `${match[1]} y${match[2]}`
    },
    {
        name: 'ignore puḷḷi',
        group: 'tamil',
        search: '[kKJcTNtnpmyrlvḻḷṟṉ](?!\\s*[aAiIuUeēEoōOḵ])',
        replace: (match) => `${match[0]}a`
    },
    {
        name: 'candrabindu',
        search: 'm̐',
        replace: () => 'M'
    },
    {
        name: 'additional punctuation',
        search: '[()\\[\\],;?!|¦_\\-–—―=+\\d.\\/]+',
        replace: () => ''
    },
    {
        name: 'geminated aspirated consonants',
        search: '(?:kK|gG|cC|jJ|wW|qQ|tT|dD|pP|bB)',
        replace: (match) => match[0].slice(-1)
    },
    {
        name: 'geminated m after h',
        search: '(?:Mhm|hmm)',
        replace: () => 'hm'
    },
    {
        name: 'geminated t',
        search: '([rfi]|p[aA])tt|tt(?=[rvy]\\S)',
        replace: (match) => match[1] ? `${match[1]}t` : 't'
    },
    { 
        name: 'geminated consonants after r',
        search: '([rf]\\s*)([kgcjwqdpbRnmyvl])\\2{1,2}', 
        replace: (match) => `${match[1]}${match[2]}`
    },
    {
        name: 'final nasal variants',
        search: '(?:[MN][lSs]|nn)(?!\\S)',
        replace: () => 'n'
    },
    {
        name: 'internal nasal variants',
        search: '[mnNYR](?=[pPbBmdDtTnwWqQcCjJkKgG])',
        replace: () => 'M'
    },
    {
        name: 'final anusvāra variants', // A 8.4.59
        search: 'M?[mN](?!\\S)|n(?=\\s+[tdn])|Y(?=\\s+[jc])',
        replace: () => 'M'
    }, 
    {
        name: 'visarga aḥ before voiced consonants',
        search: '(?<!\\sB)(?:a[Hr]|[o])(?=\\s+[\'gGjJqQdDnbBmrylvh])', // ignore bho?
        replace: () => 'aH'
    },
    {
        name: 'visarga aḥ before vowels',
        search: 'aH(?=\\s+[AiIeuUof])',
        replace: () => 'a'
    },
    {
        name: 'visarga aḥ before unvoiced consonants and space + anusvāra',
        search: 'o\\s+(?=[kKcCwWtTpPszSM])',
        replace: () => 'aH a'
    },
    {
        name: 'visarga āḥ variants',
        search: 'AH(?=\\s+[aAiIeEuUogGjJqQdDbBnmyrlvh])',
        replace: () => 'A'
    },
    {
        name: 'other visarga variants',
        search: 'H?[rszS](?!\\S)',
        replace: () => 'H'
    },
    {
        name: 'superfluous avagrahas',
        search: '(\\S)\'+',
        replace: (match) => match[1]
    },
    {
        name: 'double avagrahas',
        search: '\'\'',
        replace: () => 'A'
    },
    {
        name: 'avagrahas',
        search: '\'',
        replace: () => 'a'
    },
    {
        name: 'internal visarga variants',
        search: 'z(?=[kK])|s(?=s)',
        replace: () => 'H'
    },
    {
        name: 'final au/āv',
        search: 'Av(?!\\S)',
        replace: () => 'O'
    },
    {
        name: 'final su',
        search: '(?<=[sz])v(?=\\s+[aAiIuUoOeE])',
        replace: () => 'u'
    },
    {
        name: 'final i',
        search: 'i(?=\\s+[aAuUoOeE])',
        replace: () => 'y'
    },
    {
        name: 'kcch/kś',
        search: 'k(\\s*)(?:S|c?C)',
        replace: (match) => `k${match[1]}S`
    },
    {
        name: 'cś/tś',
        search: '[tc](\\s*)S',
        replace: (match) => `c${match[1]}C`
    },
    {
        name: 'cch/ch',
        search: '([aAiIuUeEoO])C',
        replace: (match) => `${match[1]}cC`
    },
    {
        name: 'final t + hi', // just catch most common case here
        search: 'd(\\s+)D(?=[iy](?:\\s|$))',
        replace: (match) => `t${match[1]}h`
    },
    {
        name: 'final t + voiced syllable', // different rule for t + h = ddh
        search: 'd(?=(?:\\s+[aAiIeEuUoOgGdDbByrv]|\\s*$))',
        replace: () => 't'
    },
    {
        name: 'final t + n/m',
        search: '([ai])n(?=\\s+[nm])',
        replace: (match) => `${match[1]}t`
    },
    {
        name: 'final t + c/j',
        search: 'j(?=\\s+j)|c(?=\\s+c)',
        replace: () => 't'
    },
    {    
        name: 'i/y + vowel',
        search: 'y(?=\\s+[aAuUeEoO])',
        replace: () => 'i'
    },
    {
        name: 'bhd for bdh',
        search: 'Bd',
        replace: () => 'bD'
    }
];
*/

const nasals = new Map([
    ['ñ','ñ'],
    ['c','ñ'],
    ['t','n'],
    ['k','ṅ']
]);
const retro = new Map([
    ['n','ṇ'],
    ['t','ṭ'],
]);

const retroToDental = s => {
  const rtd = new Map([
    ['ṭ','t'],
    ['ḍ','ḍ'],
    ['Ṭ','T'],
    ['Ḍ','D']
  ]);
  return rtd.get(s);
};

const filters = [
    {
        name: 'ignore punctuation',
        search: '[()\\[\\],:;?!|¦_"“”‘’·\\-–—―=+\\d.\\/]+',
        replace: () => '',
        group: 'general'
    },
  /*
    {
        name: 'ignore case',
        search: '[AĀIĪUŪOŌEĒṚḶṜḸKGṄCJÑṬḌṆTDNPBMYRLVŚṢSHḺṂḤṈṞ]',
        replace: match => match[0].toLowerCase(),
        group: 'general'
    },
    */
/*
    {
        name: 'valapalagilaka',
        search: 'ṙ',
        replace: () => 'r'
    },
*/
    {
        name: 'ignore long/short e',
        group: 'tamil',
        search: 'ē',
        replace: () => 'e'
    },
    {
        name: 'ignore long/short o',
        group: 'tamil',
        search: 'ō',
        replace: () => 'o'
    },
    {
        name: 'remove overshort -u',
        group: 'tamil',
        search: 'u(\\s*[aāiīuūeēoō])',
        search_slpish: 'u(\\s*[aāiīuūeēEoōO])',
        replace: (match) => match[1]
    },
    {
        name: 'insert glide after back vowels',
        group: 'tamil',
        search: '([aāuūoō])\\s+([aāiīuūeēoō])',
        search_slpish: '([aāuūoōO])\\s+([aāiīuūeēEoōO])',
        replace: (match) => `${match[1]} v${match[2]}`
    },
    {
        name: 'insert glide after front vowels',
        group: 'tamil',
        search: '([iīeē])\\s+([aāiīuūeēoō])',
        search_slpish: '([iīeēE])\\s+([aāiīuūeēEoōO])',
        replace: (match) => `${match[1]} y${match[2]}`
    },
    {
        name: 'final -m sandhi variants',
        group: 'tamil',
        search: 'm(\\s*)([ñckt])',
        replace: (match) => `${nasals.get(match[2])}${match[1]}${match[2]}`
    },
    {
        name: 'final -m elision',
        group: 'tamil',
        search: 'm(\\s+)([nm])',
        replace: (match) => `${match[2]}`
    },
    {
        name: 'final -ṇ sandhi',
        group: 'tamil',
        search: 'ṇ(\\s*)([tn])',
        replace: (match) => `n${match[1]}${retro.get(match[2])}`
    },
    {
        name: 'final -ṉ sandhi',
        group: 'tamil',
        search: 'ṉ(\\s*)([tpkn])',
        replace: (match) => {
            if(match[2] === 't') return `ṉ${match[1]}ṟ`; // or ṟṟ
            if(match[2] === 'p' && match[1] !== '') return `ṟ${match[1]}p`;
            if(match[2] === 'k' && match[1] !== '') return `ṟ${match[1]}k`;
            if(match[2] === 'n') return 'ṉ';
            return `ṉ${match[1]}${match[2]}`;
        }
    },
    {
        name: 'final -l sandhi',
        group: 'tamil',
        search: 'l(\\s*)([kcñptmn])',
        replace: (match) => {
            if(match[2] === 'k' && match[1] !== '') return `ṟ${match[1]}k`;
            if(match[2] === 'c' && match[1] !== '') return `ṟ${match[1]}c`;
            if(match[2] === 'ñ') return `ṉ${match[1]}ñ`;
            if(match[2] === 'p' && match[1] !== '') return `ṟ${match[1]}p`;
            if(match[2] === 't') return 'ṉṟ'; // or ṟ or ḵṟ
            if(match[2] === 'm') return `ṉ${match[1]}m`;
            if(match[2] === 'n') return 'ṉ';
            return `l${match[1]}${match[2]}`;
        }
    },
    {
        name: 'final -ḷ sandhi',
        group: 'tamil',
        search: 'ḷ(\\s*)([kcptmṇ])',
        replace: (match) => {
            if(match[2] === 'k' && match[1] !== '') return `ṭ${match[1]}k`; // or ṇk
            if(match[2] === 'c') return `ṭ${match[1]}c`; // or ṇc
            if(match[2] === 'p' && match[1] !== '') return `ṭ${match[1]}p`; // or ṇp
            if(match[2] === 't') return 'ṭṭ'; // or ṭ
            if(match[2] === 'm') return `ṇ${match[1]}m`;
            if(match[2] === 'ṇ') return 'ṇṇ'; // or ṇ
            return `ḷ${match[1]}${match[2]}`;
        }
    },
    {
        name: 'ignore puḷḷi',
        group: 'tamil',
        search: '[kṅcñṭṇtnpmyrlvḻḷṟṉ](?!\\s*[aāiīuūeēoōḵh])',
        search_slpish: '[kṅcñṭṇtnpmyrlvḻḷṟṉ](?!\\s*[aāiīuūeēEoōOḵh])|[kṅcñṭṇtnpmyrlvḻḷṟṉ]$',
        replace: (match) => `${match[0]}a`
    },
/*
    {
        name: 'pṛṣṭhamātrā e',
        search: 'ê',
        replace: () => 'e',
        group: 'sanskrit'
    },
    {
        name: 'pṛṣṭhamātrā o',
        search: 'ô',
        replace: () => 'o',
        group: 'sanskrit'
    },
    {
        name: 'pṛṣṭhamātrā ai',
        search: 'aî',
        replace: () => 'ai',
        group: 'sanskrit'
    },
    {
        name: 'pṛṣṭhamātrā au',
        search: 'aû',
        replace: () => 'au',
        group: 'sanskrit'
    },
*/
    {
        name: 'candrabindu as anusvāra',
        search: 'm̐',
        replace: () => 'ṃ',
        group: 'sanskrit'
    },
/*
    {
        name: 'oṃkāras',
        search: 'oṁ',
        replace: () => 'oṃ',
        group: 'sanskrit'
    },
*/
    {
        name: 'geminated aspirated consonants',
        search: '([kgcjṭḍtdpb])\\1h',
        search_slpish: '(?:kK|gG|cC|jJ|ṭṬ|ḍḌ|tT|dD|pP|bB)',
        replace: (match) => `${match[1]}h` ,
        replace_slpish: (match) => match[0].slice(-1),
        group: 'sanskrit'
    },
    {
        name: 'geminated m after h',
        search: '(?:ṃhm|hmm)',
        replace: () => 'hm',
        group: 'sanskrit'
    },
    {
        name: 'geminated t',
        search: '([rṛi]|p[aā])tt|tt(?=[rvy]\\S)',
        replace: (match) => match[1] ? `${match[1]}t` : 't',
        group: 'sanskrit'
    },
    { 
        name: 'geminated consonants after r',
        search: '([rṛ]\\s*)([kgcjṭḍṇtdnpbmyvl])\\2{1,2}', 
        replace: (match) => `${match[1]}${match[2]}`,
        group: 'sanskrit'
    },
    {
        name: 'final nasal variants',
        search: '(?:[ṃṅ][lṣs]|nn)(?!\\S)',
        replace: () => 'n',
        group: 'sanskrit'
    },

    {
        name: 'internal nasal variants',
        search: '[mnṅñṇ](?=[pbvmdtnṭḍcjkgsś])',
        search_slpish: '[mnṅñṇ](?=[pPbBvmdDtTnṭṬḍḌcCjJkKgGsś])',
        replace: () => 'ṃ',
        group: 'sanskrit'
    },
    {
        name: 'final anusvāra variants', // A 8.4.59
        search: 'ṃ?[mṅ](?!\\S)|n(?=\\s+[tdn])|ñ(?=\\s+[jc])',
        search_slpish: 'ṃ?[mṅ](?!\\S)|n(?=\\s+[tTdDn])|ñ(?=\\s+[jJcC])',
        replace: match => 'ṃ',
        group: 'sanskrit'
    }, 
    {
        name: 'visarga aḥ before voiced consonants',
        search: '(?:a[ḥr]|[o])(?=\\s+[\'gjḍdnbmyrlvh])', // ignore bho?
        search_slpish: '(?:a[ḥr]|[o])(?=\\s+[\'gGjJḍḌdDnbBmrylvh])', // ignore bho?
        replace: () => 'aḥ',
        group: 'sanskrit'
    },
    {
        name: 'visarga aḥ before vowels',
        search: 'aḥ(?=\\s+[āiīeuūoṛ])',
        replace: () => 'a',
        group: 'sanskrit'
    },
    {
        name: 'visarga aḥ before unvoiced consonants and space + anusvāra',
        search: 'o\\s+(?=[kcṭtpśṣsṃ])',
        search_slpish: 'o\\s+(?=[kKcCṭṬttpPśṣsṃ])',
        replace: () => 'aḥ a',
        group: 'sanskrit'
    },
    {
        name: 'visarga āḥ variants',
        search: 'āḥ(?=\\s+[aāiīeuūogjḍdnbmyrlvh])',
        search_slpish: 'āḥ(?=\\s+[aāiīeEuūUogGjJḍḌdDbBnmyrlvh])',
        replace: () => 'ā',
        group: 'sanskrit'
    },
    {
        name: 'other visarga variants',
        search: 'ḥ?[rśṣs](?!\\S)',
        replace: () => 'ḥ',
        group: 'sanskrit'
    },
    {
        name: 'superfluous avagrahas',
        search: '(\\S)\'+',
        replace: (match) => match[1],
        group: 'sanskrit'
    },
    {
        name: 'double avagrahas',
        search: '\'\'',
        replace: () => 'ā',
        group: 'sanskrit'
    },
    {
        name: 'avagrahas to short a',
        search: '\'',
        replace: () => 'a',
        group: 'sanskrit'
    },
    {
        name: 'remove avagrahas',
        search: '\'',
        replace: () => '',
        checked: false,
        group: 'sanskrit'
    },
    {
        name: 'internal visarga variants',
        search: 'ṣ(?=k)|s(?=s)',
        search_slpish: 'ṣ(?=kK)|s(?=s)',
        replace: () => 'ḥ',
        group: 'sanskrit'
    },
    {
        name: 'final au/āv',
        search: 'āv(?!\\S)',
        replace: () => 'au',
        replace_slpish: () => 'O',
        group: 'sanskrit'
    },
    {
        name: 'final su',
        search: '(?<=[sṣ])v(?=\\s+[aāiīuūoe])',
        search_slpish: '(?<=[sṣ])v(?=\\s+[aāiīuūoOeE])',
        replace: () => 'u',
        group: 'sanskrit'
    },
    {
        name: 'final i',
        search: 'i(?=\\s+[aāuūeo])',
        search_slpish: 'i(?=\\s+[aāuūoOeE])',
        replace: () => 'y',
        group: 'sanskrit'
    },
    {
        name: 'kcch/kś',
        search: 'k(\\s*)(?:ś|c?ch)',
        search_slpish: 'k(\\s*)(?:ś|c?C)',
        replace: (match) => `k${match[1]}ś`,
        group: 'sanskrit'
    },
    {
        name: 'ñcch/nś',
        search: '[ñṃ]c?(\\s+)ch',
        search_slpish: '[ñṃ](\\s+)ch',
        replace: (match) => `n${match[1]}ś`,
        group: 'sanskrit'
    },
    {
        name: 'cś/chś/tś',
        search: '[tc](\\s*)ś|ch(\\s*)ś',
        search_slpish: '[tcC](\\s*)ś',
        replace: (match) => `c${match[1]}ch`,
        replace_slpish: (match) => `c${match[1]}C`,
        group: 'sanskrit'
    },
    {
        name: 'cch/ch',
        search: '([aāiīuūeo])ch',
        search_slpish: '([aāiīuūeEoO])C',
        replace: (match) => `${match[1]}cch`,
        replace_slpish: (match) => `${match[1]}cC`,
        group: 'sanskrit'
    },
    {
        name: 'final t + hi', // just catch most common case here
        search: 'd(\\s+)dh(?=[iy](?:\\s|$))',
        search_slpish: 'd(\\s+)D(?=[iy](?:\\s|$))',
        replace: (match) => `t${match[1]}h`,
        group: 'sanskrit'
    },
    {
        name: 'final t + voiced syllable', // different rule for t + h = ddh
        search: 'd(?=(?:\\s+[aāiīeuūogdbyrv]|\\s*$))',
        search_slpish: 'd(?=(?:\\s+[aāiīeEuūoOgGdDbByrv]|\\s*$))',
        replace: () => 't',
        group: 'sanskrit'
    },
    {
        name: 'final t + n/m', // maybe get rid of this?
        search: '([ai])n(?=\\s+[nm])',
        replace: (match) => `${match[1]}t`,
        group: 'sanskrit'
    },
    {
        name: 'final t + c/j',
        search: 'j(?=\\s+j)|c(?=\\s+c)',
        replace: () => 't',
        group: 'sanskrit'
    },
    {    
        name: 'i/y + vowel',
        search: 'y(?=\\s+[aāuūeo])',
        search_slpish: 'y(?=\\s+[aāuūeEoO])',
        replace: () => 'i',
        group: 'sanskrit'
    },
    {
        name: 'bhd for bdh',
        search: 'bhd',
        search_slpish: 'Bd',
        replace: () => 'bdh',
        replace_slpish: () => 'bD',
        group: 'sanskrit'
    },
    {
        name: 'geminated aspirated consonants',
        search: '([kgcjṭḍtdpb])\\1h',
        search_slpish: '(?:kK|gG|cC|jJ|ṭṬ|ḍḌ|tT|dD|pP|bB)',
        replace: match => `${match[1]}h` ,
        replace_slpish: match => match[0].slice(-1),
        group: 'pali'
    },
    {
        name: 'other geminated consonants',
        search: '([kgcjñṭḍṇtdnpbslv])\\1',
        replace: match => match[1],
        group: 'pali'
    },
    {
        name: 'final anusvāra variants',
        search: 'ṃ?[mṅ](?!\\S)|n(?=\\s+[tdn])|ñ(?=\\s+[jcñh])',
        search_slpish: 'ṃ?[mṅ](?!\\S)|n(?=\\s+[tTdDn])|ñ(?=\\s+[jJcCñ])',
        replace: () => 'ṃ',
        group: 'pali'
    }, 
    {
        name: 'internal nasal variants',
        search: '[mnṅñṇ](?=[pbmdtnṭḍcjkgñh])',
        search_slpish: '[mnṅñṇ](?=[pPbBmdDtTnṭṬḍḌcCjJkKgGñ])',
        replace: () => 'ṃ',
        group: 'pali'
    },
    {
        name: 'normalize "by" to "vy"',
        search: 'b(i?)y',
        replace: match => `v${match[1]}y`,
        group: 'pali'
    },
    {
        name: 'normalize "ṭ/ḍ" to "t/d"',
        search: '[ṭḍ]',
        search_slpish: '[ṭṬḍḌ]',
        replace: match => retroToDental(match[0]),
        group: 'pali'
    },
    {
      name: 'vowel lengthening before "ti"',
      search: '([ai])\\s+(?=ti\\b)',
      replace: match => match[0] === 'a' ? 'ā' : 'ī',
      group: 'pali'
    },
    {
      name: 'ñj -> ññ',
      search: '[ṃñ]j',
      replace: () => 'ṃñ',
      group: 'pali'
    },
    {
      name: 'ṃñ -> ñ',
      search: 'ṃ?ṃñ|ṃṃ',
      replace: () => 'ñ',
      group: 'pali'
    },
    {
        name: 'remove spaces',
        group: 'general',
        search: '\\s',
        replace: () => ''
    },
];
/*
const spaces = {
    none: {
        name: 'remove spaces',
        search: '\\s',
        replace: () => ''
    },
    collapse: {
        name: 'collapse spaces',
        search: '\\s+',
        replace: () => ' '
    }
};
*/
const replaceAll = (filter, str) => {
    const matches = [...str.matchAll(filter.search_slpish || filter.search)];
    const filtered = [];
    if(matches.length === 0)
        return [str,null];

    let newstr = str; 
    for(const match of [...matches].reverse()) { // or matches.toReversed()
        const rep = (filter.replace_slpish || filter.replace)(match);
        newstr = strSplice(newstr,match.index,match[0].length,rep);
        filtered.unshift({oldtext: match[0], newtext: rep, index: match.index});
    }
    return [newstr, filtered];
};

const firstNonEmpty = arr => {
  for(let n=0;n<arr.length;n++)
    if(arr[n].length > 0) return n;
  return 0;
};

const unreplaceAll = (strs, fs) => {
    //fs: [{index: num, newtext: str, oldtext: str}]
    const init = firstNonEmpty(strs);
    const ret = init > 0 ? strs.slice(0,init) : [];
    let tail = init > 0 ? strs.slice(init) : strs;
    let offset = 0;
    while(fs.length > 0) {
        const match = fs.shift();
        let head;
        [offset,head,tail] = splitAt(offset,tail,match);
        ret.push(...head);
        tail = replaceAt(match.index - offset,tail,match);
    }
    return ret.concat(tail);
};

const splitAt = (offset,strs,match) => {
    let headlength = offset;
    let splitpoint = 0;
    const head = [];
    for(const str of strs) {
        const n = headlength + str.length;
        if(match.index > n) {
            headlength = n;
            splitpoint = splitpoint + 1;
        }
        else if(match.index === n && match.newtext !== '') {
            headlength = n;
            splitpoint = splitpoint + 1;
            break;
        }
        else break;
    }
    return [headlength, strs.slice(0,splitpoint), strs.slice(splitpoint)];
};
const replaceAt = (start, tail, match) => {
    const slice = [...tail];
    //if(start + newlength <= slice[0].length) {
    if(match.newtext.length === 0) { // empty replacement, e.g. if a space was removed
        slice[0] = strSplice(slice[0],start,0,match.oldtext);
        return slice;
    }
    else {
        let tailtext = match.oldtext;
        let tailstart = start; // only needed for the first replacement
        let tailnewlength = match.newtext.length;
        let tailindex = match.index;
        let cur = 0;
        //while(tailnewlength > 0) {
        while(true) {
            if(tailstart + tailnewlength <= slice[cur].length) {
                // do we need to add || cur === slice.length - 1 ?
                slice[cur] = strSplice(slice[cur],tailstart,tailnewlength,tailtext);
                return slice;
            }
            const splitat = slice[cur].length - tailstart;
            tailnewlength = tailnewlength - splitat;
            const head = tailtext.slice(0,splitat);
            slice[cur] = slice[cur].slice(0,tailstart) + head;
            tailtext = tailtext.slice(splitat);
            tailstart = 0;
            cur = cur + 1;
        }
    }
    return slice;
};
/*
const unreplaceAll = (strs, fs) => {
    const newstrs = [];
    let start = 0;
    let remainder = null;
    for(const str of strs) {
        if(str.length === 0) {
            newstrs.push('');
            continue; // is this necessary?
        }

        const end = start + str.length;
        let newstr = str;
        //let offset = 0;

        if(remainder) {
            if(remainder.length < str.length ||
                (remainder.length <= str.length && remainder.text.endsWith('h'))) {
                //hacky fix for aspirated consonants
                newstr = strSplice(str,0,remainder.length,remainder.text);
                //offset = remainder.text.length - remainder.length;
                remainder = null;
            }
            else {
                const remhead = remainder.text.slice(0,str.length);
                newstr = remhead;
                newstrs.push(newstr);
                const remtail = remainder.text.slice(str.length);
                remainder = {length: remainder.length - str.length, text: remtail};
                start = start + newstr.length;
                continue;
            }
        }
        while(fs.length > 0 && fs[0].index <= end) {
            const match = fs.shift();
            const matchstart = match.index - start;// + offset;
            const newtxt = match.newtext;
            const oldtxt = match.oldtext;

            if(match.index + newtxt.length <= end) {
                newstr = strSplice(newstr,matchstart,newtxt.length,oldtxt);
                //offset = 0;
                //offset = offset + oldtxt.length - newtxt.length;
            }
            else {
                const splitat = str.length - matchstart;// + offset;
                const head = oldtxt.slice(0,splitat);
                newstr = newstr.slice(0,matchstart) + head;
                const tail = oldtxt.slice(splitat);
                const taillen = newtxt.length - splitat;
                remainder = {length: taillen, text: tail};
                // the while loop should end here
            }
        }
        newstrs.push(newstr);
        start = start + newstr.length;
    }
    return newstrs;
};
*/
const strSplice = function(str,start,len,splice_in) {
    return str.slice(0,start) + splice_in + str.slice(start + len);
};

const filterAll = (str,filterindices = [...filters.keys()]) => {
    let retstr = str;
    //let retstr = str.replaceAll(/([kgcjṭḍtdpb])h/g,(m) => m[0].toUpperCase());
    const filtered = [];
    //for(const filter of [...filters,spaces.none]) {
    for(const i of filterindices) {
        const ret = replaceAll(filters[i],retstr);
        if(ret[1] === null) continue;

        retstr = ret[0];
        filtered.push(ret[1]);
    }
    return [retstr,filtered];
};

const unfilterAll = (strs,filtered) => {
    let retstrs = [...strs];
    filtered.reverse();
    for(const f of filtered) {
        retstrs = unreplaceAll(retstrs,f);
    }
    return retstrs;
};
//console.log(Normalizer(['a','r','t','th','ī','s','ā','r','tth','o ','p','a','t','ś','a','l','ī','m','artthisārttho ','pagacchati']));
//console.log(Normalizer(['artthisārttho pārttho pārttho ','pārttho ','pagacchati']));

export { filters, filterAll, unfilterAll };
