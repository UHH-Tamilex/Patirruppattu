var Transliterate;
const setTransliterator = (obj) => Transliterate = obj;

const _state = {
    scrollTimeout: null,
    switchReadingTimeout: null
};

const nextSibling = (node) => {
    let start = node;
    while(start) {
        const sib = start.nextSibling;
        if(sib) return sib;
        else start = start.parentElement; 
    }
    return null;
};
/*
const nextTextNode = (start) => {
    let next = nextSibling(start);
    while(next) {
        if(next.nodeType === 3) return next;
        else next = next.firstChild || nextSibling(next);
    }
    return null;
};

const prevSibling = (node) => {
    let start = node;
    while(start) {
        const sib = start.previousSibling;
        if(sib) return sib;
        else start = start.parentElement; 
    }
    return null;
};

const prevTextNode = (start) => {
    let prev = prevSibling(start);
    while(prev) {
        if(prev.nodeType === 3) return prev;
        else prev = prev.lastChild || prevSibling(prev);
    }
    return null;
};
*/
const countpos = (str, pos) => {
    if(pos === 0) {
        return str[0].match(/[\u00AD\s]/) ? 1 : 0;
    }
    let realn = 0;
    for(let n=0;n<str.length;n++) {
        if(realn === pos) {
            if(str[n].match(/[\u00AD\s]/))
                return n+1;
            else 
                return n;
        }
        if(str[n].match(/[\u00AD\s]/) === null)
           realn = realn + 1;
    }
    return str.length;
};

const findEls = (range) => {
    const container = range.cloneContents();
    if(container.firstElementChild) return true;
    return false;
};

const getIgnoreTags = par => {
    const ignorediv = par.querySelector('.ignoredtags');
    if(!ignorediv) return new Set();
    return new Set(
        [...ignorediv.querySelectorAll('.tagselector')].map(el => el.textContent)
    );
};

const delayedScrollIntoView = (target,listentarget) => {
    clearTimeout(_state.scrollTimeout);
    _state.scrollTimeout = setTimeout(() => {
        target.scrollIntoView({behavior: 'smooth', block: 'nearest', container: 'nearest'});
    },500);
    listentarget.addEventListener('mouseleave',() => clearTimeout(_state.scrollTimeout),{once: true});
};

