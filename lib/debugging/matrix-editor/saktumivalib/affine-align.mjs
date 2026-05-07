import {charSplit, aksaraSplit, graphemeSplit/*, getType, iast*/} from './split.mjs';
import {GridMixin} from './structurae/grid.js';

// TODO: substitution matrix
const scorechar = ({match = 1, mismatch = -1, missing = '‡', prop = null}) => (s1,i,s2,j) => {
    const a = prop ? s1[i][prop] : s1[i];
    const b = prop ? s2[j][prop] : s2[j];
    if(a === b) return match;
    if(a === '' || b === '') return match - 0.5; // TODO: add gap extension penalty instead
    //if(a === missing || b === missing) return mismatch/2; // TODO: specify this penalty?
    //if(a === '' && b === ' ') return 1;
    //if(a === ' ' && b === '') return 1;
    //if(a === '' || b === '') return -2;
    //if(getType(a,iast) !== getType(b,iast)) return mismatch - 0.5;
    return mismatch;
};

const scorearr = ({match = 1, mismatch = -1, gap_open = -2, gap_extend = -0.5, missing = '‡', prop = null}) => {
	const charfn = scorechar({match: match, mismatch: mismatch, missing: missing, prop: prop});
	const charconf = new charConfig({match: match, mismatch: mismatch, missing: missing, gap_open: gap_open, gap_extend: gap_extend, prop: null});
  const arrEq = (a,b,len) => {
    var i;
    for(i = len; i-- !== 0;)
      if(a[i] !== b[i]) return false;
      return true;
  };

	return (s1,i,s2,j) => {
		const a = prop ? s1[i][prop] : s1[i];
		const b = prop ? s2[j][prop] : s2[j];
		const alen = a.length;
		const blen = b.length;
		if(alen === 0 && blen === 0) return match; // TODO: maybe something else
		//if(alen === 0 || blen === 0) return mismatch; // TODO: better idea?
    if(alen === blen && arrEq(a,b,alen)) return match;
    if(a === '' || b === '') return match + gap_extend;
		const score = alen === 1 && blen === 1 ?
			charfn(a,0,b,0) :
			affineAlign(a,b,charconf,{alignment: false}) / Math.max(alen,blen);
		return score;
	};
};

const scorearr_simple = ({match = 1, mismatch = -1, missing = '‡', prop = null}) => (s1,i,s2,j) => {
    const a = prop ? s1[i][prop] : s1[i];
    const b = prop ? s2[j][prop] : s2[j];
    const alen = a.length;
    const blen = b.length;
    if(alen === 0 && blen === 0) return match; // TODO: maybe something else
    //if(alen === 0 || blen === 0) return mismatch; // TODO: better idea?
    if(alen !== blen) return mismatch;

    if(a[0] === missing || b[0] === missing) return match/2; // TODO: specify this penalty

    for(let n=0;n<alen;n++)
        if(a[n] !== b[n]) return mismatch;

    return match;
};

const scoremsa = scorefn => (arr1,i,arr2,j/*,weights*/) => {
  let score = 0;
  let divisor = 0;
  for(const [n,s1] of arr1.entries()) {
    for(const [m,s2] of arr2.entries()) { 
      //const newscore = weights ? scorefn(s1,i,s2,j) * weights[0][n] * weights[1][m] :
      //                           scorefn(s1,i,s2,j);
      const newscore = scorefn(s1,i,s2,j);
      score = score + newscore;
      divisor = divisor + 1;
    }
  }
  return score/divisor; // divisor shouldn't be 0
};

