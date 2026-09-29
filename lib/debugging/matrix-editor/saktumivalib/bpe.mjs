const bpe = (arrarr,iterations = 600) => {
  let n = 0;
  while(n < iterations) {
    const {newarr: newarr, max: max} = bpe1(arrarr);
    if(max === 1) return newarr;
    arrarr = newarr;
    n = n + 1;
  }
  return arrarr;
};

const bpe1 = arrarr => {
  const statmap = new Map();
  // count
  for(const arr of arrarr) {
    for(let n=0;n<arr.length-1;n++) {
      const gram = [arr[n],arr[n+1]].flat(2).join(''); // in case arr[n] is ['k','ṣ','a'], etc.
      let obj = statmap.get(gram);
      if(!obj) { obj = {count: 0, places: [], grams: [arr[n],arr[n+1]]}; statmap.set(gram, obj); }
      obj.count = obj.count + 1;
      obj.places.push({arr: arr,n: n});
    }
  }
  const max = [...statmap].reduce((acc,cur) => 
    cur[1].count > acc[1].count ? 
      cur : 
      acc,
    [null, {count: 0}]);
   
  if(max[1].count === 1) return {newarr: arrarr, max: 1};

  // merge
  for(const place of max[1].places) {
    place.arr[place.n] = max[0];
    place.arr[place.n + 1] = null;
  }
  const newarr = [];
  for(const arr of arrarr)
    newarr.push(arr.filter(a => a !== null));
  return {newarr: newarr, max: max[1].count};
};

export default bpe;
