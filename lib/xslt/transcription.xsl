<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" 
                xmlns:exsl="http://exslt.org/common"
                xmlns:x="http://www.tei-c.org/ns/1.0"
                xmlns:tst="https://github.com/tst-project"
                exclude-result-prefixes="x tst exsl">

<xsl:output method="html" encoding="UTF-8" omit-xml-declaration="yes"/>

<xsl:template match="x:text">
    <xsl:variable name="textid">
        <xsl:choose>
            <xsl:when test="@corresp">
                <xsl:value-of select="substring-after(@corresp,'#')"/>
            </xsl:when>
            <xsl:otherwise>
                <xsl:value-of select="//x:idno[@type='siglum']"/>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:variable>
    <xsl:element name="hr">
        <xsl:attribute name="id">
            <xsl:text>text-</xsl:text>
            <xsl:value-of select="$textid"/>
        </xsl:attribute>
    </xsl:element>
    <xsl:element name="section">
        <xsl:call-template name="lang"/>
        <xsl:choose>
            <xsl:when test="@type='edition'">
            <xsl:attribute name="class">
                <xsl:text>teitext edition</xsl:text>
            </xsl:attribute>
            </xsl:when>
            <xsl:otherwise>
                <xsl:attribute name="class">
                    <xsl:text>teitext</xsl:text>
                </xsl:attribute>
                <xsl:attribute name="data-synch"><xsl:value-of select="@synch"/></xsl:attribute>
                <xsl:attribute name="data-corresp"><xsl:value-of select="$textid"/></xsl:attribute>
                <xsl:element name="table">
                    <xsl:attribute name="class">texttitle</xsl:attribute>
                    <xsl:element name="tr">
                        <xsl:element name="td">
                            <xsl:variable name="title" select="ancestor::x:TEI/x:teiHeader/x:fileDesc/x:sourceDesc/x:msDesc/x:msContents/x:msItem[@xml:id=$textid]/x:title"/>
                            <xsl:attribute name="lang"><xsl:value-of select="$title/@xml:lang"/></xsl:attribute>
                            <span class="line-view-icon" title="diplomatic display">
                                <svg height='25px' width='25px' fill="#000000" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" x="0px" y="0px" viewBox="0 0 512 512"><g id="#hamburger"><g><g><path d="M486,493H26c-3.866,0-7-3.134-7-7V26c0-3.866,3.134-7,7-7h460c3.866,0,7,3.134,7,7v460C493,489.866,489.866,493,486,493z      M33,479h446V33H33V479z"></path></g><g><path d="M436,133H86c-3.866,0-7-3.134-7-7s3.134-7,7-7h350c3.866,0,7,3.134,7,7S439.866,133,436,133z"></path></g><g><path d="M436,263H86c-3.866,0-7-3.134-7-7s3.134-7,7-7h350c3.866,0,7,3.134,7,7S439.866,263,436,263z"></path></g><g><path d="M436,393H86c-3.866,0-7-3.134-7-7s3.134-7,7-7h350c3.866,0,7,3.134,7,7S439.866,393,436,393z"></path></g></g></g></svg>
                            </span>
                            <xsl:apply-templates select="$title"/>
                        </xsl:element>
                        <xsl:element name="td">
                            <xsl:attribute name="class">text-siglum</xsl:attribute>
                            <xsl:attribute name="lang">en</xsl:attribute>
                            <xsl:variable name="cu" select="translate(@synch,'#','')"/>
                            <xsl:value-of select="$cu"/>
                            <xsl:if test="$cu and $textid">
                                <xsl:text>, </xsl:text>
                            </xsl:if>
                            <xsl:value-of select="$textid"/>
                        </xsl:element>
                    </xsl:element>
                </xsl:element>
            </xsl:otherwise>
        </xsl:choose>
        <xsl:apply-templates/>
    </xsl:element>
</xsl:template>

<!--xsl:template match="x:text/@n">
    <xsl:element name="h2">
        <xsl:attribute name="lang">en</xsl:attribute>
        <xsl:value-of select="."/>
    </xsl:element>
</xsl:template-->

<xsl:template match="x:text/x:body | x:text/x:front | x:text//x:div">
    <xsl:element name="div">
        <xsl:call-template name="lang"/>
        <xsl:if test="@rend='parallel'">
            <xsl:attribute name="class">parallel</xsl:attribute>
        </xsl:if>
        <xsl:apply-templates/>
    </xsl:element>
</xsl:template>

<xsl:template match="x:ab">
    <xsl:element name="span">
        <xsl:call-template name="lang"/>
        <xsl:apply-templates/>
    </xsl:element>
</xsl:template>

<xsl:template match="x:body/x:ab">
    <xsl:element name="div">
        <xsl:attribute name="class">ab</xsl:attribute>
        <xsl:call-template name="lang"/>
        <xsl:apply-templates/>
    </xsl:element>
</xsl:template>