/*
const AlignConfig = function(scorefn, gap_open, gap_extend, gap_skip_initial) {
    this.scorefn = scorefn;
    this.gap = {
        open: gap_open,
        extend: gap_extend,
        skip_initial: gap_skip_initial
    };
};
*/
const arrConfig = function(scoring) {
    this.match = scoring.match; // this is for estimateSize
    this.mismatch = scoring.mismatch;
    this.prop = scoring.prop;
    this.scorefn = scorearr({
        match: scoring.match, 
        mismatch: scoring.mismatch, 
        gap_open: scoring.gap_open, 
        gap_extend: scoring.gap_extend,
        prop: scoring.prop
    });
    this.gap = {
        open: scoring.gap_open,
        extend: scoring.gap_extend,
        skip_initial: scoring.gap_skip_initial
    };
};
const arrMsaConfig = function(scoring) {
    const scorefn = scorearr({
        match: scoring.match, 
        mismatch: scoring.mismatch, 
        gap_open: scoring.gap_open, 
        gap_extend: scoring.gap_extend,
        prop: scoring.prop
    });
    this.scorefn = scoremsa(scorefn);
    this.match = scoring.match;
    this.mismatch = scoring.mismatch;
    this.prop = scoring.prop;
    this.gap = {
        open: scoring.gap_open,
        extend: scoring.gap_extend,
        skip_initial: scoring.gap_skip_initial
    };
};
const simpleArrConfig = function(scoring) {
    this.scorefn = scorearr_simple({match: scoring.match, mismatch: scoring.mismatch, prop: scoring.prop});
    this.match = scoring.match;
    this.mismatch = scoring.mismatch;
    this.prop = scoring.prop;
    this.gap = {
        open: scoring.gap_open,
        extend: scoring.gap_extend,
        skip_initial: scoring.gap_skip_initial,
    };
};

const simpleArrMsaConfig = function(scoring) {
    this.match = scoring.match;
    this.mismatch = scoring.mismatch;
    this.prop = scoring.prop;
    const scorefn = scorearr_simple({match: scoring.match, mismatch: scoring.mismatch, prop: scoring.prop});
    this.scorefn = scoremsa(scorefn);
    this.gap = {
        open: scoring.gap_open,
        extend: scoring.gap_extend,
        skip_initial: scoring.gap_skip_initial
    };
};
const charConfig = function(scoring) {
    this.match = scoring.match;
    this.mismatch = scoring.mismatch;
    this.prop = scoring.prop;
    this.scorefn = scorechar({match: scoring.match, mismatch: scoring.mismatch, prop: scoring.prop});
    this.gap = {
        open: scoring.gap_open,
        extend: scoring.gap_extend,
        skip_initial: scoring.gap_skip_initial
    };
};
const charMsaConfig = function(scoring) {
    this.match = scoring.match;
    this.mismatch = scoring.mismatch;
    this.prop = scoring.prop;
    const scorefn = scorechar({match: scoring.match, mismatch: scoring.mismatch, prop: scoring.prop});
    this.scorefn = scoremsa(scorefn);
    this.gap = {
        open: scoring.gap_open,
        extend: scoring.gap_extend,
        skip_initial: scoring.gap_skip_initial
    };
};

if(typeof Float16Array === 'undefined') var Float16Array = Float32Array;

const Float16Grid = GridMixin(Float16Array);
const Float32Grid = GridMixin(Float32Array);
const Float64Grid = GridMixin(Float64Array);
const Uint8Grid = GridMixin(Uint8Array);

const estimateSize = (len1, len2, config) => {
    const len = Math.max(len1,len2);
    const mut = Math.max(
        Math.abs(config.match),
        Math.abs(config.mismatch),
        Math.abs( (config.gap.open + config.gap.extend)/2 )
        );
    const tot = len * mut;
    if(tot < 65504) return Float16Grid;
    if(tot < 3.4e38) return Float32Grid;
    return Float64Grid;
};

