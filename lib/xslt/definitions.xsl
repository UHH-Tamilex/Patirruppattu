<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" 
                xmlns:exsl="http://exslt.org/common"
                xmlns:x="http://www.tei-c.org/ns/1.0"
                xmlns:tst="https://github.com/tst-project"
                exclude-result-prefixes="x tst exsl">

<xsl:output method="html" encoding="UTF-8" omit-xml-declaration="yes"/>

<xsl:template match="tst:entry">
    <xsl:apply-templates/>
</xsl:template>

<!-- definitions -->
<xsl:variable name="defRoot">
<tst:mstypes>
    <tst:entry key="#STM" selected="true">Single-text</tst:entry>
    <tst:entry key="#MTM">Multiple-text</tst:entry>
    <tst:entry key="#CM">Composite</tst:entry>
    <tst:entry key="#MVM">Multi-volume</tst:entry>
</tst:mstypes>

<tst:format>
    <tst:entry key="baad">bāḍ</tst:entry>
    <tst:entry key="codex">codex</tst:entry>
    <tst:entry key="loose-leaf">loose leaf</tst:entry>
    <tst:entry key="plate">plate</tst:entry>
    <tst:entry key="poster">poster</tst:entry>
    <tst:entry key="pothi" selected="true">pothi</tst:entry>
    <tst:entry key="roll">roll</tst:entry>
    <tst:entry key="scrapbook">scrapbook</tst:entry>
</tst:format>

<tst:technology>
    <tst:entry key="manuscript">manuscript</tst:entry>
    <tst:entry key="inscription">inscription</tst:entry>
    <tst:entry key="estampage">estampage</tst:entry>
    <tst:entry key="xylography">xylography</tst:entry>
    <tst:entry key="lithography">lithography</tst:entry>
    <tst:entry key="movable-type">movable type</tst:entry>
    <tst:entry key="photography">photography</tst:entry>
</tst:technology>

<tst:materials>
    <tst:entry key="paper">Paper</tst:entry>
    <tst:entry key="paper industrial">Paper (industrial)</tst:entry>
    <tst:entry key="paper handmade">Paper (handmade)</tst:entry>
    <tst:entry key="paper laid">Paper (laid)</tst:entry>
    <tst:entry selected="true" key="palm-leaf">Palm leaf</tst:entry>
    <tst:entry key="palm-leaf talipot">Palm leaf (talipot)</tst:entry>
    <tst:entry key="palm-leaf palmyra">Palm leaf (palmyra)</tst:entry>
    <tst:entry key="birch-bark">Birch bark</tst:entry>
    <tst:entry key="sancipat">Sancipat</tst:entry>
    <tst:entry key="copper">Copper</tst:entry>
    <tst:entry key="leather">Leather</tst:entry>
</tst:materials>

<tst:extentunit>
    <tst:entry key="folio" selected="true">folios</tst:entry>
    <tst:entry key="page">pages</tst:entry>
    <tst:entry key="plate">plates</tst:entry>
</tst:extentunit>

<tst:style>
    <tst:entry key="inline-commentary">inline commentary</tst:entry>
    <tst:entry key="interlinear-commentary">interlinear commentary</tst:entry>
    <tst:entry key="tripāṭha">tripāṭha</tst:entry>
    <tst:entry key="pañcapāṭha">pañcapāṭha</tst:entry>
</tst:style>

<tst:decotype>
    <tst:entry key="decorative">decorative</tst:entry>
    <tst:entry key="diagram">diagram</tst:entry>
    <tst:entry key="doodle">doodle</tst:entry>
    <tst:entry key="drawing">drawing</tst:entry>
    <tst:entry key="emblem">emblem</tst:entry>
    <tst:entry key="initial">initial</tst:entry>
    <tst:entry key="monogram">monogram</tst:entry>
    <tst:entry key="painting">painting</tst:entry>
    <tst:entry key="paraph">paraph</tst:entry>
    <tst:entry key="royal-cypher">royal cypher</tst:entry>
    <tst:entry key="table">table</tst:entry>
</tst:decotype>

<tst:subtype>
    <tst:entry key="back">back</tst:entry>
    <tst:entry key="beginning">beginning</tst:entry>
    <tst:entry key="cover">cover</tst:entry>
    <tst:entry key="detached">detached</tst:entry>
    <tst:entry key="end">end</tst:entry>
    <tst:entry key="front">front</tst:entry>
    <tst:entry key="guard-folio">guard folio</tst:entry>
    <tst:entry key="inserted">inserted</tst:entry>
    <tst:entry key="interlineal">interlineal</tst:entry>
    <tst:entry key="intertextual">intertextual</tst:entry>
    <tst:entry key="marginal">marginal</tst:entry>
    <tst:entry key="running">running</tst:entry>
    <tst:entry key="spine">spine</tst:entry>
    <tst:entry key="title-page">title page</tst:entry>
    <tst:group label="position">
        <tst:entry key="top">top</tst:entry>
        <tst:entry key="bottom">bottom</tst:entry>
        <tst:entry key="middle">middle</tst:entry>
        <tst:entry key="left">left</tst:entry>
        <tst:entry key="right">right</tst:entry>
    </tst:group>
