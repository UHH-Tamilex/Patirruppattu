import Sanscript from '../js/sanscript.mjs';

const alignApparatus = async (curDoc, blockid) => {
    const popup = document.getElementById('variants-popup');

    const textblock = curDoc.querySelector(`[*|id="${blockid}"]`);
    const edition = textblock.querySelector('[type="edition"]');
    let text = edition || textblock;
    const textarea = popup.querySelector('textarea');
    const app = processApparatus(textarea.value,curDoc);
    
    for(const ap of app) {
        const errors = [];
        if(ap.lemma && ap.lemma.error) errors.push(ap.lemma.error);
        if(ap.readings) 
            for(const reading of ap.readings)
                if(reading.error) errors.push(reading.error);
        if(errors.length > 0) return {errors: errors};
    }

    const checked = await checkWits(app);
    if(checked.errors) return checked;

    const aligned = alignAppToText(app,text);
    if(typeof aligned[0] === 'string')
        return {errors: aligned};

    const formatted = formatApparatus(aligned,blockid);
    /*
     * const adjusted = adjustApparatus(aligned,eddoc);
     * const formatted = formatApparatus(adjusted);
    */
    return {
        output: checked.witnesses ? 
            formatted + `\n<listWit>\n${checked.witnesses}\n</listWit>` :
            formatted,
        warnings: checked.warnings
    };
};

const checkWits = async listapp => {
    const findPar = node => {
         let ret = node.parentNode.closest('witness');
         if(!ret) return null;
         while(ret) {
             const test = ret.parentNode.closest('witness');
             if(test) ret = test;
             else return ret;
         }
    };
    const allwits = new Set();
    for(const app of listapp) {
        const witset = new Set();
        if(!app.hasOwnProperty('lemma') || !app.hasOwnProperty('readings')) continue;
        const wits = [app.lemma,...app.readings].map(e => e.witnesses).flat();
        for(const wit of wits) {
            if(witset.has(wit)) return {errors: [`${wit} reported twice for ${app.lemma.reading}.`]};
            witset.add(wit);
            allwits.add(wit);
        }
    }
    const res = await fetch('witnesses.xml');
    if(res.ok) {
        const warnings = [];
        const allels = new Set();
        const xmltext = await res.text();
        const witDoc = (new DOMParser()).parseFromString(xmltext,'text/xml');
        for(const wit of allwits) {
            const el = witDoc.querySelector(`witness[*|id="${wit.replace(/^#/,'')}"]`);
            if(!el) warnings.push(`${wit} not recognized.`);
            else {
				const parwit = findPar(el);
                if(parwit)
                    allels.add(parwit.outerHTML);
                else allels.add(el.outerHTML);
            }
        }
        return { warnings: warnings,
                 witnesses: [...allels].join('\n')
        };
        
    }
    return {warnings: ['No witnesses defined.']};
};

const formatApparatus = (entries,blockid) => {
    const formatted = entries.map(entry => {
        const notes = (entry.notes && entry.notes.length !== 0) ? entry.notes.map(n => `<note xml:lang="en">${n.innerHTML}</note>`).join('\n') : '';
        if(!entry.coords)
            return `<app>${notes}</app>`;
        const readings = entry.readings.map(rdg => {
            return `<rdg wit="${rdg.witnesses.join(' ')}">${rdg.reading}</rdg>`;
        });
        return `<app loc="${entry.coords[0]},${entry.coords[1]}">
        <lem wit="${entry.lemma.witnesses.join(' ')}">${entry.lemma.reading}</lem>
        ${readings.join('\n')}${notes}
        </app>`;
    });
    return `<listApp>\n${formatted.join('\n')}\n</listApp>`;
};

