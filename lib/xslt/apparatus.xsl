<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" 
                              xmlns:exsl="http://exslt.org/common"
                              xmlns:str="http://exslt.org/strings"
                              xmlns:x="http://www.tei-c.org/ns/1.0"
                              xmlns:tst="https://github.com/tst-project"
                              exclude-result-prefixes="x tst exsl str">

<xsl:output method="html" encoding="UTF-8" omit-xml-declaration="yes"/>

<!--xsl:variable name="nativesplit" select="function-available('str:split')"/-->
<xsl:variable name="nativesplit" select="false()"/>

<xsl:template name="pointersvg">
  <svg width="235.08" height="188" version="1.1" viewBox="0 0 235.08 188" xml:space="preserve" xmlns="http://www.w3.org/2000/svg">
    <style type="text/css">
      .st0{fill:none;stroke:rgb(168,81,16);stroke-width:10;stroke-linecap:round;stroke-linejoin:round;}
    </style>
    <path class="st0" d="m2.3798 176.26v-164.52c0-5.1785 5.9714-9.3612 13.365-9.3612h203.45c7.3932 0 13.365 4.1827 13.365 9.3612v164.52c0 5.1785-5.9714 9.3612-13.365 9.3612h-203.45c-7.3931-0.19918-13.365-4.3818-13.365-9.3612z"/>
    <line class="st0" x1="48.587" x2="48.587" y1="185.42" y2="2.3798"/>
    <line class="st0" x1="232.7" x2="50.009" y1="139.81" y2="139.81"/>
    <line class="st0" x1="232.7" x2="50.009" y1="94" y2="94"/>
    <line class="st0" x1="232.7" x2="50.009" y1="48.09" y2="48.09"/>
    <line class="st0" x1="94.368" x2="94.368" y1="185.42" y2="2.3798"/>
    <line class="st0" x1="140.72" x2="140.72" y1="185.42" y2="2.3798"/>
    <line class="st0" x1="186.5" x2="186.5" y1="185.42" y2="2.3798"/>
  </svg>
</xsl:template>

<xsl:variable name="isedition" select="//x:text[@type='edition']"/>

<xsl:variable name="listwit">
  <xsl:variable name="witness" select="//x:witness"/>
  <xsl:for-each select="$witness">
    <xsl:variable name="parwit" select="ancestor::x:witness[@source]"/>
    <xsl:variable name="mysource" select="@source"/>
    <xsl:variable name="parsource" select="$parwit/@source"/>
    <xsl:variable name="parid" select="$parwit/@xml:id"/>
    <xsl:variable name="source" select="$mysource[$mysource] | $parsource[not($mysource)]"/>

    <x:witness>
      <xsl:attribute name="id"><xsl:value-of select="@xml:id"/></xsl:attribute> 
      <xsl:attribute name="hashid"><xsl:value-of select="concat('#',@xml:id)"/></xsl:attribute> 
      <xsl:if test="$parwit">
        <xsl:attribute name="parid"><xsl:value-of select="$parid"/></xsl:attribute>
      </xsl:if>
      <xsl:if test="$source">
        <xsl:attribute name="source">
          <xsl:value-of select="$source"/>
          <xsl:text>?corresp=</xsl:text>
          <xsl:choose>
            <xsl:when test="$parid"><xsl:value-of select="$parid"/></xsl:when>
            <xsl:otherwise><xsl:value-of select="@xml:id"/></xsl:otherwise>
          </xsl:choose>
        </xsl:attribute>
        </xsl:if>
      <xsl:if test="x:abbr">
        <x:abbr>
          <xsl:apply-templates select="x:abbr/node()"/>
        </x:abbr>
      </xsl:if>
    </x:witness>
   </xsl:for-each>
</xsl:variable>
<xsl:variable name="witlist" select="exsl:node-set($listwit)"/>

<xsl:template name="splitwit">
  <xsl:param name="mss">
    <xsl:choose>
      <xsl:when test="@wit"><xsl:value-of select="concat(@wit,' ')"/></xsl:when>
      <xsl:when test="@select"><xsl:value-of select="concat(@select,' ')"/></xsl:when>
      <xsl:otherwise/>
    </xsl:choose>
  </xsl:param>
  <xsl:param name="rdggrp" select="current()[local-name() = 'rdgGrp']"/>
  <xsl:param name="corresp"/>
  <xsl:call-template name="splitloop">
    <xsl:with-param name="rdggrp" select="$rdggrp"/>
    <xsl:with-param name="corresp" select="$corresp"/>
    <xsl:with-param name="thisms" select="substring-before($mss,' ')"/>
  </xsl:call-template>
  <xsl:variable name="nextstr" select="substring-after($mss, ' ')"/>
  <xsl:if test="$nextstr != ''">
    <xsl:text>&#x200B;</xsl:text>
    <xsl:call-template name="splitwit">
      <xsl:with-param name="mss" select="$nextstr"/>
      <xsl:with-param name="corresp" select="$corresp"/>
    </xsl:call-template>
  </xsl:if>