</tst:subtype>

<tst:script>
    <tst:entry key="arabic">arabic</tst:entry>
    <tst:entry key="bengali">bengali</tst:entry>
    <tst:entry key="bhujimol">bhujimol</tst:entry>
    <tst:entry key="devanagari">devanagari</tst:entry>
    <tst:entry key="grantha">grantha</tst:entry>
    <tst:entry key="latin">latin</tst:entry>
    <tst:entry key="malayalam">malayalam</tst:entry>
    <tst:entry key="modi">modi</tst:entry>
    <tst:entry key="nandinagari">nandinagari</tst:entry>
    <tst:entry key="newa">newa</tst:entry>
    <tst:entry key="pala">pala</tst:entry>
    <tst:entry key="sarada">sarada</tst:entry>
    <tst:entry key="sinhala">sinhala</tst:entry>
    <tst:entry key="telugu">telugu</tst:entry>
    <tst:entry key="tamil">tamil</tst:entry>
    <tst:entry key="dbucan">uchen</tst:entry>
    <tst:entry key="dbumed">ume</tst:entry>
</tst:script>

<tst:scriptRef>
    <tst:group label="Tamil">
        <tst:entry key="#tamilPulliNone">no <x:foreign xml:lang="ta">puḷḷi</x:foreign></tst:entry>
        <tst:entry key="#tamilPulliSporadic">sporadic <x:foreign xml:lang="ta">puḷḷi</x:foreign></tst:entry>
        <tst:entry key="#tamilPulliRegular">regular <x:foreign xml:lang="ta">puḷḷi</x:foreign></tst:entry>
        <tst:entry key="#tamilRa">closed <x:foreign xml:lang="ta">kāl</x:foreign>/modern <x:foreign xml:lang="ta">ra</x:foreign></tst:entry>
        <tst:entry key="#tamilPreReform">pre-reform ligatures</tst:entry>
        <tst:entry key="#tamilMacron">disambiguating macron (-a vocalisation)</tst:entry>
        <tst:entry key="#tamilOE">long <x:foreign xml:lang="ta">ō/ē</x:foreign> (double-curled <x:foreign xml:lang="ta">kompu</x:foreign>)</tst:entry>
    </tst:group>
    <tst:group label="Bengali">
        <tst:entry key="#bengaliRaBarBelow"><x:foreign xml:lang="sa">ra</x:foreign> with bar below</tst:entry>
        <tst:entry key="#bengaliRaCrossbar"><x:foreign xml:lang="sa">ra</x:foreign> with cross-bar</tst:entry>
        <tst:entry key="#bengaliRa"><x:foreign xml:lang="sa">ra</x:foreign> with dot below</tst:entry>
        <tst:entry key="#bengaliYa"><x:foreign xml:lang="sa">ya</x:foreign> with dot below</tst:entry>
    </tst:group>
    <tst:group label="Devanāgarī">
        <tst:entry key="#prsthamatra"><x:foreign xml:lang="sa">pṛṣṭhamātrā</x:foreign></tst:entry>
        <tst:entry key="#vaba"><x:foreign xml:lang="sa">ba</x:foreign> not distinguished</tst:entry>
        <tst:entry key="#sthascha"><x:foreign xml:lang="sa">stha</x:foreign> written as <x:foreign xml:lang="sa">scha</x:foreign></tst:entry>
        <tst:entry key="#jainaNagari"><x:term xml:lang="sa">Jaina</x:term> nāgarī</tst:entry>
    </tst:group>
    <tst:group label="Malayalam">
        <tst:entry key="#dotReph">dot reph</tst:entry>
    </tst:group>
    <tst:group label="Telugu">
        <tst:entry key="#valapalagilaka">valapalagilaka</tst:entry>
    </tst:group>
</tst:scriptRef>

<tst:media>
    <tst:entry key="ink">ink</tst:entry>
    <tst:group label="colour">
        <tst:entry key="black">black</tst:entry>
        <tst:entry key="brown">brown</tst:entry>
        <tst:entry key="blue">blue</tst:entry>
        <tst:entry key="gold">gold</tst:entry>
        <tst:entry key="red">red</tst:entry>
    </tst:group>
    <tst:entry key="incised">incised</tst:entry>
    <tst:entry key="soot">soot</tst:entry>
    <tst:entry key="pencil">pencil</tst:entry>
