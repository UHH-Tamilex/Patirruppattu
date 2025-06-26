const Annotator = {};

const colourList = {
    'nominal': {
        'pronominalised noun': { colour: '#ef3b2c'},
        'participial noun': { colour: '#cb181d'},
        'noun': { colour: '#99000d'},
        'root noun': { colour: '#99000d'},
        'verbal noun': { colour: '#99000d'},
        'pronoun': {colour: '#99000d'}
    },
    'adjectival': {
        'verbal root as adjective': { colour: '#fcbba1'},
        'adjective': { colour: '#fc9272'},
        'peyareccam': { colour: '#fb6a4a'}
        },
    'finite verb': {
        'conditional': { checked: true,  colour: '#dadaeb'},
        'optative': { checked: true,  colour: '#bcbddc'},
        'subjunctive': { checked: true,  colour: '#9e9ac8'},
        'imperative': { checked: true,  colour: '#807dba'},
        'verbal root as imperative': { checked: true,  colour: '#807dba'},
        'habitual future': { checked: true,  colour: '#6a51a3'},
        'perfective aspect': { checked: true,  colour: '#4a1486',
            selector: '.role_first_person.role_perfective_aspect:not(.role_participial_noun), .role_second_person.role_perfective_aspect:not(.role_participial_noun), .role_third_person.role_perfective_aspect:not(.role_participial_noun)'},
        'imperfective aspect': { checked: true,  colour: '#4a1486',
            selector: '.role_first_person.role_imperfective_aspect:not(.role_participial_noun), .role_second_person.role_imperfective_aspect:not(.role_participial_noun), .role_third_person.role_imperfective_aspect:not(.role_participial_noun)'},
        'negative': { checked: true,  colour: '#4a1486',
            selector: '.role_first_person.role_negative_aspect:not(.role_participial_noun), .role_second_person.role_negative_aspect:not(.role_participial_noun), .role_third_person.role_negative_aspect:not(.role_participial_noun)'}
    },
    'non-finite verb': {
        'absolutive': { checked: true,  colour: '#9ecae1'},
        'verbal root as absolutive': { checked: true,  colour: '#9ecae1'},
        'infinitive': { checked: true,  colour: '#3182bd'},
        'verbal root as infinitive': { checked: true,  colour: '#3182bd'},
    }
};