</xsl:template>

<xsl:template name="splitwit2">
  <xsl:param name="mss" select="@wit | @select"/>
  <xsl:param name="rdggrp" select="current()[local-name() = 'rdgGrp']"/>
  <xsl:param name="corresp"/>
  <xsl:for-each select="str:split($mss,' ')">
    <xsl:call-template name="splitloop">
      <xsl:with-param name="rdggrp" select="$rdggrp"/>
      <xsl:with-param name="corresp" select="$corresp"/>
    </xsl:call-template>
    <xsl:if test="position() != last()">
      <xsl:text>&#x200B;</xsl:text>
    </xsl:if>
  </xsl:for-each>
</xsl:template>

<xsl:template name="splitloop">
  <xsl:param name="rdggrp"/>
  <xsl:param name="corresp"/>
  <xsl:param name="thisms" select="."/>
  <xsl:variable name="witness" select="$witlist/x:witness[@hashid=$thisms]"/>
  <xsl:variable name="siglum" select ="$witness/x:abbr/node()"/>
  <xsl:variable name="source" select="$witness/@source"/>
  <xsl:choose>
    <xsl:when test="$source">
      <xsl:element name="a">
         <xsl:attribute name="lang">en</xsl:attribute>
         <xsl:attribute name="target">_blank</xsl:attribute>
          <xsl:attribute name="data-id"><xsl:value-of select="$witness/@id"/></xsl:attribute>
         <xsl:attribute name="class">
          <xsl:text>msid</xsl:text>
          <xsl:if test="$rdggrp and $rdggrp/x:rdg[@type='minor'][contains(concat(normalize-space(@wit), ' '),concat($thisms,' '))]">
            <xsl:text> mshover</xsl:text>
          </xsl:if>
        </xsl:attribute>
        <xsl:attribute name="data-anno"/>
        <xsl:attribute name="href">
          <xsl:value-of select="$source"/>
          <xsl:if test="$corresp">
            <xsl:text>&amp;corresp=</xsl:text>
            <xsl:value-of select="$corresp"/>
          </xsl:if>
        </xsl:attribute>
        <xsl:copy-of select="$siglum"/>
      </xsl:element>
    </xsl:when>
    <xsl:otherwise>
      <xsl:element name="span">
         <xsl:attribute name="lang">en</xsl:attribute>
         <xsl:attribute name="class">
          <xsl:text>msid</xsl:text>
          <xsl:if test="$rdggrp and $rdggrp/x:rdg[@type='minor'][contains(concat(normalize-space(@wit), ' '),concat($thisms,' '))]">
            <xsl:text> mshover</xsl:text>
          </xsl:if>
         </xsl:attribute>
         <xsl:attribute name="data-anno"/>
         <xsl:choose>
          <xsl:when test="$siglum">
            <xsl:attribute name="data-id"><xsl:value-of select="$witness/@id"/></xsl:attribute>
            <xsl:copy-of select="$siglum"/>
          </xsl:when>
          <xsl:otherwise>
            <xsl:variable name="cleanstr" select="substring-after($thisms,'#')"/>
            <xsl:attribute name="data-id"><xsl:value-of select="$cleanstr"/></xsl:attribute>
            <xsl:value-of select="$cleanstr"/>
          </xsl:otherwise>
        </xsl:choose>
        </xsl:element>
    </xsl:otherwise>
  </xsl:choose>
</xsl:template>
<xsl:template match="x:listWit">
  <xsl:element name="div">
    <xsl:attribute name="class">listWit</xsl:attribute>
    <xsl:apply-templates/>
  </xsl:element>
</xsl:template>
<xsl:template match="x:witness">
  <xsl:element name="div">
    <xsl:attribute name="class">witness</xsl:attribute>
    <xsl:attribute name="id"><xsl:value-of select="@xml:id"/></xsl:attribute>
    <xsl:element name="span">
      <xsl:attribute name="class">msid</xsl:attribute>
      <xsl:apply-templates select="x:abbr/node()"/>
    </xsl:element>
    <xsl:apply-templates select="x:expan"/>
    <xsl:apply-templates select="x:listWit"/>
  </xsl:element>
</xsl:template>