</tst:media>

<tst:typemedia>
    <tst:entry key="ink">ink</tst:entry>
    <tst:group label="colour">
        <tst:entry key="black">black</tst:entry>
        <tst:entry key="brown">brown</tst:entry>
        <tst:entry key="blue">blue</tst:entry>
        <tst:entry key="red">red</tst:entry>
    </tst:group>
</tst:typemedia>

<!-- DEPRECATED -->
<tst:scribes>
    <tst:entry key="#ArielTitleScribe">Ariel's title scribe</tst:entry>
    <tst:entry key="#EdouardAriel">Edouard Ariel</tst:entry>
    <tst:entry key="#PhEDucler">Philippe Étienne Ducler</tst:entry>
    <tst:entry key="#DuclerScribe">Ducler's scribe</tst:entry>
    <tst:entry key="#UmraosinghShergil">Umraosingh Sher-Gil</tst:entry>
</tst:scribes>

<tst:langs>
    <tst:entry key="ara">Arabic</tst:entry>
    <tst:entry key="bra">Brajbhasa</tst:entry>
    <tst:entry key="zho">Chinese</tst:entry>
    <tst:entry key="eng">English</tst:entry>
    <tst:entry key="fra">French</tst:entry>
    <tst:entry key="deu">German</tst:entry>
    <tst:entry key="guj">Gujarati</tst:entry>
    <tst:entry key="hin">Hindi</tst:entry>
    <tst:entry key="lat">Latin</tst:entry>
    <tst:entry key="mal">Malayalam</tst:entry>
    <tst:entry key="mar">Marathi</tst:entry>
    <tst:entry key="pli">Pali</tst:entry>
    <tst:entry key="por">Portuguese</tst:entry>
    <tst:entry key="pra">Prakrit</tst:entry>
    <tst:entry key="raj">Rajasthani</tst:entry>
    <tst:entry key="san">Sanskrit</tst:entry>
    <tst:entry key="sin">Sinhalese</tst:entry>
    <tst:entry key="tam">Tamil</tst:entry>
    <tst:entry key="tel">Telugu</tst:entry>
    <tst:entry key="bod">Tibetan</tst:entry>
</tst:langs>

<tst:iso6392b>
    <tst:entry key="ara">ara</tst:entry>
    <tst:entry key="bra">bra</tst:entry>
    <tst:entry key="zho">chi</tst:entry>
    <tst:entry key="eng">eng</tst:entry>
    <tst:entry key="fra">fre</tst:entry>
    <tst:entry key="deu">ger</tst:entry>
    <tst:entry key="guj">guj</tst:entry>
    <tst:entry key="hin">hin</tst:entry>
    <tst:entry key="lat">lat</tst:entry>
    <tst:entry key="mal">mal</tst:entry>
    <tst:entry key="mar">mar</tst:entry>
    <tst:entry key="pli">pli</tst:entry>
    <tst:entry key="por">por</tst:entry>
    <tst:entry key="pra">pra</tst:entry>
    <tst:entry key="raj">raj</tst:entry>
    <tst:entry key="san">san</tst:entry>
    <tst:entry key="sin">sin</tst:entry>
    <tst:entry key="tam">tam</tst:entry>
    <tst:entry key="tel">tel</tst:entry>
    <tst:entry key="bod">tib</tst:entry>
