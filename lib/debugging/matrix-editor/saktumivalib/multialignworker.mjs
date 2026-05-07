import MultiAligner from './multialign.mjs';

onmessage = function(e) {
    const ma = new MultiAligner(e.data[1],e.data[2]);
    const res = ma.align(e.data[0]);
    postMessage(res);
};