<xsl:template match="x:text//x:p">
  <xsl:variable name="xmlid" select="@xml:id"/>
  <xsl:variable name="hashid" select="concat('#',$xmlid)"/>
  <xsl:variable name="apparatus" select="//x:standOff[@type='apparatus' and @corresp=$hashid]"/>
  <xsl:variable name="notes1" select="//x:standOff[@type='notes1' and @corresp=$hashid]"/>
  <xsl:variable name="notes2" select="//x:standOff[@type='notes2' and @corresp=$hashid]"/>
  <xsl:variable name="notes3" select="//x:standOff[@type='notes3' and @corresp=$hashid]"/>
  <xsl:variable name="notes4" select="//x:standOff[@type='notes4' and @corresp=$hashid]"/>
  <xsl:choose>
    <xsl:when test="$apparatus or $notes1 or $notes2 or notes3 or $notes4">
      <div class="lg wide">
        <div>
          <xsl:call-template name="lang"/>
          <xsl:attribute name="class">
            <xsl:text>text-block p edition</xsl:text>
          </xsl:attribute>
          <xsl:attribute name="id"><xsl:value-of select="$xmlid"/></xsl:attribute>
          <xsl:if test="@corresp">
            <xsl:attribute name="data-corresp"><xsl:value-of select="@corresp"/></xsl:attribute>
          </xsl:if>
          <xsl:apply-templates/>
        </div>
        <xsl:call-template name="apparatus-standoff">
          <xsl:with-param name="notes1" select="$notes1"/>
          <xsl:with-param name="apparatus" select="$apparatus"/>
          <xsl:with-param name="notes2" select="$notes2"/>
          <xsl:with-param name="notes3" select="$notes3"/>
          <xsl:with-param name="notes4" select="$notes4"/>
        </xsl:call-template>
      </div>
    </xsl:when>
    <xsl:when test=".//x:app and not(//x:facsimile/x:graphic)">
      <div>
        <xsl:attribute name="class">para wide</xsl:attribute>
        <xsl:if test="$xmlid">
          <xsl:attribute name="id"><xsl:value-of select="$xmlid"/></xsl:attribute>
        </xsl:if>
        <xsl:if test="@corresp">
          <xsl:attribute name="data-corresp"><xsl:value-of select="@corresp"/></xsl:attribute>
        </xsl:if>
        <div>
          <xsl:attribute name="class">text-block</xsl:attribute>
          <xsl:call-template name="lang"/>
          <xsl:apply-templates/>
        </div>
        <div>
          <xsl:attribute name="class">apparatus-block</xsl:attribute>
          <xsl:call-template name="lang"/>
          <xsl:call-template name="apparatus"/>
        </div>
      </div>
    </xsl:when>
    <xsl:otherwise>
      <xsl:call-template name="p"/>
    </xsl:otherwise>
  </xsl:choose>
</xsl:template>

<xsl:template match="x:text//x:head">
  <xsl:choose>
    <xsl:when test=".//x:app and not(//x:facsimile/x:graphic)">
      <div>
        <xsl:attribute name="class">para wide</xsl:attribute>
        <xsl:if test="@xml:id">
          <xsl:attribute name="id"><xsl:value-of select="@xml:id"/></xsl:attribute>
        </xsl:if>
        <xsl:if test="@corresp">
          <xsl:attribute name="data-corresp"><xsl:value-of select="@corresp"/></xsl:attribute>
        </xsl:if>
        <div>
          <xsl:attribute name="class">text-block</xsl:attribute>
          <xsl:call-template name="lang"/>
          <xsl:call-template name="texthead"/>
        </div>
        <div>
          <xsl:attribute name="class">apparatus-block</xsl:attribute>
          <xsl:call-template name="lang"/>
          <xsl:call-template name="apparatus"/>
        </div>
      </div>
    </xsl:when>
    <xsl:otherwise>
      <xsl:call-template name="texthead"/>
    </xsl:otherwise>
  </xsl:choose>
</xsl:template>