const affineAlign = (s1arr,
                     s2arr,
                     config = new charConfig({match: 1, mismatch: -1, gap_open: -2, gap_extend: -0.25,skip_initial: false}),
                     options = {
                         alignment: true,
                         matrix: false,
                         gap: null
                        }
                     ) => {
    const UP   = 1;
    const LEFT = 2;
    const UL   = 3;
    const START = -Infinity;

    const s1len = s1arr.length;
    const s2len = s2arr.length;
    
    const [gapopen,gapextend] = options.gap ? 
      [options.gap.open, options.gap.extend] :
      [config.gap.open, config.gap.extend];

    // initialize matrix
    const ArrayType = estimateSize(s1len+1,s2len+1,{...config.gap, gap: {open: gapopen, extend: gapextend}});
    const mat    = ArrayType.create(s1len+1,s2len+1);
    const igap   = ArrayType.create(s1len+1,s2len+1);
    const jgap   = ArrayType.create(s1len+1,s2len+1);
    const direc  = Uint8Grid.create(s1len+1,s2len+1);
    /* 
    const isGap = (arr, n) => {
      const test = config.prop ?
        arr[n][config.prop] : arr[n];
      if(Array.isArray(test) && test[0] === '') return true;
      if(test !== '') return true;
      return false;
    }
    */
    for(let i=0; i<s1len+1; i++) {
        if(i === 0) {
            mat.setValue(0,0,0);
            igap.setValue(0,0,0);
            jgap.setValue(0,0,0);
            //direc.setValue(0,0,0); // 0 by default; should not be needed
        }
        else {
            const score = config.gap.skip_initial ?  
                gapextend * i :
                gapopen + gapextend * i;
            mat.setValue(i,0,score);
            igap.setValue(i,0,score);
            jgap.setValue(i,0,i === 0 ? 0 : START); //i === 0 ? 0 : null;
            direc.setValue(i,0,UP);
        }
    }
    for(let j=1; j<s2len+1; j++) {
        // no gap opening penalty at the beginning
        const score = config.gap.skip_initial ? 
            gapextend * j :
            gapopen + gapextend * j;
        mat.setValue(0,j,score);
        igap.setValue(0,j,START); // null;
        jgap.setValue(0,j,score);
        direc.setValue(0,j,LEFT);
    }

    // calculate scores
    for(let i=1; i<s1len+1; i++) {
        for(let j=1; j<s2len+1; j++) {
            let ulscore = mat.getValue(i-1,j-1) + config.scorefn(s1arr,i-1,s2arr,j-1);
            
            // no gap opening penalty at the bottom row
            const bottomrow = config.gap.skip_initial && j === s2len;
            //const igapadd = scoreGap(s1arr,i-1,config.gap.open,config.prop);
            const igapopen = bottomrow ? 
                mat.getValue(i-1,j) :
                mat.getValue(i-1,j) + gapopen;
                //mat.getValue(i-1,j) + igapadd;

            const previgap = igap.getValue(i-1,j);
            /* // START is -Infinity, so previgap will always be smaller
            const igapmax = previgap !== START ? 
                Math.max(igapopen,previgap) + config.gap.extend : igapopen + config.gap.extend;
            */
            const igapmax = Math.max(igapopen,previgap) + gapextend;

            // no gap opening penalty at the last column
            const lastcol = config.gap.skip_initial && i === s1len;
            const freeopenj = s1arr[i-1] === '⊔';
            //const jgapadd = scoreGap(s2arr,j-1,config.gap.open,config.prop);
            const jgapopen = lastcol ?  
                mat.getValue(i,j-1) :
                mat.getValue(i,j-1) + gapopen;
                //mat.getValue(i,j-1) + jgapadd;
           
            const prevjgap = jgap.getValue(i,j-1);
            /*
            const jgapmax = prevjgap !== START ?
                Math.max(jgapopen,prevjgap) + config.gap.extend : jgapopen + config.gap.extend;
            */
            const jgapmax = Math.max(jgapopen,prevjgap) + gapextend;
            /* 
            const curigap = isGap(s1arr,i-1);
            const curjgap = isGap(s2arr,j-1);
            const maxval = curigap ?
              Math.max(ulscore,jgapmax) : curjgap ?
              Math.max(ulscore,igapmax) :
              Math.max(ulscore,igapmax,jgapmax);
            */
            const maxval = Math.max(ulscore,igapmax,jgapmax);

            mat.setValue(i,j,maxval);
            igap.setValue(i,j,igapmax);
            jgap.setValue(i,j,jgapmax);

            if(maxval === ulscore) direc.setValue(i,j,UL);
            else if(maxval === igapmax) direc.setValue(i,j,UP);
            else if(maxval === jgapmax) direc.setValue(i,j,LEFT);
        }
    }
    
    if(options.alignment !== true)
            return mat.getValue(s1len,s2len);
    // traceback
    const chars = [[],[]];
    var I = s1len;
    var J = s2len;
    const gapel = () => {
      if(config.prop) {
        const ret = {};
        ret[config.prop] = '';
        return ret;
      }
      else return '';
    };
    let curpath = [s1len,s2len];
    const path = [curpath];
    while(I > 0 || J > 0) {
        switch (direc.getValue(I,J)) {
        case UP:
            I--;
            chars[0].push(s1arr[I]);
            chars[1].push(gapel());
            if(options.matrix) {
				curpath = [curpath[0]-1,curpath[1]];
				path.push(curpath);
			}
            break;
        case LEFT:
            J--;
            chars[0].push(gapel());
            chars[1].push(s2arr[J]);
			if(options.matrix) {
				curpath = [curpath[0],curpath[1]-1];
				path.push(curpath);
			}
            break;
        case UL:
            I--;
            J--;
            chars[0].push(s1arr[I]);
            chars[1].push(s2arr[J]);
			if(options.matrix) {
				curpath = [curpath[0]-1,curpath[1]-1];
				path.push(curpath);
			}
            break;
        default: break;
        }
    }
    chars[0].reverse();
    chars[1].reverse();
    path.reverse();

    // TODO: Semantic cleanup
    // 1. "syād vyutkramaḥ sthāno" vs "s________________thāno"
    //    move single characters preceded by space to other side of gap

    if(options.matrix)
        return [...chars,mat.getValue(s1len,s2len),mat.toArrays(),new Set(path.map(p => p.join(',')))];
    else
        return [...chars,mat.getValue(s1len,s2len)];
        
};

