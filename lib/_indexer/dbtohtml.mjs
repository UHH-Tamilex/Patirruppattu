import Fs from 'fs';
import Path from 'path';
import Process from 'process';
import Jsdom from 'jsdom';
import sqlite3 from 'better-sqlite3';

const order = [
    'a','ā','i','ī','u','ū','e','ē','ai','o','ō','au',
    'k','ṅ','c','ñ','ṭ','ṇ','t','n','p','m',
    'y','r','l','v',
    'ḻ','ḷ','ṟ','ṉ','ś','ṣ','h'
];

const getFirstLetter = (str) => {
    if(str[0] !== 'a') return str[0];
    if(str[1] === 'u' || str[1] === 'i') return 'a' + str[1];
    return 'a';
};

const go = () => {
    const template = Fs.readFileSync('wordindex-template.html',{encoding: 'utf-8'});
    const db = new sqlite3('../../wordindex.db');

    const rows = db.prepare('SELECT lemma, form, recognized FROM lemmata ORDER BY formsort ASC').all();
    var out = '';
    const ordermap = new Map(order.map(o => [o,[]]));
    const unordered = [];

    for(const row of rows) {
        const forms = db.prepare('SELECT DISTINCT form FROM citations WHERE fromlemma = ? ORDER BY formsort ASC').all(row.lemma);
        const formstr = forms.map(f => `<hr><details class="dict" data-entry="${f.form}"><summary class="dict-heading"><span class="lemma-head">${row.form}</span> ${f.form}</summary><div class="spinner"></div></details>`).join('\n');
        const outstr = `<hr>\n<details data-entry="${row.form}" ${row.recognized === 'TRUE' ? 'id="' + row.lemma + '"' : ''} class="dict">
            <summary class="dict-heading">${row.form}</summary>
            <div class="spinner"></div>
            ${formstr}
            </details>\n`;

        const group = ordermap.get(getFirstLetter(row.form));
        if(group) group.push(outstr);
        else unordered.push(outstr);
    }

    const allgroups = [['',unordered],...ordermap];
    out = allgroups.filter(g => g[1].length > 0)
                   .map(g => `<div class="dict-group"><div>${g[1].join('')}</div><h2 class="dict-letter" lang="ta">${g[0]}</h2></div>`)
                   .join('\n');
    const writeout = template.replace('<!-- insert list here -->', out)
                             .replaceAll('<!-- insert title here -->',process.argv[2]);
    Fs.writeFileSync('../../wordindex.html',writeout);
};

go();
