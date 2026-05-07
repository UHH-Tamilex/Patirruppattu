import xmlFormat from './xml-formatter.mjs';
import Sanscript from '../js/sanscript.mjs';

const logger = {};
logger.entries = [];
logger.clear = () => logger.entries = [];
logger.log = str => {
  logger.entries.push(str);
  !window.alert ? console.log(str) : alert(str);
};

const mergeGroups = doc => {
    const els = doc.querySelectorAll('cl');
    for(const el of els) {
        if(!el.firstElementChild) { // shouldn't happen, but oh well
          el.parentNode.removeChild(el);
          continue;
        } 
        let ignorethis = el.firstElementChild.hasAttribute('ignored');
        const firstw = el.removeChild(el.firstElementChild);
        while(el.firstElementChild) {
            const nextw = el.firstElementChild;

            if(ignorethis && !nextw.hasAttribute('ignored')) ignorethis = false;

            const norm1 = firstw.hasAttribute('lemma') ? 
                firstw.getAttribute('lemma') : firstw.textContent;
            const norm2 = nextw.hasAttribute('lemma') ?
                nextw.getAttribute('lemma') : nextw.textContent;
            firstw.setAttribute('lemma',norm1 + norm2);
            while(nextw.firstChild)
                firstw.appendChild(nextw.firstChild);
            nextw.remove();
        }
        if(firstw.getAttribute('lemma') === firstw.textContent)
            firstw.removeAttribute('lemma');
        if(ignorethis) firstw.setAttribute('ignored','1');
        el.parentNode.insertBefore(firstw,el);
        el.parentNode.removeChild(el);
    }
};

const cleanupGroups = base => {
    const ws = base.querySelectorAll('w');
    if(ws.length === 1) return;

    const toadd = [];
    for(const w of ws) {
        if(w.getAttribute('lemma')?.trim() === '' || w.textContent.trim() === '') {
            toadd.push(w.getAttribute('n'));
        }
    }
    toadd.reverse();
    const doc = base.ownerDocument;
    for(const num of toadd) {
        const wws = doc.querySelectorAll(`w[n="${num}"]`);
        for(const ww of wws) {
            const prev = ww.previousElementSibling;
            const next = ww.nextElementSibling;
            const neighbour = prev || next;
            if(!neighbour) continue; // i.e., if the whole block is empty in the base text

            const norm1 = neighbour.hasAttribute('lemma') ? 
                neighbour.getAttribute('lemma') : neighbour.textContent;
            const norm2 = ww.hasAttribute('lemma') ?
                ww.getAttribute('lemma') : ww.textContent;

            if(prev)
                prev.setAttribute('lemma',norm1 + norm2);
            else
                next.setAttribute('lemma',norm2 + norm1);

            while(ww.firstChild)
                if(prev) prev.appendChild(ww.firstChild);
                else next.prepend(ww.firstChild);
            ww.remove();

            if(neighbour.getAttribute('lemma') === neighbour.textContent)
                neighbour.removeAttribute('lemma');
        }
    }
    const els = doc.querySelectorAll('cl');
    for(const el of els) {
        const firstw = el.removeChild(el.firstElementChild);
        while(el.firstElementChild) {
            const norm1 = firstw.hasAttribute('lemma') ? 
                firstw.getAttribute('lemma') : firstw.textContent;
            const norm2 = el.firstElementChild.hasAttribute('lemma') ?
                el.firstElementChild.getAttribute('lemma') : el.firstElementChild.textContent;
            firstw.setAttribute('lemma',norm1 + norm2);
            while(el.firstElementChild.firstChild)
                firstw.appendChild(el.firstElementChild.firstChild);
            el.firstElementChild.remove();
        }
        if(firstw.getAttribute('lemma') === firstw.textContent)
            firstw.removeAttribute('lemma');
        el.parentNode.insertBefore(firstw,el);
        el.parentNode.removeChild(el);
    }
};

const makeSorter = order => {
    return (a,b) => {
        const aindex = typeof a === 'string' ? 
				order.indexOf(a) :
				order.indexOf(a.getAttribute('n'));
        if(aindex === -1) return 0;
        const bindex = typeof b === 'string' ?
			order.indexOf(b) :
			order.indexOf(b.getAttribute('n'));
        if(bindex === -1) return 0;
        return aindex < bindex ? -1 : 1; 
    };
};

