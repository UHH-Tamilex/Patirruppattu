import alignApparatus from './apparatus-eva.mjs';
import { makeApp, addWitnesses, addApparatus, getWits } from './apparatus.mjs';
import { loadDoc, saveAs } from './fileops.mjs';
import { addEditButton } from './utils.mjs';
import previewDoc from './preview.mjs';
import { cancelPopup as cancelPopup2, showPopup } from './popup.mjs';

const _state = {
    Transliterator: null
};

const cachedAlignments = new Map();

const switchType = e => {
    const targ = e.target.closest('.switcher > div');
    if(!targ || targ.classList.contains('selected')) return;
    
    
    const fileselect = document.getElementById('variantsfileselect');
    const textinput = document.getElementById('variantsinput');

    targ.classList.add('selected');
    if(targ.textContent === 'From file') {
        targ.nextElementSibling.classList.remove('selected');
        fileselect.style.display = 'block';
        textinput.style.display = 'none';
    }
    else {
        targ.previousSibling.classList.remove('selected');
        fileselect.style.display = 'none';
        textinput.style.display = 'flex';
    }

};

const addVariants = id => {
    const popup = showPopup('variants-popup');
    if(id) {
        const options = popup.querySelectorAll('select option');
        for(const option of options) {
            if(option.value === id)
                option.selected = true;
            else
                option.selected = false;
        }
    } 

    else popup.querySelector('select option').selected = true;

    findAlignmentFile();

    popup.style.display = 'flex';
    blackout.style.display = 'flex';
};

const saveThis = () => 
    saveAs(Apparatuser.sharedState.filename, Apparatuser.sharedState.curDoc);

const init = (transliterator) => {
    const popup = document.getElementById('variants-popup');
    if(!popup) return;

    const selector = popup.querySelector('select');
    for(const block of Apparatuser.sharedState.curDoc.querySelectorAll('text lg[*|id], text p[*|id], text div[*|id]')) {
        const option = document.createElement('option');
        const id = block.getAttribute('xml:id');
        option.value = id;
        option.append(id);
        selector.append(option);
    }
    document.getElementById('variantsswitcher').addEventListener('click',switchType);
    // evaStyle
    document.getElementById('addapparatus').addEventListener('click',generateApp);
    document.getElementById('saveapparatus').addEventListener('click',saveThis);
    popup.querySelector('.closeicon svg').addEventListener('click',cancelPopup);
    popup.querySelector('input[name="teifile"]').addEventListener('change',getFile);
    popup.querySelector('select').addEventListener('change',findAlignmentFile);

    document.getElementById('usefoundfile').addEventListener('click',() => {
        const name = document.getElementById('foundfile').textContent;
        getFile({alignment: {text: cachedAlignments.get(name)}, name: name});     
    });
    
    _state.Transliterator = transliterator;
};

const findAlignmentFile = async () => {
    const filefinder = document.getElementById('filefinder');
    const popup = document.getElementById('variants-popup');
    popup.querySelector('.output-boxen').style.display = 'none';
    const blockid = popup.querySelector('select[name="edblock"]').value;
    const srcname = `alignments/${blockid}.xml`;
    const res = await fetch(srcname,{cache: 'no-cache'});
    if(!res.ok) {
        filefinder.style.display = 'none';
        popup.querySelector('label[for="teifile"]').textContent = 'Select alignment file...';
        return;
    }
    const xmltext = await res.text();
    
    cachedAlignments.set(srcname, xmltext);

    document.getElementById('foundfile').textContent = srcname;
    filefinder.style.display = 'block';
    popup.querySelector('label[for="teifile"]').textContent = 'Use a different file...';
};

// Eva style
const generateApp = async e => {

    const popup = document.getElementById('variants-popup');
    const blockid = popup.querySelector('select[name="edblock"]').value;
    const listApp = await alignApparatus(Apparatuser.sharedState.curDoc, blockid);


    const outputboxen = popup.querySelector('.output-boxen');
    outputboxen.style.display = 'block';
    const output = outputboxen.querySelector('.popup-output');
    output.innerHTML = '';
    output.style.display = 'block';
    output.style.border = '1px solid black';
    output.style.whiteSpace = 'break-spaces';
    output.style.height = '600px';
    output.style.width = '100%';

    if(listApp.hasOwnProperty('errors'))
        output.innerHTML = listApp.errors.join('<br>');
    else {
        let curStandOff = Apparatuser.sharedState.curDoc.querySelector(`standOff[type="apparatus"][corresp="#${blockid}"]`);
        if(!curStandOff) {
            curStandOff = Apparatuser.sharedState.curDoc.createElementNS('http://www.tei-c.org/ns/1.0','standOff');
            curStandOff.setAttribute('corresp',`#${blockid}`);
            curStandOff.setAttribute('type','apparatus');
        }
        Apparatuser.sharedState.curDoc.documentElement.appendChild(curStandOff);
        curStandOff.innerHTML = listApp.output;
        const standOff = curStandOff.outerHTML;
        output.innerHTML = Prism.highlight(standOff, Prism.languages.xml, 'xml');
        if(listApp.warnings) {
            const warnp = document.createElement('p');
            warnp.innerHTML = listApp.warnings.join('<br>');
            output.prepend(warnp);
        }
        copyToClipboard(standOff,popup);

        document.getElementById('saveapparatus').style.display = 'block';
    }
};

const cancelPopup = e => {
    const popup = document.getElementById('variants-popup');
    const outputboxen = popup.querySelector('.output-boxen');
    const output = outputboxen.querySelector('.popup-output');
    outputboxen.style.display = 'none';
    output.innerHTML = '';

    cancelPopup2(e);

};