<xsl:template match="x:titlePage">
    <xsl:element name="div">
        <xsl:attribute name="class">titlepage</xsl:attribute>
        <xsl:variable name="form" select="ancestor::x:TEI/x:teiHeader/x:fileDesc/x:sourceDesc/x:msDesc/x:physDesc/x:objectDesc/@form"/>
        <xsl:variable name="unit">
            <xsl:choose>
                <xsl:when test="$form = 'pothi'">
                    <xsl:text>folio</xsl:text>
                </xsl:when>
                <xsl:otherwise><xsl:text>page</xsl:text></xsl:otherwise>
            </xsl:choose>
        </xsl:variable>
        <xsl:attribute name="data-anno">title <xsl:value-of select="$unit"/></xsl:attribute>
        <xsl:call-template name="lang"/>
        <xsl:apply-templates/>
    </xsl:element>
</xsl:template>
<xsl:template match="x:docTitle">
    <xsl:apply-templates/>
</xsl:template>
<xsl:template match="x:titlePart">
    <xsl:element name="h3">
        <xsl:call-template name="lang"/>
        <xsl:apply-templates/>
    </xsl:element>
</xsl:template>

<xsl:template match="x:fw">
    <xsl:element name="div">
        <xsl:attribute name="class">fw</xsl:attribute>
        <xsl:if test="@place">
            <xsl:variable name="place" select="translate(@place,'-',' ')"/>
            <xsl:attribute name="data-anno"><xsl:value-of select="$place"/></xsl:attribute>
        </xsl:if>
        <xsl:call-template name="lang"/>
        <xsl:apply-templates/>
    </xsl:element>
</xsl:template>
<!-- transcription styling -->

<xsl:template match="x:del">
    <xsl:variable name="rend" select="@rend"/>
    <xsl:element name="del">
        <xsl:attribute name="data-anno">
            <xsl:text>deleted</xsl:text>
            <xsl:if test="string($rend)">
                <xsl:text> (</xsl:text>
                <xsl:value-of select="$rend"/>
                <xsl:text>)</xsl:text>
           </xsl:if>
        </xsl:attribute>
        <xsl:apply-templates/>
    </xsl:element>
</xsl:template>

<xsl:template match="x:add">
    <xsl:element name="ins">
        <xsl:attribute name="class">add</xsl:attribute>
        <xsl:attribute name="data-anno">
            <xsl:text>inserted</xsl:text>
            <xsl:if test="@place"> (<xsl:value-of select="@place"/>)</xsl:if>
            <xsl:if test="@rend"> (<xsl:value-of select="@rend"/>)</xsl:if>
        </xsl:attribute>
        <xsl:apply-templates />
    </xsl:element>
</xsl:template>

<xsl:template match="x:choice">
    <xsl:element name="span">
    <xsl:attribute name="class">choice</xsl:attribute>
    <xsl:attribute name="data-anno">
        <xsl:text>choice</xsl:text>
    </xsl:attribute>
    <xsl:apply-templates />
    </xsl:element>
</xsl:template>

<xsl:template match="x:subst">
    <xsl:element name="span">
    <xsl:attribute name="class">subst</xsl:attribute>
    <xsl:attribute name="data-anno">
        <xsl:text>substitution</xsl:text>
        <xsl:if test="@rend">
            <xsl:text> (</xsl:text><xsl:value-of select="@rend"/><xsl:text>)</xsl:text>
        </xsl:if>
    </xsl:attribute>
    <xsl:apply-templates />
    </xsl:element>
</xsl:template>

<xsl:template match="x:supplied">
    <xsl:element name="span">
        <xsl:attribute name="class">
            <xsl:text>supplied</xsl:text>
            <xsl:choose>
                <xsl:when test="@reason = 'lost' or @reason = 'illegible'">
                    <xsl:text> lost</xsl:text>
                </xsl:when>
                <xsl:when test="@reason = 'omitted'">
                    <xsl:text> omitted</xsl:text>
                </xsl:when>
                <xsl:otherwise/>
            </xsl:choose>
        </xsl:attribute>
        <xsl:attribute name="data-anno">
            <xsl:text>supplied</xsl:text>
            <xsl:if test="@reason">
                <xsl:text> (</xsl:text><xsl:value-of select="@reason"/><xsl:text>)</xsl:text>
            </xsl:if>
        </xsl:attribute>
        <xsl:apply-templates />
    </xsl:element>
</xsl:template>

<xsl:template match="x:pc">
    <xsl:element name="span">
        <xsl:attribute name="class">
            <xsl:text>invisible</xsl:text>
            <xsl:if test="@type">
                <xsl:text> </xsl:text>
                <xsl:value-of select="@type"/>
            </xsl:if>
        </xsl:attribute>
        <xsl:apply-templates/>
    </xsl:element>
</xsl:template>

<xsl:template match="x:sic">
    <xsl:element name="span">
        <xsl:attribute name="class">sic</xsl:attribute>
        <xsl:call-template name="lang"/>
        <xsl:attribute name="data-anno">sic</xsl:attribute>
        <xsl:apply-templates/>
    </xsl:element>
</xsl:template>
<xsl:template match="x:choice/x:sic">
    <xsl:variable name="corr" select="../x:corr"/>
    <xsl:element name="span">
        <xsl:attribute name="class">sic</xsl:attribute>
        <xsl:call-template name="lang"/>
        <xsl:attribute name="data-anno">
            <xsl:text>sic</xsl:text>
            <xsl:if test="$corr">
                <xsl:text> (corrected: </xsl:text><xsl:value-of select="$corr"/><xsl:text>)</xsl:text>
            </xsl:if>
        </xsl:attribute>
        <xsl:apply-templates/>
    </xsl:element>
