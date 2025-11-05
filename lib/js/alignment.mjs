const parseXML = (str) => {
    const parser = new DOMParser();
    const newd = parser.parseFromString(str,'text/xml');
    if(newd.documentElement.nodeName === 'parsererror')
        alert(`The XML file could not be loaded. Please contact your friendly local system administrator. Error: ${newd.documentElement.textContent}`);
    else
        return newd;
};

const XSLTransform = async function(xslsheet,doc) {
    // compile all xsl:imports to avoid browser incompatibilities
    
    for(const x of xslsheet.querySelectorAll('import')) {
        const resp = await fetch(x.getAttribute('href'));
        const i = parseXML(await resp.text());

        while(i.documentElement.firstChild)
            x.before(i.documentElement.firstChild);
        x.remove();
    }
    const xproc = new XSLTProcessor();
    xproc.importStylesheet(xslsheet);
    return xproc.transformToDocument(doc);
};

const alignmentXSLT = `<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:x="http://www.tei-c.org/ns/1.0" exclude-result-prefixes="x">
<xsl:output method="html"/>
<xsl:template match="x:teiCorpus">
    <xsl:element name="table"><xsl:apply-templates/></xsl:element>
</xsl:template>
<xsl:template match="x:teiHeader"/>
<xsl:template match="x:TEI">
    <xsl:apply-templates/>
</xsl:template>
<xsl:template match="x:text">
    <xsl:element name="tr">
        <xsl:element name="th">
            <xsl:variable name="n" select="../@n"/>
            <xsl:variable name="abbr" select="//x:witness[@xml:id=$n]/x:abbr"/>
            <xsl:choose>
                <xsl:when test="$abbr">
                    <xsl:value-of select="$abbr"/>
                </xsl:when>
                <xsl:otherwise>
                    <xsl:value-of select="$n"/>
                </xsl:otherwise>
            </xsl:choose>
        </xsl:element>
        <xsl:apply-templates/>
    </xsl:element>
</xsl:template>
<xsl:template match="x:cl">
    <xsl:apply-templates/>
</xsl:template>
<xsl:template match="x:w">
    <xsl:element name="td">
        <xsl:attribute name="data-n"><xsl:value-of select="@n"/></xsl:attribute>
        <xsl:choose>
            <xsl:when test="parent::x:cl">
                <xsl:choose>
                    <xsl:when test="position() = '1'">
                        <xsl:attribute name="class">lemma group-start</xsl:attribute>
                    </xsl:when>
                    <xsl:when test="position() = last()">
                        <xsl:attribute name="class">lemma group-end</xsl:attribute>
                    </xsl:when>
                    <xsl:otherwise>
                        <xsl:attribute name="class">lemma group-internal</xsl:attribute>
                    </xsl:otherwise>
                </xsl:choose>
            </xsl:when>
            <xsl:otherwise>
                <xsl:attribute name="class">lemma</xsl:attribute>
            </xsl:otherwise>
        </xsl:choose>
        <xsl:if test="@lemma">
            <xsl:attribute name="data-normal"><xsl:value-of select="@lemma"/></xsl:attribute>
        </xsl:if>
        <xsl:apply-templates/>
    </xsl:element>
</xsl:template>
</xsl:stylesheet>`;

const viewer = async function(url) {
    const resp = await fetch(url);
    const xdoc = parseXML(await resp.text());
    const xsheet = parseXML(alignmentXSLT);
    const hdoc = await XSLTransform(xsheet, xdoc);
    const blackout = document.createElement('div');
    blackout.id = 'alignment-blackout';
    const viewer = document.createElement('div');
    viewer.id='alignment-viewer';
    replaceHeaders(hdoc);
    viewer.append(hdoc.querySelector('table'));
    blackout.append(viewer);
    document.body.append(blackout);
    blackout.addEventListener('click',killViewer);
    viewer.addEventListener('mouseover',viewerMouseover);
};

const killViewer = (e) => {
    if(!e.target.closest('#alignment-viewer'))
        document.getElementById('alignment-blackout').remove();
};

const viewerMouseover = (e) => {
    const targ = e.target.closest('.lemma');
    if(!targ) return;
   
    const reading = targ.dataset.normal || targ.textContent;
    const table = document.getElementById('alignment-viewer').querySelector('table');
    const highlit = table.querySelectorAll('.highlit, .lightlit');
    for(const h of highlit)
        h.classList.remove('highlit','lightlit');
    const ns = table.querySelectorAll(`.lemma[data-n="${targ.dataset.n}"]`);
    for(const n of ns) {
        const nreading = n.dataset.normal || n.textContent;
        if(reading === nreading)
            n.classList.add('highlit');
        else
            n.classList.add('lightlit');
    }

};

const replaceHeaders = (doc) => {
    for(const th of doc.querySelectorAll('th')) {
        const wit = document.getElementById(th.textContent);
        if(wit) {
            const abbr = wit.querySelector('.msid');
            const abbrcopy = abbr.cloneNode(true);
            while(th.firstChild) th.firstChild.remove();
            th.appendChild(abbrcopy);
        }
    }
};

const AlignmentViewer = {
    viewer: viewer
};

export { AlignmentViewer };