const getWitList = (doc, opts, arr) => {
    //const sorter = opts.sorter;
    const idsel = opts.idsel;
    const noformat = opts.noformat || false;
    const attr = opts.attr || 'wit';
    const mustcontain = opts.mustcontain || new Set();
    const listWit = doc.querySelector('listWit');
    const wits = new Set(arr);
    const newwits = new Set();
    for(const wit of wits) {
        const witel = listWit.querySelector(`witness[${idsel}="${wit}"]`);
        if(!witel) continue; // for reconstructed nodes
        const type = witel.getAttribute('n');
        const select = witel.hasAttribute('select');
        const par = witel.parentNode.closest('witness');
        const parid = par?.getAttribute('xml:id');
        const other = parid && type === 'ac' ? 
                par.querySelector('witness[n="pc"]')?.getAttribute('xml:id') :
                      parid && (type == 'pc'  || select) ?
                par.querySelector('witness[n="ac"]')?.getAttribute('xml:id') : null;

        if(select) {
            if( !mustcontain.has(wit) &&
                parid && 
                (wits.has(parid) || wits.has(other))
              ) 
                continue;
            else newwits.add(wit);
        }
        else if(other && wits.has(other) && !mustcontain.has(wit) && !mustcontain.has(other)) { 
                newwits.add(parid);
        }
        else newwits.add(wit);
    }
	
	let witarr;
	if(opts.witgroups) {
		findGroups(opts.witgroups, newwits, mustcontain);
		if(opts.sorter) witarr = [...newwits].sort(opts.sorter);
		else witarr = [...newwits];
	}
	else witarr = [...newwits];

    if(noformat)
        return witarr;

    if(witarr.length === 0)
        return '';

    return `${attr}="${witarr.map(w => '#' + w).join(' ')}"`;
};

const findGroups = (groups,witSet,mustcontain = new Set()) => {
    for(const group of groups) {
		if(!isDisjointFrom(group.children, mustcontain))
			continue;
		if(isSuperset(witSet,group.children)) {
			for(const el of group.children) witSet.delete(el);
			witSet.add(group.id);
		}
    }
};

const isSuperset = (set, subset) => {
	if(set.isSupersetOf !== undefined)
		return set.isSupersetOf(subset);
	for(const el of subset)
		if(!set.has(el)) return false;
	return true;
};

const isDisjointFrom = (s1, s2) => {
	if(s1.isDisjointFrom !== undefined)
		return s1.isDisjointFrom(s2);
	for(const el of s1)
		if(s2.has(el)) return false;
	return true;
};

const curry = f => {
    return a => {
        return b => {
            return c => {
                return f(a,b,c);
            };
        };
    };
};

/*
const fetchFile = async fn => {
    const response = await fetch(fn);
    const str = await response.text();
    return str;
};
const loadOtherTEI = async (listWit) => {
    const files = new Map();
    const wits = new Map();
    for(const witel of listWit.querySelectorAll('witness')) {
        const filename = witel.closest('[source]').getAttribute('source');
        if(!files.has(filename)) files.set(filename,parseString(await fetchFile(filename),filename));

        wits.set(witel.getAttribute('xml:id'), {
            file: files.get(filename),
            type: witel.getAttribute('type'),
            subtype: witel.getAttribute('subtype')
        });
    }

    return wits;
};

const getStart = (el, n) => {
    const ws = el.querySelectorAll('w');
    let ret = 0;
    for(const w of ws) {
       if(w.getAttribute('n') === 'n') break;
       ret = ret + w.textContent.length;
    }
    return ret;
};

const getTEIRdg = (witfile, blockid, positions) => {
    const block = witfile.file.querySelector(`[*|id="${blockid}"], [corresp="#${blockid}"]`);
    const type = witfile.type;
    const subtype = witfile.subtype;

    const walker = block.ownerDocument.createTreeWalker(block,NodeFilter.SHOW_ALL, { acceptNode() {return NodeFilter.FILTER_ACCEPT;}});
    let start = 0;
    let started = false;
    const range = new Range();

    while(walker.nextNode()) {
        const cur = walker.currentNode;

        if(cur.nodeType === 1) {
            if(cur.nodeName === 'lem' && type && type !== 'ac' && type !== 'pc') continue;
            if(cur.nodeName === 'add' && type === 'ac') continue;
            if(cur.nodeName === 'del' && type !== 'ac') continue;
            if(cur.nodeName === 'rdg' && !cur.getAttribute('wit').split(' ').includes(subtype)) continue;
        }
        
        else if(cur.nodeType === 3) {
            const nodecount = cur.data.length;
            const end = start + nodecount;
            if(!started && positions[0] <= end) {
                const realpos = positions[0]-start;
                range.setStart(cur,realpos);
                started = true;
            }
            if(positions[1] <= end) {
                const realpos = positions[1]-start;
                range.setEnd(cur,realpos);
                break;
            }
            start = end;
        }
    }
    const div = document.createElement('div');
    div.appendChild(range.cloneContents());
    return div.innerHTML.trim();
};

const getTEIRdgs = (rdgs,blockid,witdocs,alignment,dataN) => {
    const newrdgs = new Map();
    for(const [rdg,wits] of rdgs) {
        for(const wit of wits) {
            const witfile = witdocs.get(wit);
            const row = alignment.querySelector(`TEI[n="${wit}"] text`);
            const startcount = getStart(row,dataN);
            const endcount = startcount + rdg.length;
            console.log(`${wit}, ${rdg}`);
            const xmlrdg = getTEIRdg(witfile,blockid,[startcount,endcount]);
            
            const newentry = newrdgs.get(xmlrdg) || [];
            newentry.push(wit);
            newrdgs.set(xmlrdg,newentry);
        }
    }
    return newrdgs;
};
*/