</xsl:template>

<xsl:template match="x:corr">
    <xsl:element name="span">
        <xsl:attribute name="class">corr</xsl:attribute>
        <xsl:call-template name="lang"/>
        <xsl:attribute name="data-anno">corrected by transcriber</xsl:attribute>
        <xsl:apply-templates/>
    </xsl:element>
</xsl:template>

<xsl:template match="x:choice/x:corr"/>

<xsl:template match="x:orig">
    <xsl:element name="span">
        <xsl:attribute name="class">orig</xsl:attribute>
        <xsl:call-template name="lang"/>
        <xsl:attribute name="data-anno">original</xsl:attribute>
        <xsl:apply-templates/>
    </xsl:element>
</xsl:template>
<xsl:template match="x:choice/x:orig">
    <xsl:variable name="reg" select="../x:reg"/>
    <xsl:element name="span">
        <xsl:attribute name="class">orig</xsl:attribute>
        <xsl:call-template name="lang"/>
        <xsl:attribute name="data-anno">
            <xsl:text>original</xsl:text>
            <xsl:if test="$reg">
                <xsl:text> (regular: </xsl:text><xsl:value-of select="$reg"/><xsl:text>)</xsl:text>
            </xsl:if>
        </xsl:attribute>
        <xsl:apply-templates/>
    </xsl:element>
</xsl:template>

<xsl:template match="x:choice/x:reg"/>

<xsl:template match="x:gap | x:damage">
    <xsl:element name="span">
        <xsl:choose>
            <xsl:when test="not(node())">
                <xsl:attribute name="lang">en</xsl:attribute>
            </xsl:when>
            <xsl:otherwise>
                <xsl:call-template name="lang"/>
            </xsl:otherwise>
        </xsl:choose>
        <xsl:attribute name="class">
            <xsl:value-of select="local-name()"/>
            <xsl:if test="@reason='ellipsis'">
                <xsl:text> ellipsis</xsl:text>
            </xsl:if>
        </xsl:attribute>
        <xsl:attribute name="data-anno">
            <xsl:choose>
                <xsl:when test="name() = 'damage'">
                    <xsl:text>damage</xsl:text>
                </xsl:when>
                <xsl:otherwise>
                    <xsl:text>gap</xsl:text>
                </xsl:otherwise>
            </xsl:choose>
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
        <xsl:if test="not(node())">
            <xsl:variable name="spacechar">
                <xsl:choose>
                    <xsl:when test="@reason='ellipsis'">…</xsl:when>
                    <xsl:when test="@reason='lost'">‡</xsl:when>
                    <xsl:otherwise>?</xsl:otherwise>
                </xsl:choose>
            </xsl:variable>
            <xsl:variable name="extentnum" select="translate(@extent,translate(@extent,'0123456789',''),'')"/>
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
        </xsl:if>
        <xsl:apply-templates/>
    </xsl:element>
</xsl:template>

<xsl:template match="x:space">
    <xsl:element name="span">
        <xsl:attribute name="lang">en</xsl:attribute>
        <xsl:attribute name="class">space</xsl:attribute>
        <xsl:attribute name="data-anno">
            <xsl:choose>
                <xsl:when test="@type='vacat'"><xsl:text>vacat</xsl:text></xsl:when>
                <xsl:otherwise><xsl:text>space</xsl:text></xsl:otherwise>
            </xsl:choose>
            <xsl:if test="@quantity">
                <xsl:text> of </xsl:text><xsl:value-of select="@quantity"/>
                <xsl:choose>
                <xsl:when test="@unit">
                <xsl:text> </xsl:text><xsl:value-of select="@unit"/>
                    <xsl:if test="@quantity &gt; '1'">
                        <xsl:text>s</xsl:text>
                    </xsl:if>
                </xsl:when>
                <xsl:otherwise>
                <xsl:text> akṣara</xsl:text>
                    <xsl:if test="@quantity &gt; '1'">
                        <xsl:text>s</xsl:text>
                    </xsl:if>
                </xsl:otherwise>
                </xsl:choose>
            </xsl:if>
            <xsl:if test="@rend">
                <xsl:text> (</xsl:text><xsl:value-of select="@rend"/><xsl:text>)</xsl:text>
            </xsl:if>
        </xsl:attribute>
        <xsl:choose>
            <xsl:when test="count(./*) &gt; 0">
                <xsl:apply-templates/>
            </xsl:when>
            <xsl:when test="@type='vacat'"><xsl:text>[vacat]</xsl:text></xsl:when>
            <xsl:otherwise>
                <xsl:text>_</xsl:text>
                <xsl:choose>
                    <xsl:when test="@quantity &gt; 1">
                        <xsl:call-template name="repeat">
                            <xsl:with-param name="output"><xsl:text>_&#x200B;</xsl:text></xsl:with-param>
                            <xsl:with-param name="count" select="@quantity"/>
                        </xsl:call-template>

                    </xsl:when>
                    <xsl:when test="@extent">
                        <xsl:variable name="extentnum" select="translate(@extent,translate(@extent,'0123456789',''),'')"/>
                        <xsl:if test="number($extentnum) &gt; 1">
                            <xsl:call-template name="repeat">
                                <xsl:with-param name="output"><xsl:text>_&#x200B;</xsl:text></xsl:with-param>
                                <xsl:with-param name="count" select="$extentnum"/>
                            </xsl:call-template>
                        </xsl:if>
                    </xsl:when>
                </xsl:choose>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:element>
