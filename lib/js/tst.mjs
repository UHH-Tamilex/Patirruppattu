import { Transliterate } from './transliterate.mjs';
import { AlignmentViewer } from './alignment.mjs';
import { ApparatusViewer } from './apparatus.mjs';
import { MiradorWrapper } from './miradorwrapper.mjs';
import { GitHubFunctions } from './githubfunctions.mjs';
import './tooltip.mjs';

const _state = Object.seal({
    manifest: null,
    mirador: null,
});

const init = () => {

    const params = new URLSearchParams(window.location.search);
    // load image viewer if facsimile available
    const viewer = document.getElementById('viewer');

    const corresps = params.getAll('corresp');
    let facs,scrollel;
    if(corresps.length > 0) {
        scrollel = findCorresp(corresps);
        if(scrollel) {
            const res = findFacs(scrollel);
            if(res) facs = res.split(':')[0] - 1;
        }
    }
    if(viewer) {
        _state.manifest = viewer.dataset.manifest;
        const param = params.get('facs');
        const page = facs !== undefined ? facs :
            (param ? parseInt(param) - 1 : null) || viewer.dataset.start;
        if(_state.mirador)
            MiradorWrapper.refresh(_state.mirador,_state.manifest, page);
        else
            _state.mirador = MiradorWrapper.start('viewer',_state.manifest, page);
    }
    
    // initialize events for the record text
    const recordcontainer = document.getElementById('recordcontainer');

    cleanLb(recordcontainer);
    
    // start all texts in diplomatic view
    for(const l of recordcontainer.querySelectorAll('.line-view-icon')) {
        const teitext = l.closest('.teitext');
        const lb = !teitext.querySelector('.apparatus-block') && teitext?.querySelector('.lb, .pb');
        if(!lb)
            l.style.display = 'none';
        else {
            if(teitext.classList.contains('edition'))
                l.classList.add('diplo'); // lineView will then switch it to paragraph mode
            lineView(l);
        }
    }
    for(const excerpt of recordcontainer.querySelectorAll('.excerpt')) {
        for(const el of excerpt.querySelectorAll('p,.lg,.l,.ab,.caesura'))
            el.classList.add('diplo');
    }

    if(document.querySelector('.app')) {
        ApparatusViewer.init();
        ApparatusViewer.setTransliterator(Transliterate);
    }

    recordcontainer.addEventListener('click',events.docClick);
    document.getElementById('togglers').addEventListener('click',events.toggleClick);
    recordcontainer.addEventListener('copy',events.removeHyphens);

    Transliterate.init(recordcontainer);
    
    if(scrollel) scrollTo(scrollel);

    // check for GitHub commit history
    GitHubFunctions.latestCommits();

};

const findCorresp = (corresps) => {
    let res = document;
    for(const c of corresps) {
        res = res.querySelector(`[data-corresp~='${c}'], [id='${c}']`);
        if(!res) return false;
    }
    return res;
};

const scrollTo = (el) => {

    el.scrollIntoView({behaviour: 'smooth', block: 'center'});
    el.classList.add('highlit');
    document.addEventListener('click',() => {
       el.classList.remove('highlit'); 
    },{once: true});
};

const findFacs = (startel) => {

    const prev = (e)  => {
        let prevEl = e.previousElementSibling;
        if(prevEl) {
            while(prevEl.lastElementChild)
                prevEl = prevEl.lastElementChild;
            return prevEl;
        }
   
        let par = e.parentNode;
        while(par && !par.classList?.contains('teitext')) {
            let parPrevEl = par.previousElementSibling;
            if(parPrevEl) {
                while(parPrevEl.lastElementChild)
                    parPrevEl = parPrevEl.lastElementChild;
                return parPrevEl;
            }
            par = par.parentNode;
        }
        return false;
    };
    
    const forwardFind = (e) => {
        const walker = document.createTreeWalker(e,NodeFilter.SHOW_ALL);
        while(walker.nextNode()) {
            const cur = walker.currentNode;
            if(cur.nodeType === 3 && cur.data.trim() !== '') 
                return false;
            else if(cur.nodeType === 1 && 'loc' in cur.dataset) 
                return cur.dataset.loc;
        }
            
    };
    
    const found = forwardFind(startel);
    if(found) return found;

    var p = prev(startel);
    while(p) {
        if(!p || !p.dataset) return '';
        if('loc' in p.dataset) {
            return p.dataset.loc;
        }
        p = prev(p);
    }
    return false;
};

