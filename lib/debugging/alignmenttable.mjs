import { tamilSplit } from './aligner.mjs';

const wordClean = (str) => {
    // remove all but first option from alignment
    return str.replaceAll(/\/[aāiīuūeēoōkṅcñṭṇtnpmyrlvḻḷṟṉ\-*~+]+\s/g,'')
              .replaceAll(/\s/g,'');
};

const consonants = new Set(['k','ṅ','c','ñ','ṭ','ṇ','t','n','p','m','y','r','l','v','ḷ','ḻ','ṟ','ṉ']);

const glides = new Map([
    ['y',['i','ī','e','ē','ai']],
    ['v',['a','ā','u','ū','o','ō','au']]
]);
const checkEquality = (arr1, arr2, n) => {
    const char1 = arr1[n];
    const char2 = arr2[n];

    if(typeof char1 !== 'string' || typeof char2 !== 'string')
        return 'mismatch';
    if(char1 === char2)
        return null;
    if([';','.',',','-','–','—','―'].includes(char1) && char2 === '')
        return null;
    if(char2 === '')
        return 'typo';
    if(char2 === '~') {
        if(['y','v'].includes(char1)) {
            const prev = getPrev(arr1,n);
            if(prev && !glides.get(char1).includes(prev))  {
                if(getPrev(arr2,n) === '+')
                    return null; // 'i+~' is ok
                return 'typo';
            }
            return null;
        }
        else return 'typo';
    }
    if(char2 === '+') {
        if(!consonants.has(char1)) return 'typo';
        
        const next = getNext(arr1,n);
        if(next && next === char1) return null;
        
        const prev = getPrev(arr1,n);
        if(prev && prev === char1) return null;

        return 'typo';

    }
    if(char2 === '*' || char2 === "'") {
        if(char1 !== '')
            return 'typo';
        else return null;
    }
    if(char2 === '-') {
        if(char1 !== '') return 'typo';
        else return null;
    }
    if(char1 === 'i') {
        if(char2 === '*')
            return 'typo';
        if(char2 === '[i]')
            return null;
        if(char2 === 'u') {
            const next = getNext(arr1,n);
            if(next && next === 'y') return null;
            else return 'typo';
        }
    }
    if(char2 === 'u' && char1 === '')
        return 'typo';
    
    if(char2 === '[m]')
        if(char1 === 'm') return null;
        else return 'typo';

    if(char2 === '[i]')
        if(char1 === 'i') return null;
        else return 'typo';

    return 'mismatch';
};

const getNext = (arr,n) => {
    for(let m=n+1;m<arr.length;m++) {
        if(typeof arr[m] !== 'string') continue;
        if(arr[m] === '' || [';',',','.'].includes(arr[m])) continue;
        return arr[m];
    }
    return false;
};

const getPrev = (arr,n) => {
    for(let m=n-1;m>=0;m--) {
        if(typeof arr[m] !== 'string') continue;
        if(arr[m] === '' || [';',',','.'].includes(arr[m])) continue;
        return arr[m];
    }
    return false;
};

const makeAlignmentTable = (alignment,lines,warnings) => {
    const ret = [];
    let charcounts = lines.reduce((acc,cur) => {
        const i = tamilSplit(wordClean(cur)).length;
        if(acc.length > 0)
            acc.push(acc[acc.length-1] + i);
        else acc.push(i - 1);
        return acc;
    },[]);

    let atab = document.createElement('table');
    let row1 = document.createElement('tr');
    let row2 = document.createElement('tr');
    let nn = -1;
    for(let n=0;n<alignment[0].length;n++) {
        const unequal = checkEquality(alignment[0],alignment[1],n);
        let td1;
        if(typeof alignment[0][n] === 'string') {
            td1 = document.createElement('td');
            td1.append(alignment[0][n]);
            if(alignment[0][n + 1] === Symbol.for('concatleft')) {
                td1.colSpan = 2;
                td1.classList.add('mismatch');
            }
            if(alignment[0][n - 1] === Symbol.for('concatright')) {
                if(row1.childNodes.length)
                    td1.colSpan = 2;
                td1.classList.add('mismatch');
            }
            else if(unequal) td1.classList.add(unequal);
            row1.appendChild(td1);
        }
        if(typeof alignment[1][n] === 'string') {
            const td2 = document.createElement('td');
            td2.append(alignment[1][n]);
            if(alignment[1][n + 1] === Symbol.for('concatleft') ||
               alignment[1][n - 1] === Symbol.for('concatright')) {
                td2.colSpan = 2;
                td2.classList.add('mismatch');
            }
            else if(unequal) td2.classList.add(unequal);
            else if(td1?.classList.contains('mismatch')) td2.classList.add('mismatch');
            row2.appendChild(td2);
        }

        if(typeof alignment[1][n] === 'string' && alignment[1][n] !== '') nn++;

        if(alignment[1][n+1] !== '' && charcounts.includes(nn)) {
            const add1 = row1.lastChild.colSpan === 2;

            atab.appendChild(row1);
            atab.appendChild(row2);
            ret.push(atab);
            atab = document.createElement('table');
            row1 = document.createElement('tr');
            row2 = document.createElement('tr');

            if(add1)
                row1.appendChild(document.createElement('td'));
        }

    atab.appendChild(row1);
    atab.appendChild(row2);
    ret.push(atab);
    }

    if(warnings.length > 0)
        for(const warning of warnings) {
            const ws = document.createElement('div');
            ws.innerHTML = `Please check <b>${warning}</b>.`;
            ws.className = 'warningbox';
            ret.unshift(ws);
        }

    return ret;

};

export default makeAlignmentTable;