const getWitOrder = el => {
    return [...el.querySelectorAll('witness')].map(w => w.getAttribute('xml:id'));
};

const formatReading = str => {
    if(!str) return ''; // if the whole reading is empty
    return str.replace(/‡+/g,(match) => `<gap reason="lost" quantity="${match.length}"/>`);
    // TODO: deal with akṣaras, lines, etc.
};

const cleanPunct = (str,posonly = false) => {
    let endpunct = str.search(/\s*[.,:!?|\-–—―\d\s\/]+$/);
    if(endpunct === -1) // don't mess up XML enttites
      endpunct = str.search(/(?<!&[\d\w]+);$/);
    // if endpunct is 0, it means the whole lemma was punctuation, so we want to keep it
    if(posonly) return endpunct > 0 ? endpunct : str.length;
    return endpunct > 0 ?
        str.slice(0,endpunct) :
        str;
};

const processReadings = (n,otherdocs,otherrdgs,word,opts) => {

    const lemmatrimmed = cleanPunct(word.textContent).trimLeft();
    const lemma = opts.normlem ? 
        (word.getAttribute('lemma') || lemmatrimmed) :
        lemmatrimmed;

    const posapp = {all: new Set(), minor: new Map()};
    const negapp = new Map();
    for(const otherdoc of otherdocs) {
        const id = otherdoc.getAttribute('n');
        const otherword = otherdoc.querySelectorAll('w')[n];

        if(otherword.hasAttribute('ignored')) continue;

        const trimmed = cleanPunct(otherword.textContent);
        const normattr = otherword.getAttribute('lemma');
        const normword = normattr ? normattr : trimmed;

        const newstr = opts.normlem ? normword : trimmed;

        if(newstr === lemma) {
            posapp.all.add(id);
            const realrdg = opts.witnesses && otherrdgs.get(id)?.length ? 
                cleanPunct(otherrdgs.get(id)[n]) :
                trimmed;
            if(realrdg !== lemmatrimmed) {
                const minorwits = posapp.minor.get(realrdg) || [];
                minorwits.push(id);
                posapp.minor.set(realrdg,minorwits);
            }
        }
        else {
            const realrdg = opts.witnesses && otherrdgs.get(id) ? 
                otherrdgs.get(id)[n] :
                trimmed;
            const negwits = negapp.get(newstr) || new Map();
            const negrdg = negwits.get(realrdg) || [];
            negrdg.push(id);
            negwits.set(realrdg,negrdg);
            negapp.set(newstr,negwits);
        }
    }
    return [posapp, negapp];
};

const formatMinorReadings = (arr,doc,witlistopts) => {
    const curriedWitList = curry(getWitList)(doc)({...witlistopts, noformat: true });
    const allwits = new Set();
    const attr = witlistopts.attr || 'wit';
    let rdgstr = '';
    for(const e of arr) {
        const ret = curriedWitList(e[1]);
        for(const wit of ret) allwits.add(wit);
        const attrstr = `${attr}="${[...ret].map(w => '#' + w).join(' ')}"`;
        rdgstr = rdgstr +  `<rdg type="minor" ${attrstr}>${e[0]}</rdg>`;
    }
    return {wits: allwits, rdgstr: rdgstr};
};

const processLem = (word, posapp, doc, witlistopts) => {

    const cleanlem = cleanPunct(word.innerHTML);

    const negapp = posapp.minor;
    if(negapp.size === 0) {
        const poswits = getWitList(doc,witlistopts,posapp.all);
        return  `  <lem ${poswits}>${cleanlem}</lem>\n`;
    }

    const curriedWitList = curry(getWitList)(doc)(witlistopts);
    const poswits = getWitList(doc,
        {...witlistopts,
             attr: 'select',
        },posapp.all);
    let app = `<rdgGrp type="lemma"${poswits}>\n<lem>${cleanlem}</lem>\n`;

    for(const rdg of [...negapp]) {
        const rdgarr = [...rdg];
        const {wits: minorwits, rdgstr: minorrdgs} = formatMinorReadings([rdgarr],doc,witlistopts);
            app = app + `  ${minorrdgs}\n`;
    }
    app = app + '<\/rdgGrp>';
    return app;
};

