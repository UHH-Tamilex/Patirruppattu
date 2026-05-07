import Patristic from './patristic.mjs';
import { distanceMatrix as ngramMatrix } from './ngrams.mjs';
import { distanceMatrix as NCDMatrix } from './ncd.mjs';

const fixNegativeLengths = (root) => {
    const go = (par) => { 
        let addon = 0;
        let addto = null;
        for(const child of par.children) {
            if(child.length < 0) {
                addon = 0 - child.length;
                child.length = 0;
            }
            else addto = child;
            if(child.children.length !== 0)
                go(child);
        }
        if(addto) // if addto is null, both children had negative lengths (now zeroed)
            addto.length = addto.length + addon;

    };
    go(root);
};

const weightLeaves = tree => {
  let all = [];
  for(const leaf of tree.leaves()) {
    let par = leaf.parent;
    let weight = 0;
    while(par) {
      weight = weight + par.length/par.leaves().length;
      all.push(weight);
      par = par.parent;
    }
    leaf.data.weight = weight;
  }
  // softmax
  const den = all.map(w => Math.exp(w)).reduce((acc,cur) => acc + cur);
  for(const leaf of tree.leaves()) {// normalize between 1 and 0.8
    leaf.data.weight = Math.exp(leaf.data.weight)/den;
  }
  /*
  const norm = 1/all.reduce((acc,cur) => acc + cur);
  for(const leaf of tree.leaves()) {
    leaf.data.weight = norm * leaf.data.weight;
  }
  */
};

const toNeXML = tree => {
    const otus = tree.leaves().map((o,i) => `<nex:otu id="otu${i}" label="${o.id}"/>`).join('');
    const nodes = tree.descendants().map((o,i) => 
    `<nex:node id="${o._guid}" ${o.id ? 'label="'+o.id+'" otu="otu'+i+'"' : ''} ${i === 0 ? `root="true"` : ''}/>`).join('');
    const edges = tree.links().map((l,i) => `<nex:edge source="${l.source._guid}" target="${l.target._guid}" id="edge${i}" length="${l.target.length}"/>`).join('');
    return `<nex:nexml xmlns:nex="http://www.nexml.org/2009" version="0.9"><nex:otus id="otus1">${otus}</nex:otus><nex:trees otus="otus1" id="trees1"><nex:tree id="guidetree" label="guidetree" xsi:type="nex:FloatTree" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">${nodes}${edges}</nex:tree></nex:trees></nex:nexml>`;
};

const guideTree = (texts,distancefunc,ngramsize) => {
    const matrix = distancefunc === 'ncd' ?
      NCDMatrix(texts) : 
      ngramMatrix(texts,ngramsize);
    const guidetree = Patristic.parseMatrix(matrix,texts.map(t => t[0]));
    fixNegativeLengths(guidetree);
    //weightLeaves(guidetree);
    guidetree.toNeXML = () => toNeXML(guidetree);
    return guidetree;
};

export default guideTree;