</tst:iso6392b>
<tst:entities>
    <tst:entry key="#pcs">&#x0BF3;</tst:entry>
    <tst:entry key="#pcl">&#x0BF3;</tst:entry>
    <tst:entry key="#ra_r_kal">&#xB86;</tst:entry>
    <tst:entry key="#kompu">&#x0B8E;</tst:entry>
    <tst:entry key="#nna=m">&#xBA3;&#xBAE;&#xBCD;</tst:entry>
    <tst:entry key="#ya=m">&#xBAF;&#xBAE;&#xBCD;</tst:entry>
    <tst:entry key="#tēti">&#x0BF3;</tst:entry>
    <tst:entry key="#mācam">௴</tst:entry>
    <tst:entry key="#varuṣam">௵</tst:entry>
    <tst:entry key="#patru">௶</tst:entry>
    <tst:entry key="#eduppu">௷</tst:entry>
    <tst:entry key="#mēṟpaṭi">௸</tst:entry>
    <tst:entry key="#rupai">௹</tst:entry>
    <tst:entry key="#niluvai">௺</tst:entry>
    <tst:entry key="#munthiri">𑿀</tst:entry>
    <tst:entry key="#araikkaani">𑿁</tst:entry>
    <tst:entry key="#kaani">𑿂</tst:entry>
    <tst:entry key="#kaal_viisam">𑿃</tst:entry>
    <tst:entry key="#arai_maa">𑿄</tst:entry>
    <tst:entry key="#arai_viisam">𑿅</tst:entry>
    <tst:entry key="#mukkaani">𑿆</tst:entry>
    <tst:entry key="#mukkaal_viisam">𑿇</tst:entry>
    <tst:entry key="#maa">𑿈</tst:entry>
    <tst:entry key="#viisam">𑿉</tst:entry>
    <tst:entry key="#viisam_alt">𑿊</tst:entry>
    <tst:entry key="#irumaa">𑿋</tst:entry>
    <tst:entry key="#araikkaal">𑿌</tst:entry>
    <tst:entry key="#mumaa">𑿍</tst:entry>
    <tst:entry key="#muuviisam">𑿎</tst:entry>
    <tst:entry key="#naangu_maa">𑿏</tst:entry>
    <tst:entry key="#kaal">𑿐</tst:entry>
    <tst:entry key="#arai">𑿑</tst:entry>
    <tst:entry key="#arai_alt">𑿒</tst:entry>
    <tst:entry key="#mukkaal">𑿓</tst:entry>
    <tst:entry key="#kiizh">𑿔</tst:entry>
    <tst:entry key="#nel">𑿕</tst:entry>
    <tst:entry key="#cevitu">𑿖</tst:entry>
    <tst:entry key="#aazhaakku">𑿗</tst:entry>
    <tst:entry key="#uzhakku">𑿘</tst:entry>
    <tst:entry key="#muuvuzhakku">𑿙</tst:entry>
    <tst:entry key="#kuruni">𑿚</tst:entry>
    <tst:entry key="#pathakku">𑿛</tst:entry>
    <tst:entry key="#mukkuruni">𑿜</tst:entry>
    <tst:entry key="#kaacu">𑿝</tst:entry>
    <tst:entry key="#panam">𑿞</tst:entry>
    <tst:entry key="#pon">𑿟</tst:entry>
    <tst:entry key="#varaakan">𑿠</tst:entry>
    <tst:entry key="#paaram">𑿡</tst:entry>
    <tst:entry key="#kuzhi">𑿢</tst:entry>
    <tst:entry key="#veli">𑿣</tst:entry>
    <tst:entry key="#nansey">𑿤</tst:entry>
    <tst:entry key="#punsey">𑿥</tst:entry>
    <tst:entry key="#nilam">𑿦</tst:entry>
    <tst:entry key="#uppalam">𑿧</tst:entry>
    <tst:entry key="#varavu">𑿨</tst:entry>
    <tst:entry key="#enn">𑿩</tst:entry>
    <tst:entry key="#naalathu">𑿪</tst:entry>
    <tst:entry key="#silvaanam">𑿫</tst:entry>
    <tst:entry key="#poga">𑿬</tst:entry>
    <tst:entry key="#āka">𑿭</tst:entry>
    <tst:entry key="#vasam">𑿮</tst:entry>
    <tst:entry key="#muthal">𑿯</tst:entry>
    <tst:entry key="#muthaliya">𑿰</tst:entry>
    <tst:entry key="#vakaiyaraa">𑿱</tst:entry>
    <tst:entry key="#end_of_text">𑿿</tst:entry>
    
    <tst:entry key="#pattu"><x:term xml:lang="ta-Taml">௰</x:term></tst:entry>
    <tst:entry key="#nūṟu"><x:term xml:lang="ta-Taml">௱</x:term></tst:entry>
    <tst:entry key="#āyiram"><x:term xml:lang="ta-Taml">௲</x:term></tst:entry>

    <tst:entry key="#newa-siddhi">&#x1144A;</tst:entry>
    <tst:entry key="#newa-gap-filler">&#x1144E;</tst:entry>
    <tst:entry key="#newa-old-gap-filler">&#x1144E;</tst:entry>
    <tst:entry key="#newa-abbreviation">&#x1144F;</tst:entry>

    <tst:entry key="#sarada-ekam">&#x111DA;</tst:entry>
    <tst:entry key="#sarada-siddhi">&#x111DB;</tst:entry>
    <tst:entry key="#sarada-separator">&#x111C8;</tst:entry>

    <tst:entry key="#headmark">&#x11B00;</tst:entry>
    <tst:entry key="#headmark_with_headstroke">&#x11B01;</tst:entry>
    <tst:entry key="#bhale">&#x11B02;</tst:entry>
    <tst:entry key="#bhale_hook">&#x11B03;</tst:entry>
    <tst:entry key="#bhale_five">&#x11B06;</tst:entry>
    <tst:entry key="#bhale_nine">&#x11B07;</tst:entry>
    <tst:entry key="#bhale_nine_reversed">&#x11B08;</tst:entry>
    <tst:entry key="#mindu">&#x11B09;</tst:entry>
    <tst:entry key="#jain_omkara">&#xA8FD;</tst:entry>

    <tst:entry key="#puspika">&#xA8F8;</tst:entry>
    <tst:entry key="#sirorekha">&#xA8FB;</tst:entry>
    <tst:entry key="#broken_danda">&#x0964;</tst:entry>
    <tst:entry key="#danda_with_slash">&#x0964;</tst:entry>

    <tst:entry key="#latin_cross">✝</tst:entry>