Annotator.init = () => {
    const wsbutton = document.getElementById('wordsplitbutton');
    if(wsbutton) {
        const optionssvg = document.createElementNS('http://www.w3.org/2000/svg','svg');
        optionssvg.id = 'optionssvg';
        optionssvg.setAttribute('viewBox','0 0 33.866667 128');
        optionssvg.innerHTML = ' <g inkscape:label="Layer 1" inkscape:groupmode="layer" id="layer1" transform="translate(0,-169)"> <path style="fill:#000000;fill-opacity:1;fill-rule:nonzero;stroke:#1a1313;stroke-width:7.24876738;stroke-linecap:square;stroke-linejoin:miter;stroke-miterlimit:4.5;stroke-dasharray:none;stroke-opacity:0.99184781;paint-order:stroke fill markers" d="M 64 7.8710938 A 56.127251 56.127251 0 0 0 54.222656 8.7421875 C 54.227896 13.278668 54.163532 17.918156 53.234375 22.035156 A 43.35857 43.35857 0 0 0 33.269531 33.455078 C 29.252324 32.170768 25.222043 29.878875 21.316406 27.578125 A 56.127251 56.127251 0 0 0 11.308594 44.869141 C 15.226296 47.125851 19.193019 49.495849 22.28125 52.349609 A 43.35857 43.35857 0 0 0 20.642578 64 A 43.35857 43.35857 0 0 0 22.166016 75.357422 C 19.057264 78.178582 15.078982 80.510682 11.152344 82.732422 A 56.127251 56.127251 0 0 0 21.074219 100.07227 C 24.978728 97.812586 29.004714 95.565903 33.011719 94.314453 A 43.35857 43.35857 0 0 0 52.90625 105.86133 C 53.806255 109.98163 53.838257 114.6176 53.798828 119.15234 A 56.127251 56.127251 0 0 0 64 120.12891 A 56.127251 56.127251 0 0 0 73.777344 119.25781 C 73.772144 114.72133 73.836661 110.08182 74.765625 105.96484 A 43.35857 43.35857 0 0 0 94.730469 94.542969 C 98.747989 95.827329 102.77749 98.120745 106.68359 100.42188 A 56.127251 56.127251 0 0 0 116.69141 83.130859 C 112.77417 80.874359 108.80873 78.503501 105.7207 75.650391 A 43.35857 43.35857 0 0 0 107.35938 64 A 43.35857 43.35857 0 0 0 105.83398 52.642578 C 108.94274 49.821418 112.92102 47.489318 116.84766 45.267578 A 56.127251 56.127251 0 0 0 106.92578 27.927734 C 103.02215 30.186744 98.996336 32.432154 94.990234 33.683594 A 43.35857 43.35857 0 0 0 75.09375 22.138672 C 74.193552 18.018362 74.161722 13.382406 74.201172 8.8476562 A 56.127251 56.127251 0 0 0 64 7.8710938 z M 64 35.033203 A 28.96616 28.96616 0 0 1 92.966797 64 A 28.96616 28.96616 0 0 1 64 92.966797 A 28.96616 28.96616 0 0 1 35.033203 64 A 28.96616 28.96616 0 0 1 64 35.033203 z " transform="translate(-47.066666,169)" id="path824" /> </g>';
        wsbutton.appendChild(optionssvg);
        optionssvg.addEventListener('mouseenter',Annotator.showOptions);
        optionssvg.addEventListener('mouseleave',Annotator.hideOptions);

        wsbutton.addEventListener('click',Annotator.setAnnotated);
    }

    const optionsbox = document.createElement('div');
    optionsbox.id = 'optionsbox';
    let optionsstr = '';
    for(const fieldset in colourList) {
        let str1 = '';
        let unchecked = false;
        for(const key in colourList[fieldset]) {
            const id = key.replaceAll(/\s+/g,'_');
            const name = colourList[fieldset][key].hasOwnProperty('selector') ?
                colourList[fieldset][key].selector :
                `.role_${id}`;

            str1 = str1 + `<input type="checkbox" id="${id}" name="${name}" ${colourList[fieldset][key].checked ? 'checked' : ''}><label for="${id}"><span style="color: ${colourList[fieldset][key].colour};">●</span>${key}</label>`;
            if(!colourList[fieldset][key].checked) unchecked = true;
        }
        optionsstr = optionsstr + `<fieldset><legend ${!unchecked ? 'style="font-weight: bold"' : ''}>${fieldset}</legend>` + str1 + '</fieldset>';
    }
    optionsbox.innerHTML = optionsstr;
    document.getElementById('topbar').appendChild(optionsbox);
    optionsbox.addEventListener('click',Annotator.updateOptions);
    optionsbox.addEventListener('mouseenter',Annotator.cancelTimeout);
    optionsbox.addEventListener('mouseleave',Annotator.hideOptions);
};

