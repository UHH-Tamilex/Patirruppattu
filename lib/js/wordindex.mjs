import { Transliterate } from './transliterate.mjs';
import openDb from './sqlite.mjs';

const init = () => {
    const loc = window.location.hash;
    if(!loc) return;

    const word = decodeURI(loc.replace(/^#/,''));
    const details = document.querySelector(`details[data-entry='${word}']`);
    const pardetails = details.parentNode.closest('details');
    if(pardetails) {
        docClick({target: pardetails});
        pardetails.open = true;
    }
    docClick({target: details});
    details.scrollIntoView({behavior: 'smooth', block: 'center'});
    details.open = true;
};

const formatCitations = (citations) => {
    return '<table><tbody>' + citations.map(c =>
`<tr>
    <td><span class="msid" lang="en"><a href="${c.filename}">${c.siglum}</a></span></td>
    <td><q lang="ta">${c.context}</q></td>
    <td>${c.translation ? '<span class="context-translation">'+c.translation+'</span>':''}</td>
    <td>${c.syntax ? ' <span class="syntax">'+c.syntax+'</span>':''}</td>
</tr>`).join('\n') + '</tbody></table>';
};

const docClick = e => {
    const details = e.target.closest('details');
    if(details) getEntry(details);
};

const workers = {
    local: null,
    /*full: null*/
};

const getEntry = async (targ) => {
    const spinner = targ.querySelector(':scope > .spinner');
    if(!spinner) return;
    
    if(!workers.local) 
        workers.local = await openDb('wordindex.db');
    /*
    if(!workers.full) 
        workers.full = await createSqlWorker('index.db');
    */
    let results = {};
    let canonicaldef;
    if(targ.id) {
        results = workers.local.exec(`SELECT def, pos, number, gender, nouncase, person, aspect, voice, syntax, particlefunction, rootnoun, proclitic, enclitic, context, citation, filename FROM citations WHERE islemma = "${targ.id}"`);
        /*
        if(results.length === 0)
            results = await workers.full.db.query('SELECT definition, pos, number, gender, nouncase, voice, person, aspect, mood FROM dictionary WHERE islemma = ?',[targ.id]);
        */
        canonicaldef = (workers.local.exec(`SELECT definition FROM lemmata WHERE lemma = "${targ.id}" LIMIT 1`))[0].values[0][0];
    }
    else {
        const lemma = targ.closest('details[id]')?.id;
        const form = targ.closest('details').dataset.entry;
        if(lemma)
            results = workers.local.exec(`SELECT def, pos, number, gender, nouncase, person, voice, aspect, syntax, particlefunction, rootnoun, proclitic, enclitic, context, citation, filename FROM citations WHERE form = "${form}" AND fromlemma = "${lemma}"`); 
            //bind: {$form: form, $fromlemma: lemma}, rowMode: 'object'})).result.resultRows;
        else
            results = workers.local.exec(`SELECT def, pos, number, gender, nouncase, person, voice, aspect, syntax, particlefunction, rootnoun, proclitic, enclitic, context, citation, filename FROM citations WHERE form = "${form}" AND fromlemma IS NULL`);//, bind: {$form: form}, rowMode: 'object'})).result.resultRows;
    }
    
    if(results.length === 0) {
        spinner.remove();
        return; 
    }

    const entry = {
        translations: new Set(),
        grammar: new Set(),
        citations: []
    };

    for(const result of results[0].values) {
        if(result[0]) entry.translations.add(result[0]);
        if(result[1]) entry.grammar.add(result[1]);
        if(result[2]) entry.grammar.add(result[2]);
        if(result[3]) entry.grammar.add(result[3]);
        if(result[4]) entry.grammar.add(result[4]);
        if(result[5]) entry.grammar.add(result[5]);
        if(result[6]) entry.grammar.add(result[6]);
        if(result[13]) entry.citations.push({
            context: result[13],
            siglum: result[14],
            filename: result[15],
            translation: result[0],
            syntax: result[8] || result[9] || results[10],
        });
    }
    const definition = canonicaldef ? `<div>${canonicaldef}</div>` : '';
    let frag =
`<div lang="en">
<div>${[...entry.grammar].join(', ')}</div>
${definition}
</div>`;
    if(entry.translations.size > 0) {
        frag = frag + 
`<div>
<h4 lang="en">translations in context</h4>
<div class="dict-definitions">${[...entry.translations].join(', ')}</div>`;
    }
    if(entry.citations.length > 0) {
        frag = frag + 
`<h4 lang="en">citations</h4>
<div class="dict-citations">
${formatCitations(entry.citations)}
</div>`;
    }
    const range = document.createRange();
    range.selectNode(targ);
    const docfrag = range.createContextualFragment(frag);
    spinner.replaceWith(docfrag);
};

document.addEventListener('click',docClick);
window.addEventListener('load',init);