</xsl:template>

<xsl:template match="x:c">
    <xsl:element name="span"><xsl:apply-templates/></xsl:element>
</xsl:template>

<xsl:template match="x:g">
        <xsl:variable name="ref" select="@ref"/>
        <xsl:variable name="rend" select="@rend"/>
        <xsl:variable name="entityrend" select="$TST//tst:entityrend/tst:entry[@key=$rend]"/>
        <xsl:variable name="cname" select="$TST//tst:entityclasses/tst:entry[@key=$ref]"/>
        <xsl:variable name="ename" select="$TST//tst:entitynames/tst:entry[@key=$ref]"/>
        <xsl:variable name="rname" select="$TST//tst:rendnames/tst:entry[@key=$rend]"/>
        <xsl:variable name="txt" select="$TST//tst:entities/tst:entry[@key=$ref]"/>
        <xsl:element name="span">
            <xsl:call-template name="lang"/>
            <xsl:attribute name="class">
                <xsl:text>gaiji</xsl:text>
                <xsl:if test="$entityrend">
                    <xsl:text> </xsl:text>
                    <xsl:value-of select="$entityrend"/>
                </xsl:if>
                <xsl:if test="$cname">
                    <xsl:text> </xsl:text><xsl:value-of select="$cname"/>
                </xsl:if>
            </xsl:attribute>
            <xsl:attribute name="data-anno">
                <xsl:choose>
                    <xsl:when test="$ename">
                        <xsl:value-of select="$ename"/>
                        <xsl:if test="node()">
                            <xsl:text> symbol</xsl:text>
                        </xsl:if>
                    </xsl:when>
                    <xsl:when test="$rend">
                        <xsl:choose>
                            <xsl:when test="$rname">
                                <xsl:value-of select="$rname"/>
                            </xsl:when>
                            <xsl:otherwise><xsl:value-of select="$rend"/></xsl:otherwise>
                        </xsl:choose>
                    </xsl:when>
                    <xsl:otherwise/>
                </xsl:choose>
            </xsl:attribute>
            <xsl:choose>
                <xsl:when test="$txt">
                    <xsl:choose>
                        <xsl:when test="not(node())">
                            <xsl:apply-templates select="$txt"/>
                        </xsl:when>
                        <xsl:otherwise>
                            <xsl:attribute name="data-glyph"><xsl:value-of select="$txt"/></xsl:attribute>
                            <xsl:apply-templates/>
                        </xsl:otherwise>
                    </xsl:choose>
                </xsl:when>
                <xsl:otherwise>
                    <xsl:apply-templates/>
                </xsl:otherwise>
            </xsl:choose>
        </xsl:element>
</xsl:template>
<xsl:template match="x:milestone">
    <xsl:param name="excerpt">no</xsl:param>
    <xsl:variable name="unit" select="@unit"/>
    <xsl:element name="span">
        <xsl:attribute name="class">
            <xsl:text>milestone diplo</xsl:text>
            <xsl:if test="$excerpt = 'yes'"><xsl:text> nobreak</xsl:text></xsl:if>
            <xsl:if test="$unit = 'folio' or $unit = 'page'">
                <xsl:text> biggap</xsl:text>
            </xsl:if>
        </xsl:attribute>
        <xsl:attribute name="lang">en</xsl:attribute>
        <xsl:apply-templates select="@facs"/>
        <xsl:if test="$excerpt = 'no' and @break = 'no'">
            <xsl:attribute name="data-nobreak"/>
        </xsl:if>
        <xsl:choose>
        <xsl:when test="$unit">
            <xsl:variable name="unitname" select="$TST//tst:milestones/tst:entry[@key=$unit]"/>
            <xsl:choose>
                <xsl:when test="$unitname"><xsl:value-of select="$unitname"/></xsl:when>
                <xsl:otherwise><xsl:value-of select="$unit"/></xsl:otherwise>
            </xsl:choose>
            <xsl:if test="@n"><xsl:text> </xsl:text></xsl:if>
        </xsl:when>
        <xsl:when test="ancestor::x:TEI/x:teiHeader/x:fileDesc/x:sourceDesc/x:msDesc/x:physDesc/x:objectDesc[@form = 'pothi']">
            <xsl:text>folio </xsl:text>
        </xsl:when>
<xsl:when test="ancestor::x:TEI/x:teiHeader/x:fileDesc/x:sourceDesc/x:msDesc/x:physDesc/x:objectDesc[@form = 'book']">
            <xsl:text>page </xsl:text>
        </xsl:when>
        </xsl:choose>
        <xsl:value-of select="@n"/>
    </xsl:element>
</xsl:template>

<xsl:template match="x:locus">
    <xsl:element name="span">
        <xsl:attribute name="class">
            <xsl:text>locus </xsl:text>
            <xsl:value-of select="@rend"/>
        </xsl:attribute>
        <xsl:apply-templates select="@facs"/>
        <xsl:call-template name="lang"/>
        <xsl:apply-templates/>
    </xsl:element>
