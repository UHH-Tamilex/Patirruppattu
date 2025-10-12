import Splitter from './splits.mjs';
import Apparatuser from './variants.mjs';
import Annotator from './annotate.mjs';
import Citer from './cite.mjs';
import { addEditButtons } from './utils.mjs';
import { loadDoc, saveAs } from './fileops.mjs';
import Exporter from './export.mjs';

const _state = {
    curDoc: null,
    filename: window.location.pathname.split('/').pop()

};

Splitter.sharedState = _state;
Apparatuser.sharedState = _state;

const startEditMode = async (Transliterator,libRoot) => {
    injectCSS(Annotator.css);
    revealButtons();
    _state.curDoc = await loadDoc(window.location.pathname);
    _state.libRoot = libRoot;
    const blocks = _state.curDoc.querySelectorAll('lg[*|id],p[*|id],div[*|id],div[*|id]');
    addEditButtons(blocks);
    document.getElementById('button_wordsplitbutton')?.addEventListener('click',Splitter.addWordSplits);
    document.getElementById('button_editbutton')?.addEventListener('click',Apparatuser.addVariants);
    document.getElementById('button_exportbutton')?.addEventListener('click',Exporter.showOptions);
    //document.getElementById('button_annotatebutton').addEventListener('click',annotateMode);
    document.getElementById('button_savebutton')?.addEventListener('click',saveAs.bind(null,_state.filename, _state.curDoc));
   
    Annotator.init();
    document.getElementById('recordcontainer').addEventListener('click',docClick);
    //document.getElementById('recordcontainer').addEventListener('mouseup',Citer.docSelect);
    Apparatuser.init(Transliterator);
    Citer.init(_state.curDoc);
    Splitter.init(/*Transliterator*/);
    Exporter.init(_state.curDoc,libRoot);
};

const revealButtons = () => {
    const topbar = document.getElementById('topbar');
    for(const button of topbar.querySelectorAll('button'))
        button.style.display = 'block';
};

const docClick = e => {
    const wordsplit = e.target.closest('.mini_wordsplit');
    const lg = e.target.closest('.lg');
    if(wordsplit) {
        Splitter.addWordSplits(lg.id || lg.querySelector('[id]').id);
        return;
    }
    const apparatus = e.target.closest('.mini_apparatus');
    if(apparatus) {
        Apparatuser.addVariants(lg.id || lg.querySelector('[id]').id);
    }
    const alignbutton = e.target.closest('.alignedit');
    if(alignbutton)
        editAlignment(alignbutton);
};

const editAlignment = el => {
    const url = encodeURIComponent(el.dataset.href);
    window.open(`lib/debugging/matrix-editor/?url=${url}`);
};


const injectCSS = (add = '') => {
    const style = document.createElement('style');
    style.append(
`
#topbar {
    background: linear-gradient(rgb(255,255,248) 60%, rgba(255,255,255,0));
    height: auto;
    top: 0;
    padding-top: 1em;
    padding-bottom: 2em;
    z-index: 3;
    backdrop-filter: blur(1px);
    flex-direction: row;
}
#buttoncontainer {
    top: auto;
}

` + add
    );
    document.head.appendChild(style);
};

export default startEditMode;
