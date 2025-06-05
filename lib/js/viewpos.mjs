'use strict';

const viewPos = (function() {

    const set = function(par,middle) {
        if(!middle) return;
        const scrollpos = par.scrollTop + middle[0].getBoundingClientRect().top + middle[1] - window.innerHeight/2;
        par.scrollTo(0,scrollpos);
    };

    const get = function(par) {
        const els = par.querySelectorAll('div');
        //const els = par.querySelectorAll('#summary,tr,span.milestone,span.lb,span.locus');
        var midEl = null;
        var lastDist;
        var currDist = null;
        const ellen = els.length;
        for(let i=0;i<ellen;i++) {
            lastDist = currDist;
            currDist = window.innerHeight/2 - els[i].getBoundingClientRect().top;
            if(lastDist !== null && Math.abs(currDist) > Math.abs(lastDist)) {
                midEl = els[i-1];
                currDist = lastDist;
                break;
            }
        }
        if(midEl === null)
            midEl = els[ellen-1];
        return [midEl,currDist];
    };

    return Object.freeze({
        getVP: get,
        setVP: set
    });

}());

export { viewPos };
