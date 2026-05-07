const similarityMatrix = (arrs, n) => {
    const grams = arrs.map(arr => [arr[0], ngrams(arr[1],n)]);
    const collated = collateGrams(grams);
    tfidf(collated);

    //const sortedheader = sortGrams(collated);
    //return gramsToCsv({header: sortedheader, rows: collated.rows});
    return cosineSimilarity(collated.rows);
};

const distanceMatrix = (arrs, n) => {
    const grams = arrs.map(arr => [arr[0], ngrams(arr[1],n)]);
    const collated = collateGrams(grams);
    tfidf(collated);
    return cosineSimilarity(collated.rows, true);
};
const ngrams = (arr, n) => {
    n = parseInt(n);
    const grams = [];
    for(let i=0; i < arr.length - n - 1; i++) {
        const sub = [];
        for(let j=i; j < i + n; j++)
            sub.push(Array.isArray(arr[j]) ? arr[j].join('') : arr[j]);
        grams.push(sub.join(' '));
    }
    const ret = new Map();
    for(const gram of grams) {
        const inmap = ret.get(gram);
        if(inmap)
            ret.set(gram,inmap + 1);
        else
            ret.set(gram,1);
    }
    return ret;
};

/*
 * @param {Array.<{siglum: string, data: Map}>} objs
 */
const collateGrams = (arrs) => {
    const collated = {header: new Set(), rows: []};
    for(const arr of arrs) {
        for(const newkey of arr[1].keys())
            collated.header.add(newkey);
        collated.rows.push(arr);
    }
    return collated;
};

const tfidf = (obj) => {
    const docs = obj.rows.length;
    const idf = new Map();
    for(const heading of obj.header) {
        let count = 0;
        for(const row of obj.rows) {
            if(row[1].has(heading))
                count = count + 1;
        }
        idf.set(heading,Math.log(docs/count));

        for(const row of obj.rows) {
            const data = row[1].get(heading);
            if(!data) continue;
            const newdata = Math.log(1 + data) * idf.get(heading);
            row[1].set(heading,newdata);
        }
    }

};

const sortGrams = (obj) => {
    const ordered = [];
    for(const gram of obj.header) {
        let count = 0;
        for(const row of obj.rows) {
            const cellcount = row[1].get(gram) || 0;
            count = count + cellcount;
        }
        ordered.push([gram,Math.log(count)]);
    }
    ordered.sort((a,b) => b[1] - a[1]);
    return ordered.map(arr => arr[0]);
};

const gramsToCsv = (obj) => {
    const headings = [...obj.header];
    const csv = [','+headings.map(h => `"${h}"`).join(',')];

    for(const row of obj.rows) {
        const ret = [];
        ret.push(row.siglum);
        for(const heading of headings)
            ret.push(row.data.get(heading) || 0);
        csv.push(ret.join(','));
    }
    return csv.join('\n');
};
/*
const cosineSimilarity = (objs) => {
    const ret = new Map();
    for(let n=0;n<objs.length-1;n++) {
        for(let m=n+1;m<objs.length;m++) {
            const [arr1, arr2] = normalizeArrays(objs[n].data, objs[m].data);
            const similarity = cosinesim(arr1,arr2);
            if(similarity === 0) continue;
            const sigla = [objs[n].siglum,objs[m].siglum];
            sigla.sort();
            ret.set(sigla.join(':'), similarity);
        }
    }
    return ret;
};
*/

const cosineSimilarity = (arrs,distance = false) => {
    const ret = new Array(arrs.length);
    for(let i=0; i< ret.length; i++)
        ret[i] = Array(arrs.length).fill(1);
    for(let n=0;n<arrs.length-1;n++) {
        for(let m=n+1;m<arrs.length;m++) {
            const [arr1, arr2] = normalizeArrays(arrs[n][1], arrs[m][1]);
            const similarity = cosinesim(arr1,arr2);
            ret[n][m] = distance ? 1 - similarity : similarity;
            ret[m][n] = ret[n][m];
        }
    }
    return ret;
};
const normalizeArrays = (map1, map2) => {
    let ret1 = [];
    let ret2 = [];
    for(const [key, val] of map1) {
        ret1.push(val);
        ret2.push(map2.get(key) || 0);
    }
    for(const [key, val] of map2) {
        if(map1.has(key)) continue;
        ret2.push(val);
        ret1.push(0);
    }
    if(ret1.length !== ret2.length) throw new Error('Error!');

    return [ret1, ret2];
};
const cosinesim = (arr1, arr2) => {
    let dotprod = 0;
    let m1 = 0;
    let m2 = 0;
    for(let i=0; i < arr1.length; i++) {
        dotprod = dotprod + (arr1[i] * arr2[i]);
        m1 = m1 + (arr1[i] * arr1[i]);
        m2 = m2 + (arr2[i] * arr2[i]);
    }

    if(m1 === 0 || m2 === 0) return 0; // something went wrong here

    return dotprod / (Math.sqrt(m1) * Math.sqrt(m2));
};
export { distanceMatrix, similarityMatrix };
