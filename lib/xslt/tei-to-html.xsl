<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" 
                xmlns:exsl="http://exslt.org/common"
                xmlns:x="http://www.tei-c.org/ns/1.0"
                xmlns:tst="https://github.com/tst-project"
                exclude-result-prefixes="x tst">

<xsl:import href="copy.xsl"/>
<xsl:import href="functions.xsl"/>
<xsl:import href="definitions.xsl"/>
<xsl:import href="common.xsl"/>
<xsl:import href="teiheader.xsl"/>
<xsl:import href="transcription.xsl"/>
<xsl:import href="apparatus.xsl"/>

<xsl:output method="html" encoding="UTF-8" omit-xml-declaration="yes"/>

<xsl:param name="root">https://tst-project.github.io/lib/</xsl:param>

<xsl:template name="TEI">
    <xsl:element name="html">
        <xsl:element name="head">
            <xsl:element name="meta">
                <xsl:attribute name="charset">utf-8</xsl:attribute>
            </xsl:element>
            <xsl:element name="meta">
                <xsl:attribute name="name">viewport</xsl:attribute>
                <xsl:attribute name="content">width=device-width,initial-scale=1</xsl:attribute>
            </xsl:element>
            <xsl:element name="title">
                <xsl:value-of select="//x:titleStmt/x:title"/>
            </xsl:element>
            <xsl:element name="link">
                <xsl:attribute name="rel">icon</xsl:attribute>
                <xsl:attribute name="type">image/png</xsl:attribute>
                <xsl:attribute name="href"><xsl:value-of select="$root"/>img/favicon-32.png</xsl:attribute>
            </xsl:element>
            <xsl:element name="link">
                <xsl:attribute name="rel">stylesheet</xsl:attribute>
                <xsl:attribute name="href"><xsl:value-of select="$root"/>css/tufte.css</xsl:attribute>
            </xsl:element>
            <xsl:element name="link">
                <xsl:attribute name="rel">stylesheet</xsl:attribute>
                <xsl:attribute name="href"><xsl:value-of select="$root"/>css/fonts.css</xsl:attribute>
            </xsl:element>
            <xsl:element name="link">
                <xsl:attribute name="rel">stylesheet</xsl:attribute>
                <xsl:attribute name="href"><xsl:value-of select="$root"/>css/tst.css</xsl:attribute>
            </xsl:element>
            <xsl:element name="link">
                <xsl:attribute name="rel">stylesheet</xsl:attribute>
                <xsl:attribute name="href"><xsl:value-of select="$root"/>css/header.css</xsl:attribute>
            </xsl:element>
            <xsl:element name="link">
                <xsl:attribute name="rel">stylesheet</xsl:attribute>
                <xsl:attribute name="href"><xsl:value-of select="$root"/>css/transcription.css</xsl:attribute>
            </xsl:element>
            <xsl:element name="link">
                <xsl:attribute name="rel">stylesheet</xsl:attribute>
                <xsl:attribute name="href"><xsl:value-of select="$root"/>css/apparatus.css</xsl:attribute>
            </xsl:element>
            <!--xsl:element name="script">
                <xsl:attribute name="type">text/javascript</xsl:attribute>
                <xsl:attribute name="src"><xsl:value-of select="$root"/>js/sanscript.js</xsl:attribute>
            </xsl:element>
            <xsl:element name="script">
                <xsl:attribute name="type">text/javascript</xsl:attribute>
                <xsl:attribute name="src"><xsl:value-of select="$root"/>js/transliterate.js</xsl:attribute>
            </xsl:element>
            <xsl:element name="script">
                <xsl:attribute name="type">text/javascript</xsl:attribute>
                <xsl:attribute name="src"><xsl:value-of select="$root"/>js/viewpos.js</xsl:attribute>
            </xsl:element>
            <xsl:element name="script">
                <xsl:attribute name="type">text/javascript</xsl:attribute>
                <xsl:attribute name="src"><xsl:value-of select="$root"/>js/hypher-nojquery.js</xsl:attribute>
            </xsl:element>
            <xsl:element name="script">
                <xsl:attribute name="type">text/javascript</xsl:attribute>
                <xsl:attribute name="src"><xsl:value-of select="$root"/>js/sa.js</xsl:attribute>
            </xsl:element>
            <xsl:element name="script">
                <xsl:attribute name="type">text/javascript</xsl:attribute>
                <xsl:attribute name="src"><xsl:value-of select="$root"/>js/ta.js</xsl:attribute>
            </xsl:element>
            <xsl:element name="script">
                <xsl:attribute name="type">text/javascript</xsl:attribute>
                <xsl:attribute name="src"><xsl:value-of select="$root"/>js/ta-Latn.js</xsl:attribute>
            </xsl:element-->
            <!--xsl:element name="script">
                <xsl:attribute name="type">text/javascript</xsl:attribute>
                <xsl:attribute name="src"><xsl:value-of select="$root"/>js/mirador.js</xsl:attribute>
            </xsl:element-->
            <!--xsl:element name="script">
                <xsl:attribute name="type">text/javascript</xsl:attribute>
                <xsl:attribute name="src">../lib/js/tst.js</xsl:attribute>
            </xsl:element-->
            <xsl:element name="script">
                <xsl:attribute name="type">module</xsl:attribute>
                <xsl:text>import { TSTViewer } from '</xsl:text>
                <xsl:value-of select="$root"/>
                <xsl:text>js/tst.mjs';
                window.addEventListener('load',TSTViewer.init);
                </xsl:text>
                <xsl:variable name="annos" select="x:teiHeader/x:xenoData[@type='webannotation']"/>
                <xsl:if test="$annos">
                        <xsl:text>TSTViewer.setAnnotations(</xsl:text>
                        <xsl:value-of select="$annos"/>
                        <xsl:text>);</xsl:text>
                </xsl:if>
            </xsl:element>
        </xsl:element>
        <xsl:element name="body">
            <xsl:attribute name="lang">en</xsl:attribute>   
            <xsl:element name="div">
                <xsl:attribute name="id">recordcontainer</xsl:attribute>
                <xsl:element name="div">
                    <xsl:choose>
                        <xsl:when test="x:facsimile/x:graphic">
                            <xsl:attribute name="class">record thin</xsl:attribute>
                        </xsl:when>
                        <xsl:otherwise>
                            <xsl:attribute name="class">record fat</xsl:attribute>
                        </xsl:otherwise>
                    </xsl:choose>
                    <xsl:element name="div">
                        <xsl:attribute name="id">topbar</xsl:attribute>
                        <div id="buttoncontainer">
                        <xsl:element name="div">
                            <xsl:attribute name="id">transbutton</xsl:attribute>
                            <xsl:attribute name="data-anno">change script</xsl:attribute>
                            <xsl:text>A</xsl:text>
                        </xsl:element>
                        </div>
                    </xsl:element>
                    <xsl:element name="article">
                        <xsl:apply-templates/>
                    </xsl:element>
                </xsl:element>
            </xsl:element>
            <xsl:variable name="manifest" select="x:facsimile/x:graphic/@url"/>
            <xsl:if test="$manifest">
                <div id="togglers">
                    <div id="recordtoggle" class="toggle" title="hide text">&gt;</div>
                    <div id="rotator" title="rotate">↺</div>
                    <div id="viewertoggle" class="toggle" title="hide images">&lt;</div>
                </div>  
                <xsl:element name="div">
                    <xsl:attribute name="id">viewer</xsl:attribute>
                    <xsl:attribute name="data-manifest">
                        <xsl:value-of select="$manifest"/>
                    </xsl:attribute>
                    <xsl:variable name="start" select="x:facsimile/x:graphic/@facs"/>
                    <xsl:attribute name="data-start">
                        <xsl:choose>
                            <xsl:when test="$start"><xsl:value-of select="$start - 1"/></xsl:when>
                            <xsl:otherwise>0</xsl:otherwise>
                        </xsl:choose>
                    </xsl:attribute>
                </xsl:element>
            </xsl:if>
        </xsl:element>
    </xsl:element>
</xsl:template>

</xsl:stylesheet>