</xsl:template>

<xsl:template match="@facs">
    <xsl:if test=". != ''">
        <xsl:attribute name="data-loc">
            <xsl:value-of select="."/>
        </xsl:attribute>
        <xsl:variable name="imgno" select="substring-before(.,':')"/>
        <xsl:variable name="annono" select="substring-after(.,':')"/>
        <xsl:attribute name="data-anno">
            <xsl:text>image </xsl:text>
            <xsl:choose>
                <xsl:when test="$annono">
                    <xsl:value-of select="$imgno"/>
                    <xsl:text>, annotation </xsl:text>
                    <xsl:value-of select="$annono"/>
                </xsl:when>
                <xsl:otherwise>
                    <xsl:value-of select="."/>
                </xsl:otherwise>
            </xsl:choose>
        </xsl:attribute>
    </xsl:if>
</xsl:template>

<xsl:template match="x:lb">
    <xsl:param name="hyphen">yes</xsl:param>
    <xsl:call-template name="lb">
        <xsl:with-param name="hyphen"><xsl:value-of select="$hyphen"/></xsl:with-param>
    </xsl:call-template>
</xsl:template>
<xsl:template match="x:q[@rend='block']//x:lg//x:lb | x:quote[@rend='block']//x:lg//x:lb | x:q[not(@rend)]//x:lb | x:quote[not(@rend)]//x:lb | x:standOff[@type='apparatus']//x:lb">
    <xsl:call-template name="lb">
        <xsl:with-param name="diplo">false</xsl:with-param>
    </xsl:call-template>
</xsl:template>

<xsl:template name="lb">
    <xsl:param name="diplo">true</xsl:param>
    <xsl:param name="hyphen">yes</xsl:param>
    <xsl:element name="span">
        <xsl:attribute name="class">
            <xsl:text>lb</xsl:text>
            <xsl:if test="$diplo = 'true'"><xsl:text> diplo</xsl:text></xsl:if>
            <xsl:if test="not(@n)"><xsl:text> unnumbered</xsl:text></xsl:if>
        </xsl:attribute>
        <xsl:attribute name="lang">en</xsl:attribute>
        <xsl:choose>
            <xsl:when test="@break = 'no' and $hyphen = 'yes'">
                <xsl:attribute name="data-nobreak"/>
            </xsl:when>
            <xsl:otherwise>
                <xsl:variable name="pretext" select="preceding::text()[1]"/>
                <xsl:if test="position() != 1 and normalize-space(substring($pretext,string-length($pretext))) != ''">
                    <xsl:attribute name="data-nobreak"/>
                </xsl:if>
            </xsl:otherwise>
        </xsl:choose>
        <xsl:attribute name="data-anno">
            <xsl:text>line </xsl:text>
            <xsl:choose>
                <xsl:when test="@n">
                    <xsl:value-of select="@n"/>
                </xsl:when>
                <xsl:otherwise>
                    <xsl:text>beginning</xsl:text>
                </xsl:otherwise>
            </xsl:choose>
        </xsl:attribute>
        <xsl:attribute name="data-n">
            <xsl:value-of select="@n"/>
        </xsl:attribute>
        <!--xsl:text>⸤</xsl:text-->
    </xsl:element>
</xsl:template>

<xsl:template match="x:cb">
    <xsl:element name="span">
        <xsl:attribute name="class">cb diplo</xsl:attribute>
        <xsl:attribute name="lang">en</xsl:attribute>
        <xsl:if test="@break = 'no'">
            <xsl:attribute name="data-nobreak"/>
        </xsl:if>
        <xsl:if test="@n">
            <xsl:attribute name="data-n">
                <xsl:text>col. </xsl:text>
                <xsl:value-of select="@n"/>
            </xsl:attribute>
        </xsl:if>
        <xsl:attribute name="data-anno">
            <xsl:if test="@n">
                <xsl:text>column </xsl:text>
                <xsl:value-of select="@n"/>
            </xsl:if>
        </xsl:attribute>
    </xsl:element>
</xsl:template>

<xsl:template match="x:pb">
    <xsl:param name="excerpt">no</xsl:param>
    <xsl:call-template name="pb">
        <xsl:with-param name="excerpt"><xsl:value-of select="$excerpt"/></xsl:with-param>
    </xsl:call-template>
</xsl:template>
<xsl:template match="x:q[@rend='block']//x:lg//x:pb | x:quote[@rend='block']//x:lg//x:pb | x:standOff[@type='apparatus']//x:pb">
    <xsl:param name="excerpt">no</xsl:param>
    <xsl:call-template name="pb">
        <xsl:with-param name="diplo">false</xsl:with-param>
        <xsl:with-param name="excerpt"><xsl:value-of select="$excerpt"/></xsl:with-param>
    </xsl:call-template>