const cleanReading = (doc,str,ignoretags) => {
    const temp = doc.createElement('temp');
    temp.innerHTML = str;
    if(ignoretags.size > 0) {
        for(const tag of temp.querySelectorAll([...ignoretags].join(','))) {
            tag.remove();
        }
    }
    for(const tag of temp.querySelectorAll('[break="no"]')) {
        const prev = tag.previousSibling;
        if(prev.nodeType === 3) // TODO: find previous text node
            prev.data = prev.data.trimEnd();
    }
    /*
    const walker = doc.createTreeWalker(temp,4);
    let node = walker.nextNode();
    const reg = new RegExp('[()\\[\\],:;?!|¦_"“”‘’·\\-–—―=+\\d.\\/]+','g');
    while(node) {
        node.data = node.data.replaceAll(reg);
        node = walker.nextNode();
    }
    return temp.innerHTML;
    */
    const reg = new RegExp('[()\\[\\],:;?!|¦_"“”‘’·\\-–—―=+\\d.\\/]+','g');
    return temp.textContent.replaceAll(reg,'');
    //TODO: get puncuation regex from normalize.mjs
};

const processNegApp = (negapp, doc, witlistopts, ignoretags) => {
    const curriedWitList = curry(getWitList)(doc)(witlistopts);
    let app = '';
    //for(const [mainrdg, rdg] of [...negapp]) {
    for(const rdg of negapp.values()) {
        /*
        const newrdgs = getTEIRdgs(rdg,opts.blockid,witdocs,doc,dataN);
        const rdgstr = newrdgs.keys().next().value;
        const negwits = curriedWitList([...newrdgs.values()].flat());
        const allwits = [...newrdgs];
        */
        const rdgarr = [...rdg];
        
        if(rdgarr.length === 1) {
            const negwits = curriedWitList(rdgarr[0][1].flat());
            app = app + `  <rdg ${negwits}>${rdgarr[0][0]}</rdg>\n`;
        }
        else {
            const mainrdg = cleanReading(doc,rdgarr[0][0],ignoretags);
            //const rdgstr = formatReading(mainrdg);
            //const remainingrdgs = rdgarr.slice(1);
            const remainingrdgs = rdgarr.filter(e => e[0] !==  mainrdg);
            const {wits: minorwits, rdgstr: minorrdgs} = formatMinorReadings(remainingrdgs,doc,witlistopts);
            
            const negwits = getWitList(doc,
                 {...witlistopts,
                 attr: 'select',
                 //mustcontain: remainingrdgs.reduce((acc,cur) => acc.concat(cur[1]),[])
                 mustcontain: minorwits,
                },
                [...rdg.values()].flat()
            );
            app = app + `  <rdgGrp ${negwits}><rdg type="main">${mainrdg}</rdg>${minorrdgs}</rdgGrp>\n`;
        }
    }
    return app;
};

const realNextSibling = walker => {
    let cur = walker.currentNode;
    while(cur) {
        const sib = walker.nextSibling();
        if(sib) return sib;
        cur = walker.parentNode();
    }
    return null;
};

const removeContainer = el => {
    if(!el) return;
    while(el.firstChild)
        el.parentNode.insertBefore(el.firstChild,el);
    el.remove();
};

const getCollectives = (doc, sel, idsel = "*|id") => {
  const ret = [sel];
  const wit = doc.querySelector(`witness[${idsel}="${sel.replace(/^#/,'')}"]`);
  if(!wit) return ret;
  let par = wit.closest('[n="collective"]');
  while(par) {
    ret.push(`#${par.getAttribute('xml:id')}`);
    par = par.parentNode.closest('[n="collective"]');
  }
  return ret;
};

const findselector = (rdg,selectors) => {
    const wits = rdg.getAttribute('wit');
    if(!wits) return false;
    const candidates = wits.split(/\s+/);
    for(const selector of selectors)
      if(candidates.includes(selector)) return true;
    return false;
};

const reduceDuplicateWits = (arr,app) => {
  // first item in arr is the actual ms siglum, rest are collective sigla
  const allwits = [...app.querySelectorAll('[wit]')].reduce((acc,cur) => {
      for(const wit of cur.getAttribute('wit').split(/\s+/)) acc.add(wit);
      return acc;
      
    },new Set());
  for(const a of arr)
    if(allwits.has(a)) return [a];
  return arr;
};

