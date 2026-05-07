import { loadDoc } from './fileops.mjs';

const _state = {
    sheet: null
};

const getXSLTSheet = async doc => {
    for(const n of doc.childNodes) {
        if(n.nodeName === 'xml-stylesheet') {
            const temp = doc.createElement('outer');
            temp.innerHTML = `<inner ${n.data}/>`;
            const href = temp.firstChild.getAttribute('href');
            return loadDoc(href,'default');
        }
    }
};

const isDuplicateParam = (nodeToImport, existingParamNames) => {
  if (nodeToImport.localName !== 'param' || 
      nodeToImport.namespaceURI !== 'http://www.w3.org/1999/XSL/Transform')
    return false;

  return existingParamNames.has(nodeToImport.getAttribute('name'));
}

const getTopLevelParamNames = (xsltsheet, xslns) => {
  const params = xsltsheet.documentElement.getElementsByTagNameNS(xslns, 'param');
  const names = new Set();
  for (const param of params) {
    if (param.parentElement === xsltsheet.documentElement)
      names.add(param.getAttribute('name'));
  }
  return names;
}

const compileImports = async (xsltsheet, relurl) => {
  const xslns = 'http://www.w3.org/1999/XSL/Transform';
  const imports = Array.from(xsltsheet.getElementsByTagNameNS(xslns, 'import'));
  if (!imports.length) return xsltsheet;
  if (!relurl) relurl = window.location.href;

  const existingParamNames = getTopLevelParamNames(xsltsheet, xslns);

  // Fetch all imports at this level in parallel.
  const importDocs = await Promise.all(
    imports.map(async (importElement) => {
      const href = new URL(importElement.getAttribute('href'), relurl).href;
      const importedDoc = await loadDoc(href, 'default');
      return { importElement, importedDoc, href };
    }),
  );

  for (const { importElement, importedDoc, href } of importDocs) {
    if (!importedDoc || !importedDoc.documentElement) {
      importElement.remove();
      continue;
    }

    /*
    const attrs = importedDocRoot.getAttributeNames();
    for (const attr of attrs) {
      if (!xsltDocRoot.getAttribute(attr)) {
        xsltDocRoot.setAttribute(attr, importedDocRoot.getAttribute(attr));
      }
    }
    */
    // Recursively compile imports within the imported document.
    await compileImports(importedDoc, href);

    // namespace-aware attributes
    const importedDocRoot = importedDoc.documentElement;
    const xsltDocRoot = xsltsheet.documentElement;
    for(const attr of importedDocRoot.attributes) {
      if(!xsltDocRoot.getAttributeNS(attr.namespaceURI,attr.localName)) {
        xsltDocRoot.setAttributeNS(attr.namespaceURI,attr.name,attr.value);
      }
    }

    // Move all children from the imported document to the main document.
    // Special case: skip duplicate parameters if they were already merged.
    let child = importedDocRoot.firstChild;
    while (child) {
      const next = child.nextSibling;
      if (isDuplicateParam(child, existingParamNames)) {
        child.remove();
      } else {
        if (child.localName === 'param' && child.namespaceURI === xslns) {
          existingParamNames.add(child.getAttribute('name'));
        }
        importElement.before(child);
      }
      child = next;
    }
    importElement.remove();
  }
  return xsltsheet;
}
/*
const compileImports = async (xsltsheet,prefix='') => {
    const imports = xsltsheet.querySelectorAll('import');
    if(!imports) return xsltsheet;
    for(const x of imports) {
        const href = prefix + x.getAttribute('href');
        const split = href.split('/');
        split.pop();
        const newprefix = split.join('/') + '/';
        const i = await loadDoc(href,'default');
        for(const attr of i.documentElement.attributes) {
          if(!xsltsheet.documentElement.getAttributeNS(attr.namespaceURI,attr.localName))
            xsltsheet.documentElement.setAttributeNS(attr.namespaceURI,attr.name,attr.value);
        }
        while(i.documentElement.firstChild) {

            if(i.documentElement.firstChild.nodeName === 'xsl:param') {
                if(xsltsheet.querySelector(`variable[name="${i.documentElement.firstChild.getAttribute('name')}"]`)) { 
                    i.documentElement.firstChild.remove();
                    continue;
                }
            }
            if(i.documentElement.firstChild.nodeName === 'xsl:import') {
                const ii = await loadDoc(newprefix + i.documentElement.firstChild.getAttribute('href'),'default');
                const embed = await compileImports(ii,newprefix);
                while(embed.documentElement.firstChild)
                        x.before(embed.documentElement.firstChild);
                for(const attr of embed.documentElement.attributes) {
                  if(!xsltsheet.documentElement.getAttributeNS(attr.namespaceURI,attr.localName))
                    xsltsheet.documentElement.setAttributeNS(attr.namespaceURI,attr.name,attr.value);
                }
                i.documentElement.firstChild.remove();
                continue;
            }

            x.before(i.documentElement.firstChild);
        }
        x.remove();
    }
    return xsltsheet;
};
*/
/*
const compileImports = async (xsltsheet,relurl) => {
    const imports = xsltsheet.querySelectorAll('import');
    if(!imports) return xsltsheet;
    if(!relurl) relurl = window.location.href;
    for(const x of imports) {
        const href = (new URL(x.getAttribute('href'),relurl)).href;
        const i = await loadDoc(href,'default');
        while(i.documentElement.firstChild) {

            if(i.documentElement.firstChild.nodeName === 'xsl:param') {
                if(xsltsheet.querySelector(`variable[name="${i.documentElement.firstChild.getAttribute('name')}"]`)) { 
                    i.documentElement.firstChild.remove();
                    continue;
                }
            }
            if(i.documentElement.firstChild.nodeName === 'xsl:import') {
                const newhref = (new URL(i.documentElement.firstChild.getAttribute('href'),href)).href;
                const ii = await loadDoc(newhref);
                const embed = await compileImports(ii,newhref);
                while(embed.documentElement.firstChild)
                        x.before(embed.documentElement.firstChild);
                i.documentElement.firstChild.remove();
                continue;
            }

            x.before(i.documentElement.firstChild);
        }
        
        for(const attr of i.documentElement.attributes) {
          if(!xsltsheet.documentElement.getAttributeNS(attr.namespaceURI,attr.localName))
            xsltsheet.documentElement.setAttributeNS(attr.namespaceURI,attr.name,attr.value);
        }

        x.remove();
    }
    return xsltsheet;
};
*/
const XSLTransform = async (xsltsheet, doc) => {
    const xproc = new XSLTProcessor();
    const compiled = await compileImports(xsltsheet);
    xproc.importStylesheet(compiled);
    return xproc.transformToDocument(doc);
};

const previewDoc = async doc => {
    if(!_state.sheet) _state.sheet = await getXSLTSheet(doc);
    return await XSLTransform(_state.sheet, doc);
};

export default previewDoc;