<xsl:template match="x:text//x:lg | x:text//x:l[@xml:id]"> <!-- not child of x:div[@rend='parallel'] -->
  <xsl:variable name="xmlid" select="@xml:id"/>
  <xsl:variable name="hashid" select="concat('#',$xmlid)"/>
  <xsl:variable name="apparatus" select="//x:standOff[@type='apparatus' and @corresp=$hashid]"/>
  <xsl:variable name="notes1" select="//x:standOff[@type='notes1' and @corresp=$hashid]"/>
  <xsl:variable name="notes2" select="//x:standOff[@type='notes2' and @corresp=$hashid]"/>
  <xsl:variable name="notes3" select="//x:standOff[@type='notes3' and @corresp=$hashid]"/>
  <xsl:variable name="notes4" select="//x:standOff[@type='notes4' and @corresp=$hashid]"/>
  <xsl:choose>
    <xsl:when test="$apparatus or $notes1 or $notes2 or notes3 or $notes4">
      <div class="lg wide">
        <div>
          <xsl:call-template name="lang"/>
          <xsl:attribute name="class">
            <xsl:text>text-block lg edition</xsl:text>
          </xsl:attribute>
          <xsl:attribute name="id"><xsl:value-of select="$xmlid"/></xsl:attribute>
          <xsl:if test="@corresp">
            <xsl:attribute name="data-corresp"><xsl:value-of select="@corresp"/></xsl:attribute>
          </xsl:if>
          <xsl:if test="@n">
            <xsl:attribute name="style">
              <xsl:text>counter-reset: line-numb </xsl:text>
              <xsl:value-of select="@n - 1"/>
              <xsl:text>;</xsl:text>
            </xsl:attribute>
            <xsl:attribute name="data-offset">
              <xsl:value-of select="@n mod 5"/>
            </xsl:attribute>
          </xsl:if>
          <xsl:apply-templates/>
        </div>
        <xsl:call-template name="apparatus-standoff">
          <xsl:with-param name="notes1" select="$notes1"/>
          <xsl:with-param name="apparatus" select="$apparatus"/>
          <xsl:with-param name="notes2" select="$notes2"/>
          <xsl:with-param name="notes3" select="$notes3"/>
          <xsl:with-param name="notes4" select="$notes4"/>
        </xsl:call-template>
      </div>
    </xsl:when>
    <xsl:when test=".//x:app and not(//x:facsimile/x:graphic)">
      <div>
        <xsl:attribute name="class">lg wide</xsl:attribute>
        <xsl:if test="$xmlid">
          <xsl:attribute name="id"><xsl:value-of select="$xmlid"/></xsl:attribute>
        </xsl:if>
        <xsl:if test="@corresp">
          <xsl:attribute name="data-corresp"><xsl:value-of select="@corresp"/></xsl:attribute>
        </xsl:if>
        <xsl:element name="div">
          <xsl:attribute name="class">text-block</xsl:attribute>
          <xsl:call-template name="lang"/>
          <xsl:apply-templates />
        </xsl:element>
        <xsl:element name="div">
          <xsl:attribute name="class">apparatus-block</xsl:attribute>
          <xsl:call-template name="lang"/>
          <xsl:call-template name="apparatus"/>
        </xsl:element>
      </div>
    </xsl:when>
    <xsl:otherwise>
      <xsl:call-template name="lg"/>
    </xsl:otherwise>
  </xsl:choose>
</xsl:template>

<!-- start of tooltip apparatus -->
<xsl:template match="x:app">
  <span class="app-inline ignored">
    <xsl:attribute name="data-anno"/>
    <span>
      <xsl:choose>
        <xsl:when test="x:lem">
          <xsl:attribute name="class">lem-inline</xsl:attribute>
          <xsl:call-template name="lang"/>
          <xsl:apply-templates select="x:lem/node()"/>
        </xsl:when>
        <xsl:otherwise>
            <xsl:attribute name="class">lem-inline lem-anchor</xsl:attribute>
            <xsl:text>†</xsl:text>
        </xsl:otherwise>
      </xsl:choose>
    </span>
    <span class="anno-inline">
      <xsl:if test="x:rdg">
        <xsl:call-template name="lemma"/>
        <xsl:apply-templates select="x:rdg"/>
      </xsl:if>
      <xsl:for-each select="x:note">
        <xsl:text> </xsl:text>
        <xsl:apply-templates select="."/>
      </xsl:for-each>
    </span>
  </span>
</xsl:template>
<xsl:template match="x:rdg">
  <xsl:call-template name="reading"/>
</xsl:template>
<xsl:template match="x:lem">
  <span class="lem-inline">
    <xsl:call-template name="lang"/>
    <xsl:apply-templates/>
  </span>
</xsl:template>
<!-- end of tooltip apparatus -->

<xsl:template match="x:abbr[@corresp]">
  <xsl:variable name="cleanstr" select="substring-after(@corresp,'#')"/>
   <xsl:variable name="witness" select="$witlist/x:witness[@id=$cleanstr]"/>
   <xsl:variable name="siglum" select="$witness/x:abbr/node()"/>
   <xsl:variable name="source" select="$witness/@source"/>
   <xsl:variable name="corresp" select="ancestor::*[@corresp]/@corresp"/>

  <xsl:element name="span">
     <xsl:attribute name="class">msid</xsl:attribute>
     <xsl:attribute name="lang">en</xsl:attribute>
     <xsl:attribute name="data-anno"></xsl:attribute>
     <xsl:attribute name="data-id"><xsl:value-of select="$cleanstr"/></xsl:attribute>
    <xsl:choose>
      <xsl:when test="$source">
        <xsl:element name="a">
          <xsl:attribute name="target">_blank</xsl:attribute>
          <xsl:attribute name="href">
            <xsl:value-of select="$source"/>
            <xsl:if test="$corresp">
              <xsl:text>&amp;corresp=</xsl:text>
              <xsl:value-of select="$corresp"/>
            </xsl:if>
          </xsl:attribute>
          <xsl:apply-templates select="$siglum"/>
        </xsl:element>
      </xsl:when>
      <xsl:otherwise><xsl:apply-templates select="$siglum"/></xsl:otherwise>
    </xsl:choose>
  </xsl:element>