</xsl:template>
<xsl:template name="pb">
    <xsl:param name="excerpt">no</xsl:param>
    <xsl:param name="diplo">true</xsl:param>
    <xsl:element name="span">
        <xsl:attribute name="class">
            <xsl:text>pb</xsl:text>
            <xsl:if test="$diplo = 'true'"><xsl:text> diplo</xsl:text></xsl:if>
            <xsl:if test="$excerpt = 'yes'"><xsl:text> nobreak</xsl:text></xsl:if>
        </xsl:attribute>
        <xsl:attribute name="lang">en</xsl:attribute>
        <xsl:variable name="facs" select="@facs"/>
        <xsl:variable name="unit" select="ancestor::x:TEI/x:teiHeader/x:fileDesc/x:sourceDesc/x:msDesc/x:physDesc/x:objectDesc/x:supportDesc/x:extent/x:measure/@unit | @type"/>
        <!--xsl:if test="$excerpt = 'no' and @break = 'no'">
            <xsl:attribute name="data-nobreak"/>
        </xsl:if-->
        <xsl:choose>
            <xsl:when test="$excerpt = 'no' and @break = 'no'">
                <xsl:attribute name="data-nobreak"/>
            </xsl:when>
            <xsl:otherwise>
                <xsl:variable name="pretext" select="preceding::text()[1]"/>
                <xsl:if test="position() != 1 and normalize-space(substring($pretext,string-length($pretext))) != ''">
                    <xsl:attribute name="data-nobreak"/>
                </xsl:if>
            </xsl:otherwise>
        </xsl:choose>
        <xsl:if test="$facs and $facs != ''">
            <xsl:attribute name="data-loc">
                <xsl:value-of select="$facs"/>
            </xsl:attribute>
        </xsl:if>
        <xsl:if test="@n">
            <xsl:attribute name="data-n">
                <xsl:choose>
                    <xsl:when test="$unit">
                        <xsl:value-of select="substring($unit,1,1)"/>
                        <xsl:text>. </xsl:text>
                    </xsl:when>
                    <xsl:otherwise>
                        <xsl:text>p. </xsl:text>
                    </xsl:otherwise>
                </xsl:choose>
                <xsl:value-of select="@n"/>
            </xsl:attribute>
        </xsl:if>
        <xsl:attribute name="data-anno">
            <xsl:if test="@n">
                <xsl:choose>
                    <xsl:when test="$unit">
                        <xsl:value-of select="$unit"/><xsl:text> </xsl:text>
                    </xsl:when>
                    <xsl:otherwise>
                        <xsl:text>page </xsl:text>
                    </xsl:otherwise>
                </xsl:choose>
                <xsl:value-of select="@n"/>
            </xsl:if>
            <xsl:if test="$facs and $facs != ''">
                <xsl:variable name="imgno" select="substring-before($facs,':')"/>
                <xsl:variable name="annono" select="substring-after($facs,':')"/>
                    <xsl:text>, image </xsl:text>
                    <xsl:choose>
                        <xsl:when test="$annono">
                            <xsl:value-of select="$imgno"/>
                            <xsl:text>, annotation </xsl:text>
                            <xsl:value-of select="$annono"/>
                        </xsl:when>
                        <xsl:otherwise>
                            <xsl:value-of select="$facs"/>
                        </xsl:otherwise>
                    </xsl:choose>
            </xsl:if>
        </xsl:attribute>
        <!--xsl:text>&#x23A1;</xsl:text-->
    </xsl:element>
</xsl:template>

<xsl:template match="x:sup">
    <xsl:element name="sup">
        <xsl:call-template name="lang"/>
        <xsl:apply-templates />
    </xsl:element>
</xsl:template>

<xsl:template match="x:sub">
    <xsl:element name="sub">
        <xsl:call-template name="lang"/>
        <xsl:apply-templates />
    </xsl:element>
</xsl:template>

<xsl:template match="x:quote | x:q">
    <xsl:element name="q">
        <xsl:call-template name="lang"/>
        <xsl:apply-templates />
    </xsl:element>
</xsl:template>

<xsl:template match="x:quote[@rend='block'] | x:q[@rend='block']">
    <xsl:element name="span">
        <xsl:attribute name="class">blockquote</xsl:attribute>
        <xsl:call-template name="lang"/>
        <xsl:apply-templates />
    </xsl:element>
</xsl:template>

<xsl:template match="x:foreign">
    <xsl:element name="em">
        <xsl:call-template name="lang"/>
        <xsl:attribute name="class">foreign</xsl:attribute>
        <xsl:apply-templates />
    </xsl:element>
</xsl:template>

<xsl:template match="x:term">
    <xsl:element name="span">
        <xsl:call-template name="lang"/>
        <xsl:attribute name="class">
            <xsl:text>term </xsl:text>
            <xsl:value-of select="@rend"/>
        </xsl:attribute>
        <xsl:apply-templates />
    </xsl:element>
</xsl:template>

<xsl:template match="x:mod">
    <xsl:element name="span">
        <xsl:attribute name="class">unclear</xsl:attribute>
        <xsl:attribute name="data-anno">
            <xsl:text>modified</xsl:text>
            <xsl:if test="@rend">
                <xsl:text> (</xsl:text><xsl:value-of select="@rend"/><xsl:text>)</xsl:text>
            </xsl:if>
        </xsl:attribute>
    </xsl:element>
</xsl:template>