const alignAppToText = (app,text) => {
    const edlines = [...text.querySelectorAll('l')].map(l => {
        const clone = l.cloneNode(true);
        const choices = clone.querySelectorAll('choice');
        for(const choice of choices) {
            const first = choice.firstChild;
            while(first.nextSibling) first.nextSibling.remove();
        }
        return clone.textContent.replaceAll(/\s/g,'');
    });
    const ret = [];
    const warnings = [];
    for(const entry of app) {
        if(!entry.line) {
            ret.push({notes: entry.notes});
            continue;
        }
        const charsbefore = edlines.slice(0,entry.line-1).join('').length;
        const prepend = charsbefore || 0;
        const searchfrom = edlines.slice(entry.line-1).join('');
        const stripped = entry.lemma.reading.replaceAll(/\s/g,'').replaceAll(/<[^>]+>/g,''); // ugly removal of tags
        const start = searchfrom.indexOf(stripped);
        if(start === -1) {
            warnings.push(`Lemma "${stripped}" not found.`);
            continue;
        }
        const end = start + stripped.length;
        /*
        if(start === -1) { // maybe it spans two cirs and there's a <choice>
            const split = entry.lemma.reading.split(' ');
            const last = split.pop();
            start = searchfrom.indexOf(split[0]);
            end = searchfrom.indexOf(last) + last.length;
        }
        */
        const coords = [prepend + start, prepend + end];
        ret.push({coords: coords, lemma: entry.lemma, readings: entry.readings, notes: entry.notes});
    }

    if(warnings.length > 0) return warnings;
    return ret;
};

const processApparatus = (str,curDoc) => {
    const apparatus = str.trim().replaceAll('FF•','•FF').split(/[Ɛ#•$]/).map(l => {
        if(l === '') return null;

        let clean = l.trim();
        let faulty = false;
        if(clean.startsWith('FF')) {
            faulty = true;
            clean = clean.slice(2).trim();
        }
        const placeres = /^(\d+-?)([a-z\-]*)/.exec(clean);
        if(!placeres) {
            const note = curDoc.createElementNS('http://www.tei-c.org/ns/1.0','note');
            note.append(clean.replace(/[\[\]]/g,''));
            return {notes: [note]};
        }

        const line = placeres[1];
        const cirs = placeres[2];
        //cirs currently not used right now
        
        const entries = clean.split(';').map(e => {
            const witstart = e.split('').reverse().join('').match(/[\u0b80-\u0bff_\/><ǂ‡@ß\[\]]/);
            if(!witstart) return {error: `Error parsing "${e}".`};
            const rdg = formatReading(e.slice(0,`-${witstart.index}`));
            const wits = splitWitnesses(e.slice(`-${witstart.index}`));
            if(!wits) return {error: `Error parsing "${e}".`};
            return {reading: Sanscript.t(rdg,'tamil','iast'), witnesses: wits};
        });
        
        const ret = {line: line, cirs: cirs, lemma: entries.shift(), readings: entries};
        if(faulty) ret.notes = [{innerHTML: 'Faulty.'}];
        return ret;
    });
    return apparatus.filter(l => l);
};

const splitWitnesses = (str) => {
    const wits = str.split(',').reduce((acc,cur) => {
        if(!acc) return null; // error from last round
        const split = cur.trim().split('+');
        if(split.length === 1) {
            acc.push(split[0]);
            return acc;
        }
        const initialmatch = split[0].match(/^[^\d]+(?=[\d(])/);
        if(!initialmatch) return null; // e.g., errors like "C+3v"
        const initial = initialmatch[0];
        const newsplit = split.map((el,i) => {
            if(i === 0) return el.replace(/^\(/,'');
            else return initial + el;
        });
        return acc.concat(newsplit);
    },[]);

    if(!wits) return null;

    const witsclean = wits.map(w => {
        const clean = w.replace(/[.\s\[\]()]/g,'')
                       .normalize('NFD').replace(/[\u0300-\u036f]/g,'');
        return `#${clean}`;
    });
    return witsclean;
};

const formatReading = (str) => {
     return str.replace(/^[\da-f\-•#$Ɛ.]+/,'')
         .replace(/\s*\|\s*/,'\n')
         .trim()
         .replace(/\//g,'<note xml:lang="en">[om.]</note>')
         .replace(/[ǂ‡]+/g,(match) => `<gap reason="lost" quantity="${match.length}" unit="character"/>`)
         .replace(/\[/g,'<sic>').replace(/\]/g,'</sic>')
         .replace(/<sic>(_+)<\/sic>/g,(match,p1) => `<space quantity="${p1.length}" unit="character"/>`)
         .replace(/^\/$/,'')
         ;
};

export default alignApparatus;