</xsl:template>

<xsl:template name="apparatus">
  <xsl:call-template name="apparatus-inline"/>
  <xsl:if test="@source">
    <xsl:element name="a">
      <xsl:attribute name="href"><xsl:value-of select="@source"/></xsl:attribute>
      <xsl:attribute name="data-anno">Textual alignment of this section</xsl:attribute>
      <xsl:attribute name="class">alignment-pointer</xsl:attribute>
      <xsl:attribute name="lang">zxx</xsl:attribute>
      <xsl:call-template name="pointersvg"/>
    </xsl:element>
  </xsl:if>
</xsl:template>

<!--xsl:template name="lemma">
    <xsl:variable name="corresp" select="ancestor::*[@corresp]/@corresp"/>
    <span>
        <xsl:attribute name="class">lem</xsl:attribute>
        <xsl:apply-templates select="x:lem/node()"/>
    </span>
    <xsl:if test="x:lem/@wit">
        <span>
            <xsl:attribute name="class">lem-wit</xsl:attribute>
            <xsl:call-template name="splitwit">
                <xsl:with-param name="mss" select="x:lem/@wit"/>
                <xsl:with-param name="corresp" select="$corresp"/>
            </xsl:call-template>
        </span>
    </xsl:if>
    <xsl:text> </xsl:text>
</xsl:template-->

<xsl:template name="app">
  <xsl:param name="corresp"/>
  <xsl:element name="span">
    <xsl:attribute name="class">app</xsl:attribute>
    <xsl:choose>
      <xsl:when test="x:lem | x:rdgGrp[@type='lemma']">
        <xsl:call-template name="lemma">
          <xsl:with-param name="corresp" select="$corresp"/>
        </xsl:call-template>
      </xsl:when>
      <xsl:otherwise>
        <span class="lem lem-anchor">†</span>
      </xsl:otherwise>
    </xsl:choose>
    <xsl:variable name="rdgs" select="./x:rdg | ./x:rdgGrp[not(@type)]"/>
    <xsl:if test="$rdgs">
      <span class="rdgs">
        <xsl:for-each select="$rdgs">
          <xsl:call-template name="reading">
            <xsl:with-param name="corresp" select="$corresp"/>
          </xsl:call-template>
        </xsl:for-each>
      </span>
    </xsl:if>
    <xsl:for-each select="x:note">
      <xsl:text> </xsl:text>
      <xsl:apply-templates />
    </xsl:for-each>
  </xsl:element>
</xsl:template>

