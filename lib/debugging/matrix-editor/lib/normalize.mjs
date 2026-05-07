import Sanscript from '../saktumivalib/sanscript.mjs';
import { filters } from '../saktumivalib/normalize.mjs';

const replaceAll = function(filter, strs) {
    const vowels = ['a','ā','i','ī','u','ū','o','ō','O','e','ē','E','ṛ','ṝ','l̥','l̥̄'];
    const full = strs.join('');
    const newstrs = []; 
    const matches = [...full.matchAll(filter.seach_slpish || filter.search)];
    let start = 0;
    let remainder = null;
    for(const str of strs) {
        const end = start + str.length;
        let newstr = str;
        let offset = 0;

        if(remainder) {
            if(remainder.length <= str.length) {
                newstr = strSplice(str,0,remainder.length,remainder.text);
                offset = remainder.text.length - remainder.length;
                remainder = null;
            }
            else {
                const remhead = remainder.text.slice(0,str.length);
                newstr = remhead;
                const remtail = remainder.text.slice(str.length);
                remainder = {length: remainder.length - str.length, text: remtail};
                continue; // is this necessary?
            }
        }

        while(matches.length > 0  && matches[0].index < end) {
            const match = matches.shift();
            const matchstart = match.index - start + offset;
            const newtxt = filter.replace(match);

            if(match.index + match[0].length < end) {
                newstr = strSplice(newstr,matchstart,match[0].length,newtxt);
                offset = offset + newtxt.length - match[0].length;
            }
            else {
                const splitat = str.length - matchstart + offset;
                const newhead = newtxt.slice(0,splitat);
                newstr = newstr.slice(0,matchstart) + newhead;
                const newtail = newtxt.slice(splitat);

                if(vowels.includes(newtail)) { // add inherent vowel
                    newstr = newstr + newtail;
                }
                else {
                    const taillen = match[0].length - splitat;
                    remainder = {length: taillen, text: newtail};
                }
                // the while loop should end here
            }
        }
        newstrs.push(newstr);
        start = end;
    }
    return newstrs;
};

const strSplice = function(str,start,len,splice_in) {
    return str.slice(0,start) + splice_in + str.slice(start + len);
};

const filterAll = function(strs,filteropts) {
    const selectedfilters = [];
    for(const filter of filters) { 
      if(filteropts.hasOwnProperty('groups')) {
        if(filteropts.groups.includes(filter.group)) {
          if(filteropts.hasOwnProperty('names')) {
            if(filteropts.names.includes(filter.name)) 
              selectedfilters.push(filter);
          }
          else
            selectedfilters.push(filter);
        }
      }
      else selectedfilters.push(filter);
    }
    let retstrs = strs.map(s => Sanscript.t(s,'iast','slpish'));
    for(const filter of selectedfilters)
        retstrs = replaceAll(filter,retstrs);
    return retstrs.map(s => Sanscript.t(s,'slpish','iast'));
};

//console.log(Normalizer(['a','r','t','th','ī','s','ā','r','tth','o ','p','a','t','ś','a','l','ī','m','artthisārttho ','pagacchati']));
//console.log(Normalizer(['artthisārttho pārttho pārttho ','pārttho ','pagacchati']));

export default filterAll;