const readOne = async (file) => {
    const reader = new FileReader();
    return new Promise(res => {
        reader.onload = () => res(reader.result);
        reader.readAsText(file);
    });
};
const parseString = (str,fname) => {
    const parser = new DOMParser();
    const newd = parser.parseFromString(str,'text/xml');
    if(newd.documentElement.nodeName === 'parsererror')
        alert(`${fname} could not be loaded. Please contact your friendly local system administrator. Error: ${newd.documentElement.textContent}`);
    else
        return newd;
};
const getFile = async (e) => {
    const popup = document.getElementById('variants-popup');
    const blockid = popup.querySelector('select[name="edblock"]').value;
    const alignment = e.alignment;

    const xml = alignment ?
        parseString(alignment.text) :
        await (async () => {
            const input = document.getElementById('teifile');
            const file = input.files[0];
            const text = await readOne(file);
            return parseString(text,file.name);
        })();
    
    const siglum = Apparatuser.sharedState.curDoc.querySelector('idno[type="siglum"]')?.textContent || Apparatuser.sharedState.curDoc.documentElement.getAttribute('n');

    const cachedwitnesses = new Map();
    const cachedfiles = new Map();
    for(const wit of getWits(Apparatuser.sharedState.curDoc,xml)) {
        if(!cachedwitnesses.get(wit.name)) {
            let file = cachedfiles.get(wit.filename);
            if(!file) {
                file = await loadDoc(wit.filename);
                cachedfiles.set(wit.filename,file);
            }
            if(file) { // file could be null from loadDoc
                cachedwitnesses.set(wit.name, {
                    name: wit.name,
                    type: wit.type,
                    select: wit.select,
                    xml: file
                });
            }
        }
    }
    const app = await makeApp(xml, Apparatuser.sharedState.curDoc, {
        base: Apparatuser.sharedState.curDoc.querySelector(`[*|id="${blockid}"]`).closest('text').getAttribute('corresp')?.replace(/^#/,'') || siglum,
        normlem: document.getElementById('normlem').checked, 
        mergerdgs: document.getElementById('mergerdgs').checked,
        blockid: blockid,
        witnesses: cachedwitnesses
    });

    /*
    const outputboxen = popup.querySelector('.output-boxen');
    outputboxen.style.display = 'block';
    const output = outputboxen.querySelector('.popup-output');
    output.innerHTML = '';
    output.style.display = 'block';
    output.style.border = '1px solid black';
    output.style.whiteSpace = 'break-spaces';
    output.style.height = '600px';
    output.style.width = '100%';
    if(app.error) {
        output.innerHTML = app.error;
        return;
    }    
    */
    if(app.error) {
        alert(app.error);
        return;
    }

    popup.style.display = 'none';
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    document.getElementById('blackout').appendChild(spinner);

    addWitnesses(Apparatuser.sharedState.curDoc, app.listwit);
    addApparatus(Apparatuser.sharedState.curDoc, app.listapp, xml, blockid, e.name);
    const curStandOff = Apparatuser.sharedState.curDoc.querySelector(`standOff[type="apparatus"][corresp="#${blockid}"]`);
    const standOff = curStandOff.outerHTML;
    //output.innerHTML = Prism.highlight(standOff, Prism.languages.xml, 'xml');
    //copyToClipboard(standOff,popup);

    //document.getElementById('saveapparatus').style.display = 'block';
    const newDoc = await previewDoc(Apparatuser.sharedState.curDoc);
    const newblock = newDoc.getElementById(blockid);
    const newpar = newblock.closest('.wide');
    const newwide = newpar || newblock; // TODO: this is ugly

    const oldblock = document.getElementById(blockid);
    const oldpar = oldblock.closest('.wide');
    const oldwide = oldpar || oldblock;

    oldwide.parentNode.replaceChild(newwide,oldwide);
    newwide.classList.add('edited');
    _state.Transliterator.refreshCache(newwide);

    cancelPopup();
    spinner.remove();

    document.getElementById(blockid).scrollIntoView({behavior: 'smooth',block: 'center'}); 
    addEditButton(blockid);

    // keep clicking until the apparatus appears... pretty hacky solution
    const appbutton = document.getElementById('apparatusbutton');
    if(!appbutton) return;

    if(appbutton.style.display === 'block') appbutton.click();

    if(document.querySelector('.apparatus-block.hidden'))  {
        apparatusbutton.style.display = 'block';
        appbutton.click();
    }

    // keep clicking until the wordsplit appears... pretty hacky solution
    if(document.getElementById('wordsplitsvg').style.display === 'none') {
        const wsbutton = document.getElementById('wordsplitbutton');
        wsbutton.click();
        wsbutton.click();
    }
};

const copyToClipboard = async (xml,popup) => {
    const par = popup.querySelector('.popup-output');
    const tip = document.createElement('div');
    tip.style.position = 'absolute';
    tip.style.top = 0;
    tip.style.right = 0;
    tip.style.background = 'rgba(0,0,0,0.5)';
    tip.style.color = 'white';
    tip.style.padding = '0.5rem';
    try {
        await navigator.clipboard.writeText(xml);
        tip.append('Copied to clipboard.');
        par.appendChild(tip);
        tip.animate([
            {opacity: 0},
            {opacity: 1, easing: 'ease-in'}
            ],200);
    } catch {
        const tip = document.createElement('div');
        tip.style.color = 'red';
        tip.append('Couldn\'t copy to clipboard.');
        par.appendChild(tip);
    }
    setTimeout(() => tip.remove(),1000);
};

const getWitOrder = el => {
    return [...el.querySelectorAll('witness')].map(w => w.getAttribute('xml:id'));
};

const Apparatuser = {
    addVariants: addVariants,
    init: init,
    sharedState: null
};
export default Apparatuser;