</tst:entities>

<tst:entityclasses>
    <tst:entry key="#pcl">aalt</tst:entry>
    <tst:entry key="#ra_r_kal">aalt</tst:entry>
    <tst:entry key="#kompu">aalt</tst:entry>
    <tst:entry key="#nna=m">hlig</tst:entry>
    <tst:entry key="#ya=m">hlig</tst:entry>
    <tst:entry key="#newa-old-gap-filler">trad</tst:entry>
    <tst:entry key="#double_kal">hlig</tst:entry>

    <tst:entry key="#broken_danda">cv01</tst:entry>
    <tst:entry key="#danda_with_slash">cv02</tst:entry>
</tst:entityclasses>

<tst:entityrend>
    <tst:entry key="prereform">hlig</tst:entry>
    <tst:entry key="below-base">dlig</tst:entry>
    <tst:entry key="post-base">dlig</tst:entry>
    <tst:entry key="vowel-sign">aalt</tst:entry>
</tst:entityrend>
<tst:rendnames>
    <tst:entry key="prereform">prereform</tst:entry>
    <tst:entry key="below-base">below-base ligature</tst:entry>
    <tst:entry key="post-base">post-base ligature</tst:entry>
    <tst:entry key="vowel-sign">vowel sign</tst:entry>
</tst:rendnames>

