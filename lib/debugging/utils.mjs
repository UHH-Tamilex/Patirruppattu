const decodeRLE = s => s.replaceAll(/(\d+)([MLRG])/g, (_, count, chr) => chr.repeat(count));

const realNextSibling = (walker) => {
    let cur = walker.currentNode;
    while(cur) {
        const sib = walker.nextSibling();
        if(sib) return sib;
        cur = walker.parentNode();
    }
    return null;
};
const countWalker = el => {
    const walker = el.ownerDocument.createTreeWalker(el,0xFFFFFFFF);
    let count = 0;
    let cur = walker.currentNode;
    while(cur) {
        if(cur.nodeType === 1) {
            if(cur.nodeName === 'choice' && 
               cur !== cur.parentNode.children[0]) {
                cur = realNextSibling(walker);
                continue;
            }
            else if(cur.nodeName === 'gap')
                count = count + parseInt(cur.getAttribute('quantity') || 1);
        }
        if(cur.nodeType === 3)
            count = count + cur.textContent
                               .trim()
                               .replaceAll(/[\s\u00AD]/g,'')
                               .length;
        cur = walker.nextNode();
    }
    return count;
};
const countLines = lines => {
    return [...lines].reduce((acc,cur) => {
        const count = countWalker(cur);
        const add = acc.length > 0 ? acc.at(-1) : 0;
        acc.push(count + add);
        return acc;
    },[]);
};

const matchCounts = (alignment,linecounts) => {
    linecounts = [...linecounts];
    const realcounts = [];
    let matchcount = 0;
    for(let n=0;n<alignment[0].length;n++) {
        if(matchcount === linecounts[0]) {
            linecounts.shift();
            const line2 = alignment[1].slice(0,n);
            const matches = [...line2].reduce((acc, cur) => cur === 'M' ?  acc + 1 : acc,0);
            realcounts.push(matches);
        }
        if(alignment[0][n] === 'M') matchcount = matchcount + 1;
    }
    return realcounts;
};

const addEditButtons = blocks => {for(const block of blocks) addEditButton(block);};

const addEditButton = blockel => {
    const xmlid = typeof blockel === 'string' ? blockel : blockel.getAttribute('xml:id');
    const block = document.getElementById(xmlid);
    const wideblock = block.closest('.wide');
    const editmenu = document.createElement('div');
    editmenu.className = 'editmenu ignored';
    editmenu.lang = 'en';

    const wsbutton = document.createElement('button');
    wsbutton.className = 'mini_wordsplit';
    const wssvg = document.getElementById('wordsplitsvg').cloneNode(true);
    wssvg.style.display = 'unset';
    wssvg.removeAttribute('id');
    wsbutton.appendChild(wssvg);
    wsbutton.dataset.anno = `Edit word splits for ${xmlid}`;

    const appbutton = document.createElement('button');
    appbutton.className = 'mini_apparatus';
    const appsvg = document.getElementById('apparatussvg').cloneNode(true);
    appsvg.removeAttribute('id');
    appsvg.style.display = 'unset';
    appbutton.appendChild(appsvg);
    appbutton.dataset.anno = `Edit apparatus for ${xmlid}`;

    editmenu.append(wsbutton, appbutton);
    (wideblock || block).prepend(editmenu);
};

export {decodeRLE, matchCounts, countLines, addEditButtons, addEditButton};