<xsl:template match="x:unclear">
    <xsl:variable name="r" select="@reason"/>
    <xsl:variable name="reason" select="$TST//tst:reason//tst:entry[@key=$r]"/>
    <xsl:element name="span">
        <xsl:attribute name="class">unclear</xsl:attribute>
        <xsl:attribute name="data-anno">
            <xsl:text>unclear</xsl:text>
            <xsl:if test="$r">
                <xsl:text> (</xsl:text>
                <xsl:choose>
                    <xsl:when test="$reason"><xsl:value-of select="$reason"/></xsl:when>
                    <xsl:otherwise><xsl:value-of select="$r"/></xsl:otherwise>
                </xsl:choose>
                <xsl:text>)</xsl:text>
            </xsl:if>
        </xsl:attribute>
        <xsl:apply-templates/>
    </xsl:element>
</xsl:template>

<xsl:template match="x:caesura">
<xsl:variable name="pretext" select="preceding::text()[1]"/>
<xsl:if test="normalize-space(substring($pretext,string-length($pretext))) != ''">
    <span class="caesura ignored" data-teiname="caesura">-</span>
</xsl:if>
    <xsl:element name="br">
    <xsl:attribute name="class">caesura ignored</xsl:attribute>
    </xsl:element>
</xsl:template>

<xsl:template match="x:expan">
    <xsl:element name="span">
        <xsl:call-template name="lang"/>
        <xsl:attribute name="class">expan</xsl:attribute>
        <xsl:attribute name="data-anno">abbreviation</xsl:attribute>
        <xsl:apply-templates/>
    </xsl:element>
</xsl:template>

<xsl:template match="x:ex">
    <xsl:element name="span">
        <xsl:call-template name="lang"/>
        <xsl:attribute name="class">ex</xsl:attribute>
        <xsl:attribute name="data-anno">editorial expansion</xsl:attribute>
        <xsl:apply-templates/>
    </xsl:element>
</xsl:template>

<xsl:template match="x:note[@place='foot']">
    <xsl:variable name="anchor" select="./x:c[@type='anchor']"/>
    <xsl:element name="span">
        <xsl:attribute name="data-teiname">note</xsl:attribute>
        <xsl:attribute name="data-anno"/>
        <xsl:attribute name="class">footnote ignored<xsl:if test="not($anchor)"> numbered</xsl:if></xsl:attribute>
        <!--xsl:choose>
            <xsl:when test="$anchor"><xsl:value-of select="$anchor"/></xsl:when>
            <xsl:otherwise><xsl:text>*</xsl:text></xsl:otherwise>
        </xsl:choose-->
        <xsl:if test="$anchor"><xsl:value-of select="$anchor"/></xsl:if>
        <xsl:element name="span">
            <xsl:attribute name="class">anno-inline</xsl:attribute>
            <xsl:call-template name="lang"/>
            <xsl:apply-templates/>
        </xsl:element>
    </xsl:element>
</xsl:template>

<xsl:template match="x:note">
<xsl:element name="span">
    <xsl:call-template name="lang"/>
    <xsl:attribute name="data-teiname">note</xsl:attribute>
    <xsl:attribute name="class">note
        <xsl:choose>
            <xsl:when test="@place='above' or @place='top-margin' or @place='left-margin'"> super</xsl:when>
            <xsl:when test="@place='below' or @place='bottom-margin' or @place='right-margin'"> sub</xsl:when>
            <xsl:otherwise> inline</xsl:otherwise>
        </xsl:choose>
    </xsl:attribute>
    <xsl:attribute name="data-anno">note
        <xsl:if test="@place"> (<xsl:value-of select="@place"/>)</xsl:if>
        <xsl:if test="@resp"> (by <xsl:value-of select="@resp"/>)</xsl:if>
    </xsl:attribute>
    <xsl:apply-templates />
</xsl:element>
</xsl:template>

<xsl:template match="x:surplus">
    <xsl:element name="span">
        <xsl:attribute name="class">surplus</xsl:attribute>
        <xsl:attribute name="data-anno">surplus</xsl:attribute>
        <xsl:call-template name="lang"/>
        <xsl:apply-templates/>
    </xsl:element>
</xsl:template>

<xsl:template match="x:seg">
    <xsl:element name="span">
        <xsl:call-template name="lang"/>
        <xsl:variable name="func" select="@function"/>
        <xsl:attribute name="data-anno">
            <xsl:if test="$func">
                <!-- needs to be //tst:entry because of intervening tst:group elements -->
                <xsl:variable name="funcname" select="$TST/tst:additiontype//tst:entry[@key=$func] | $TST/tst:segtype/tst:entry[@key=$func]"/>
                <xsl:choose>
                    <xsl:when test="$funcname">
                        <xsl:value-of select="$funcname"/>
                    </xsl:when>
                    <xsl:otherwise>
                        <xsl:value-of select="$func"/>
                    </xsl:otherwise>
                </xsl:choose>
            </xsl:if>
            <xsl:if test="@corresp">
                <xsl:variable name="cleanid" select="substring-after(@corresp,'#')"/>
                <xsl:text> (</xsl:text>
                <xsl:value-of select="ancestor::x:TEI/x:teiHeader/x:fileDesc/x:sourceDesc/x:msDesc/x:msContents/x:msItem[@xml:id = $cleanid]/x:title"/>
                <xsl:text>)</xsl:text>
            </xsl:if>
            <xsl:if test="@cert">
                <xsl:text> (</xsl:text><xsl:value-of select="@cert"/><xsl:text> certainty)</xsl:text>
            </xsl:if>
        </xsl:attribute>
        <xsl:choose>
            <xsl:when test="@rend='grantha'">
                <xsl:attribute name="class">bold</xsl:attribute>
                <xsl:attribute name="lang">sa</xsl:attribute>
            </xsl:when>
            <xsl:otherwise>
                <xsl:attribute name="class">paratext</xsl:attribute>
                <xsl:call-template name="lang"/>
            </xsl:otherwise>
        </xsl:choose>
        <xsl:apply-templates/>
    </xsl:element>