const highlight = {
    inline(targ) {
        const par = targ.closest('div.text-block');
        if(!par) return;
	// TODO: deprecate lem-anchor
	const leftsel = targ.closest('.lem-anchor') ?
		'.lem-anchor' :
        	'.lem-inline:not(.lem-following, .lem-anchor)';
	const rightsel = targ.closest('.lem-anchor') ? 
		'.lem-anchor' :
		':scope > .app > .lem .rdg-text';

        if(targ.dataset.hasOwnProperty('lemmaId')) {
            const lemmaId = targ.dataset.lemmaId;
            const others = [...par.querySelectorAll(`.lem-inline[data-lemma-id="${lemmaId}"]`)];
            for(const other of others)
                other.classList.add('highlit');
            if(targ.classList.contains('lem-following'))
                targ = others[0];
        }
        const allleft = [...par.querySelectorAll(leftsel)];
        const pos = allleft.indexOf(targ);
        const right = par.parentElement.querySelector('.apparatus-block');
        const allright = right.querySelectorAll(rightsel);
        const el = allright[pos];
        el.classList.add('highlit');
        delayedScrollIntoView(el,targ);
    },
    apparatus(targ) {
        const par = targ.closest('div.apparatus-block');
        if(!par) return;

	// TODO: deprecate lem-anchor
	const leftsel = targ.closest('.lem-anchor') ?
		'.lem-anchor' :
        	'.lem-inline:not(.lem-following, .lem-anchor)';
	const rightsel = targ.closest('.lem-anchor') ? 
		'.lem-anchor' :
		':scope > .app > .lem:not(.lem-anchor)';

        const left = par.parentElement.querySelector('.text-block'); // or .edition?
        if(targ.dataset.loc) {
            const ignoretags = getIgnoreTags(par);
            if(document.getElementById('transbutton').lang === 'en') {
                Transliterate.revert(left);
            }
            const els = highlightCoords(targ,left,ignoretags);
            const el = Array.isArray(els[0]) ? els[0][0] : els[0];
            delayedScrollIntoView(el,targ);
            if(document.getElementById('transbutton').lang === 'en') {
                Transliterate.refreshCache(left);
                Transliterate.activate(left);
            }
        }
        else {
            const allright = [...par.querySelectorAll(rightsel)];
            const pos = allright.indexOf(targ);
            const allleft = left.querySelectorAll(leftsel);
            if(allleft.length !== 0) {
               const el = allleft[pos];
               el.classList.add('highlit');
               delayedScrollIntoView(el,targ);
            }
        }
    },
};
/*
const suggestLemmata = (lemma, par) => {
    if(document.getElementById('transbutton').lang === 'en') {
        Transliterate.revert(par);
    }
    const haystack = par.textContent.replaceAll('\u00AD','');
    const re = new RegExp(lemma.dataset.text.replaceAll(/\s/g,'\\s+'),'g');
    let res = re.exec(haystack);
    const coords = [];
    while(res !== null) {
        coords.push([res.index,res.index + res[0].length]);
        res = re.exec(haystack);
    }
    const ranges = [];
    for(const coord of coords) {
        ranges.push([highlightcoord(coord, lemma, par, permalightrange),coord]);
    }
    if(document.getElementById('transbutton').lang === 'en') {
        Transliterate.refreshCache(par);
        Transliterate.activate(par);
    }
    for(const range of ranges) showRangeCoords(...range);
};

const getOffset = (el) => {
    const rect = el.getBoundingClientRect();
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    return {top: rect.top + scrollTop, left: rect.left + scrollLeft};
};
const showRangeCoords = (startel,coord) => {
        const placement = getOffset(startel);
        const tBox = document.createElement('div');
        const tBoxDiv = document.createElement('div');
        tBox.className = 'coord-suggestion';
        document.body.appendChild(tBox);

        tBox.style.top = (placement.top - 35) + 'px';
        tBox.style.left = placement.left + 'px';
        tBoxDiv.append(coord.join(','));
        tBox.appendChild(tBoxDiv);

        tBox.animate([
            {opacity: 0 },
            {opacity: 1, easing: 'ease-in'}
            ], 200);
};
*/

/**
 * @param {Array.<int[]>} positions - array of [start,end]
 * @param {string} lem
 * @param {DOMElement} target
 * @param {Set} ignoretags
 * @returns {Array.<Range>}
 */
const rangesFromCoords = (positions, target, ignoretags=new Set()) => {
    const realNextSibling = (walker) => {
        let cur = walker.currentNode;
        while(cur) {
            const sib = walker.nextSibling();
            if(sib) return sib;
            cur = walker.parentNode();
        }
        return null;
    };
    
    const retRanges = [];

    let curRange = document.createRange();
    positions = [...positions];
    let curPositions = positions.shift();
    
    /*
     * returns false if not finished; true if finished
     */
    const checkNode = (start, end, cur) => {
        if(!started && curPositions[0] <= end) {
            const realpos = countpos(cur.data,curPositions[0]-start);
            // TODO: if realpos === cur.data.length, move to beginning of next node
            // then if next node starts with a space, +1
            // then if the node consists only of spaces, move again to beginning of next node
            curRange.setStart(cur,realpos);
            started = true;
        }
        if(!started) return false;
        if(curPositions[1] <= end) {
            const realpos = countpos(cur.data,curPositions[1]-start);
            if(cur.data[realpos-1] === ' ')
                curRange.setEnd(cur,realpos-1);
            else
                curRange.setEnd(cur,realpos);

            retRanges.push(curRange);

            if(positions.length === 0)
                return true;

            curPositions = positions.shift();
            curRange = document.createRange();
            started = false;
            return checkNode(start,end,cur);
        }
    };
    const walker = document.createTreeWalker(target,NodeFilter.SHOW_ALL, { acceptNode() {return NodeFilter.FILTER_ACCEPT;}});
    let start = 0;
    let started = false;
    //let last;
    let cur = walker.nextNode();
    while(cur) {
        if(cur.nodeType === 1) {
            if(cur.classList.contains('choiceseg') && 
               cur !== cur.parentNode.firstChild) {

                cur = realNextSibling(walker);
                continue;
            }
            
            if(cur.classList.contains('ignored') || ignoretags.has(cur.dataset.teiname)) {
                cur = realNextSibling(walker);
                continue;
            }
        }
        
        else if(cur.nodeType === 3) {
            const nodecount = cur.data.trim().replaceAll(/[\s\u00AD]/g,'').length;
            const end = start + nodecount;
            
            const done = checkNode(start,end,cur);
            if(done) break;

            start = end;
            //last = cur;
        }
        cur = walker.nextNode();
    }
    //if(range.collapsed) range.setEnd(last,last.data.length);
    // shouldn't need this
    return retRanges;
};

