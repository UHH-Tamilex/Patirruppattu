import { findLines } from './utils.mjs';
import { cancelPopup, showPopup } from './popup.mjs';

const Citer = {};

const Sheet = (new DOMParser()).parseFromString(`<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:tei="http://www.tei-c.org/ns/1.0" exclude-result-prefixes="tei">
  <xsl:output method="xml" version="1.0" encoding="UTF-8" indent="yes"/>

  <xsl:template match="*">
    <xsl:element name="{local-name()}">
      <xsl:copy-of select="@*"/>
      <xsl:apply-templates/>
    </xsl:element>
  </xsl:template>
    
  <xsl:template match="tei:choice">
    <xsl:element name="choice">
        <xsl:copy-of select="@*"/>
        <xsl:apply-templates/>
    </xsl:element>
  </xsl:template>
  <xsl:template match="tei:seg">
    <xsl:element name="seg"><xsl:apply-templates/></xsl:element>
  </xsl:template>

  <xsl:template match="tei:form">
    <xsl:element name="w"><xsl:apply-templates/></xsl:element>
  </xsl:template>
</xsl:stylesheet>
`,'text/xml');

const getWords = (par, range) => {
    const start = range.startContainer.parentNode.closest('.choice') || range.startContainer.parentNode.closest('.word');
    const end = range.endContainer.parentNode.closest('.choice') || range.endContainer.parentNode.closest('.word');
    if(!start || !end) return;
    
    const ret = [];
    for(const [n, word] of [...par.querySelectorAll('.word, .choice')].entries()) {
        if(word.parentNode.closest('.choice')) continue;
        if(word === start || word === end) {
            ret.push(n);
            if(start === end) {
                ret.push(n);
                return ret;
            }
        }
        if(ret.length === 2) {
            ret.sort((a,b) => a > b);
            return ret;
        }
    }
    return;
};

const copyToClipboard = (xml, par) => {
    navigator.clipboard.writeText(xml).then(
        () => {
            const tip = document.createElement('div');
            tip.style.position = 'absolute';
            tip.style.top = 0;
            tip.style.right = 0;
            tip.style.background = 'rgba(0,0,0,0.5)';
            tip.style.color = 'white';
            tip.style.padding = '0.5rem';
            tip.append('Copied to clipboard.');
            par.appendChild(tip);
            tip.animate([
                {opacity: 0},
                {opacity: 1, easing: 'ease-in'}
                ],200);
            setTimeout(() => tip.remove(),1000);
        },
        () => {
            const par = popup.querySelector('.popup-output');
            const tip = document.createElement('div');
            tip.style.position = 'absolute';
            tip.style.top = 0;
            tip.style.right = 0;
            tip.style.background = 'rgba(0,0,0,0.5)';
            tip.style.color = 'red';
            tip.style.padding = '0.5rem';
            tip.append('Couldn\'t copy to clipboard.');
            par.appendChild(tip);
            setTimeout(() => tip.remove(),1000);
        }
    );
};

Citer.makeCitation = (doc, id, nums) => {
    const ns = 'http://www.tei-c.org/ns/1.0' ;
    const standOff = doc.querySelector(`standOff[type="wordsplit"][corresp="#${id}"]`);
    const par = document.implementation.createDocument(ns,'q');
    let i = 0;
    for(const word of standOff.querySelectorAll(':scope > entry, :scope > superEntry')) {
        if(i > nums[1]) break;
        if(i >= nums[0]) {
            if(word.nodeName === 'superEntry') {
                const choice = document.createElementNS(ns,'choice');
                const type = word.getAttribute('type');
                if(type) choice.setAttribute('type',type);

                for(const entry of word.querySelectorAll(':scope > entry')) {
                    const seg = par.createElementNS(ns,'seg');
                    for(const wword of entry.querySelectorAll('entry')) {
                        const clone = par.importNode(wword.querySelector('form'),true);
                        seg.appendChild(clone);
                    }
                    choice.appendChild(seg);
                }
                par.documentElement.appendChild(choice);
            }
            else {
                const clone = par.importNode(word.querySelector('form'),true);
                par.documentElement.appendChild(clone);
            }
            if(i < nums[1])
                par.documentElement.append(' ');
        }
        i = i + 1;
    }
    const xproc = new XSLTProcessor();
    xproc.importStylesheet(Sheet);
    const newdoc = xproc.transformToDocument(par);
    newdoc.documentElement.setAttribute('xml:lang','ta');
    return newdoc;
};

const getLineNums = (doc, id, nums) => {
    const docClone = Citer.thisDoc.cloneNode(true);
    const standOff = docClone.querySelector(`standOff[type="wordsplit"][corresp="#${id}"]`);
    findLines(docClone,id,standOff);
    const entries = standOff.querySelectorAll(':scope > entry, :scope > superEntry');
    return [
        parseInt(entries.item(nums[0]).getAttribute('linenum')) + 1,
        parseInt(entries.item(nums[1]).getAttribute('linenum')) + 1
        ];
};

Citer.docSelect = e => {
    const sel = document.getSelection();
    if(sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    const par = range.commonAncestorContainer.nodeType === 1 ?
        range.commonAncestorContainer : range.commonAncestorContainer.parentNode;
    const edblock = par.closest('.text-block.edition');
    if(!edblock) return;
    const nums = getWords(edblock, range);
    const id = edblock.closest('[id]').id;
    const q = Citer.makeCitation(Citer.thisDoc, id, nums);
    
    const linenums = getLineNums(Citer.thisDoc, id, nums);

    const qserial = (new XMLSerializer()).serializeToString(q.documentElement);
    const url = new URL(window.location);
    const base = url.origin + url.pathname;
    const link = base + '?highlight=' + encodeURIComponent(`[id=${id}] .l:nth-of-type(${linenums[0]})`);
    const out = `<cit source="${base}?id=${id}&amp;w=${nums.join(',')}">
    ${qserial}
    <ref target="${link}">${id}, ${linenums[0] === linenums[1] ? 'line ' + linenums[0] : 'lines ' + linenums.join('–')}</ref>
</cit>`;

    const popup = showPopup('citation-popup');
    const outbox = popup.querySelector('.boxen div');
    outbox.innerHTML = Prism.highlight(out,Prism.languages.xml,'xml');
    copyToClipboard(out,outbox);
    
    sel.empty();
};

Citer.closePopup = e => {
    const popup = document.getElementById('citation-popup');
    popup.querySelector('.boxen div').innerHTML = '';
    cancelPopup(e);
 
};

Citer.startCite = e => {
    if(!e.target.classList.contains('pressed')) {
        e.target.classList.add('pressed');
        document.addEventListener('mouseup',Citer.docSelect);
        for(const block of document.querySelectorAll('.text-block.edition'))
            block.style.cursor = 'copy';
    }
    else {
        e.target.classList.remove('pressed');
        document.removeEventListener('mouseup',Citer.docSelect);
        for(const block of document.querySelectorAll('.text-block.edition'))
            block.style.cursor = 'inherit';
    }

};

Citer.thisDoc = null;

Citer.init = xmldoc => {
    document.getElementById('button_citebutton')?.addEventListener('click',Citer.startCite);
    document.getElementById('citation-popup')?.querySelector('.closeicon').addEventListener('click',Citer.closePopup);
    Citer.thisDoc = xmldoc;
};

export default Citer;

