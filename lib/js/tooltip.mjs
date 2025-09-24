const _state = {
    tooltipTimeout: null
};

const Events = {
    docMouseover: (e) => {
        const go = e => {
            var targ = e.target.closest('[data-anno]');
            while(targ && targ.hasAttribute('data-anno')) {
               
                //ignore if apparatus is already on the side
                if(document.querySelector('.record.fat') && 
                   targ.classList.contains('app-inline') &&
                   !targ.closest('.teitext').querySelector('.diplo') ) {
                    targ = targ.parentNode;
                    continue;
                }

                ToolTip.make(e,targ);
                targ = targ.parentNode;
            }
        };

        if(document.getElementById('tooltip'))
            go(e);
        else {
            clearTimeout(_state.tooltipTimeout);
            _state.tooltipTimeout = setTimeout(() => {
                go(e);
            },300);
        }

    }
};

const ToolTip = {
    make: function(e,targ) {
        const toolText = targ.dataset.anno || targ.querySelector(':scope > .anno-inline')?.cloneNode(true);
        if(!toolText) return;

        var tBox = document.getElementById('tooltip');
        const tBoxDiv = document.createElement('div');

        if(tBox) {
            for(const kid of tBox.childNodes) {
                if(kid.myTarget === targ)
                    return;
            }
            tBoxDiv.appendChild(document.createElement('hr'));
        }
        else {
            tBox = document.createElement('div');
            tBox.id = 'tooltip';
            //tBox.style.opacity = 0;
            //tBox.style.transition = 'opacity 0.2s ease-in';
            document.body.appendChild(tBox);
            tBoxDiv.myTarget = targ;
        }

        tBox.style.top = (e.clientY + 10) + 'px';
        tBox.style.left = (e.clientX + 1) + 'px';
        tBoxDiv.append(toolText);
        tBoxDiv.myTarget = targ;
        tBox.appendChild(tBoxDiv);
        const ydiff = tBox.getBoundingClientRect().bottom - document.documentElement.clientHeight;
        if(ydiff > 0)
            tBox.style.top = (e.clientY - ydiff + 10) + 'px';
        targ.addEventListener('mouseleave',ToolTip.remove,{once: true});

        //window.getComputedStyle(tBox).opacity;
        //tBox.style.opacity = 1;
        tBox.animate([
            {opacity: 0 },
            {opacity: 1, easing: 'ease-in'}
            ], 200);
        
    },
    remove: function(e) {
        clearTimeout(_state.tooltipTimeout);

        const tBox = document.getElementById('tooltip');
        if(!tBox) return;

        if(tBox.children.length === 1) {
            tBox.remove();
            return;
        }

        const targ = e.target;
        for(const kid of tBox.childNodes) {
            if(kid.myTarget === targ) {
                kid.remove();
                break;
            }
        }
        if(tBox.children.length === 1) {
            const kid = tBox.firstChild.firstChild;
            if(kid.tagName === 'HR')
                kid.remove();
        }
    },
};

document.addEventListener('mouseover',Events.docMouseover);
document.addEventListener('click',ToolTip.remove);