const scoreGap = (arr,n,gapopen,prop=null) => {
    const test = prop ? arr[n][prop] : arr[n];
    if(Array.isArray(test) && test[0] !== '') return gapopen;
    else if(test !== '') return gapopen;
    return 0;
};

const scoreMsaGap = (arr,n,gapopen,prop=null) => {
    let score = 0;
    for(const c of arr) {
      const test = prop ? c[n][prop] : c[n];
      if(Array.isArray(test) && test[0] !== '') score = score + gapopen;
      else if(test !== '') score = score + gapopen;
    }
    return score/arr.length;
};

const alignAlign = (p1arr,
                     p2arr,
                     config = new charMsaConfig({match: 1, mismatch: -1, gap_open: -2, gap_extend: -0.25,skip_initial: false}),
                     options = {
                      gap: null
                     }
                   ) => {
    const UP   = 1;
    const LEFT = 2;
    const UL   = 3;
    const START = -Infinity;

    const p1len = p1arr[0].length;
    const p2len = p2arr[0].length;

    const [gapopen,gapextend] = options.gap ? 
      [options.gap.open, options.gap.extend] :
      [config.gap.open, config.gap.extend];

    // initialize matrix
    const ArrayType = estimateSize(p1len+1,p2len+1,{...config.gap, gap: {open: gapopen, extend: gapextend}});
    const mat    = ArrayType.create(p1len+1,p2len+1);
    const igap   = ArrayType.create(p1len+1,p2len+1);
    const jgap   = ArrayType.create(p1len+1,p2len+1);
    const direc  = Uint8Grid.create(p1len+1,p2len+1);
    /*
    const isGap = (arr, n) => {
      for(const row of arr) {
        const test = config.prop ? row[n][config.prop] : row[n];
        if(Array.isArray(test) && test[0] !== '') return false;
        else if(test !== '') return false;
      }
      return true;
    };
    */
    for(let i=0; i<p1len+1; i++) {
        if(i === 0) {
            mat.setValue(0,0,0);
            igap.setValue(0,0,0);
            jgap.setValue(0,0,0);
            //direc.setValue(0,0,0); // previously null
        }
        else {
            const score = config.gap.skip_initial ? 
                gapextend * i :
                gapopen + gapextend * i;
            mat.setValue(i,0,score);
            igap.setValue(i,0,score);
            jgap.setValue(i,0,i === 0 ? 0 : START);
            direc.setValue(i,0,UP);
        }
    }
    for(let j=1; j<p2len+1; j++) {
        // no gap opening penalty at the beginning
        const score = config.gap.skip_initial ? 
            gapextend * j :
            gapopen + gapextend * j;
        mat.setValue(0,j,score);
        igap.setValue(0,j,START);
        jgap.setValue(0,j,score);
        direc.setValue(0,j,LEFT);
    }

    // calculate scores
    for(let i=1; i<p1len+1; i++) {
        for(let j=1; j<p2len+1; j++) {
            let ulscore = mat.getValue(i-1,j-1) + config.scorefn(p1arr,i-1,p2arr,j-1/*,weights*/);
            // no gap opening penalty at the bottom row

            //const igapadd = scoreMsaGap(p1arr,i-1,config.gap.open,config.prop);
            const bottomrow = config.gap.skip_initial && j === p2len;
            const igapopen = bottomrow ? 
                mat.getValue(i-1,j) :
                mat.getValue(i-1,j) + gapopen;
                //mat.getValue(i-1,j) + igapadd;

            const previgap = igap.getValue(i-1,j);
            /*
            const igapmax = previgap !== START ?
                Math.max(igapopen,previgap) + config.gap.extend : igapopen + config.gap.extend;
            */
            const igapmax = Math.max(igapopen,previgap) + gapextend;

            // no gap opening penalty at the last column
            //const jgapadd = scoreMsaGap(p2arr,j-1,config.gap.open,config.prop);
            const lastcol = config.gap.skip_initial && i === p1len;
            const jgapopen = lastcol ? 
                mat.getValue(i,j-1) :
                mat.getValue(i,j-1) + gapopen;
                //mat.getValue(i,j-1) + jgapadd;
           
            const prevjgap = jgap.getValue(i,j-1);
            /*
            const jgapmax = prevjgap !== START ?
                Math.max(jgapopen,prevjgap) + config.gap.extend : jgapopen + config.gap.extend;
            */
            const jgapmax = Math.max(jgapopen,prevjgap) + gapextend;
            /*
            const curigap = isGap(p1arr,i-1);
            const curjgap = isGap(p2arr,j-1);
            const maxval = curigap ?
              Math.max(ulscore,jgapmax) : curjgap ?
              Math.max(ulscore,igapmax) :
              Math.max(ulscore,igapmax,jgapmax);
            */
            const maxval = Math.max(ulscore,igapmax,jgapmax);

            mat.setValue(i,j,maxval);
            igap.setValue(i,j,igapmax);
            jgap.setValue(i,j,jgapmax);

            if( maxval === ulscore) direc.setValue(i,j,UL);
            else if( maxval === igapmax) direc.setValue(i,j,UP);
            else if( maxval === jgapmax) direc.setValue(i,j,LEFT);

        }
    }

    // traceback
    const chars1 = new Array(p1arr.length);
    for(let n=0;n<p1arr.length;n++)
        chars1[n] = [];
    const chars2 = new Array(p2arr.length);
    for(let n=0;n<p2arr.length;n++)
        chars2[n] = [];
    var I = p1len;
    var J = p2len;
    const gapel = () => {
      if(config.prop) {
        const ret = {};
        ret[config.prop] = '';
        return ret;
      }
      else return '';
    };
    while(I > 0 || J > 0) {
        switch (direc.getValue(I,J)) {
        case UP:
            I--;
            for(let n=0;n<chars1.length;n++)
                chars1[n].unshift(p1arr[n][I]);
            for(const char2 of chars2)
                char2.unshift(gapel());
            break;
        case LEFT:
            J--;
            for(const char1 of chars1)
                char1.unshift(gapel());
            for(let n=0;n<chars2.length;n++)
                chars2[n].unshift(p2arr[n][J]);
            break;
        case UL:
            I--;
            J--;
            for(let n=0;n<chars1.length;n++)
                chars1[n].unshift(p1arr[n][I]);
            for(let n=0;n<chars2.length;n++)
                chars2[n].unshift(p2arr[n][J]);
            break;
        default: break;
        }
    }

    //return [[...chars1,...chars2],mat[p1len][p2len]];
    return [...chars1,...chars2];
        
};
export {affineAlign, alignAlign, charConfig, arrConfig, simpleArrConfig, arrMsaConfig, simpleArrMsaConfig, charMsaConfig };