<xsl:template name="lemma">
  <xsl:param name="corresp"/>
  <xsl:variable name="lem" select="./x:lem"/>
  <xsl:variable name="lemgrp" select="./x:rdgGrp[@type='lemma']"/>
  <xsl:choose>
    <xsl:when test="$lem">
      <xsl:element name="span">
        <xsl:attribute name="class">lem</xsl:attribute>
        <xsl:attribute name="data-loc"><xsl:value-of select="@loc"/></xsl:attribute>
        <!--xsl:attribute name="data-text"><xsl:value-of select="./x:lem/text() | ./x:rdgGrp[@type='lemma']/x:lem/text()"/></xsl:attribute-->
        <span class="rdg-text">
          <xsl:apply-templates select="$lem/node()"/>
        </span>
        <xsl:for-each select="./x:rdgGrp/x:rdg[@type='minor']">
            <span class="rdg-alt">
                <xsl:attribute name="data-wit">
                    <xsl:value-of select="translate(@wit,'#','')"/>
                </xsl:attribute>
                <xsl:apply-templates select="./node()"/>
            </span>
        </xsl:for-each>
        <xsl:choose>
          <xsl:when test="$lem/@wit">
            <span>
              <xsl:attribute name="class">lem-wit</xsl:attribute>
              <xsl:choose>
                <xsl:when test="$nativesplit">
                  <xsl:call-template name="splitwit2">
                    <xsl:with-param name="mss" select="$lem/@wit"/>
                    <xsl:with-param name="corresp" select="$corresp"/>
                    <xsl:with-param name="rdggrp"/>
                  </xsl:call-template>
                </xsl:when>
                <xsl:otherwise>
                  <xsl:call-template name="splitwit">
                    <xsl:with-param name="mss" select="concat($lem/@wit,' ')"/>
                    <xsl:with-param name="corresp" select="$corresp"/>
                    <xsl:with-param name="rdggrp"/>
                  </xsl:call-template>
                </xsl:otherwise>
              </xsl:choose>
            </span>
          </xsl:when>
          <xsl:otherwise>
            <xsl:if test="$isedition">
              <span class="lem-wit"><span class="editor" lang="en" data-anno="emendation">em.</span></span>
            </xsl:if>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:element>
      </xsl:when>
      <xsl:when test="$lemgrp">
          <xsl:element name="span">
            <xsl:attribute name="class">lem</xsl:attribute>
            <xsl:attribute name="data-loc"><xsl:value-of select="@loc"/></xsl:attribute>
            <span class="rdg-text">
              <xsl:apply-templates select="$lemgrp/x:lem/node()"/>
            </span>
            <xsl:for-each select="$lemgrp/x:rdg[@type='minor']">
              <span class="rdg-alt">
                <xsl:attribute name="data-wit">
                  <xsl:value-of select="translate(@wit,'#','')"/>
                </xsl:attribute>
                <xsl:apply-templates select="./node()"/>
              </span>
            </xsl:for-each>
            <span>
              <xsl:attribute name="class">lem-wit</xsl:attribute>
              <xsl:choose>
                <xsl:when test="$nativesplit">
                  <xsl:call-template name="splitwit2">
                    <xsl:with-param name="mss" select="$lemgrp/@select"/>
                    <xsl:with-param name="corresp" select="$corresp"/>
                    <xsl:with-param name="rdggrp" select="$lemgrp"/>
                  </xsl:call-template>
                </xsl:when>
                <xsl:otherwise>
                  <xsl:call-template name="splitwit">
                    <xsl:with-param name="mss" select="concat($lemgrp/@select,' ')"/>
                    <xsl:with-param name="corresp" select="$corresp"/>
                    <xsl:with-param name="rdggrp" select="$lemgrp"/>
                  </xsl:call-template>
                </xsl:otherwise>
              </xsl:choose>
            </span>
          </xsl:element>
        </xsl:when>
      <xsl:otherwise/>
    </xsl:choose>
  <xsl:text> </xsl:text>
</xsl:template>

<xsl:template name="reading">
  <xsl:param name="corresp" select="ancestor::*[@corresp]/@corresp"/>
  <xsl:param name="rdggrp" select="current()[local-name() = 'rdgGrp']"/>
  <span>
    <xsl:attribute name="class">rdg</xsl:attribute>
    <span>
      <xsl:attribute name="class">rdg-text</xsl:attribute>
      <xsl:choose>
        <xsl:when test="$rdggrp">
          <xsl:apply-templates select="./x:rdg[@type='main']/node()"/>
        </xsl:when>
        <xsl:when test="./node()">
          <xsl:apply-templates select="./node()"/>
        </xsl:when>
        <xsl:otherwise>
          <span class="editor" lang="en" data-anno="omission">om.</span>
        </xsl:otherwise>
      </xsl:choose>
    </span>
    <xsl:for-each select="./x:rdg[@type='minor']">
      <span class="rdg-alt">
        <xsl:attribute name="data-wit">
          <xsl:value-of select="translate(@wit,'#','')"/>
        </xsl:attribute>
        <xsl:apply-templates select="./node()"/>
      </span>
    </xsl:for-each>
    <xsl:text> </xsl:text>
    <span>
      <xsl:attribute name="class">rdg-wit</xsl:attribute>
      <xsl:choose>
        <xsl:when test="$nativesplit">
          <xsl:call-template name="splitwit2">
            <xsl:with-param name="corresp" select="$corresp"/>
            <xsl:with-param name="rdggrp" select="$rdggrp"/>
          </xsl:call-template>
        </xsl:when>
        <xsl:otherwise>
          <xsl:call-template name="splitwit">
            <xsl:with-param name="corresp" select="$corresp"/>
            <xsl:with-param name="rdggrp" select="$rdggrp"/>
          </xsl:call-template>
        </xsl:otherwise>
      </xsl:choose>
    </span>
  </span>
  <xsl:text> </xsl:text>
</xsl:template>

<xsl:template match="x:anchor">
  <span>
    <xsl:attribute name="class">anchor</xsl:attribute>
    <xsl:attribute name="data-teiname">anchor</xsl:attribute>
    <xsl:if test="@xml:id">
      <xsl:attribute name="id"><xsl:value-of select="@xml:id"/></xsl:attribute>
    </xsl:if>
    <xsl:if test="@n">
      <xsl:attribute name="data-n"><xsl:value-of select="@n"/></xsl:attribute>
    </xsl:if>
  </span>
