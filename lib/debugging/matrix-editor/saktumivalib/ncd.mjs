//import * as fflate from 'https://cdn.skypack.dev/fflate@0.8.2?min';
import * as fflate from './fflate.mjs';

const distanceMatrix = arrs => {
  const comps = new Map();
  for(const arr of arrs) {
    const buf = fflate.strToU8(arr[1].flat(2).join(''));
    const res = fflate.deflateSync(buf,{level: 9});
    comps.set(arr[0],res.length);
  } 
  const ret = [];
  for(let n=0;n<arrs.length;n++) ret.push([]);

  for(const [n,arr1] of arrs.entries()) {
    for(const [m,arr2] of arrs.entries()) {
      const buf = fflate.strToU8(arr1[1].flat(2).join('') + arr2[1].flat(2).join(''));
      const res = fflate.deflateSync(buf,{level: 9});
      const s1 = comps.get(arr1[0]);
      const s2 = comps.get(arr2[0]);
      ret[n][m] = (res.length - Math.min(s1,s2)) / Math.max(s1,s2);
    }
  }
  return ret;
};

export { distanceMatrix };
