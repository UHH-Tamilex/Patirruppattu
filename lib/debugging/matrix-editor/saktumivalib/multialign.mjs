import guideTree from './tree.mjs';
import { affineAlign, alignAlign, charConfig, arrConfig, simpleArrConfig, arrMsaConfig, simpleArrMsaConfig, charMsaConfig } from './affine-align.mjs';
 
class multiAligner {
    constructor(configfunc, scoring) {
        //const scoringclone = [...scoring];
        //this.realigndepth = scoringclone.pop();
        const msafunc = configfunc === 'arr' ? arrMsaConfig :
            configfunc === 'arr_simple' ? simpleArrMsaConfig :
            charMsaConfig;
        const pairfunc = configfunc === 'arr' ? arrConfig :
            configfunc === 'arr_simple' ? simpleArrConfig :
            charConfig;
        //this.msafunc = new msafunc(...scoringclone);
        //this.pairfunc = new pairfunc(...scoringclone);
        this.msafunc = new msafunc(scoring);
        this.pairfunc = new pairfunc(scoring);
        this.realigndepth = scoring.realigndepth;
        this.distancefunc = scoring.distancefunc;
        this.ngramsize = scoring.ngramsize;
        this.scalegap = scoring.scalegap;
        this.progress = {
            total: 0,
            cur: 0,
            update: (message,addone = true) => {
                if(typeof postMessage !== 'function') return;
                if(addone) this.progress.cur = this.progress.cur + 1;
                const ret = {progress: this.progress.cur/this.progress.total};
                if(message) ret.message = message;
                postMessage(ret);
            }
        };
    }
    scaleGapSizes(gap,branch1,branch2,len1,len2) {
        const dists = [];
        for(const child1 of branch1) {
          for(const child2 of branch2) {
            dists.push(child1.distanceTo(child2));
          }
        }
        const avgdist = dists.reduce((acc,cur) => acc + cur)/dists.length;
        const gapopen = (this.pairfunc.gap.open - Math.log(Math.min(len1,len2))) * (1 - avgdist);
        const gapex = this.pairfunc.gap.extend * (1 + Math.abs(Math.log(len1/len2)));
        
        return {open: gapopen, extend: gapex};
    }

    align(arr) {
        const texts = arr.map(a => [a.siglum, a.text]).sort((a,b) => a[0].localeCompare(b[0]))
        // sort by siglum for guidetree consistency; order seems to affect tree
        const guidetree = guideTree(texts,this.distancefunc,this.ngramsize);

        this.progress.total = guidetree.descendants().length - guidetree.leaves().length;
        this.progress.cur = 0;

        const textmap = new Map(texts);
        const alignment = this.alignToTree(guidetree,textmap);
        alignment.tree = guidetree.toNeXML();
        
        if(this.realigndepth)
            return this.reAlign(alignment,guidetree,this.realigndepth);
        else
            return alignment;
    }

    alignAppend(alignment,newtexts) {
        const texts = [...alignment.map(a => [a.siglum,a.textobj]),
                       ...newtexts.map(a => [a.siglum, a.textobj])];

        const textsflat = texts.map(t => [t[0],t[1].map(w => w.norm).filter(w => w !== '')]).sort((a,b) => a[0].localeCompare(b[0]));
        const guidetree = guideTree(textsflat,this.distancefunc,(this.ngramsize || 3));

        this.progress.total = guidetree.descendants().length - guidetree.leaves().length;
        this.progress.cur = 0;

        const textmap = new Map(texts);
        const newsigla = new Set(newtexts.map(a => a.siglum));
        // TODO: align to closest text, then replace gaps from already aligned version
        const newalignment = this.alignToTree(guidetree,textmap,newsigla);
        newalignment.tree = guidetree.toNeXML();
        if(this.realigndepth)
            return this.reAlign(newalignment,guidetree,this.realigndepth);
        else
            return newalignment;
    }