</xsl:template>

<xsl:template match="x:text//x:div[@xml:id] | x:text//x:div[@rend='parallel']">
  <xsl:element name="div">
    <xsl:attribute name="class">lg wide</xsl:attribute>
    <xsl:call-template name="lang"/>
    <xsl:variable name="xmlid" select="@xml:id | ./x:lg/@xml:id | ./x:p/@xml:id"/>
    <xsl:if test="$xmlid">
      <xsl:attribute name="id"><xsl:value-of select="$xmlid"/></xsl:attribute>
    </xsl:if>

    <xsl:apply-templates/>

    <xsl:variable name="hashid" select="concat('#',$xmlid)"/> 
    <xsl:variable name="apparatus" select="//x:standOff[@type='apparatus' and @corresp=$hashid]"/>
    <xsl:variable name="notes1" select="//x:standOff[@type='notes1' and @corresp=$hashid]"/>
    <xsl:variable name="notes2" select="//x:standOff[@type='notes2' and @corresp=$hashid]"/>
    <xsl:variable name="notes3" select="//x:standOff[@type='notes3' and @corresp=$hashid]"/>
    <xsl:variable name="notes4" select="//x:standOff[@type='notes4' and @corresp=$hashid]"/>
    <xsl:choose>
      <xsl:when test="$apparatus or $notes1 or $notes2 or notes3 or $notes4">
        <xsl:call-template name="apparatus-standoff">
          <xsl:with-param name="apparatus" select="$apparatus"/>
          <xsl:with-param name="notes1" select="$notes1"/>
          <xsl:with-param name="notes2" select="$notes2"/>
          <xsl:with-param name="notes3" select="$notes3"/>
          <xsl:with-param name="notes4" select="$notes4"/>
        </xsl:call-template>
      </xsl:when>
      <xsl:when test=".//x:app">
        <div>
          <xsl:attribute name="class">
            <xsl:text>apparatus-block hidden</xsl:text>
          </xsl:attribute>
          <xsl:call-template name="lang"/>
          <xsl:call-template name="apparatus"/>
        </div>
      </xsl:when>
    </xsl:choose>
  </xsl:element>
</xsl:template>
<xsl:template match="x:div[@xml:id]/x:p | x:div[@rend='parallel']/x:p">
    <xsl:element name="div">
        <xsl:attribute name="class">
            <xsl:text>text-block p </xsl:text>
            <xsl:choose>
                <xsl:when test="@type='translation'"><xsl:text>translation</xsl:text></xsl:when>
                <xsl:when test="../@rend = 'parallel' and @xml:lang"><xsl:text>translation</xsl:text></xsl:when>
                <xsl:when test="../x:p[@xml:lang]"><xsl:text>edition nolemmata</xsl:text></xsl:when>
                <xsl:otherwise><xsl:text>edition</xsl:text></xsl:otherwise>
            </xsl:choose>
        </xsl:attribute>
        <xsl:call-template name="lang"/>
        <xsl:apply-templates/>
    </xsl:element>
</xsl:template>

<xsl:template match="x:div[@xml:id]/x:lg | x:div[@rend='parallel']/x:lg">
  <xsl:element name="div">
    <xsl:call-template name="lang"/>
    <xsl:attribute name="class">
      <xsl:text>text-block lg </xsl:text>
      <xsl:choose>
        <!--xsl:when test="@type='translation'"><xsl:text>translation</xsl:text></xsl:when-->
        <xsl:when test="../@rend = 'parallel' and @xml:lang"><xsl:text>translation</xsl:text></xsl:when>
        <xsl:when test="../x:lg[@xml:lang] | ../x:p[@xml:lang]"><xsl:text>edition nolemmata</xsl:text></xsl:when>
        <xsl:otherwise><xsl:text>edition</xsl:text></xsl:otherwise>
      </xsl:choose>
    </xsl:attribute>
      <xsl:if test="@n">
        <xsl:attribute name="style">
          <xsl:text>counter-reset: line-numb </xsl:text>
          <xsl:value-of select="@n - 1"/>
          <xsl:text>;</xsl:text>
        </xsl:attribute>
        <xsl:attribute name="data-offset">
          <xsl:value-of select="@n mod 5"/>
        </xsl:attribute>
      </xsl:if>
    <xsl:apply-templates/>
  </xsl:element>