const highlightrange = (range,classname = 'highlit temporary') => {
    if(range.toString().trim() === '') return; // avoid highlighting blank spaces/lines

    const lemma = document.createElement('span');
    lemma.className = classname;
    lemma.append(range.extractContents());

    range.insertNode(lemma);
    lemma.lang = lemma.parentElement.lang;
    return lemma;
};

const permalightrange = (range) => highlightrange(range,'permalit temporary');

const highlightCoords = (lem,target,ignoretags,highlightfn = highlightrange) => {
    const alignment = target.dataset.alignment?.split(',');
    const multiple = lem.dataset.loc.split(';').map(str => {
        const split = str.split(',');
        if(alignment) {
            return [matchCounts(alignment,parseInt(split[0]),'start'),
                    matchCounts(alignment,parseInt(split[1]),'end')];
        }
        return split;
    });
    const ranges = rangesFromCoords(multiple, target, ignoretags);
    return highlightRanges(ranges,target,highlightfn);
};


const markLemmata = (par = document) => {

    let lemmaid = 0;

    const markLemmaRange = range => highlightrange(range,'lem-inline');
    // TODO: this doesn't support xx,xx;xx,xx anymore 
    const doOne = (lemmata,left,ignoretags,alignment) => {
        const parsed = [...lemmata].map(el => {
            const split = el.dataset.loc.split(',');
            if(alignment) {
                return [matchCounts(alignment,parseInt(split[0]),'start'),
                        matchCounts(alignment,parseInt(split[1]),'end')];
            }
            return split;
        });
        const ranges = rangesFromCoords(parsed, left, ignoretags);
        const highlit = highlightRanges(ranges,left,markLemmaRange);
        for(const els of highlit) {
            if(Array.isArray(els)) {
                for(let n=0;n < els.length;n++) {
                    els[n].dataset.lemmaId = lemmaid; 
                    if(n > 0) els[n].classList.add('lem-following');
                }
                lemmaid = lemmaid + 1;
            }
        }
    };

    const apparati = par.querySelectorAll('div.apparatus-block');
    for(const apparatus of apparati) {

        const lemmata = apparatus.querySelectorAll('.lem[data-loc]');
        if(lemmata.length === 0) continue;
        const left = apparatus.parentElement.querySelector('.text-block');
        const ignoretags = getIgnoreTags(apparatus);
        const alignment = left.dataset.alignment?.split(',');
        doOne(lemmata,left,ignoretags,alignment);
    }
};

const wrongSeg = (txtnode) => {
    const ignored = txtnode.parentNode.closest('.ignored');
    if(ignored) return ignored;
    const el = txtnode.parentNode.closest('.choiceseg');
    return el && el !== el.parentNode.firstChild;
};

const matchCounts = (alignment,m,pos='start') => {
    let matchcount = 0;
    for(let n=0;n<alignment[0].length;n++) {
        if(matchcount === m) {
            if(pos === 'start' && alignment[0][n] === 'G') n = n + 1; // |vēḻa_|vēṇ|, |vēḻam|veḷ|

            const line2 = alignment[1].slice(0,n);
            const matches = [...line2].reduce((acc, cur) => cur === 'M' ?  acc + 1 : acc,0);
            return matches;
        }
        if(alignment[0][n] === 'M') matchcount = matchcount + 1;
    }
    
    // no match; go to end of the block
    const matches = [...alignment[1]].reduce((acc, cur) => cur === 'M' ?  acc + 1 : acc,0); //-1;
    // why was there -1 here??
    return matches;
};

