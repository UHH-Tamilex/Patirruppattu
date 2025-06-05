import { MiradorModule } from './mirador.mjs';
import TSTStorageAdapter from './tstStorageAdapter.mjs';

const Mirador = MiradorModule.Mirador;
const miradorImageTools = MiradorModule.miradorImageToolsPlugin;
const miradorAnnotations = MiradorModule.miradorAnnotationPlugin;
const _state = {
    winname: 'win1',
    annoMap: new Map(),
};

const setFacs = {
    name: 'set facs attribute',
    reducers: {
        facsSet: (state=null,action=null) => {
            if(action.type === 'mirador/RECEIVE_MANIFEST')
                return action.manifestJson;

            if(!state) return state;

            if(action.type === 'mirador/SET_CANVAS') {
                // n-1 because f1 is image 0
                const items = state.sequences ? 
                    state.sequences[0].canvases : 
                    state.items;
                for(let n=0;n<items.length;n++) {
                    const id = items[n]['@id'] || items[n].id;
                    if(id === action.canvasId) {
                        const url = new URL(window.location.href);
                        url.searchParams.set('facs',n+1);
                        window.history.replaceState({},'',url.toString());
                    }
                }
            }
            return state;
        },
    }
};

const newMirador = function(id,manifest,start = 0,annoMap = _state.annoMap, annotate = false) {
    _state.annoMap = annoMap;
    //const plugins = annotate ?
    //  [...miradorImageTools,...miradorAnnotations] :
    //  [...miradorImageTools];
    const plugins = [...miradorImageTools,...miradorAnnotations,setFacs];
    const opts = {
        id: id,
        windows: [{
            id: _state.winname,
            loadedManifest: manifest,
            canvasIndex: start
        }],
        window: {
            allowClose: false,
            allowFullscreen: false,
            allowMaximize: false,
            defaultSideBarPanel: 'annotations',
            //highlightAllAnnotations: true,
            sideBarOpenByDefault: false,
            imageToolsEnabled: true,
            imageToolsOpen: false,
        },
        workspace: {
            showZoomControls: true,
            type: 'mosaic',
        },
        workspaceControlPanel: {
            enabled: false,
        },
    };
    opts.annotation = {
        adapter: (canvasId) => new TSTStorageAdapter(canvasId,annoMap),
        exportLocalStorageAnnotations: false,
        };
    const viewer = Mirador.viewer(opts,plugins);
    const act = Mirador.actions.setWindowViewType(_state.winname,'single');
    viewer.store.dispatch(act);
        
    if(annoMap) annotateMirador(viewer,annoMap);
    /*if(!annotate) {
        const el = document.createElement('style');
        el.innerHTML = '[aria-label="Create new annotation"] { display: none !important;}';
        document.head.appendChild(el);
    }*/
    
    return viewer;
};
    
const annotateMirador = function(win, annoMap) {
    for(const annoarr of annoMap) {
        for(const anno of annoarr) {
            const act = Mirador.actions.receiveAnnotation(anno.page, anno.id, anno.obj);
            win.store.dispatch(act);
        }
    }
    /*
    const act4 = Mirador.actions.toggleAnnotationDisplay(_state.winname);
    win.store.dispatch(act4);
    */
};

const refreshMirador = function(win,manifest,start,annoMap = null) {
    const act = Mirador.actions.addWindow({
        id: _state.winname,
        manifestId: manifest,
        canvasIndex: start
    });
    win.store.dispatch(act);
    if(annoMap) annotateMirador(win,annoMap);
};

const killMirador = function(win) {
    const act = Mirador.actions.removeWindow(_state.winname);
    win.store.dispatch(act);
};

const setAnnotations = function(obj) {
    _state.annoMap = new Map(obj);
};

const jumpTo = function(win,manifest,n) {
    const split = n.split(':');
    const page = split[0];
    const manif = win.store.getState().manifests[manifest].json;
    // n-1 because f1 is image 0
    const items = manif.sequences ? manif.sequences[0].canvases : manif.items;
    const canvasid = items[page-1]['@id'] || items[page-1].id;
    const act = Mirador.actions.setCanvas(_state.winname,canvasid);
    win.store.dispatch(act);

    if(split[1]) {
        const annos = _state.annoMap.get(canvasid);
        // n-1 because annotation 1 is indexed 0
        const annoid = annos.items[split[1] - 1].id;
        const act2 = Mirador.actions.selectAnnotation(_state.winname,annoid);
        win.store.dispatch(act2);
    }
};

const jumpToId = function(win,id) {
    const act = Mirador.actions.setCanvas(_state.winname,id);
    win.store.dispatch(act);
};

const getMiradorCanvasId = (win) => {
        const win1 = win.store.getState().windows[_state.winname];
        return win1 ? win1.canvasId : null;
};

const MiradorWrapper = {
    start: newMirador,
    refresh: refreshMirador,
    kill: killMirador,
    setAnnotations: setAnnotations,
    jumpTo: jumpTo,
    jumpToId: jumpToId,
    getMiradorCanvasId: getMiradorCanvasId
};

export { MiradorWrapper };