</xsl:template>
<xsl:template name="apparatus-standoff">
  <xsl:param name="notes1"/>
  <xsl:param name="apparatus"/>
  <xsl:param name="notes2"/>
  <xsl:param name="notes3"/>
  <xsl:param name="notes4"/>
  <!--xsl:variable name="hideapp" select="./*[@type='translation'] or ./x:lg[@xml:lang] or ./x:p[@xml:lang]"/-->
  <xsl:variable name="hideapp" select="./x:lg[@xml:lang] or ./x:p[@xml:lang]"/>
  <xsl:element name="div">
    <xsl:attribute name="class">
      <xsl:text>apparatus-block</xsl:text>
      <xsl:if test="$hideapp">
        <xsl:text> hidden</xsl:text>
      </xsl:if>
    </xsl:attribute>
    <xsl:call-template name="apparatus-inline"/>
    <xsl:apply-templates select="$apparatus/x:interp"/>
    <xsl:apply-templates select="$apparatus/x:listApp"/>
    <xsl:if test="$apparatus/@source">
      <xsl:element name="a">
        <xsl:attribute name="href"><xsl:value-of select="$apparatus/@source"/></xsl:attribute>
        <xsl:attribute name="data-anno">Textual alignment of this section</xsl:attribute>
        <xsl:attribute name="class">alignment-pointer</xsl:attribute>
        <xsl:attribute name="lang">zxx</xsl:attribute>
        <xsl:call-template name="pointersvg"/>
      </xsl:element>
    </xsl:if>
    <xsl:if test="$notes1">
      <xsl:call-template name="notesblock">
        <xsl:with-param name="standOff" select="$notes1"/>
      </xsl:call-template>
    </xsl:if>
    <xsl:if test="$notes2">
      <xsl:call-template name="notesblock">
        <xsl:with-param name="standOff" select="$notes2"/>
      </xsl:call-template>
    </xsl:if>
    <xsl:if test="$notes3">
      <xsl:call-template name="notesblock">
        <xsl:with-param name="standOff" select="$notes3"/>
      </xsl:call-template>
    </xsl:if>
    <xsl:if test="$notes4">
      <xsl:call-template name="notesblock">
        <xsl:with-param name="standOff" select="$notes4"/>
      </xsl:call-template>
    </xsl:if>
  </xsl:element>
</xsl:template>

<xsl:template name="notesblock">
  <xsl:param name="standOff"/>
  <xsl:element name="hr">
    <xsl:attribute name="class">apparatus-divider</xsl:attribute>
  </xsl:element>
  <xsl:for-each select="$standOff/x:note">
    <span class="anchored-note">
      <xsl:if test="@target">
        <xsl:attribute name="data-target">
        <xsl:value-of select="@target"/>
        </xsl:attribute>
      </xsl:if>
      <xsl:if test="@n">
        <xsl:attribute name="data-n">
        <xsl:value-of select="@n"/>
        </xsl:attribute>
      </xsl:if>
      <xsl:call-template name="lang"/>
      <xsl:apply-templates/>
    </span>
  </xsl:for-each>
</xsl:template>

<xsl:template match="x:interp[@type='normalization']">
  <xsl:apply-templates/>
</xsl:template>
<xsl:template match="x:desc[@type='tagfilters']">
  <div class="ignoredtags" lang="en">
    <xsl:apply-templates select="x:tag[@subtype='ignore']"/>
  </div>
</xsl:template>
<xsl:template match="x:desc[@type='tagfilters']/x:tag">
  <div class="tagselector"><xsl:apply-templates/></div>
</xsl:template>

<xsl:template match="x:standOff/x:listApp">
  <xsl:variable name="corresp" select="translate(../@corresp,'#','')"/>
  <xsl:variable name="omissions" select="x:listApp[@type='omissions']"/>
    <xsl:if test="$omissions">
      <xsl:element name="div">
       <xsl:attribute name="class">omissions-app</xsl:attribute>
        <xsl:for-each select="$omissions/x:app">
          <xsl:call-template name="app">
            <xsl:with-param name="corresp" select="$corresp"/>
          </xsl:call-template>
        </xsl:for-each>
        <xsl:element name="hr"/>
      </xsl:element>
  </xsl:if>
  <xsl:for-each select="x:app">
    <xsl:call-template name="app">
      <xsl:with-param name="corresp" select="$corresp"/>
    </xsl:call-template>
  </xsl:for-each>
</xsl:template>

<xsl:template name="apparatus-inline">
  <xsl:for-each select=".//x:app">
    <xsl:call-template name="app">
      <xsl:with-param name="corresp" select="./ancestor::*[@xml:id]/@xml:id"/>
    </xsl:call-template>
  </xsl:for-each>
</xsl:template>

<xsl:template match="x:standOff[@type='apparatus']"/>
<xsl:template match="x:standOff[@type='notes1']"/>
<xsl:template match="x:standOff[@type='notes2']"/>
<xsl:template match="x:standOff[@type='notes3']"/>
<xsl:template match="x:standOff[@type='notes4']"/>

</xsl:stylesheet>
