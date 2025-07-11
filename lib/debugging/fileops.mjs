import { showSaveFilePicker } from './native-file-system-adapter/es6.js';

const saveAs = async (filename,doc) => {
    const fileHandle = await showSaveFilePicker({
        suggestedName: filename,
        types: [
            { description: 'TEI XML', accept: { 'text/xml': [ '.xml'] } }
        ],
    });
    const serialized = typeof doc === 'string' ? 
        doc :
        (new XMLSerializer()).serializeToString(doc);
    const file = new Blob([serialized], {type: 'text/xml;charset=utf-8'});
    const writer = await fileHandle.createWritable();
    writer.write(file);
    writer.close();
};

const loadDoc = async (fn,cache='no-cache',type='xml') => {
    const res = await fetch(fn, {cache: cache});
    if(!res.ok) return null;
    const xmltext = await res.text();
    return (new DOMParser()).parseFromString(xmltext, `text/${type}`);
};

export {loadDoc, saveAs};