const highlightRanges = (ranges, target, highlightfn) => {
    const ret = [];
    for(const range of ranges.toReversed()) { //TODO: toReversed() is still needed for adjacent ranges
        if(!findEls(range)) {
            const el = highlightfn(range);
            ret.push(el);
            continue;
        }

        const toHighlight = [];
        const start = (range.startContainer.nodeType === 3) ?
            range.startContainer :
            range.startContainer.childNodes[range.startOffset];

        const end = (range.endContainer.nodeType === 3) ?
            range.endContainer :
            range.endContainer.childNodes[range.endOffset-1];

        if(start.nodeType === 3 && range.startOffset !== start.length && !wrongSeg(start)) {
            const textRange = document.createRange();
            textRange.setStart(start,range.startOffset);
            textRange.setEnd(start,start.length);
            toHighlight.push(textRange);
        }
        
        const getNextNode = (n) => n.firstChild || nextSibling(n);

        for(let node = getNextNode(start); node !== end; node = getNextNode(node)) {
            if(node.nodeType === 3 && !wrongSeg(node)) {
                const textRange = document.createRange();
                textRange.selectNode(node);
                toHighlight.push(textRange);
            }
        }

        if(end.nodeType === 3 && range.endOffset > 0 && !wrongSeg(end)) {
            const textRange = document.createRange();
            textRange.setStart(end,0);
            textRange.setEnd(end,range.endOffset);
            toHighlight.push(textRange);
        }
        
        //const firsthighlit = highlightfn(toHighlight.shift());
        
        const nodearr = [];
        for(const hiNode of toHighlight) {
            const node = highlightfn(hiNode);
            if(node) nodearr.push(node); // highlightrange returns undefined if range is empty
        }
        if(nodearr.length > 1) ret.push(nodearr);
        else ret.push(nodearr[0]);
    }

    target.normalize();

    return ret;
};

const unhighlight = (targ) => {
    let highlit = /*par*/document.querySelectorAll('.highlit');
    if(highlit.length === 0) return;
    
    targ = targ ? targ.closest('div.wide') : highlit[0].closest('div.wide');
    const par = targ.querySelector('.text-block'); // or .edition?
    if(!par) return;
    
    if(document.getElementById('transbutton').lang === 'en') {
        Transliterate.revert(par);
        highlit = document.querySelectorAll('.highlit'); // in case things changed (via jiggle)
    }
    
    for(const h of highlit) {
        if(h.classList.contains('temporary')) {
            while(h.firstChild)
                h.after(h.firstChild);
            h.remove();
        }
        else h.classList.remove('highlit');
    }
    par.normalize();
    Transliterate.refreshCache(par);
    
    if(document.getElementById('transbutton').lang === 'en')
        Transliterate.activate(par);
};

const unpermalight = () => {
    const highlit = /*par*/document.querySelectorAll('.permalit');
    if(highlit.length === 0) return;
    
    const targ = highlit[0].closest('div.wide');
    const par = targ.querySelector('.text-block'); // or .edition?
    if(!par) return;
    if(document.getElementById('transbutton').lang === 'en') {
        Transliterate.revert(par);
    }
    for(const h of highlit) {
        if(h.classList.contains('temporary')) {
            while(h.firstChild)
                h.after(h.firstChild);
            h.remove();
        }
        else h.classList.remove('permalit');
    }
    par.normalize();
    Transliterate.refreshCache(par);
    if(document.getElementById('transbutton').lang === 'en') {
        Transliterate.activate(par);
    }
};

const switchReading = el => {
    if(el.querySelector('.rdg-alt')) return;
    const par = el.closest('.lem') || el.closest('.rdg');
    const id = el.dataset.id;
    const rdgalt = par.querySelector(`.rdg-alt[data-wit~="${id}"]`).cloneNode(true);
    rdgalt.style.display = 'inline';
    el.appendChild(rdgalt);
};

const restoreReading = par => {
    clearTimeout(_state.switchReadingTimeout);
    par.querySelector('.rdg-alt')?.remove();
};