const cleanBlock = (blockid,idsel,wit) => {
    const block = wit.parent ? 
      wit.xml.querySelector(`text[corresp="#${wit.parent}"] [corresp="#${blockid}"]`) :
      wit.xml.querySelector(`text[corresp="#${wit.name}"] [corresp="#${blockid}"], text[corresp="#${wit.name}"] [${idsel}="${blockid}"]`)?.cloneNode(true) || 
      wit.xml.querySelector(`text [corresp="#${blockid}"], text [${idsel}="${blockid}"]`)?.cloneNode(true);
    if(!block) return;
    for(const el of block.querySelectorAll('l, lg'))
        removeContainer(el);
    let gapid = 0;
    for(const gap of [...block.querySelectorAll('gap')]) {
        if(gap.getAttribute('reason') === 'ellipsis') continue;
        const quantity = parseInt(gap.getAttribute('quantity')) || 1;
        for(let n=1;n<quantity + 1;n++) {
            const newgap = gap.cloneNode(true);
            newgap.setAttribute('quantity',1);
            newgap.setAttribute('_gapid',gapid);
            newgap.textContent = '‡';
            gap.parentNode.insertBefore(newgap,gap);
        }
        gapid = gapid + 1;
        gap.remove();
    }
	
	for(const nobreak of block.querySelectorAll('pb[break="no"],lb[break="no"]')) {
		const prev = nobreak.previousSibling;
		if(!prev || prev.nodeType !== 3) continue;
		prev.data = prev.data.trimRight();
	}

    const pbunit = wit.xml.querySelector('supportDesc extent measure')?.getAttribute('unit');
    if(pbunit) {
        for(const pb of block.querySelectorAll('pb')) pb.setAttribute('type', pbunit);
    }

    const apps = block.querySelectorAll('app');
    const substs = block.querySelectorAll('subst');
    const dels = block.querySelectorAll('del');
    const adds = block.querySelectorAll('add');
    // TODO: jiggle vowels in subst
    for(const subst of substs) removeContainer(subst);

    if(wit.type) {
        for(const del of dels) {
            if(wit.type === 'pc') del.remove();
            if(wit.type === 'ac')  removeContainer(del);
        }
        for(const add of adds) {
            if(wit.type === 'ac') add.remove();
            if(wit.type === 'pc')  removeContainer(add);
        }
        for(const app of apps) {
            for(const rdg of app.querySelectorAll('rdg'))
                rdg.remove();
            removeContainer(app.querySelector('lem')); // <app><note/></app> will have no <lem>
            removeContainer(app);
        }
    }
    else if(wit.select) {
      const selectors = getCollectives(wit.xml,wit.select,idsel);
        for(const del of dels)
            del.remove();
        for(const add of adds)
            removeContainer(add);
        for(const app of apps) {
            const lem = app.querySelector('lem');
            const rdgs = app.querySelectorAll('rdg');
            const witaliases = selectors.length === 1 ? selectors :
              reduceDuplicateWits(selectors,app);
            let foundreading = false;
            for(const rdg of rdgs) {
                const found = findselector(rdg,witaliases);
                if(found)
                  foundreading = rdg;
                /*
                if(rdg.getAttribute('wit').split(/\s+/).includes(wit.select)) {
                    foundreading = rdg;
                }
                */
                else
                    rdg.remove();

            }
            if(foundreading) {
                lem.remove();
                removeContainer(foundreading);
            }
            else removeContainer(lem);
        }

        for(const app of apps) removeContainer(app);
    }
    else { // pc lemma reading
        for(const del of dels) del.remove();
        for(const add of adds) removeContainer(add);
        for(const app of apps) {
            for(const rdg of app.querySelectorAll('rdg'))
                rdg.remove();
            removeContainer(app.querySelector('lem'));
            removeContainer(app);
        }
    }
    block.normalize();
    return block;
};

const cleanText = (node, ignoretags) => {
  const blockclone = node.cloneNode(true);
  if(ignoretags.size > 0) {
      for(const tag of blockclone.querySelectorAll([...ignoretags].join(',')))
          tag.remove();
  }
  return blockclone.textContent.replaceAll(/\s+/g,' ').toLowerCase();
};

const checkAlignment = (words, block, ignoretags = []) => {
    const aligntext = words.reduce((acc,cur) => acc + cur.textContent,'');
                           //.replaceAll('‡','')
                           //.replaceAll(/\s+/g,' '); // for spaces around gaps
    const blocktext = cleanText(block,ignoretags);
    if(aligntext === blocktext) return true;
    console.log(aligntext);
    console.log(blocktext);
    return false;
};