    alignToTree(branch,textmap,newtexts = new Set()) {
        if(branch.isLeaf()) {
            //console.log(branch.data.id);
          const ret = {sigla: [branch.data.id], alignment: [textmap.get(branch.data.id)]};
          if(newtexts.size && newtexts.has(branch.data.id))
            ret.updated = true;
          return ret;
        }

        const msa1 = this.alignToTree(branch.children[0],textmap,newtexts);
        const msa2 = this.alignToTree(branch.children[1],textmap,newtexts);

        if(newtexts.size && !msa1.updated && !msa2.updated) {
          return {sigla: [...msa1.sigla, ...msa2.sigla], 
                  alignment: [...msa1.alignment,...msa2.alignment]};
        }

        const scaledgap = this.scalegap ?
          this.scaleGapSizes(this.pairfunc.gap,
                             branch.children[0].leaves(),
                             branch.children[1].leaves(), 
                             msa1.alignment[0].length,
                             msa2.alignment[0].length
                            ) :
          null;

        const updated = newtexts.size ? true : false;

        if(msa1.sigla.length === 1 && msa2.sigla.length === 1) {
            //console.log([msa1.sigla[0],msa2.sigla[0]]);
            this.progress.update();
            
            const opts = {alignment: true, matrix: false};
            if(this.scalegap) opts.gap = {open: scaledgap.open, extend: scaledgap.extend};

            const psa = affineAlign(msa1.alignment[0],
                                    msa2.alignment[0],
                                    this.pairfunc,
                                    opts
                                   );
            return {sigla: [msa1.sigla[0], msa2.sigla[0]], alignment: [psa[0],psa[1]], updated: updated};
        }

        //console.log([...msa1.sigla,...msa2.sigla]);
        this.progress.update();
        /*
        const weights = [branch.children[0].leaves().map(l => l.data.weight),
                         branch.children[1].leaves().map(l => l.data.weight)];
        */
        const opts = {};
        if(this.scalegap) opts.gap = {open: scaledgap.open, extend: scaledgap.extend};
        const msa3 = alignAlign(msa1.alignment,
                                msa2.alignment,
                                this.msafunc,
                                opts
                                //weights
                               );
        return {sigla: [...msa1.sigla,...msa2.sigla], alignment: msa3, updated: updated};
    }

    sumOfPairs(alignment,skip = new Map()) {
        for(let n=0; n < alignment.sigla.length-1; n++) {
            for(let m=n+1; m < alignment.sigla.length; m++) {
                const ids = [alignment.sigla[n],alignment.sigla[m]];
                ids.sort();
                const id = ids.join('');

                if(skip.has(id)) continue;

                skip.set(id, this.pairScore(alignment.alignment[n], alignment.alignment[m]));
            }
        }
        return {
            scores: skip,
            total: [...skip.values()].reduce((acc,cur) => acc + cur,0)
        };
    }

    pairScore(seq1, seq2) {
        let ret = 0;
        let seq1gapopen = false;
        let seq2gapopen = false;
        
        for(let n=0; n<seq1.length; n++ ) {
            const s1 = this.pairfunc.prop ? seq1[n][this.pairfunc.prop] : seq1[n];
            const s2 = this.pairfunc.prop ? seq2[n][this.pairfunc.prop] : seq2[n];
            //if(s1 === '' && s2 === '') continue; // this doesn't work for affine gap penalties
            if(s1 !== '' && s2 !== '') {
              seq1gapopen = false;
              seq2gapopen = false;
              ret = ret + this.pairfunc.scorefn(seq1,n,seq2,n);
            }
            else {
              if(s1 === '') {
                seq2gapopen = false;
                if(!seq1gapopen) {
                    seq1gapopen = true;
                    ret = ret + this.pairfunc.gap.open + this.pairfunc.gap.extend;
                }
                else ret = ret + this.pairfunc.gap.extend;
              }
              if(s2 === '') {
                  seq1gapopen = false;
                  if(!seq2gapopen) {
                      seq2gapopen = true;
                      ret = ret + this.pairfunc.gap.open + this.pairfunc.gap.extend;
                  }
                  else ret = ret + this.pairfunc.gap.extend;
              }
          }
        }
        return ret;
    }
/*
const pairScore2 = (seq1, seq2) => {
    // https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0160043
    let ret = 0;
    const seq1g = [];
    const seq2g = [];

    for(let n=0; n<seq1.length; n++ ) {
        if(!(seq1[n] === '' && seq2[n] === '')) {
            seq1g.push(seq1[n]);
            seq2g.push(seq2[n]);
        }
        if(seq1[n] !== '' && seq2[n] !== '')
            ret = ret + _pairfunc.scorefn(seq1,n,seq2,n);
    }
    for(const gaplength of [...collateGaps(seq1g),...collateGaps(seq2g)])
        ret = ret + _pairfunc.gap.open + _pairfunc.gap.extend * gaplength;

    return ret;
};

const collateGaps = (seq) => {
    const ret = [];
    let cur = null;
    for(let n=0;n<seq.length;n++) {
        if(seq[n] === '')
            if(cur === null)
                cur = 1;
            else cur = cur + 1;
        if(seq[n] !== '' && cur !== null) {
            ret.push(cur);
            cur = null;
        }
    }
    if(cur !== null) ret.push(cur);
    return ret;
};
*/
    reAlignBranch(alignment,sigla1,sigla2,scaledgap) {
        const filterAlignments = (full, part) => {
            const indices = part.sigla.map(s => full.sigla.indexOf(s));
            for(const index of indices)
                part.alignment.push(structuredClone(full.alignment[index]));
            const removesites = [];
            for(let n=0;n<part.alignment[0].length;n++) {
                let allgaps = true;
                for(let m=0;m<part.alignment.length;m++) {
                    const mn = this.pairfunc.prop ? 
                      part.alignment[m][n][this.pairfunc.prop] : 
                      part.alignment[m][n];
                    if(mn !== '') {
                        allgaps = false;
                        break;
                    }
                }
                if(allgaps) removesites.unshift(n);
            }
            for(const site of removesites)
                for(const alignment of part.alignment)
                    alignment.splice(site,1);
        };

        const msa1 = {sigla: sigla1, alignment: []};
        const msa2 = {sigla: sigla2, alignment: []};
        filterAlignments(alignment,msa1);
        filterAlignments(alignment,msa2);

        const opts = {};
        if(scaledgap) opts.gap = {open: scaledgap.open, extend: scaledgap.extend};

        if(msa1.sigla.length === 1 && msa2.sigla.length === 1) {
            //console.log(msa1.sigla[0] + ' vs. ' + msa2.sigla.join(', '));
            opts.alignment = true;
            opts.matrix = false;
            const psa = affineAlign(msa1.alignment[0],
                                    msa2.alignment[0],
                                    this.pairfunc,
                                    opts
                                   );
            return {sigla: [msa1.sigla[0], msa2.sigla[0]], alignment: [psa[0],psa[1]], tree: alignment.tree};
        }

        //console.log(msa1.sigla.join(', ') + ' vs. ' + msa2.sigla.join(', '));
        const msa3 = alignAlign(msa1.alignment,
                                msa2.alignment,
                                this.msafunc,
                                opts
                               );
        return {sigla: [...msa1.sigla,...msa2.sigla], alignment: msa3, tree: alignment.tree};
    }