const Events = { 
    docMouseover(e) {
        const lem_inline = e.target.closest('.lem-inline');
        if(lem_inline) {
            highlight.inline(lem_inline);
            return;
        }
        const msid = e.target.closest('.mshover');
        if(msid) {
            clearTimeout(_state.switchReadingTimeout);
            _state.switchReadingTimeout = setTimeout(() => {
                switchReading(msid);
            },350);
            msid.addEventListener('mouseleave',restoreReading.bind(null,msid),{once: true});
        }
        const lem = e.target.closest('.rdg-text')?.closest('.lem');
        if(lem) {
            highlight.apparatus(lem);
            return;
        }
	// TODO: deprecate lem-anchor
	const lem_anchor = e.target.closest('.lem.lem-anchor');
	if(lem_anchor) {
	    highlight.apparatus(lem_anchor);
	    return;
	}
        const anchor = e.target.closest('.anchor');
        if(anchor) {
            const note = document.querySelector(`[data-target='#${anchor.id}']`);
            if(note) {
                anchor.classList.add('highlit');
                note.classList.add('highlit');
                anchor.addEventListener('mouseout',() => {
                    anchor.classList.remove('highlit');
                    note.classList.remove('highlit');
                },{once: true});
                delayedScrollIntoView(note,anchor);
            }
        }
        const note = e.target.closest('.anchored-note');
        if(note) {
            const anchor = document.getElementById(note.dataset.target.replace(/^#/,''));
            if(anchor) {
                anchor.classList.add('highlit');
                note.classList.add('highlit');
                note.addEventListener('mouseout',() => {
                    anchor.classList.remove('highlit');
                    note.classList.remove('highlit');
                },{once: true});
                delayedScrollIntoView(anchor,note);
            }
        }
    },

    docMouseout(e) {
        if(e.target.closest('.lem') ||
           e.target.closest('.lem-inline'))
            unhighlight(e.target);
    },
    docClick(e) {
        const msid = e.target.closest('.mshover');
        if(msid) restoreReading.bind(msid);
	/*
        for(const tooltip of document.querySelectorAll('.coord-suggestion'))
            tooltip.remove();
        unpermalight(); 


        const targ = e.target.closest('.lemmalookup');
        if(!targ) return;
        const par = targ.closest('div.apparatus-block');
        if(!par) return;
        const left = par.parentElement.querySelector('.text-block');
        const lemma = targ.nextSibling;
        suggestLemmata(lemma,left);
	*/
    },
    toggleApparatus() {
        const apparatussvg = document.getElementById('apparatussvg');
        const translationsvg = document.getElementById('translationsvg');
        const apparati = document.querySelectorAll('.apparatus-block');

        if(!translationsvg.checkVisibility()) {
            for(const apparatus of apparati) {
                //apparatus.previousElementSibling.style.width = '60%';
                apparatus.parentNode.querySelector('.edition').classList.remove('nolemmata');
                const translation = apparatus.parentNode.querySelector('.translation');
                if(translation) translation.classList.add('hidden');
                apparatus.classList.remove('hidden');
            }
            apparatussvg.style.display = 'none';
            translationsvg.style.display = 'block';
            translationsvg.parentNode.dataset.anno = 'translation';
        }
        else {
            for(const apparatus of apparati) {
                //apparatus.previousElementSibling.style.width = 'unset';
                apparatus.parentNode.querySelector('.edition').classList.add('nolemmata');
                const translation = apparatus.parentNode.querySelector('.translation');
                if(translation) translation.classList.remove('hidden');
                apparatus.classList.add('hidden');
            }
            translationsvg.style.display = 'none';
            apparatussvg.style.display = 'block';
            translationsvg.parentNode.dataset.anno = 'apparatus of variants';
        }
    }
};

const init = () => {
    document.addEventListener('mouseover',Events.docMouseover);
    document.addEventListener('mouseout',Events.docMouseout);
    document.addEventListener('click',Events.docClick);
    
    markLemmata();
    const apparatusbutton = document.getElementById('apparatusbutton');
    if(apparatusbutton) {
        apparatusbutton.addEventListener('click',Events.toggleApparatus);
        if(document.querySelector('.apparatus-block.hidden'))
            apparatusbutton.style.display = 'block';
    }

    // listen for refresh events
    (new BroadcastChannel('apparatus')).addEventListener('message', e => {
        markLemmata(document.getElementById(e.data.id));
    });
};

const ApparatusViewer = {
    init: init,
    setTransliterator: setTransliterator,
};

export { ApparatusViewer };