const getXMLRdgs = (block, blockid, alignment, witname, ignoretags) => {
    if(!block) return;
    if(!block.firstChild) return;

    const doc = block.ownerDocument;
    const words = [...alignment.querySelectorAll('w')];

    if(!checkAlignment(words,block,ignoretags))
        logger.log(`${blockid}: ${witname} doesn't match alignment.`);

    const ranges = [];

    let start = 0;
    let end = 0;
    let prevspace = false;
    let curword = words.shift();
    let wordend = curword.textContent.length;//.replaceAll('‡','').length;
    let currange = doc.createRange();
    const walker = doc.createTreeWalker(block,0xFFFFFFFF);
    let node = walker.nextNode();
    currange.setStart(block.firstChild,0);
    mainLoop: while(node) {
        if(node.nodeType === 1) {
            if(ignoretags.has(node.nodeName)) {
                node = realNextSibling(walker); 
                continue;
            }
        }
        if(node.nodeType === 3) {
            node.data = Sanscript.t(node.data.replaceAll(/\s+/g,' '),'tamil','iast');
            let nodecount = node.data.length;
            if(prevspace) {
                if(node.data.startsWith(' ')) {
                    start = start - 1;
                }
                prevspace = false;
            }
            if(node.data.endsWith(' ')/* &&
               node.data !== ' '*/) // don't double count if the node is just one space
                prevspace = true;

            end = start + nodecount;
            while(wordend <= end) {
                currange.setEnd(node,wordend - start);
                ranges.push(serializeRange(doc, currange));
                /*
                const clone = currange.cloneContents();
                const temp = doc.createElement('temp');
                temp.appendChild(clone);
                ranges.push(temp.innerHTML.replaceAll(' xmlns="http://www.tei-c.org/ns/1.0"','').replaceAll(/\s+/g,' ').trim());
                */
                currange = doc.createRange();
                currange.setStart(node,wordend - start);
                curword = words.shift();
                if(!curword) break mainLoop;
                wordend = curword.textContent/*.replaceAll('‡','')*/.length + wordend;
            }
            start = end;
        }
        node = walker.nextNode();
    }
    if(wordend > end) { // catch leftover readings (not sure why this works)
        currange.setEndAfter(block.lastChild);
        ranges.push(serializeRange(doc, currange));
        /*
        const clone = currange.cloneContents();
        const temp = doc.createElement('temp');
        temp.appendChild(clone);
        ranges.push(temp.innerHTML.replaceAll(' xmlns="http://www.tei-c.org/ns/1.0"','').replaceAll(/\s+/g,' ').trim());
        */
    }
    return ranges;
};

const serializeRange = (doc, range) => {
    const clone = range.cloneContents();
    const nURI = doc.documentElement.namespaceURI;
    const temp = doc.createElementNS(nURI, 'ab');
    temp.appendChild(clone);
    for(const gap of temp.querySelectorAll('gap')) {
        const gapid = gap.getAttribute('_gapid');
        gap.removeAttribute('_gapid');
        let quantity = 1;
        while(gap.nextSibling && 
              gap.nextSibling.nodeName === 'gap' && 
              gap.nextSibling.getAttribute('_gapid') === gapid) {
            quantity = quantity + 1;
            gap.nextSibling.remove();
        }
        gap.setAttribute('quantity',quantity);
        gap.textContent = '';
    }

    // so that firstChild is <lb/>, etc. if there is one
    if(temp.firstChild?.nodeType === 3 && temp.firstChild.data.trim() === '')
      temp.firstChild.remove();

    // ignore initial line breaks, etc.
    while(temp.firstChild) {
      if(temp.firstChild.nodeType !== 1) break;
      if(temp.firstChild.nodeName === 'lb') temp.firstChild.remove();
      else if(temp.firstChild.nodeName === 'pb') temp.firstChild.remove();
      else if(temp.firstChild.nodeName === 'cb') temp.firstChild.remove();
      else if(temp.firstChild.nodeName === 'milestone') temp.firstChild.remove();
      else break;
    }
    //TODO: stripping namespaces like this is very hacky
    return temp.innerHTML.replaceAll(' xmlns="http://www.tei-c.org/ns/1.0"','').replaceAll(/\s+/g,' ').trim();
};

const collectWitGroups = listWit => {
	const findWitDepth = wit => {
		let ret = 0;
		let par = wit.parentNode.closest('witness');
		while(par) {
			ret = ret + 1;
            par = par.parentNode.closest('witness');
        }
		return ret;
	};
	const preRet = [];
	for(const group of listWit.querySelectorAll('witness[n="collective"]')) {
		//const wits = [...group.querySelectorAll(':scope > listWit > witness')].map(w => w.getAttribute('xml:id'));
		const wits = [...group.querySelectorAll('witness')].filter(w => !w.hasAttribute('n')).map(w => w.getAttribute('xml:id'));
		const depth = findWitDepth(group);
		preRet.push({id: group.getAttribute('xml:id'), children: new Set(wits), depth: depth});
	}
	return preRet.toSorted((a,b) => {
		return a.depth < b.depth ? -1 : 1;
	});
};