const events = {

    docClick: function(e) {
        const locel = e.target.closest('[data-loc]');
        if(locel && !e.target.closest('.app')) {
            MiradorWrapper.jumpTo(_state.mirador,_state.manifest,locel.dataset.loc);
            return;
        }
        const lineview = e.target.closest('.line-view-icon');
        if(lineview) {
            lineView(lineview);
            return;
        }
        const apointer = e.target.closest('.alignment-pointer');
        if(apointer) {
            e.preventDefault();
            AlignmentViewer.viewer(apointer.href);
            return;
        }

        if(e.target.dataset && e.target.dataset.hasOwnProperty('scroll')) {
            e.preventDefault();
            const el = document.getElementById(e.target.href.split('#')[1]);
            el.scrollIntoView({behavior: 'smooth', inline:'end'});
        }
    },
    removeHyphens: function(ev) {
        if(ev.target.closest('textarea'))
            return; 
        ev.preventDefault();
        const hyphenRegex = new RegExp('\u00AD','g');
        const sel = window.getSelection().toString().replaceAll(hyphenRegex,'');
        (ev.clipboardData || window.clipboardData).setData('Text',sel);
    },
    toggleClick: e => {
        if(e.target.closest('#viewertoggle'))
            toggleViewer(e);
        else if(e.target.closest('#recordtoggle'))
            toggleRecord(e);
        else if(e.target.closest('#rotator'))
            rotatePage(e);

    }
};


const cleanLb = (par) => {
    const lbs = par.querySelectorAll('[data-nobreak]');
    for(const lb of lbs) {
        const prev = lb.previousSibling;
        if(prev && prev.nodeType === 3)
            prev.data = prev.data.trimEnd();
    }
};


const lineView = function(icon) {
    const par = icon.closest('.teitext');
    if(icon.classList.contains('diplo')) {
        par.classList.remove('diplo');

        const els = par.querySelectorAll('.diplo');
        for(const el of els)
            el.classList.remove('diplo');
       /* 
        if(document.getElementById('record-fat')) {
            const apps = par.querySelectorAll('.app');
            for(const app of apps)
                app.style.display = 'initial';
        }
        */
        icon.title = 'diplomatic view';
    }
    else {
        icon.classList.add('diplo');
        par.classList.add('diplo');
        
        const els = par.querySelectorAll('p,.para,div.lg,div.l,div.ab,.pb,.lb,.cb,.caesura,.milestone');
        for(const el of els)
            el.classList.add('diplo');
        /*
        if(document.getElementById('record-fat')) {
            const apps = par.querySelectorAll('.app');
            for(const app of apps)
                app.style.display = 'none';
        } 
        */
        icon.title = 'paragraph view';
    }

};
//window.addEventListener('load',init);

const toggleViewer = e => {
    if(e.target.textContent === '<')
        hideViewer();
    else
        showViewer();
};

const toggleRecord = e => {
    if(e.target.textContent === '>')
        hideRecord();
    else
        showRecord();
};