Annotator.css = `
#optionsbox {
    position: absolute;
    display: none;
    left: 10px;
    top: 65px;
    border: 1px solid black;
    border-radius: 3px;
    padding: 1rem;
    background: rgba(255,255,248,0.6);
    backdrop-filter: blur(5px) saturate(150%);
    
}
#optionsbox legend {
    cursor: default;
}
#optionsbox legend:hover {
    background-color: yellow;
}

#optionssvg {
    width: 10px;
    height: 10px;
    position: absolute;
    left: 22px;
    top: 0;
}

/*#wordsplitsvg,*/ #optionssvg {
    filter: invert(54%) sepia(18%) saturate(865%) hue-rotate(174deg) brightness(95%) contrast(88%);
}

#optionssvg:hover {
    filter: invert(50%) sepia(69%) saturate(3929%);
}

.annotated .word {
    border-radius: 3px;
    padding: 0 2px 0 2px;
}

/* noun-ish (peyar, peyareccam) */
.annotated .role_verbal_root_as_adjective {
    border: 0px solid #fcbba1;
}
.annotated .role_adjective {
    border: 0px solid #fc9272;
}
.annotated .role_peyareccam {
    border: 0px solid #fb6a4a;
}
.annotated .role_pronominalised_noun {
    border: 0px solid #ef3b2c;
}
.annotated .role_participial_noun {
    border: 0px solid #cb181d;
}
.annotated .role_noun,
.annotated .role_root_noun,
.annotated .role_verbal_noun,
.annotated .role_pronoun,
.annotated .role_proper_name {
    border: 0px solid #99000d;
}

/* finite verb */
 
.annotated .role_conditional {
    border: 0px solid #dadaeb;
}
.annotated .role_optative {
    border: 0px solid #bcbddc;
}
.annotated .role_subjunctive {
    border: 0px solid #9e9ac8;
}
.annotated .role_imperative,
.annotated .role_verbal_root_as_imperative {
    border: 0px solid #807dba;
}
.annotated .role_habitual_future {
    border: 0px solid #6a51a3;
}
.annotated .role_first_person.role_perfective_aspect:not(.role_participial_noun),
.annotated .role_first_person.role_imperfective_aspect:not(.role_participial_noun),
.annotated .role_first_person.role_negative:not(.role_participial_noun),
.annotated .role_second_person.role_perfective_aspect:not(.role_participial_noun),
.annotated .role_second_person.role_imperfective_aspect:not(.role_participial_noun),
.annotated .role_second_person.role_negative:not(.role_participial_noun),
.annotated .role_third_person.role_perfective_aspect:not(.role_participial_noun),
.annotated .role_third_person.role_imperfective_aspect:not(.role_participial_noun),
.annotated .role_third_person.role_negative:not(.role_participial_noun) {
    border: 0px solid #4a1486;
}

/* non-finite verb */

.annotated .role_absolutive,
.annotated .role_verbal_root_as_absolutive {
    border: 0px solid #9ecae1;
}
.annotated .role_infinitive,
.annotated .role_verbal_root_as_infinitive {
    border: 0px solid #3182bd;
}
/*
.annotated .role_verbal_root {
    border: 0px solid #2171b5;
}
*/

.annotated .on {
    border-width: 2px !important;
}
`;

Annotator.setAnnotated = () => {
    const getEdition = s => {
        const t = document.getElementById(s.dataset.corresp.replace(/^#/,''));
        return t.querySelector('.edition') || t;
    };

    const standoffs = document.querySelectorAll('.standOff[data-type="wordsplit"]');
    for(const standoff of standoffs) {
        const edition = getEdition(standoff);
        edition.classList.add('annotated');
    }
    for(const option of document.getElementById('optionsbox').querySelectorAll('input')) {
        const selector = option.name;
        for(const el of document.querySelectorAll(selector)) {
            if(option.checked)
                el.classList.add('on');
            else
                el.classList.remove('on');
        }
    }
};
Annotator.showOptions = e => {
    document.getElementById('optionsbox').style.display = 'block';
};
Annotator.hideTimeout = null;
Annotator.cancelTimeout = () => {
    clearTimeout(Annotator.hideTimeout);
    Annotator.hideTimeout = null;
};
Annotator.hideOptions = () => {
    if(Annotator.hideTimeout)
        Annotator.cancelTimeout();
    Annotator.hideTimeout = setTimeout(() => {
        document.getElementById('optionsbox').style.display = 'none';
    },100);
};
Annotator.updateOptions = e => {
    const legend = e.target.closest('legend');
    if(legend) {
        if(legend.style.fontWeight === 'bold') {
            for(const input of e.target.parentNode.querySelectorAll('input')) {
                input.checked = false;
            }
            legend.style.fontWeight = 'normal';
        }
        else {
            for(const input of e.target.parentNode.querySelectorAll('input')) {
                input.checked = true;
            }
            legend.style.fontWeight = 'bold';
        }
    }
    Annotator.setAnnotated();
};

export default Annotator;