const markIgnoredGaps = (doc,base,maxlen) => {
  const teis = doc.querySelectorAll('TEI');
  const basews = base.querySelectorAll('w');

  const allgroups = [];

  for(const tei of teis) {
    if(tei === base) continue;
    const thisn = tei.getAttribute('n');
    const text = tei.querySelector('text');
    const ws = text.querySelectorAll('w');
    let curgroup = [];
    let curlen = 0;
    let groupstart = 0;
    let index = 0;
    for(let n=0;n<ws.length;n++) {
      const textlength = basews[n].textContent.length;
      const newindex = index + textlength;

      if(ws[n].textContent.length > 0) {
        if(curlen > maxlen) {
          for(const el of curgroup)
            el.setAttribute('ignored','1');
          allgroups.push({start: groupstart, end: newindex, witness: thisn});
        }
        curgroup = [];
        curlen = 0;
        index = newindex;
        continue;
      }
      if(curgroup.length === 0) groupstart = index;

      curgroup.push(ws[n]);
      const lem = basews[n].getAttribute('lemma');
      const wlen = lem ? lem.length : textlength;
      curlen = curlen + wlen;
      index = newindex;
    }
  }
  return allgroups;
};

const makeOmNotes = (objs, text, ignoretags) => {
  const truncate = str => {
    if(str.length < 20) return str;
    const clean = cleanPunct(str).replaceAll(/^["‘“|\/\d]/g,'');
    const firstspace = clean.indexOf(' ');
    const lastspace = clean.lastIndexOf(' ');
    if(firstspace !== lastspace && firstspace !== -1)
      return clean.slice(0,firstspace) + '… ' + clean.slice(lastspace + 1);
    return str;
  };
  
  if(objs.length === 0) return '';

  const clean = cleanText(text,ignoretags);
  let ret = '<listApp type="omissions">';
  for(const obj of objs) {
    ret = ret + `<app loc="${obj.start},${obj.end}"><lem>` + 
      truncate(clean.slice(obj.start, obj.end)) + 
      `</lem><rdg wit="#${obj.witness}"/></app>`;
  }
  return ret + '</listApp>';
};

const makeApp = (doc, ed, opts) =>  {
  logger.clear();
  const base = doc.querySelector(`TEI[n="${opts.base}"]`);
  if(!base) return {error: `${opts.base} not found in alignment file.`};
  
  const omNotes = (opts.hasOwnProperty('maxomlength') && opts.maxomlength !== null) ?
    markIgnoredGaps(doc,base,opts.maxomlength) :
    [];

  if(opts.mergerdgs) mergeGroups(doc);
  cleanupGroups(base);
  
  const curListWit = ed.querySelector('listWit');
  
  const idsel = opts.idsel || '*|id';
  const sorter = opts.sort ? makeSorter(opts.sort) :
                 curListWit ? makeSorter(getWitOrder(curListWit)) : 
                 null;
  const witlistopts = {idsel: idsel};
  if(curListWit?.querySelector('witness[n="collective"]')) {
    witlistopts.witgroups = collectWitGroups(curListWit);
    witlistopts.sorter = sorter;
  }

    //const curriedWitList = curry(getWitList)(doc)(witlistopts);

    const words = doc.querySelector(`TEI[n="${opts.base}"]`).querySelectorAll('w');

    const ignoretags = ((par) => {
        const filters = par.querySelector('ab[type="tagfilters"]');
        if(!filters) return new Set();
        return new Set([...filters.querySelectorAll('tag[subtype="ignore"]')].map(f => f.textContent.trim()));
    })(doc);

    const block = cleanBlock(opts.blockid,idsel,{name: opts.base, xml: ed});
    if(!checkAlignment([...words],block,ignoretags))
        logger.log(`${opts.blockid}: ${opts.base} doesn't match alignment.`);

    const otherdocs = [...doc.querySelectorAll(`TEI:not([n="${opts.base}"])`)];
    if(sorter) otherdocs.sort(sorter);

    const otherrdgs = opts.witnesses ? new Map(
        otherdocs.map(d => {
            const docid = d.getAttribute('n');
            const witfile = opts.witnesses.get(docid);
            if(!witfile) {
                logger.log(`Can't find file for ${docid}.`);
                return [docid,null];
            }
            const block = cleanBlock(opts.blockid,idsel,witfile);
            const rdgs = getXMLRdgs(block,opts.blockid,d,witfile.name,ignoretags);
            return [docid, rdgs];
        })) : null;

    let ret = '';
    ret = ret + makeOmNotes(omNotes,block,ignoretags);
    let start = 0;
    for(let n=0; n<words.length;n++) {

        const word = words[n];
        
        const cleanword = word.textContent.replaceAll(/\s/g,'');
        const endpunct = cleanPunct(cleanword,true);

        const end = start + cleanword.length;
        const realend = start + endpunct;

        //const end = start + word.textContent.replaceAll(/\s/g,'').length;

        const [posapp, negapp] = processReadings(n,otherdocs,otherrdgs,word,opts);

        if(negapp.size === 0) {
            start = end;
            continue;
        }
        
        let app = `<app loc="${start},${realend}">\n`;

        app = app + processLem(word,posapp,doc,witlistopts);

        app = app + processNegApp(negapp,doc,witlistopts,ignoretags);

        app = app + '</app>\n';    

        ret = ret + app;

        start = end;
        
    }
    const listWit = updateListWit(doc.querySelector('listWit'),opts.witnesses,idsel);
    return {listwit: listWit, listapp: ret, warnings: logger.entries};
};

const updateListWit = (listWit, witnesses, idsel='*|id') => {
    if(!witnesses) return listWit;
    listWit = listWit.cloneNode(true);
    for(const [siglum,witness] of witnesses.entries()) {
        if(witness.type) continue;
        if(witness.hasOwnProperty('updatedfilename')) {
            const el = listWit.querySelector(`[${idsel}="${siglum}"]`);
            if(el) {
                el.setAttribute('source',witness.updatedfilename);
            }
        }
    }
    return listWit;
};

const addWitnesses = (doc, listwit, idsel='*|id') => {
    const nURI = doc.documentElement.namespaceURI;
    const doclistwit = doc.querySelector('sourceDesc > listWit') ||
        (() => {
            const el = doc.createElementNS(nURI,'listWit');
            doc.querySelector('sourceDesc').appendChild(el);
            return el;
        })();
    for(const wit of listwit.querySelectorAll('witness')) {
        const witid = wit.getAttribute('xml:id');
        if(doclistwit.querySelector(`witness[${idsel}="${witid}"]`)) continue;
        
        const witclone = wit.cloneNode(true);

        const parwit = wit.parentNode.closest('witness');
        if(!parwit)
            doclistwit.append('\n',witclone);
        else {
            const parwitid = parwit.getAttribute('xml:id');
            const docparwit = doclistwit.querySelector(`witness[${idsel}="${parwitid}"]`);
            if(docparwit) {
                let docparlistwit = docparwit.querySelector('listWit');
                if(!docparlistwit) {
                        docparlistwit = doc.createElementNS(nURI,'listWit');
                        docparwit.append('\n',docparlistwit);
                }
                docparlistwit.append('\n',witclone);
            }
            else
                doclistwit.append('\n',witclone);
        }
    }
};

const addApparatus = (doc, listappstr, warnings, alignxml, block, alignmentfn) => {
    const nURI = doc.documentElement.namespaceURI;
    const docstandoff = doc.querySelector(`standOff[type="apparatus"][corresp="#${block}"]`) || (() => {
        const newstandoff = doc.createElementNS(nURI,'standOff');
        newstandoff.setAttribute('type','apparatus');
        newstandoff.setAttribute('corresp',`#${block}`);
        newstandoff.setAttribute('source',alignmentfn);
        doc.documentElement.appendChild(newstandoff);
        return newstandoff;
    })();
    const tagfilters = alignxml.querySelector('ab[type="tagfilters"]')?.innerHTML || '';
    const formatopts =  {
        indentation: '  ',
        collapseContent: true,
        lineSeparator: '\n'
    };
    const listappel = listappstr ? '\n' + xmlFormat(`<listApp>${listappstr}</listApp>`,formatopts) : '';
    const warncomm = warnings.length === 0 ? '' :
      '\n<!--Warnings\n' + warnings.join('\n') + '\n-->';
    docstandoff.innerHTML = xmlFormat(`<interp type="normalization"><desc type="tagfilters">${tagfilters}</desc></interp>`,formatopts) + warncomm + listappel;
};

const getWits = (...args) => {
    const wits = args.reduce((acc,cur) => [...acc,...cur.querySelectorAll('witness')],[]);
    const witmap = wits.reduce((acc,w) => {
        const id = w.getAttribute('xml:id');
        if(!acc.has(id)) {
            const newitem = {
                name: id,
                filename: w.getAttribute('source') ||
                          w.closest('[source]')?.getAttribute('source'),
                type: w.getAttribute('n')
            };
            const select = w.getAttribute('select');
            if(select) {
              newitem.select = select;    
              newitem.parent = w.closest('[source]').getAttribute('xml:id');
            }
            acc.set(id, newitem);
        }
        return acc;
    }, new Map());
    return [...witmap.values()];
};

export { makeApp, addWitnesses, addApparatus, getWits };
