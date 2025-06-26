const removeHyphens = ev => {
    if(ev.target.closest('textarea'))
        return; 
    ev.preventDefault();
    const hyphenRegex = new RegExp('\u00AD','g');
    const sel = window.getSelection().toString().replaceAll(hyphenRegex,'');
    (ev.clipboardData || window.clipboardData).setData('Text',sel);
};

document.addEventListener('copy',removeHyphens);