const rotatePage = e => {
    if(e.target.textContent === '↺') {
        document.body.style.flexDirection = 'column';
        e.target.textContent = '⟳';
        e.target.style.margin = '0 0.2rem 0 0.2rem';
        e.target.style.borderRadius = '0 0 0.3rem 0.3rem';
        const togglers = document.getElementById('togglers');
        togglers.style.transform = 'rotate(180deg)';
        togglers.style.writingMode = 'vertical-lr';
        togglers.style.height = 'auto';
        togglers.style.width = '100vw';
        const viewertoggle = document.getElementById('viewertoggle');
        viewertoggle.style.borderRadius = '0.3rem 0 0 0.3rem';
        const rec = document.querySelector('.record.thin');
        if(rec) rec.className = 'record fat';
    }
    else {
        document.body.style.flexDirection = 'row-reverse';
        e.target.textContent = '↺';
        e.target.style.margin = '0.2rem 0 0.2rem 0';
        e.target.style.borderRadius = '0 0.3rem 0.3rem 0';
        const togglers = document.getElementById('togglers');
        togglers.style.transform = 'unset';
        togglers.style.writingMode = 'unset';
        togglers.style.height = '100vh';
        togglers.style.width = 'auto';
        const viewertoggle = document.getElementById('viewertoggle');
        viewertoggle.style.borderRadius = '0 0.3rem 0.3rem 0';
        const rec = document.querySelector('.record.fat');
        if(rec) rec.className = 'record thin';
    }
};

const hideViewer = () => {
    const viewer = document.getElementById('viewer');
    viewer.style.display = 'none';
    //_state.curImage = TSTViewer.getMiradorCanvasId(_state.mirador);
    //TSTViewer.killMirador();
    const toggle = document.getElementById('viewertoggle');
    const othertoggle = document.getElementById('recordtoggle');
    const rotator = document.getElementById('rotator');
    toggle.textContent = '>';
    toggle.title = 'show images';
    othertoggle.style.display = 'none';
    rotator.style.display = 'none';
    const rec = document.querySelector('.record.thin');
    if(rec) rec.className = 'record fat';
    //TSTViewer.refreshMirador();   
};

const showViewer = () => {
    const viewer = document.getElementById('viewer');
    viewer.style.display = 'block';
    //TSTViewer.refreshMirador(_state.mirador,_state.manifest, _state.curImage);
    const toggle = document.getElementById('viewertoggle');
    const othertoggle = document.getElementById('recordtoggle');
    const rotator = document.getElementById('rotator');
    toggle.textContent = '<';
    toggle.title = 'hide images';
    toggle.style.display = 'flex';
    othertoggle.title = 'hide text';
    othertoggle.style.display = 'flex';
    rotator.style.display = 'flex';
    if(document.body.style.flexDirection === 'row-reverse') {
        const rec = document.querySelector('.record.fat');
        if(rec) rec.className = 'record thin';
    }
};

const hideRecord = () => {
    document.getElementById('recordcontainer').style.display = 'none';
    const toggle = document.getElementById('recordtoggle');
    const othertoggle = document.getElementById('viewertoggle');
    const rotator = document.getElementById('rotator');
    toggle.textContent = '<';
    toggle.title = 'show text';
    othertoggle.style.display = 'none';
    rotator.style.display = 'none';
    //TSTViewer.refreshMirador(_state.mirador,_state.manifest, _state.curImage);
};

const showRecord = () => {
    document.getElementById('recordcontainer').style.display = 'flex';
    const toggle = document.getElementById('recordtoggle');
    const othertoggle = document.getElementById('viewertoggle');
    const rotator = document.getElementById('rotator');
    toggle.textContent = '>';
    toggle.title = 'hide text';
    othertoggle.style.display = 'flex';
    rotator.style.display = 'flex';
    //TSTViewer.refreshMirador(_state.mirador,_state.manifest, _state.curImage);
};

const TSTViewer = Object.freeze({
    init: init,
    newMirador: MiradorWrapper.start,
    killMirador: (which) => {
        const win = which || _state.mirador;
        if(win) MiradorWrapper.kill(win);
    },
    getMirador: () => _state.mirador,
    getMiradorCanvasId: MiradorWrapper.getMiradorCanvasId,
    refreshMirador: MiradorWrapper.refresh,
    jumpToId: MiradorWrapper.jumpToId,
    setAnnotations: MiradorWrapper.setAnnotations
});

export { TSTViewer };