</xsl:template>

<xsl:template match="x:metamark">
    <xsl:variable name="func" select="@function"/>
    <xsl:element name="span">
        <xsl:attribute name="class">metamark</xsl:attribute>
        <xsl:attribute name="data-anno">
            <xsl:text>metamark</xsl:text>
            <xsl:if test="$func">
                <xsl:text> (</xsl:text><xsl:value-of select="$func"/><xsl:text>)</xsl:text>
            </xsl:if>
        </xsl:attribute>
        <xsl:apply-templates/>
    </xsl:element>
</xsl:template>

<xsl:template match="x:hi">
    <span>
        <xsl:attribute name="class">hi</xsl:attribute>
        <xsl:call-template name="lang"/>
        <xsl:apply-templates/>
    </span>
</xsl:template>
<xsl:template match="x:hi[@rend='bold']">
    <strong>
        <xsl:call-template name="lang"/>
        <xsl:apply-templates/>
    </strong>
</xsl:template>
<xsl:template match="x:hi[@rend='italic']">
    <em>
        <xsl:call-template name="lang"/>
        <xsl:apply-templates/>
    </em>
</xsl:template>
<xsl:template match="x:hi[@rend='superscript']">
    <sup>
        <xsl:call-template name="lang"/>
        <xsl:apply-templates/>
    </sup>
</xsl:template>
<xsl:template match="x:hi[@rend='subscript']">
    <sub>
        <xsl:call-template name="lang"/>
        <xsl:apply-templates/>
    </sub>
</xsl:template>

<xsl:template name="texthead">
    <xsl:choose>
        <xsl:when test="@type = 'sub'">
            <h3>
                <xsl:call-template name="lang"/>
                <xsl:apply-templates/>
            </h3>
        </xsl:when>
        <xsl:otherwise>
            <h2>
                <xsl:call-template name="lang"/>
                <xsl:apply-templates/>
            </h2>
        </xsl:otherwise>
    </xsl:choose>
</xsl:template>

<xsl:template match="x:text//x:head">
    <xsl:call-template name="texthead"/>
</xsl:template>

<xsl:template match="x:table">
    <table>
        <xsl:call-template name="lang"/>
        <xsl:apply-templates/>
    </table>
</xsl:template>

<xsl:template match="x:row">
    <tr>
        <xsl:call-template name="lang"/>
        <xsl:apply-templates/>
    </tr>
</xsl:template>

<xsl:template match="x:cell">
    <td>
        <xsl:call-template name="lang"/>
        <xsl:apply-templates/>
    </td>
</xsl:template>

<xsl:template match="x:ruby">
    <xsl:element name="ruby">
        <xsl:call-template name="lang"/>
        <xsl:variable name="place" select="x:rt/@place"/>
        <xsl:attribute name="class">
            <xsl:choose>
                <xsl:when test="$place='bottom-margin' or $place='below'">
                    <xsl:text>under</xsl:text>
                </xsl:when>
                <xsl:otherwise>
                    <xsl:text>over</xsl:text>
                </xsl:otherwise>
            </xsl:choose>
        </xsl:attribute>
        <xsl:apply-templates/>
    </xsl:element>
</xsl:template>

<xsl:template match="x:rt">
    <xsl:element name="rt">
        <xsl:call-template name="lang"/>
        <xsl:attribute name="data-anno">
            <xsl:text>annotation</xsl:text>
            <xsl:if test="@place">
                <xsl:text> (</xsl:text><xsl:value-of select="@place"/><xsl:text>)</xsl:text>
            </xsl:if>
        </xsl:attribute>
        <xsl:apply-templates/>
    </xsl:element>
</xsl:template>

<xsl:template match="x:rb">
    <xsl:element name="rb">
        <xsl:call-template name="lang"/>
        <xsl:apply-templates/>
    </xsl:element>
</xsl:template>

<xsl:template match="x:num">
    <xsl:element name="span">
        <xsl:call-template name="lang"/>
        <xsl:choose>
            <xsl:when test="@rend='traditional'">
                <xsl:attribute name="class">num trad</xsl:attribute>
                <xsl:attribute name="data-anno">traditional numerals</xsl:attribute>
            </xsl:when>
            <xsl:otherwise>
                <xsl:attribute name="class">num</xsl:attribute>
                <xsl:attribute name="data-anno">number</xsl:attribute>
            </xsl:otherwise>
        </xsl:choose>
        <xsl:apply-templates/>
    </xsl:element>
</xsl:template>

<xsl:template match="x:retrace">
    <span class="retrace" data-anno="retraced">
        <xsl:call-template name="lang"/>
        <xsl:apply-templates/>
    </span>
</xsl:template>
</xsl:stylesheet>
