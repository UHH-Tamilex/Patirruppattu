import {GridMixin} from './structurae/grid.js';

const defaultscore = (a,b) => {
    const vowels = ['a','ā','i','ī','u','ū','o','ō','e','ē','ai','au'];
    if(a === b) return 1;
    if(a === '' && b === ' ') return 1;
    if(a === ' ' && b === '') return 1;
    //if(a === '' || b === '') return -2;
    if(a === ' ' || b === ' ') return -2;
    if(vowels.includes(a) && vowels.includes(b)) return -0.5;
    return -1;
};

if(typeof Float16Array == 'undefined') var Float16Array = Float32Array;

const Float16Grid = GridMixin(Float16Array);
const Float32Grid = GridMixin(Float32Array);
const Float64Grid = GridMixin(Float64Array);
const Uint8Grid = GridMixin(Uint8Array);

const estimateSize = (len1, len2, config) => {
    const len = Math.max(len1,len2);
    const mut = Math.max(
        Math.abs(config.G),
        Math.abs(config.P),
		Math.abs(config.M)
        );
    const tot = len * mut;
    if(tot < 65504) return Float16Grid;
    if(tot < 3.4e38) return Float32Grid;
    return Float64Grid;
};

const needlemanWunsch = (s1,s2,scorefn=defaultscore/*op={G:2,P:1,M:-1}*/) => {
    const op = {G:2,P:1,M:-1};
    /*
    const UP   = Symbol('UP');
    const LEFT = Symbol('LEFT');
    const UL   = Symbol('UP-LEFT');
    */
    const UP   = 1;
    const LEFT = 2;
    const UL   = 3;
    //const s1arr = s1.split('');
    const s1arr = s1;
    const s1len = s1arr.length;
    //const s2arr = s2.split('');
    const s2arr = s2;
    const s2len = s2arr.length;
    //const mat   = new Array(s1len+1);
    //const direc = new Array(s1len+1);
	
	const ArrayType = estimateSize(s1len+1,s2len+1,op);
    const mat = ArrayType.create(s1len+1, s2len+1);
    const direc = Uint8Grid.create(s1len+1, s2len+1);
    // initialization
    for(let i=0; i<s1len+1; i++) {
        //mat[i] = {0:0};
        //direc[i] = {0:[]};
        //mat[i] = new Float16Array(s2len+1);
        //mat[i][0] = 0;
        //direc[i] = new Uint8Array(s2len+1);
        //direc[i][0] = [];
        for(let j=1; j<s2len+1; j++) {
            //mat[i][j] = (i === 0) ? 0 : 
            mat.setValue(i,j,(i === 0) ? 0 : 
                scorefn(s1arr[i-1],s2arr[j-1]));
            //direc[i][j] = [];
        }
    }
    // calculate each value
    for(let i=0; i<s1len+1; i++) {
        for(let j=0; j<s2len+1; j++) {
            const newval = (i === 0 || j === 0) ? 
                -op.G * (i + j) : 
                Math.max(mat.getValue(i-1,j) - op.G, mat.getValue(i-1,j-1) + mat.getValue(i,j), mat.getValue(i,j-1) - op.G);
            if (i > 0 && j > 0) {
                /*
                if( newval === mat[i-1][j] - op.G) direc[i][j].push(UP);
                if( newval === mat[i][j-1] - op.G) direc[i][j].push(LEFT);
                if( newval === mat[i-1][j-1] + mat[i][j]) direc[i][j].push(UL);
                */
                if( newval === mat.getValue(i-1,j) - op.G) direc.setValue(i,j,UP);
                else if( newval === mat.getValue(i,j-1) - op.G) direc.setValue(i,j,LEFT);
                else if( newval === mat.getValue(i-1,j-1) + mat.getValue(i,j)) direc.setValue(i,j,UL);
            }
            else {
                //direc[i][j].push((j === 0) ? UP : LEFT);
                direc.setValue(i,j, (j === 0) ? UP : LEFT);
            }
            mat.setValue(i,j,newval);
        }
    }
    // get result
    const chars = [[],[]];
    const gaps0 = [];
    var I = s1len;
    var J = s2len;
    //const max = Math.max(I, J);
    while(I > 0 || J > 0) {
        //switch (direc[I][J][0]) {
        switch (direc.getValue(I,J)) {
        case UP:
            I--;
            chars[0].unshift(s1arr[I]);
            chars[1].unshift('');
            break;
        case LEFT:
            J--;
            chars[0].unshift('');
            gaps0.push(chars[0].length);
            chars[1].unshift(s2arr[J]);
            break;
        case UL:
            I--;
            J--;
            chars[0].unshift(s1arr[I]);
            chars[1].unshift(s2arr[J]);
            break;
        default: break;
        }
    }

    return [...chars,gaps0];
};

export default needlemanWunsch;
