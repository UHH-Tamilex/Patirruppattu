const loadFile = async url => {
    //const res = await fetch(new URL(url, import.meta.url));
    const res = await fetch(new URL(url, import.meta.url));
    return await res.text();
};
/*
const lgXSLT = await loadFile('../xslt/lg.xsl');
*/

const makeProc = function(sheet) {
    const parser = new DOMParser();
    const xslsheet = parser.parseFromString(sheet,'text/xml');
    const xslt_proc = new XSLTProcessor();
    xslt_proc.importStylesheet(xslsheet);
    return xslt_proc;
};

const xslt = function(_state) {
    
    this.transformString = function(s,proc) {
        const temp = _state.xml.createElementNS(_state.teins,'ab');
        temp.innerHTML = s;
        //temp.setAttribute('xmlns','http://www.w3.org/1999/xhtml');
        return proc.transformToFragment(temp,document);
    };
	this.sheets = {};
    this.init = async () => {
		this.sheets.csv = makeProc(await loadFile('../xslt/csv.xsl'));
		this.sheets.xml = makeProc(await loadFile('../xslt/prettyprint.xsl'));
		this.sheets.matrix = makeProc(await loadFile('../xslt/matrix.xsl'))
		this.sheets.lemma = makeProc(await loadFile('../xslt/lemma.xsl'));
		this.sheets.lg = makeProc(await loadFile('../xslt/lg.xsl'));
		this.sheets.tree = makeProc(await loadFile('../xslt/tree.xsl'));
    };
};

export { xslt };