    reAlign(alignment,tree,maxlevel) {
        //console.log('realigning');

        const originalorder = [...alignment.sigla];

        let sop = this.sumOfPairs(alignment);
        //console.log(sop);

        const levels = [];
        for(const node of tree.descendants()) {
            const arr = levels[node.depth];
            if(arr)
                arr.push(node);
            else
                levels[node.depth] = [node];
        }
        levels.reverse();
        levels.pop();
       
        const sortfn = (a,b) => tree.depthOf(a) > tree.depthOf(b) ? -1 : 1;
        // sometimes the results are better if levels are sorted with shortest to longest depth?
        for(const level of levels)
            level.sort(sortfn);

        const realmax = Math.min(maxlevel,levels.length-1);
        this.progress.total = realmax;
        this.progress.cur = 0;
        this.progress.update('Improving alignment...',false);
        
        //const weightmap = new Map(tree.leaves().map(l => [l.data.id,l.data.weight]));

        for(let n=0;n<=realmax;n++) {
            const level = levels[n];
            //if(!level) break;
            for(const node of level) {
                const curleaves = node.isLeaf() ? [node.id] : node.getLeaves().map(l => l.id);
                curleaves.sort();
                const otherleaves = alignment.sigla.filter(s => !curleaves.includes(s));
                /*
                const weights = [curleaves.map(l => weightmap.get(l)),
                                 otherleaves.map(l => weightmap.get(l))
                                ]; 
                */
                /*
                const dists = [];
                for(const child1 of node.leaves().filter(l => curleaves.includes(l.id))) {
                  for(const child2 of tree.leaves().filter(l => otherleaves.includes(l.id))) {
                    dists.push(child1.distanceTo(child2));
                  }
                }
                const avgdist = dists.reduce((acc,cur) => acc + cur)/dists.length;
                */
                const scaledgap = this.scalegap ?
                  this.scaleGapSizes(this.pairfunc.gap,
                                     node.leaves().filter(l => curleaves.includes(l.id)),
                                     tree.leaves().filter(l => otherleaves.includes(l.id)),
                                     alignment.alignment[0].length,
                                     alignment.alignment[0].length
                                    ) :
                  null;

                const newalignment = this.reAlignBranch(alignment,curleaves,otherleaves,scaledgap);
                
                const changedids = [];
                const skip = new Map(sop.scores);
                for(const curleaf of curleaves) {
                    for(const otherleaf of otherleaves) {
                        const arr = [curleaf,otherleaf];
                        arr.sort();
                        skip.delete(arr.join(''));
                    }
                }
                const newsop = this.sumOfPairs(newalignment,skip);
                //console.log(`level ${n}, SoP: ${newsop.total}`);
                if(newsop.total > sop.total) {
                    alignment = newalignment;
                    sop = newsop;
                }
            }
            this.progress.update();
        }
        //console.log(`final SOP: ${sop.total}`);
        const reordered = [];
        for(const siglum of originalorder)
            reordered.push(alignment.alignment[alignment.sigla.indexOf(siglum)]);
        return {sigla: originalorder, alignment: reordered, tree: alignment.tree};
    }
}

export default multiAligner;
