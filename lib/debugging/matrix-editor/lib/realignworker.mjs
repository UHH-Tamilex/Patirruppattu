import MultiAligner from '../saktumivalib/multialign.mjs';

onmessage = function(e) {
    const ma = new MultiAligner(e.data[2],e.data[3]);
    const oldtexts = JSON.parse(e.data[0]);
    const toaddobjs = JSON.parse(e.data[1]);
    const res = ma.alignAppend(oldtexts,toaddobjs);
    postMessage(JSON.stringify(res));
};