<tst:entitynames>
    <tst:entry key="#pcs">piḷḷaiyār cuḻi (short)</tst:entry>
    <tst:entry key="#pcl">piḷḷaiyār cuḻi (long)</tst:entry>
    <tst:entry key="#ra_r_kal">ra, r, or kāl</tst:entry>
    <tst:entry key="#kompu">kompu</tst:entry>
    <tst:entry key="#nna=m">ṇam ligature</tst:entry>
    <tst:entry key="#ya=m">yam ligature</tst:entry>
    <tst:entry key="#tēti">tēti</tst:entry>
    <tst:entry key="#mācam">mācam</tst:entry>
    <tst:entry key="#varuṣam">varuṣam</tst:entry>
    <tst:entry key="#patru">debit</tst:entry>
    <tst:entry key="#eduppu">credit</tst:entry>
    <tst:entry key="#mēṟpaṭi">as above</tst:entry>
    <tst:entry key="#rupai">rupee</tst:entry>
    <tst:entry key="#niluvai">balance</tst:entry>
    <tst:entry key="#munthiri">1/320</tst:entry>
    <tst:entry key="araikkaani">1/160</tst:entry>
    <tst:entry key="#kaani">1/80</tst:entry>
    <tst:entry key="#kaal_viisam">1/64</tst:entry>
    <tst:entry key="#arai_maa">1/40</tst:entry>
    <tst:entry key="#arai_viisam">1/32</tst:entry>
    <tst:entry key="#mukkaal_viisam">3/64</tst:entry>
    <tst:entry key="#mukkaani">3/80</tst:entry>
    <tst:entry key="#maa">1/20</tst:entry>
    <tst:entry key="#viisam">1/16</tst:entry>
    <tst:entry key="#viisam_alt">1/16</tst:entry>
    <tst:entry key="#irumaa">1/10</tst:entry>
    <tst:entry key="#araikkaal">1/8</tst:entry>
    <tst:entry key="#mumaa">3/20</tst:entry>
    <tst:entry key="#muuviisam">3/16</tst:entry>
    <tst:entry key="#naangu_maa">1/5</tst:entry>
    <tst:entry key="#kaal">1/4</tst:entry>
    <tst:entry key="#arai">1/2</tst:entry>
    <tst:entry key="#arai_alt">1/2</tst:entry>
    <tst:entry key="#mukkaal">3/4</tst:entry>
    <tst:entry key="#kiizh">less 1/320</tst:entry>
    <tst:entry key="#nel">nel</tst:entry>
    <tst:entry key="#cevitu">cevitu</tst:entry>
    <tst:entry key="#aazhaakku">āḻākku</tst:entry>
    <tst:entry key="#uzhakku">uḻakku</tst:entry>
    <tst:entry key="#muuvuzhakku">mūvuḻakku</tst:entry>
    <tst:entry key="#kuruni">kuṟuṇi</tst:entry>
    <tst:entry key="#pathakku">patakku</tst:entry>
    <tst:entry key="#mukkuruni">mukkuṟuṇi</tst:entry>
    <tst:entry key="#kaacu">kācu</tst:entry>
    <tst:entry key="#panam">paṇam</tst:entry>
    <tst:entry key="#pon">poṉ</tst:entry>
    <tst:entry key="#varaakan">varākaṉ</tst:entry>
    <tst:entry key="#paaram">pāram</tst:entry>
    <tst:entry key="#kuzhi">kuḻi</tst:entry>
    <tst:entry key="#veli">vēļi</tst:entry>
    <tst:entry key="#nansey">wet cultivation</tst:entry>
    <tst:entry key="#nilam">land</tst:entry>
    <tst:entry key="#uppalam">salt pan</tst:entry>
    <tst:entry key="#varavu">credit</tst:entry>
    <tst:entry key="#enn">number</tst:entry>
    <tst:entry key="#naalathu">current</tst:entry>
    <tst:entry key="#silvaanam">and odd</tst:entry>
    <tst:entry key="#poga">spent</tst:entry>
    <tst:entry key="#āka">total</tst:entry>
    <tst:entry key="#vasam">in possession</tst:entry>
    <tst:entry key="#muthal">starting from</tst:entry>
    <tst:entry key="#muthaliya">et cetera (in a series)</tst:entry>
    <tst:entry key="#vakaiyaraa">et cetera (of a kind)</tst:entry>
    <tst:entry key="#end_of_text">end of text</tst:entry>

    <tst:entry key="#pattu">pattu</tst:entry>
    <tst:entry key="#nūṟu">nūṟu</tst:entry>
    <tst:entry key="#āyiram">āyiram</tst:entry>
    
    <tst:entry key="#newa-siddhi">Newa siddhi</tst:entry>
    <tst:entry key="#newa-gap-filler">Newa gap filler</tst:entry>
    <tst:entry key="#newa-old-gap-filler">Newa old-style gap filler</tst:entry>

    <tst:entry key="#sarada-ekam">Śāradā ekam</tst:entry>
    <tst:entry key="#sarada-siddhi">śāradā siddhi</tst:entry>
    <tst:entry key="#sarada-siddhi">śāradā separator</tst:entry>

    <tst:entry key="#headmark">head mark</tst:entry>
    <tst:entry key="#headmark_with_headstroke">head mark with headstroke`</tst:entry>
    <tst:entry key="#bhale">bhale</tst:entry>
    <tst:entry key="#bhale_hook">bhale with hook</tst:entry>
    <tst:entry key="#bhale_five">five-like bhale</tst:entry>
    <tst:entry key="#bhale_nine">nine-like bhale</tst:entry>
    <tst:entry key="#bhale_nine_reversed">reversed nine-like bhale</tst:entry>
    <tst:entry key="#mindu">mīṇḍu</tst:entry>
    <tst:entry key="#jain_omkara">Jaina oṃkāra</tst:entry>

    <tst:entry key="#puspika">puṣpikā</tst:entry>
    <tst:entry key="#sirorekha">śirorekhā</tst:entry>
    <tst:entry key="#broken_danda">broken daṇḍa</tst:entry>
    <tst:entry key="#danda_with_slash">daṇḍa with slash</tst:entry>

    <tst:entry key="#latin_cross">latin cross</tst:entry>
</tst:entitynames>

<tst:additiontype>
    <tst:group label="structuring">
        <tst:entry key="catchword">catchword</tst:entry>
        <tst:entry key="foliation">foliation</tst:entry>
        <tst:entry key="intertitle">intertitle</tst:entry>
        <tst:entry key="register">register</tst:entry>
        <tst:entry key="table-of-contents">table of contents</tst:entry>
        <tst:entry key="title">title</tst:entry>
        <tst:entry key="verse-beginning">verse beginning</tst:entry>
        <tst:entry key="verse-numbering">verse numbering</tst:entry>
    </tst:group>
    <tst:group label="commenting">
        <tst:entry key="correction">correction</tst:entry>
        <tst:entry key="gloss">gloss/commentary</tst:entry>
        <tst:entry key="label">label</tst:entry>
        <tst:entry key="prosody">prosody</tst:entry>
        <tst:entry key="commenting-note">commenting note</tst:entry>
    </tst:group>
    <tst:group label="documenting">
        <tst:entry key="blessing">blessing (prose)</tst:entry>
        <tst:entry key="copy-statement">copy statement</tst:entry>
        <tst:entry key="date">date</tst:entry>
        <tst:entry key="dedication">dedication</tst:entry>
        <tst:entry key="ex-libris">ex-libris</tst:entry>
        <tst:entry key="invocation">invocation (metrical)</tst:entry>
        <tst:entry key="ownership-statement">ownership statement</tst:entry>
        <tst:entry key="postface">postface</tst:entry>
        <tst:entry key="preface">preface</tst:entry>
        <tst:entry key="recitation-statement">recitation statement</tst:entry>
        <tst:entry key="satellite-stanza">satellite stanza</tst:entry>
        <tst:entry key="seal">seal</tst:entry>
        <tst:entry key="shelfmark">shelfmark</tst:entry>
        <tst:entry key="stamp">stamp</tst:entry>
        <tst:entry key="summary">summary</tst:entry>
        <tst:entry key="total-chapters">total chapters</tst:entry>
        <tst:entry key="total-leaves">total leaves</tst:entry>
        <tst:entry key="total-stanzas">total stanzas</tst:entry>
        <tst:entry key="total-sutras">total sūtras</tst:entry>
        <tst:entry key="total-works">total works</tst:entry>
        <tst:entry key="documenting-note">documenting note</tst:entry>
        <tst:entry key="user-related-note">user-related note</tst:entry>
    </tst:group>
</tst:additiontype>

<tst:segtype>
    <tst:entry key="rubric">rubric</tst:entry>
    <tst:entry key="incipit">incipit</tst:entry>
    <tst:entry key="explicit">explicit</tst:entry>
    <tst:entry key="completion-statement">completion statement</tst:entry>
    <tst:entry key="colophon">colophon</tst:entry>
</tst:segtype>

<tst:genres>
    <tst:entry key="#antati">Antāti</tst:entry>
    <tst:entry key="#ammanai">Ammāṉai</tst:entry>
    <tst:entry key="#illakkanam">Ilakkaṇam</tst:entry>
    <tst:entry key="#katai">Katai</tst:entry>
    <tst:entry key="#kalampakam">Kalampakam</tst:entry>
    <tst:entry key="#kappiyam">Kāppiyam</tst:entry>
    <tst:entry key="#kilkkanakku">Kīḻkkaṇakku</tst:entry>
    <tst:entry key="#cankam">Caṅkam</tst:entry>
    <tst:entry key="#talapuranam">Talapurāṇam</tst:entry>
    <tst:entry key="#tirumurai">Tirumuṟai</tst:entry>
    <tst:entry key="#nikantu">Nikaṇṭu</tst:entry>
    <tst:entry key="#natakam">Nāṭakam</tst:entry>
    <tst:entry key="#niti">Nīti</tst:entry>
    <tst:entry key="#pirapantam">Pirapantam</tst:entry>
    <tst:entry key="#puranam">Purāṇam</tst:entry>
</tst:genres>

<tst:milestones>
    <tst:entry key="left-margin">left margin</tst:entry>
    <tst:entry key="right-margin">right margin</tst:entry>
    <tst:entry key="main-text-area">main text area</tst:entry>
</tst:milestones>

<tst:persroles>
    <tst:entry key="addressee">addressee</tst:entry>
    <tst:entry key="annotator">annotator</tst:entry>
    <tst:entry key="author">author</tst:entry>
    <tst:entry key="binder">binder</tst:entry>
    <tst:entry key="collector">collector</tst:entry>
    <tst:entry key="commentator">commentator</tst:entry>
    <tst:entry key="commissioner">commissioner</tst:entry>
    <tst:entry key="editor">editor</tst:entry>
    <tst:entry key="owner">owner</tst:entry>
    <tst:entry key="proofreader">proofreader</tst:entry>
    <tst:entry key="reciter">reciter</tst:entry>
    <tst:entry key="scribe">scribe</tst:entry>
    <tst:entry key="signer">signer</tst:entry>
    <tst:entry key="translator">translator</tst:entry>
</tst:persroles>

<tst:unclear>
    <tst:entry key="blemish">blemish</tst:entry>
    <tst:entry key="rubbed">rubbed</tst:entry>
    <tst:entry key="messy">messy</tst:entry>
    <tst:entry key="consonant_unclear">consonant unclear</tst:entry>
    <tst:entry key="vowel_unclear">vowel unclear</tst:entry>
    <tst:entry key="eccentric_ductus">eccentric ductus</tst:entry>
</tst:unclear>

<tst:abbreviations>
    <tst:entry key="#Aink" short="Aiṅk"><x:title xml:lang="ta">Aiṅkuṟunūṟu</x:title></tst:entry>
    <tst:entry key="#Atiyar" short="Aṭi"><x:persName xml:lang="ta">Aṭiyārkkunallār</x:persName></tst:entry>
    <tst:entry key="#AN" short="AN"><x:title xml:lang="ta">Akanāṉūṟu</x:title></tst:entry>
    <tst:entry key="#Beschi" short="Beschi">Beschi's <x:title xml:lang="en">Caturakarāti</x:title></tst:entry>
    <tst:entry key="#CC" short="Cānti"><x:foreign xml:lang="ta">Cānti Cātaṉa</x:foreign> edition</tst:entry>
    <tst:entry key="#Cena" short="Cēṉā"><x:persName xml:lang="ta">Cēṉāvaraiyar</x:persName></tst:entry>
    <tst:entry key="#Cila" short="Cila"><x:title xml:lang="ta">Cilappatikāram</x:title></tst:entry>
    <tst:entry key="#Cint" short="Cint"><x:title xml:lang="ta">Cīvakacintāmaṇi</x:title></tst:entry>
    <tst:entry key="#Cre-A" short="Cre-A"><x:title xml:lang="ta">Kriyāviṉ Tarḵālat Tamiḻ Akarāti</x:title></tst:entry>
    <tst:entry key="#Ilam" short="Iḷam"><x:persName xml:lang="ta">Iḷampūraṇar</x:persName></tst:entry>
    <tst:entry key="#io" short="i.o.">isolated occurence</tst:entry>
    <tst:entry key="#Kali" short="Kali"><x:title xml:lang="ta">Kalittokai</x:title></tst:entry>
    <tst:entry key="#Kall" short="Kall"><x:persName xml:lang="ta">Kallāṭaṉār</x:persName></tst:entry>
    <tst:entry key="#KT" short="KT"><x:title xml:lang="ta">Kuṟuntokai</x:title></tst:entry>
    <tst:entry key="#Mani" short="Maṇi"><x:title xml:lang="ta">Maṇimēkalai</x:title></tst:entry>
    <tst:entry key="#MuTA" short="MuTA"><x:title xml:lang="ta">Mūṉṟān Tiruvantāti</x:title></tst:entry>
    <tst:entry key="#NA" short="NA"><x:title xml:lang="ta">Naṟṟiṇai</x:title></tst:entry>
    <tst:entry key="#Nacc" short="Nacc"><x:persName xml:lang="ta">Nacciṉārkkiṉiyār</x:persName></tst:entry>
    <tst:entry key="#Pati" short="Pati"><x:title xml:lang="ta">Patiṟṟuppattu</x:title></tst:entry>
    <tst:entry key="#Pari" short="Pari"><x:title xml:lang="ta">Paripāṭal</x:title></tst:entry>
    <tst:entry key="#Parim" short="Parim"><x:title xml:lang="ta">Parimēlaḻakar</x:title></tst:entry>
    <tst:entry key="#Pink" short="Piṅk"><x:title xml:lang="ta">Piṅkalam</x:title></tst:entry>
    <tst:entry key="#PN" short="PN"><x:title xml:lang="ta">Puṟanāṉūṟu</x:title></tst:entry>
    <tst:entry key="#pu" short="p.u."><x:term xml:lang="ta">paḻaiyavurai</x:term></tst:entry>
    <tst:entry key="#Tev" short="Tēv"><x:title xml:lang="ta">Tēvāram</x:title></tst:entry>
    <tst:entry key="#Tiv" short="Tiv"><x:title xml:lang="ta">Tivākaram</x:title></tst:entry>
    <tst:entry key="#TK" short="TK"><x:title xml:lang="ta">Tirukkuṛaḷ</x:title></tst:entry>
    <tst:entry key="#TL" short="TL"><x:title xml:lang="en">University of Madras Tamil Lexicon</x:title></tst:entry>
    <tst:entry key="#TNV" short="TNV"><x:title xml:lang="ta">Tamiḻneṟi Viḷakkam</x:title></tst:entry>
    <tst:entry key="#Tol" short="Tol"><x:title xml:lang="ta">Tolkāppiyam</x:title></tst:entry>
    <tst:entry key="#Teyv" short="Teyv"><x:persName xml:lang="ta">Teyvaccilaiyār</x:persName></tst:entry>
    <tst:entry key="#UVC" short="UVC"><x:persName xml:lang="ta">U. Vē. Cāminātaiyar</x:persName></tst:entry>
    <tst:entry key="#UVSL" short="UVSL"><x:persName xml:lang="ta">U. Vē. Cāminātaiyar</x:persName> Library</tst:entry>
    <tst:entry key="#VAMTIPA" short="VAMTIPA"><x:title xml:lang="ta">Varalāṟṟumuṟait Tamiḻ Ilakkiyap Pērakarāti</x:title></tst:entry>
    <tst:entry key="#VMS" short="VMS"><x:persName xml:lang="ta">V. M. Subramanya Aiyar</x:persName></tst:entry>
    <tst:entry key="#VTCSP" short="VTCSP"><x:title xml:lang="pt">Vocabulario Tamulico com Asignificaçam Portugueza</x:title></tst:entry>
</tst:abbreviations>
</xsl:variable>

<xsl:variable name="TST" select="exsl:node-set($defRoot)"/>

</xsl:stylesheet>
