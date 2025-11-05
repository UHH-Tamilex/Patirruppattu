<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" 
                xmlns:exsl="http://exslt.org/common"
                xmlns:x="http://www.tei-c.org/ns/1.0"
                xmlns:tst="https://github.com/tst-project"
                exclude-result-prefixes="x tst">

<xsl:output method="html" encoding="UTF-8" omit-xml-declaration="yes" indent="no"/>

<xsl:template match="x:standOff">
    <xsl:element name="table">
        <xsl:element name="thead">
            <th>Tamil</th><th>English</th><th>grammar</th><th>particle</th>
        </xsl:element>
        <xsl:element name="tbody">
            <xsl:apply-templates/>
        </xsl:element>
    </xsl:element>
</xsl:template>

<xsl:template match="x:interp"/>
<xsl:template match="x:superEntry">
    <xsl:apply-templates/>
</xsl:template>
<xsl:template match="x:superEntry/x:entry">
    <xsl:apply-templates>
        <xsl:with-param name="super">superEntry</xsl:with-param>
    </xsl:apply-templates>
</xsl:template>

<xsl:template match="x:entry">
    <xsl:param name="super"/>
    <xsl:element name="tr">
      <xsl:if test="@type">
        <xsl:attribute name="class"><xsl:value-of select="@type"/></xsl:attribute>
      </xsl:if>
      <xsl:element name="th">
            <xsl:if test="$super = 'superEntry'">
              <xsl:attribute name="class">superEntry</xsl:attribute>
            </xsl:if>
            <xsl:attribute name="lang">ta-Latn</xsl:attribute>
            <xsl:choose>
                <xsl:when test="x:form[@type='simple']">
                    <xsl:apply-templates select="x:form[@type='simple']"/>
                </xsl:when>
                <xsl:otherwise>
                    <xsl:apply-templates select="x:form[1]"/>
                    <!--xsl:variable name="form"><xsl:value-of select="x:form"/></xsl:variable>
                    <xsl:value-of select="translate($form,'~+()','')"/-->
                </xsl:otherwise>
            </xsl:choose>
            <xsl:apply-templates select="x:note"/>
        </xsl:element>
        <xsl:element name="td">
            <xsl:element name="span">
            <xsl:attribute name="contenteditable">true</xsl:attribute>
            <xsl:attribute name="spellcheck">true</xsl:attribute>
                <xsl:apply-templates select="x:def"/>
            </xsl:element>
            <xsl:text> </xsl:text>
        </xsl:element>
        <xsl:element name="td">
            <xsl:attribute name="class">gramGrp</xsl:attribute>
            <xsl:apply-templates select="x:gramGrp[not(@type)]"/>
        </xsl:element>
        <xsl:element name="td">
            <xsl:attribute name="lang">ta-Latn</xsl:attribute>
            <xsl:apply-templates select="x:gramGrp[@type='particle']"/>
        </xsl:element>
    </xsl:element>
</xsl:template>

<xsl:template match="x:pc"/>
<xsl:template match="x:c">
    <xsl:if test="@type='elided' or @type='uncertain'">
        <xsl:apply-templates/>
    </xsl:if>
</xsl:template>

<xsl:template name="repeat">
    <xsl:param name="output" />
    <xsl:param name="count" />
    <xsl:if test="$count &gt; 0">
        <xsl:value-of select="$output" />
        <xsl:call-template name="repeat">
            <xsl:with-param name="output" select="$output" />
            <xsl:with-param name="count" select="$count - 1" />
        </xsl:call-template>
    </xsl:if>
</xsl:template>
<xsl:template match="x:gap | x:damage">
    <xsl:element name="span">
        <xsl:attribute name="lang">en</xsl:attribute>
        <xsl:attribute name="class">
            <xsl:value-of select="local-name()"/>
            <xsl:if test="@reason='ellipsis'">
                <xsl:text> ellipsis</xsl:text>
            </xsl:if>
        </xsl:attribute>
        <xsl:attribute name="data-anno">
            <xsl:text>gap</xsl:text>
                <xsl:choose>
                    <xsl:when test="@quantity">
                        <xsl:text> of </xsl:text><xsl:value-of select="@quantity"/>
                        <xsl:choose>
                        <xsl:when test="@unit">
                        <xsl:text> </xsl:text><xsl:value-of select="@unit"/>
                        </xsl:when>
                        <xsl:otherwise>
                        <xsl:text> akṣara</xsl:text>
                        </xsl:otherwise>
                        </xsl:choose>
                            <xsl:if test="@quantity &gt; '1'">
                                <xsl:text>s</xsl:text>
                            </xsl:if>
                    </xsl:when>
                    <xsl:when test="@extent">
                        <xsl:text> of </xsl:text><xsl:value-of select="@extent"/>
                    </xsl:when>
                </xsl:choose>
                <xsl:if test="@reason | @agent">
                    <xsl:text> (</xsl:text>
                    <xsl:value-of select="@reason"/>
                    <xsl:if test="@reason and @agent">
                        <xsl:text>, </xsl:text>
                    </xsl:if>
                    <xsl:value-of select="@agent"/>
                    <xsl:text>)</xsl:text>
                </xsl:if>
        </xsl:attribute>
        <xsl:variable name="spacechar">
            <xsl:choose>
                <xsl:when test="@reason='ellipsis'">…</xsl:when>
                <xsl:when test="@reason='lost'">‡</xsl:when>
                <xsl:otherwise>?</xsl:otherwise>
            </xsl:choose>
        </xsl:variable>
        <xsl:variable name="extentnum" select="translate(@extent,translate(@extent,'0123456789',''),'')"/>
        <xsl:choose>
            <xsl:when test="count(./*) &gt; 0"><xsl:apply-templates/></xsl:when>
            <xsl:otherwise>
                <xsl:element name="span">
                <xsl:choose>
                    <xsl:when test="@quantity &gt; 0">
                        <xsl:call-template name="repeat">
                            <xsl:with-param name="output"><xsl:value-of select="$spacechar"/></xsl:with-param>
                            <xsl:with-param name="count" select="@quantity"/>
                        </xsl:call-template>

                    </xsl:when>
                    <xsl:when test="number($extentnum) &gt; 0">
                        <xsl:call-template name="repeat">
                            <xsl:with-param name="output"><xsl:value-of select="$spacechar"/></xsl:with-param>
                            <xsl:with-param name="count" select="$extentnum"/>
                        </xsl:call-template>
                    </xsl:when>
                    <xsl:otherwise><xsl:text>…</xsl:text></xsl:otherwise>
                </xsl:choose>
                </xsl:element>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:element>
</xsl:template>
<xsl:template match="x:note">
    <xsl:element name="span">
        <xsl:attribute name="data-anno"/>
        <xsl:attribute name="class">footnote</xsl:attribute>
        <xsl:text>*</xsl:text>
        <xsl:element name="span">
            <xsl:attribute name="class">anno-inline</xsl:attribute>
            <xsl:attribute name="lang">en</xsl:attribute>
            <xsl:apply-templates/>
        </xsl:element>
    </xsl:element>
</xsl:template>

<xsl:template match="x:gramGrp[not(@type)]">
    <xsl:for-each select="x:gram">
        <xsl:value-of select="."/>
        <xsl:if test="position() != last()">
            <xsl:element name="br"/>
        </xsl:if>
    </xsl:for-each>
</xsl:template>
<xsl:template match="x:gramGrp[@type='particle']">
    <xsl:value-of select="x:m"/>
</xsl:template>
</xsl:stylesheet>
