import Smits from './jsphylosvg-custom.mjs';
import { changeScript, to } from './transliterate.mjs';
import { Utils as _Utils } from './utils.mjs';
import { Fitch as _Fitch } from './fitch.mjs';
import _Hypher from './hypher.mjs';
import hyphenation_sa from './hypher-sa.mjs';

Smits.PhyloCanvas.Render.Style.line.stroke = 'rgb(162,164,170)';

const Hypher = new _Hypher(hyphenation_sa);

var _state, Find, Check, Make, Xslt, edit, multi, view;

const init = (state, xslt, utils, Edit, Multi, View) => {
  _state = state;
  Find = utils.find;
  Check = utils.check;
  Make = utils.make;
  Xslt = xslt;
  edit = Edit;
  multi = Multi;
  view = View;
	_state.viewdiv.addEventListener('click',events.textClick);
	document.addEventListener('keydown',events.keyDown,{capture: true});
	document.addEventListener('contextmenu',events.rightClick);
	document.addEventListener('mouseup',contextMenu.remove);
};

const touchUpNode = node => {
  const walker = document.createTreeWalker(node,NodeFilter.SHOW_TEXT);
  while(walker.nextNode()) {
    const txt = touchUpText(walker.currentNode.nodeValue);
    walker.currentNode.nodeValue = txt;
  }
};

const touchUpText = str => {
  // TODO: do other languages
  return Hypher.hyphenateText(
    str
      .replace(/ \|/g,'\u00a0|')
      .replace(/\| (?=\d)/g,'|\u00a0')
      .replace(/\|\|/g,'॥')
      .replace(/\|/g,'।')
  );
};

const removeBox = () => {
	const box = document.getElementById('tooltip');
	if(box) box.remove();
};

class Box {
	constructor(name) {
		this.name = name;
		this.script = 0;
	}

	show() {
		_state.descs.appendChild(this.descbox);
		if(Check.normalizedView())
			view.showNormalized(this);
		_state.viewdiv.appendChild(this.boxdiv);
		this.closed = false;
	}

	clear() {
		while(this.boxdiv.firstChild)
			this.boxdiv.removeChild(this.boxdiv.firstChild);
		if(this.svgcontainer) {
			this.clearsvg();
			this.boxdiv.appendChild(this.svgcontainer);
		
		}
	}

	destroy() {
		_state.viewdiv.removeChild(this.boxdiv);
		_state.descs.removeChild(this.descbox);
		const treeindex = _state.trees.indexOf(this);
		if(treeindex > -1)
			_state.trees.splice(treeindex,1);
		const textindex = _state.textboxes.indexOf(this);
		if(textindex > -1)
			_state.textboxes.splice(textindex,1);
		this.closed = true;
		//underlineVariants();
		if(this.name === 'Matrix')
			document.getElementById('matrixmenu').style.display = 'block';
		view.drawTrees();
		multi.rehighlight();
	}

	pullout() {
		this.destroy();
		const features = 'menubar=no,location=no,status=no,height=620,width=620,scrollbars=yes,centerscreen=yes';
		const branchnum = window.mainWindow ?
			window.mainWindow.comboView.getWindows().length :
			_state.windows.length;
		const newWindow = window.open('branch.html','branch'+branchnum,features);
		newWindow.mainWindow = window.mainWindow ?
			window.mainWindow :
			window;
		newWindow.startbox = this.text ?
		//{text: {name: this.name, map: this.textmap}} :
			{text: {name: this.name}} :
			{tree: this.name};
		newWindow.mainWindow.comboView.addWindow(newWindow);
	}

	makeDescBox() {
		const descbox = document.createElement('div');
		const closer = document.createElement('div');
		closer.classList.add('closer');
		closer.innerHTML = 'x';
		closer.title = 'close';
		/*      const opener = document.createElement('div');
  opener.classList.add('opener');
  opener.innerHTML = '^';
  opener.title = 'open in new window'; */
		const scripter = document.createElement('div');
		scripter.classList.add('scripter');
		scripter.innerHTML = 'A';
		scripter.title = 'change script';
		descbox.appendChild(closer);
		//descbox.appendChild(opener);
		descbox.appendChild(scripter);
		descbox.appendChild(document.createTextNode(this.desc));
		this.descbox = descbox;
		closer.addEventListener('click',this.destroy.bind(this));
		//opener.addEventListener('click',this.pullout.bind(this));
		scripter.addEventListener('click',this.cyclescript.bind(this));
	}

	cyclescript() {
		const oldscript = _state.scripts[this.script];
		this.script = this.script + 1;
		if(this.script === _state.scripts.length)
			this.script = 0;
		const scripter = this.descbox.querySelector('.scripter');
		if(this.script === 0)
			scripter.innerHTML = 'A';
		else
			scripter.innerHTML = to(_state.scripts[this.script],'a');
		scripter.classList.add(_state.scripts[this.script]);
		scripter.classList.remove(oldscript);
		/*if(_state.scripts[this.script] === 'grantha')
			scripter.classList.add('grantha');
		else scripter.classList.remove('grantha');*/
		//this.updatescript(oldscript);
		this.updatescript();
		this.boxdiv.classList.add(_state.scripts[this.script]);
		this.boxdiv.classList.remove(oldscript);
	}

	updatescript(/*oldscript*/lemmata) {
		const nodes = lemmata ?
			lemmata.map(l => this.boxdiv.querySelector(`.lemma[data-n=${l}]`)) :
			this.boxdiv.querySelectorAll('.lemma,.tree-lemma');
		for(const node of nodes) {
			const hasNormalized = node.dataset.hasOwnProperty('normal');
			if(!hasNormalized && node.textContent.trim() === '') continue;
			/*if(!node.hasOwnProperty('IAST'))
			node.IAST = node.cloneNode(true); */
			const tochange = ((document) => {
				if(Check.normalizedView() && hasNormalized) {
					const temp = document.createElement('span');
					temp.appendChild(document.createTextNode(node.dataset.normal));
					return temp;
				}
				else
					return node.IAST.cloneNode(true);
			})(document);
			const newnode = this.script === 0 ?
				tochange :
				changeScript(tochange,_state.scripts[this.script]);
			node.innerHTML = '';
			while(newnode.firstChild)
				node.appendChild(newnode.firstChild);
		}
		/*
		if(oldscript) {
			this.boxdiv.classList.add(_state.scripts[this.script]);
			this.boxdiv.classList.remove(oldscript);
		}
		*/
		/*
		if(_state.scripts[this.script] === 'grantha') 
			this.boxdiv.classList.add('grantha');
		else this.boxdiv.classList.remove('grantha');
		*/
		if(this.boxdiv.classList.contains('matrix'))
			view.xScrollToHighlit();
	}
}

class TreeBox extends Box {
	constructor(stemmaid,id) {
		super(`#${stemmaid} #${id}`);
		this.stemmaid = stemmaid;
		this.id = id;
		this.nexml = _state.treelist.get(this.name).cloneNode(true);
		this.desc = this.nexml.querySelector('tree').getAttribute('label');
	}
	init() {
		this.makeDescBox();
		const treediv = document.createElement('div');
		treediv.classList.add('tree-box');
		var divid;
		var n = 0;
		do {
			divid = 'tree' + n;
			n++;
		} while(document.getElementById(divid));
		treediv.id = divid;
		this.boxdiv = treediv;
		this.boxdiv.addEventListener('mouseover',events.treeMouseover.bind(null,this));
		this.boxdiv.addEventListener('click',events.treeClick);
		this.svgcontainer = document.createElement('div');
		this.svgcontainer.id = this.boxdiv.id + 'container';
		this.boxdiv.appendChild(this.svgcontainer);
		this.boxdiv.myTree = this;

		//const parser = new DOMParser();
		///this.nexml = parser.parseFromString(_state.treelist.get(this.name),'text/xml');
		this.calcPaths();
		this.jiggleroot();
		this.findLevels();
		this.labelInternal();
	}

	show() {
		_state.descs.appendChild(this.descbox);
		_state.viewdiv.appendChild(this.boxdiv);
	}

	jiggleroot() {
		const oldroot = this.nexml.evaluate('//nex:node[@root="true"]',this.nexml,this.nsResolver,XPathResult.FIRST_ORDERED_NODE_TYPE,null).singleNodeValue;
		const edges = this.nexml.evaluate('//nex:edge[@source="'+oldroot.id+'"]|//nex:edge[@target="'+oldroot.id+'"]',this.nexml,this.nsResolver,XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,null);
		if(edges.snapshotLength === 3) {
			var oldedge;
			var newsrctrgt;
			for(let i=0;i<edges.snapshotLength;i++) {
				const thisedge = edges.snapshotItem(i);
				const sourceid = thisedge.getAttribute('source');
				const targetid = thisedge.getAttribute('target');
				const sourcenode = this.nexml.evaluate('//nex:node[@id="'+sourceid+'"]',this.nexml,this.nsResolver,XPathResult.FIRST_ORDERED_NODE_TYPE,null).singleNodeValue;
				const targetnode = this.nexml.evaluate('//nex:node[@id="'+targetid+'"]',this.nexml,this.nsResolver,XPathResult.FIRST_ORDERED_NODE_TYPE,null).singleNodeValue;
				if(!sourcenode.hasAttribute('otu') && !targetnode.hasAttribute('otu')) {
					oldedge = thisedge;
					newsrctrgt = targetid === oldroot.id ?
						'target' : 'source';
					break;
				}
			}
			if(oldedge) {
				const newroot = this.nexml.createElementNS(oldroot.namespaceURI,'node');
				newroot.id = 'fakeroot';
				newroot.setAttribute('root','true');
				oldroot.removeAttribute('root');
				oldroot.parentElement.insertBefore(newroot,oldroot);
				const newedge = this.nexml.createElementNS(oldroot.namespaceURI,'edge');
				newedge.id = 'newrootedge';
				newedge.setAttribute('length','0');
				newedge.setAttribute('source','fakeroot');
				newedge.setAttribute('target',oldroot.id);
				oldroot.parentElement.insertBefore(newedge,oldedge);
		
				oldedge.setAttribute(newsrctrgt,newroot.id);
			}
		}
	}

	findLevels() {
		const alledges = this.nexml.querySelectorAll('edge');
		const taxa = [...this.nexml.querySelectorAll('node[otu]')];
		const tree = this.nexml;
		const levels = [taxa];

		const getNextLevel = function(curlevel,edges) {
			const ids = curlevel.map(t => t.id);
			const dups = new Map();
			const nodups = new Map();
			const usededges = [];
			for (const e of edges) {
				const target = e.getAttribute('target');
				const source = e.getAttribute('source');
				const group = (() => {
					/*if(ids.indexOf(target) !== -1)
						return {ancestor: tree.querySelector(`node[id="${source}"]`),
							child: tree.querySelector(`node[id="${target}"]`)};
					else if(ids.indexOf(source) !== -1)
						return {ancestor: tree.querySelector(`node[id="${target}"]`),
							child: tree.querySelector(`node[id="${source}"]`)};
					else
						return null;*/
					if(ids.indexOf(target) !== -1)
						return {ancestor: tree.getElementById(source),
							child: tree.getElementById(target)};
					else if(ids.indexOf(source) !== -1)
						return {ancestor: tree.getElementById(target),
							child: tree.getElementById(source)};
					else
						return null;
				})();
				if(group !== null) {
					if(nodups.has(group.ancestor)) {// duplicate
						const othergroup = nodups.get(group.ancestor);
						dups.set(group.ancestor,[othergroup.child, group.child]);
						usededges.push(e);
						usededges.push(othergroup.edge);
					}
					else nodups.set(group.ancestor,{child: group.child, edge: e});
				}
			}
			const dupkeys = [...dups.keys()];
			const leftovers = [...nodups.keys()].reduce((acc,key) => {
				if(dupkeys.indexOf(key) === -1)
					acc.push(nodups.get(key).child);
				return acc;
			},[]);
		
			const unusededges = [...edges].reduce((acc,e) => {
				if(usededges.indexOf(e) === -1)
					acc.push(e);
				return acc;
			},[]);

			return {match: dups, remainder: [...new Set(leftovers)],edges: unusededges};
		};

		var curnodes = taxa;
		var curedges = alledges;
		do {
			const nextlevel = getNextLevel(curnodes,curedges);
			levels.push(nextlevel.match);
			curnodes = [...nextlevel.match.keys(),...nextlevel.remainder];
			curedges = nextlevel.edges;
		} while (curedges.length > 0);

		this.levels = Find.serializedlevels(levels);
	}

	labelInternal() {
		for(const node of this.nexml.querySelectorAll('node:not([label])'))
			node.setAttribute('label',node.id);
	}
	fitch() {
		const texts = new Map(this.levels[0].map(id => {
			const normalized = Check.normalizedView();
			const label = this.nexml.querySelector(`node[id="${id}"]`).getAttribute('label');
			const treelemma = this.boxdiv.querySelector(`span.tree-lemma[data-id="${label}"]`);
			const reading = treelemma ? Find.htmlreading(treelemma,normalized) : undefined;
			return [id,reading];
		}));

		const results = (new _Fitch(texts,this.levels)).run();
		
		for(const [node,reading] of results) {
			const htmlnode = this.boxdiv.querySelector(`span.internal[data-key="${node}"]`);
			htmlnode.dataset.reconstructed = reading;
		}
	}

	clearsvg() {
		while(this.svgcontainer.firstChild)
			this.svgcontainer.removeChild(this.svgcontainer.firstChild);
	}

	removecolors() {
		//const colored = this.nexml.evaluate('//nex:node[@color]',this.nexml,this.nsResolver,XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,null);

		const colored = this.nexml.querySelectorAll('node[color]');
		for(let i=0; i < colored.snapshotLength; i++)
			colored.snapshotItem(i).removeAttribute('color');
	}

	drawlines(nodes,color) {
		this.removecolors();
		if(nodes) {
		/*
		const nodearr = nodes.split(';');
		const edges = this.getPath(...nodearr
					.map(s => s.replace(/[-_]/g,''))
				).path;
		
		*/
			const edges = this.getPath(...nodes.split(';')).path;
			const nodeset = new Set();
			for(const edge of edges) {
				nodeset.add(edge.getAttribute('target'));
				nodeset.add(edge.getAttribute('source'));
			}
			for(const node of nodeset) {
				const el = this.nexml.evaluate('//nex:node[@id="'+node+'"]',this.nexml,this.nsResolver,XPathResult.FIRST_ORDERED_NODE_TYPE,null).singleNodeValue;
				//const edges = this.nexml.evaluate('//nex:edge[@source="'+node+'"]|//nex:edge[@target="'+node+'"]',this.nexml,this.nsResolver,XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,null);
				if(/*edges.snapshotLength < 3 && */!el.getAttribute('root'))
					el.setAttribute('color',color);
			}
		}
		const width = parseInt(window.getComputedStyle(this.svgcontainer,null).width) - 15; // -15 for vertical scrollbar
		const maxheight = parseInt(window.getComputedStyle(this.boxdiv,null).height) - 10;
		const height = (function() {
			if(maxheight < 600) return 600;
			//else if(maxheight < 800) return maxheight;
			//else return 800;
			else return maxheight;
		})();
		this.phylocanvas = new Smits.PhyloCanvas(
			{nexml: this.nexml, fileSource: true},
			this.svgcontainer.id,
			width,height,
			// 'circular'
		);
		const highlit = this.svgcontainer.querySelectorAll('path:not([stroke="#a2a4aa"])');
		for(const high of highlit) {
			high.style.strokeWidth = '2';
		}
	}
	draw() {
		this.clear();
		this.drawlines();
		this.makeLabels();
	}

	clearLabels() {
		for(const txt of this.boxdiv.firstChild.querySelectorAll('text')) {
			txt.parentElement.removeChild(txt);
		}
	}

	makeLabels() {
		const alltexts = [...Find.texts()];
		const texts = new Set(alltexts.map(el => el.parentNode.getAttribute('n')));
		const reconstructed = new Map(
			alltexts.filter(el =>
				el.parentNode.hasAttribute('corresp') &&
			(el.parentNode.getAttribute('corresp') === this.name))
				.map(el => [el.parentNode.getAttribute('select').replace(/^#/,''),el.parentNode.getAttribute('n')])
		);
		for(const txt of this.boxdiv.firstChild.querySelectorAll('text')) {
			const newEl = document.createElement('div');
			newEl.setAttribute('class','tree-div');
			const offleft = parseInt(txt.getAttribute('x') - 5);
			const offtop = parseInt(txt.getAttribute('y')) - 15;
			newEl.style.left = offleft + 'px';
			newEl.style.top = offtop + 'px';
			const key = txt.textContent.trim();//.replace(/[-_]/g,'');
			//            newEl.innerHTML =
			/*                (texts.has(key) ?
				`<span class="witness inactive" data-key="${key}">${key}</span>` :
				`<span class="internal" data-key="${key}">${key}</span>`)
			+ '<span class="tree-lemma '+key+'" data-id="'+key+'"></span>';
*/
			if(texts.has(key)) {
				const label = document.querySelector(`tr[data-n="${key}"] th`).innerHTML;
				newEl.innerHTML =
`<span class="witness inactive" data-key="${key}">${label}</span><span class="tree-lemma ${key}" data-id="${key}"></span>`;
			}
      else if(_state.xml.querySelector(`witness[*|id="${key}"]`)) {
        newEl.innerHTML = `<span class="witness inactive greyedout" data-key="${key}">${key}</span><span class="tree-lemma ${key}" data-id="${key}"></span>`;
      }
			else if(key !== 'fakeroot') {
				if(reconstructed.has(key))
					newEl.innerHTML = `<span class="internal reconstructed" data-key="${key}" data-label="${reconstructed.get(key)}">${reconstructed.get(key)}</span><span class="tree-lemma invisible ${key}" data-id="${key}" data-label="${reconstructed.get(key)}"></span>`;
				else
					newEl.innerHTML = `<span class="internal" data-key="${key}">0</span>`;
			}
			else newEl.innerHTML = `<span class="internal" data-key="${key}"></span>`;
			//while(txt.firstChild)
			//    txt.removeChild(txt.firstChild);
			txt.parentElement.removeChild(txt);
			this.boxdiv.appendChild(newEl);
		}
	}

	clearlemmata() {
		for(const el of this.boxdiv.querySelectorAll('span.tree-lemma')) {
			el.innerHTML = '';
			if(el.dataset.hasOwnProperty('normal'))
				delete el.dataset.normal;
			el.IAST = el.cloneNode(true);
		}
	}

  concatLemmata(arr) {
    return arr.join('').replace(/\s+/g,' ').trim();
  }

	populate(n,m) {
		/*        for(const [key,value] of _texts)
		for(const el of this.boxdiv.getElementsByClassName(key)) {
			el.innerHTML = '';
			if(m)
				el.appendChild(Xslt.transformString(
					value.text.slice(n,parseInt(m)+1).join(' '),
					proc));
			else
				el.appendChild(Xslt.transformString(
					value.text[n],
					proc));
			el.IAST = el.cloneNode(true); // why was this commented out?
		} */
		//const texts = Find.texts();
		//for(const text of texts) {
    const maybeText = id => {
      const text = Find.firsttext(id);
      if(text) return text;
      
      const wit = _state.xml.querySelector(`witness[*|id="${id}"]`);
      if(!wit) return null;
      
      let par = wit.parentNode.closest('witness[*|id]');
      while(par) {
        const newtext = Find.firsttext(par.getAttribute('xml:id'));
        if(newtext) return newtext;
        par = wit.parentNode.closest('witness[*|id]');
      }
      return null;
    };

    for(const el of this.boxdiv.querySelectorAll('span.tree-lemma[data-id],span.tree-lamma[data-label]')) {
      const key = el.dataset.id || el.dataset.label;
			//const key = text.parentNode.getAttribute('n');
			//const el = this.boxdiv.querySelector(`span.tree-lemma[data-id="${key}"]`) || this.boxdiv.querySelector(`span.tree-lemma[data-label="${key}"]`);
      const text = maybeText(key);
			if(!text) continue;
			if(!el.hasOwnProperty('IAST')) el.IAST = el.cloneNode(true);
			el.IAST.innerHTML = '';
			if(m) {
				const arr = [];
				const normarr = [];
				var emended = false;
				for(let x=n;x<=m;x++) {
					const word = Find.firstword(x,text);
          const ret = word.innerHTML;

          const appendSpace = (multi && word.parentElement.nodeName === 'cl' && word.parentElement.lastElementChild === word) ?
            true : false;

          if(ret === '') arr.push(ret);
          else
            arr.push(appendSpace ? ret + ' ' : ret);

					if(word.hasAttribute('lemma')) {
            const lemma = word.getAttribute('lemma');
            if(lemma === '') normarr[x-n] = '';
            else
              normarr[x-n] = appendSpace ? lemma + ' ' : lemma;
          }
					if(word.hasAttribute('emended')) emended = true;
				}
				el.IAST.appendChild(Xslt.transformString(this.concatLemmata(arr),Xslt.sheets.tree));
				if(normarr.length !== 0) {
					const newarr = arr.slice(0).map((e,i) =>
						normarr.hasOwnProperty(i) ?
							normarr[i] :
							e
					);
					const temp = document.createElement('span');
					temp.appendChild(Xslt.transformString(this.concatLemmata(newarr),Xslt.sheets.tree));
					el.dataset.normal = temp.innerHTML;
				}
				if(emended) el.dataset.emended = true;
				else if(el.dataset.hasOwnProperty('emended')) delete el.dataset.emended;
			}
			else {
				const word = Find.firstword(n,text);
				el.IAST.appendChild(Xslt.transformString(word.innerHTML,Xslt.sheets.tree));
				if(word.hasAttribute('lemma'))
					el.dataset.normal = word.getAttribute('lemma');
				else
					delete el.dataset.normal;
				if(word.hasAttribute('emended')) el.dataset.emended = true;
				else if(el.dataset.hasOwnProperty('emended')) delete el.dataset.emended;
			}
			if(Check.normalizedView() && el.dataset.hasOwnProperty('normal'))
				el.innerHTML = el.dataset.normal;
			else
				el.innerHTML = el.IAST.innerHTML;
		}
		const inactive = this.boxdiv.querySelectorAll('.inactive');
		for(const label of inactive)
			label.classList.remove('inactive');
		this.fitch();
	}

	calcPaths() {
		this.nodes = [];
		this.paths = [];
		this.longest = {path:[]};
		this.nsResolver = this.nexml.createNSResolver(this.nexml.ownerDocument == null ? this.nexml.documentElement : this.nexml.ownerDocument.documentElement );
		const nodesSnapshot = this.nexml.evaluate('//nex:node[@label]',this.nexml,this.nsResolver,XPathResult.ORDERED_NODE_SNAPSHOT_TYPE);
		for(let i=0; i < nodesSnapshot.snapshotLength; i++)
			this.nodes.push(nodesSnapshot.snapshotItem(i));
		for(let i=0; i < this.nodes.length; i++) {
			const startnode = this.nodes[i];
			const startlabel = startnode.getAttribute('label');
			const startid = startnode.id;
			for(let j=i+1;j<this.nodes.length;j++) {
				const endnode = this.nodes[j];
				const endlabel = endnode.getAttribute('label');
				const endid = endnode.id;
				this.paths.push({nodes: [startlabel,endlabel],
					path: this.pathFind(startid,endid)});
			}
		}
		for(const key of Object.keys(this.paths))
			if(this.paths[key].path.length > this.longest.path.length)
				this.longest = this.paths[key];
	}

	pathFind(startid,endid,checked) {
		if(!checked) checked = [];
		const edges = this.nexml.evaluate('//nex:edge[@source="'+startid+'"]|//nex:edge[@target="'+startid+'"]',this.nexml,this.nsResolver,XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,null);
		var path;

		for(let i=0; i < edges.snapshotLength; i++) {
			const thisedge = edges.snapshotItem(i);
			path = [thisedge];
			if(checked.indexOf(thisedge.id) != -1) continue;

			checked.push(thisedge.id);
			const otherend = thisedge.getAttribute('source') !== startid ?
				thisedge.getAttribute('source') :
				thisedge.getAttribute('target');
			if(otherend === endid) return path;
			const othernode = this.nexml.evaluate('//nex:node[@id="'+otherend+'"]',this.nexml,this.nsResolver,XPathResult.FIRST_ORDERED_NODE_TYPE,null);
			if(othernode.singleNodeValue.hasAttribute('otu')) continue;
			else {
				const nextlevel = this.pathFind(otherend,endid,checked);
				if(nextlevel) return path.concat(nextlevel);
				else continue;
			}
		}
		return false;
	}

	analyzeVariants(n,m) {
		/* arguments: n -- index of lemma in each witness of the _texts object
 * returns object of longest paths:
 *      keys are lemmata,
 *      value is either:
 *          an object with properties length (int), branch_length (float), and paths (array)
 *          or a string, the name of the witness, pointing to the normalized lemma
 */
		const lemmata = [];
		const aliases = [];
    /*
		const makeLgLemma = function(str) {
			if(!str.startsWith('<lg')) return str;

			return Xslt.transformString(str,Xslt.sheets.lg).firstChild.data.slice(1);
		};

		const multiLemmaConcat = function(arr) {
			return arr.map(lemma => {
				return makeLgLemma(lemma);
			}).join('')
				.replace(/\s+/g,' ')
				.trim();
		};
    */
    /*
    const getReading = Check.normalizedView() ?
			function(n,text,multi=false) {
				const word = Find.firstword(n,text);
        const ret = word.hasAttribute('lemma') ?
					word.getAttribute('lemma') :
					word.textContent;

        if(ret === '') return ret;

        if(multi && word.parentElement.nodeName === 'cl' && word.parentElement.lastElementChild === word)
          return ret + ' ';
        else
          return ret;
			} :
			function(n,text,multi=false) {
				const word = Find.firstword(n,text);
        const ret = word.textContent;

        if(ret === '') return ret;

        if(multi && word.parentElement.nodeName === 'cl' && word.parentElement.lastElementChild === word)
          return ret + ' ';
        else
          return ret;
			};
    */
		//for(const text of Find.texts()) {
			//const key = text.parentNode.getAttribute('n');
		for(const el of this.boxdiv.querySelectorAll('span.tree-lemma')) {
	    const key = el.dataset.id;
			// ignore reconstructions and texts not in current tree
			if(!this.nexml.querySelector(`otu[label="${key}"]`))
				continue;
      /*
			const lemma = m ?
				this.concatLemmata(
				//Array.from(Array(parseInt(m)-n+1).keys(), p => p+n)
					Find.range(n,m).map(x => getReading(x,text,true))
				) :
				getReading(n,text);
      */
      const lemma = el.textContent;

			if(lemma === '')
				if(lemmata.hasOwnProperty(''))
					lemmata[''].push(key);
				else
					lemmata[''] = [key];
			else { // normalization dealt with elsewhere now
				if(lemmata.hasOwnProperty(lemma))
					lemmata[lemma].push(key);
				else
					lemmata[lemma] = [key];
				/*                const next_lemma = m ?
				findNextLemma2(value.text,m) :
				findNextLemma2(value.text,n);
			const clean = normalize(lemma,next_lemma);
			if(lemmata.hasOwnProperty(clean))
				lemmata[clean].push(key)
			else lemmata[clean] = [key];

			if(clean !== lemma)
				aliases[key] = clean;
*/
			}
		}
		const longestPaths = {};
		for(const lemma of Object.keys(lemmata)) {
			var longest = {length: 0, branch_length: 0, paths: []};
			if(lemmata[lemma].length === 1) {
				longest = false;
			}
			else {
				for(let i=0;i<lemmata[lemma].length;i++) {
					for(let j=i+1;j<lemmata[lemma].length;j++) {
						const path = this.getPath(lemmata[lemma][i],lemmata[lemma][j]);
						if(!path.hasOwnProperty('path'))
							//console.log(path);
							alert(path);
						if(path.path.length === longest.length) {
							const branch_length = this.calcBranchLength(path.path);
							if(branch_length === longest.branch_length)
								longest.paths.push(path);
							else if(branch_length > longest.branch_length)
								longest = {length: path.path.length,
									branch_length: branch_length,
									paths: [path]};
						}
						else if(path.path.length > longest.length)
							longest = {length: path.path.length,
								branch_length: this.calcBranchLength(path.path),
								paths: [path]};
					}
				}
			}
			longestPaths[lemma] = longest;
		}
		for(const key of Object.keys(aliases))
			longestPaths[key] = aliases[key];
		return longestPaths;
	}

	getPath(wit1,wit2) {
		for(const path of this.paths) {
		//const nodes = path.nodes.map(s => s.replace(/[-_]/g,''));
			if(path.nodes.indexOf(wit1) > -1 && path.nodes.indexOf(wit2) > -1)
				return path;
		}
		return false;
	}

	calcBranchLength(path) {
		return path.map(node => node.getAttribute('length'))
			.reduce((acc,cur) => parseFloat(acc)+parseFloat(cur));
	}

	pickColour(fadeFraction, rgbColor1, rgbColor2, rgbColor3) {
	// from https://gist.github.com/gskema/2f56dc2e087894ffc756c11e6de1b5ed
		var color1 = rgbColor1;
		var color2 = rgbColor2;
		var fade = fadeFraction;

		// Do we have 3 colors for the gradient? Need to adjust the params.
		if (rgbColor3) {
			fade = fade * 2;

			// Find which interval to use and adjust the fade percentage
			if (fade >= 1) {
				fade -= 1;
				color1 = rgbColor2;
				color2 = rgbColor3;
			}
		}

		const diffRed = color2.red - color1.red;
		const diffGreen = color2.green - color1.green;
		const diffBlue = color2.blue - color1.blue;

		const gradient = {
			red: parseInt(Math.floor(color1.red + (diffRed * fade)), 10),
			green: parseInt(Math.floor(color1.green + (diffGreen * fade)), 10),
			blue: parseInt(Math.floor(color1.blue + (diffBlue * fade)), 10),
		};

		return 'rgb(' + gradient.red + ',' + gradient.green + ',' + gradient.blue + ')';
	}

	colourizeVariants(n,m) {
		const paths = this.analyzeVariants(n,m);
		for(const el of this.boxdiv.querySelectorAll('span.tree-lemma')) {
			const path = paths.hasOwnProperty(el.dataset.id) ?
				paths[paths[el.dataset.id]] :
				paths[el.textContent];
			const red = {red: 252, green: 70, blue: 107};
			const blue = {red: 63, green: 94, blue: 251};
			if(path) {
				el.style.color = this.pickColour(path.length/this.longest.path.length,blue,red);
				el.dataset.length = path.length;
				el.dataset.branch_length = path.branch_length;
				el.dataset.nodes = path.paths[0].nodes.join(';');
			}
			else {
				el.style.color = this.pickColour(1/this.longest.path.length,blue,red);
				el.dataset.length = 0;
				el.dataset.branch_length = 0;
				el.dataset.nodes = '';
			}
			if(el.textContent.trim() === '') {
				el.innerHTML = '<span lang="en">\u00a0\u00a0\u00a0</span>';
				el.style.backgroundColor = el.style.color;
			}
			else el.style.backgroundColor = '';
		}

	}
}

class EdBox extends Box {
	//    constructor(name,arr) {
	constructor(name) {
		super(name);
		//        this.textmap = arr;
		//this.desc = arr.get(name).desc;
		this.desc = name;
		this.text = Find.firsttext(name);
	//this.text = arr.get(name).text;
	//this.name = name;
	}
	init() {
		this.makeTextBox();
		this.makeDescBox();
		this.descbox.style.maxWidth = '595px';
		this.descbox.style.paddingLeft = '5px';
		this.boxdiv.addEventListener('mouseup',events.textMouseup);
	}
  
	refresh() {
	//this.text = _texts.get(this.name).text;
	//this.text = Find.firsttext(this.name);
		this.boxdiv.innerHTML = '';
		this.boxdiv.appendChild(Xslt.sheets.lemma.transformToFragment(this.text,document));
		//this.boxdiv.appendChild(XSLTransformElement(this.text,xslt_proc));
		touchUpNode(this.boxdiv);
		for(const lemma of Find.lemmata(false,this.boxdiv)) {
			lemma.IAST = lemma.cloneNode(true);
		}
		//this.boxdiv.appendChild(csvToFrag(this.text));
		this.updatescript();
	}

	makeTextBox() {
		const textbox = document.createElement('div');
		textbox.dataset.id = this.name; 
		textbox.classList.add('text-box');
		textbox.appendChild(Xslt.sheets.lemma.transformToFragment(this.text,document));
		//textbox.appendChild(XSLTransformElement(this.text,xslt_proc));
		touchUpNode(textbox);
		for(const lemma of Find.lemmata(false,textbox))
			lemma.IAST = lemma.cloneNode(true);
		//textbox.appendChild(csvToFrag(this.text));
		//touchUp(textbox);
		this.boxdiv = textbox;
	}
}

class MatrixBox extends Box {
	constructor() {
		super(name);
		this.desc = 'Matrix';
		this.name = 'Matrix';
		this.makeDescBox();
		this.makeViewBox();
		this.descbox.style.maxWidth = '100vw';
		this.descbox.style.paddingLeft = '5px';
	}
	init() {
		this.makeTable();
	}
	makeViewBox() {
		const box = document.createElement('div');
		box.classList.add('matrix');
		box.dataset.id = this.name;
		this.boxdiv = box;
	}
	makeTable() {
		/*        const header = document.createElement('table');
	header.classList.add('header');
	_texts.forEach((value,key) =>  {
		const head = document.createElement('th');
		const row = document.createElement('tr');
		head.appendChild(document.createTextNode(value.desc));
		row.appendChild(head);
		header.appendChild(row);
	});
	*/
		const scroller = document.createElement('div');
		scroller.classList.add('scroller');

		scroller.append(Xslt.sheets.matrix.transformToFragment(_state.xml,document));
		//scroller.append(XSLTransformElement(_state.xml.documentElement,xslt_proc));
		//for(const th of scroller.getElementsByTagName('th'))
		//    th.addEventListener('dragstart',events.thDragStart);

		scroller.addEventListener('dragstart',events.thDragStart);
		scroller.addEventListener('dragenter',events.trDragEnter);
		scroller.addEventListener('dragleave',events.trDragLeave);
		scroller.addEventListener('dragover',e => e.preventDefault());
		scroller.addEventListener('drop',events.trDragDrop);
		scroller.addEventListener('mousedown',events.matrixMousedown);
		//this.boxdiv.append(header);
	
		const head = document.createElement('tr');
		head.classList.add('header');
		const firsttd = document.createElement('td');
		firsttd.classList.add('anchor');
		head.appendChild(firsttd);
		const trs = [...Find.trs(scroller)];
		const trwalkers = trs.map(tr => Find.trWalker(tr));
		const tds = Find.tds(false,trs[0]);

		for(const td of tds) {
			const th = document.createElement('th');
			th.dataset.ref = td.dataset.n;
			let count = 0;
			const unique = new Set();
			for(const walker of trwalkers) {
				const node = walker.nextNode();
				node.IAST = node.cloneNode(true);
				const txt = node.textContent;
				if(txt !== '') {
					count++;
					unique.add(txt);
				}
			}
			const readings = count < 2 ? count : `${count}(${unique.size})`;
			const readspan = document.createElement('span');
			readspan.classList.add('readings');
			readspan.appendChild(document.createTextNode(readings));
			th.appendChild(readspan);
			const form = document.createElement('form');
			form.innerHTML = '<div><input class="insignificant" title="insignificant" type="checkbox"' + 
						 (td.dataset.insignificant ? 'checked' : '') +
						 '></div><div><input class="binary" title="binary" type="checkbox"'+ 
						 (td.dataset.binary ? 'checked' : '') +
						 '></div>';
			th.appendChild(form);
			head.appendChild(th);
		}

		const tbody = scroller.querySelector('tbody');
		tbody.insertBefore(head,tbody.firstChild);
		//head.addEventListener('click',events.matrixHeaderClick);
		this.boxdiv.append(scroller);
	}
}

const newBox = {
	matrix: function() {
		_state.matrix = new MatrixBox();
		_state.matrix.init();
		_state.matrix.show();
		document.getElementById('matrixmenu').style.display = 'none';
		view.drawTrees();
		multi.rehighlight();
		return _state.matrix;
	},

	text: function(name) {
		const newEd = new EdBox(name);
		//const newEd = new EdBox(name,map);
		_state.textboxes.push(newEd);
		newEd.init();
		newEd.show();
		//underlineVariants();
		view.drawTrees();
		multi.rehighlight();
		if(!document.querySelector('.highlit'))
			events.textClick({target: newEd.boxdiv.querySelector('.lemma:not(.invisible)')});
		return newEd;
	},

	tree: function(stemmaid,id) {
		const newTree = new TreeBox(stemmaid,id);
		_state.trees.push(newTree);
		newTree.init();
		newTree.show();
		view.drawTrees();
		multi.rehighlight();
		return newTree;
	},
};

const contextMenu = {

	create: function(e) {
		const contextmenu = document.createElement('div');
		contextmenu.classList.add('contextmenu');
		contextmenu.style.left = (e.clientX - 12) + 'px';
		contextmenu.style.top = (e.clientY - 22) + 'px';
		return contextmenu;
	},

	remove: function() {
		for(const oldmenu of document.querySelectorAll('.contextmenu'))
			oldmenu.parentNode.removeChild(oldmenu);
	},
	show: function(menu) {
		document.body.appendChild(menu);
	},
	populate: function(menu,items) {
		const list = document.createElement('ul');
		for(const item of items) {
			const li = document.createElement('li');
			if(item.hasOwnProperty('cond')) {
				const frag = document.createRange().createContextualFragment(
					'<form><input type="checkbox"'+(item.cond() ? ' checked' : '')+'></form>'
				);
				li.appendChild(frag);
			}

			if(item.hasOwnProperty('toggle')) {
				const txt = item.toggle() ? item.alt : item.text;
				const frag = document.createRange().createContextualFragment(
					`<span>${txt}</span>`
				);
				li.appendChild(frag);
			}
			else
				li.appendChild(document.createTextNode(item.text));
			li.addEventListener('mouseup',item.func);
			if(item.hasOwnProperty('shortcut')) {
				const frag = document.createRange().createContextualFragment(
					`<span>${item.shortcut}</span>`
				);
				li.appendChild(frag);
			}
			list.appendChild(li);
		}
		menu.appendChild(list);
	},
};

const events = {};

events.thDragStart = e => {
  const th = e.target.closest('th[scope="row"]');
  if(!th) return;

  e.dataTransfer.setData('text/plain',e.target.textContent);
  //    _state.dragged.parentNode.classList.add('dragging');
  edit.moveRow.start(e.target.parentNode,e);
};
events.trDragEnter = e => {
  const tr = e.target.nodeType === 1 ? 
    e.target.closest('tr') :
    e.target.parentElement.closest('tr');
  if(tr)
    tr.classList.add('dragenter');
};
events.trDragLeave = e => {
  const tr = e.target.nodeType === 1 ?
    e.target.closest('tr') :
    e.target.parentElement.closest('tr'); 
  if(tr)
    tr.classList.remove('dragenter');
};

events.trDragDrop = e => {
  e.preventDefault();
  /*    _state.dragged.parentNode.classList.remove('dragging');
const tr = e.target.nodeType === 1 ?
    e.target.closest('tr') :
    e.target.parentElement.closest('tr');
if(tr) {
  tr.classList.remove('dragenter');
  edit.doMoveRow(_state.dragged.parentNode,tr);
  _state.dragged = null;
}
*/
  edit.moveRow.finish(e);
};

events.matrixMousedown = e => {
  if(e.button !== 0) return;
  if(_state.shifting) return;
  if(e.ctrlKey) {events.rightClick(e); return;}
  const lemma = e.target.nodeType === 1 ?
    e.target.closest('.lemma') :
    e.target.parentElement.closest('.lemma');
  if(lemma) {
  
    if(lemma.isContentEditable) return;

    multi.unHighlightAll();
    multi.highlightLemma(lemma.dataset.n);
    lemma.classList.add('highlitcell');
    _state.highlightanchor = lemma;
    const tabl = _state.matrix.boxdiv.querySelector('table');
    tabl.classList.add('nohover');
    tabl.addEventListener('mouseover',events.matrixMouseover);
    window.addEventListener('mouseup',events.matrixMouseup);
  }
};
events.matrixMouseup = e => {
  _state.matrix.boxdiv.querySelector('table').classList.remove('nohover');
  const nums = Find.highlit();
  if(nums.size === 1) {
    const n = [...nums][0];
    multi.clearTrees();
    multi.repopulateTrees(n);
  }
  else {
    multi.clearTrees();
    //multi.highlightRange(nums);
    const [low,high] = Find.lowhigh(nums);
    multi.repopulateTrees(low,high);
    for(const box of _state.viewdiv.querySelectorAll('.text-box'))
      if(!box.querySelector('.highlit'))
        box.querySelector('[data-n="'+low+'"]').classList.add('highlit');      
  }
  _state.highlightanchor = null;
  const tabl = _state.matrix.boxdiv.querySelector('table');
  tabl.removeEventListener('mouseover',events.matrixMouseover);
  window.removeEventListener('mouseup',events.matrixMouseup);
};
events.matrixMouseover = e => {
  const lemma = e.target.nodeType === 1 ?
    e.target.closest('.lemma') :
    e.target.parentElement.closest('.lemma');
  if(!lemma) return;

  multi.unHighlightAll();
  const sorted = Find.lowhigh([_state.highlightanchor.dataset.n,lemma.dataset.n]);
  for(let n=sorted[0];n<=sorted[1];n++) multi.highlightLemma(n,true);
  const starttr = _state.highlightanchor.closest('tr');
  const endtr = lemma.closest('tr');
  if(starttr === endtr) {
    for(let n=sorted[0];n<=sorted[1];n++) 
      starttr.querySelector(`td[data-n="${n}"]`).classList.add('highlitcell');
  }
  else {
    let started = false;
    for(const tr of Find.trs()) {
      if(!started && (tr === starttr || tr === endtr)) {
        started = true;
        for(let n=sorted[0];n<=sorted[1];n++) 
          tr.querySelector(`td[data-n="${n}"]`).classList.add('highlitcell');
      }
      else if(started) {
        for(let n=sorted[0];n<=sorted[1];n++) 
          tr.querySelector(`td[data-n="${n}"]`).classList.add('highlitcell');
        if(tr === starttr || tr === endtr)
          break;
      }
    }
  }
};
	/*
	matrixHeaderClick(e) {
		if(e.target.tagName !== 'INPUT') return;
		const type = e.target.className;
		if(type !== 'insignificant' && type !== 'binary') return;
		const num = e.target.closest('th').dataset.ref;
		const state = Find.firsttd(num).dataset[type] === 'true' ? false : true;
		const states = new Map([[num,state]]);
		//if(Find.firsttd(num).dataset[type] === 'true') e.target.checked = true;
		//else e.target.checked = false;
		//edit.startMarkAs(e.target.className,nums,e);
		edit.doMarkAs(type,states);
	},
	*/
events.rightClick = e => {
  if(_state.shifting) return;
  const th = e.target.nodeType === 1 ?
    e.target.closest('tr[data-n] th') :
    e.target.parentElement.closest('tr[data-n] th');
  if(th) {
    e.preventDefault();
    contextMenu.remove();
    const menu = contextMenu.create(e);
    const items = [
      {text: 'move row',
        func: edit.moveRow.start.bind(null,th.parentNode),
      },
      {
        text: 'delete row',
        func: edit.doDeleteRow.bind(null,th.parentNode.dataset.n),
      }
    ];
    contextMenu.populate(menu,items);
    contextMenu.show(menu);
    return;
  }

  const td = e.target.nodeType === 1 ?
    e.target.closest('td.lemma') :
    e.target.parentElement.closest('td.lemma');
  if(td) {
    e.preventDefault();
    const nums = !td.classList.contains('highlit') ?
      (events.textClick(e,true), new Set([td.dataset.n])) :
      (function() {
        const ret = Find.highlit();
        if(ret.size === 1 && 
         !td.classList.contains('highlitcell')) {
          multi.unCelllightAll(); 
          td.classList.add('highlitcell');
        }
        return ret;
      })();
    const items = nums.size > 1 ? 
      [
        {text: 'shift cells',
          func: edit.shiftCell.start
        },
        {text: 'merge columns',
          func: edit.merge.start.bind(null,nums)
        },
        {text: 'group columns',
          alt: 'ungroup columns',
          toggle: Check.grouped,
          func: edit.group.start.bind(null,false)
        },
        {text: 'delete columns',
          func: edit.removeCol.start.bind(null,nums)
        },
        /*                {text: 'insignificant',
       cond: Check.checkbox.bind(null,'insignificant',nums),
       func: edit.startMarkAs.bind(null,'insignificant',nums),
      },
      {text: 'binary',
       cond: Check.checkbox.bind(null,'binary',nums),
       func: edit.startMarkAs.bind(null,'binary',nums),
      }, */
      ] : 
      [
        {text: 'shift cell',
          alt: 'shift cells',
          toggle: Check.manyhighlitcells,
          func: edit.shiftCell.start
        },
        {text: 'delete column',
          func: edit.removeCol.start.bind(null,nums)
        },
        {text: 'insert column',
          func: edit.addCol.insert
        },
        {text: 'append column',
          func: edit.addCol.append
        }
        /*                {text: 'insignificant',
       cond: Check.checkbox.bind(null,'insignificant',nums),
       func: edit.startMarkAs.bind(null,'insignificant',nums),
      },
      {text: 'binary',
       cond: Check.checkbox.bind(null,'binary',nums),
       func: edit.startMarkAs.bind(null,'binary',nums),
      }, */
      ];
    if(nums.size === 1 && !Check.manyhighlitcells())
      items.push(
        {text: 'edit cell',
          func: edit.editCell.start.bind(null,td)
        }
      );
    contextMenu.remove();
    const menu = contextMenu.create(e);
    contextMenu.populate(menu,items);
    contextMenu.show(menu);
  }
};
	
events.keyDown = e => {
  if(_state.shifting) {
    edit.shiftCell.do(e);
    return;
  }
  if(!_state.editing) {
    if(e.key.substring(0,5) === 'Arrow') events.cycleVariant(e);
    else if(_state.matrix && !_state.matrix.closed & e.key === 'e') {
      const td = Find.highlitcell();
      if(td) {
        e.preventDefault();
        edit.editCell.start(td);
      }
    }
    else if(!_state.dragging && !_state.shifting && Check.highlitcell()) {
      if(e.key === 's')
        edit.shiftCell.start();
      else if(e.key === 'l')
        edit.slideCellLeft();
      else if(e.key === 'r')
        edit.slideCellRight();
    }
  }
  /*
  else if(e.ctrlKey || e.metaKey) {
    if(e.key === 'Z')
      edit.redo();
    else if(e.key === 'z')
      edit.undo();
  }
  */
};

events.cycleVariant = e => {
  const highlitcell = Find.highlitcell() || 
    _state.viewdiv.querySelector('td.highlit') ||
    _state.viewdiv.querySelector('td[data-n="0"]');

  switch (e.key) {

  case 'ArrowRight': {
    if(!_state.matrix.closed && highlitcell) {
      const next = highlitcell.nextElementSibling;
      if(next) events.textClick({target: next});
    } 
    else {
      const highlit = _state.viewdiv.querySelector('.highlit');
      const cur = highlit ? highlit.dataset.n : 0;
      let next = parseInt(cur)+1;
      while(next <= _state.maxlemma) {
        const nextlemmata = _state.viewdiv.querySelectorAll('[data-n="'+next+'"]');
        for(const nextlemma of nextlemmata) {
          if(nextlemma && !nextlemma.classList.contains('invisible')) {
            events.textClick({target: nextlemma});
            return;
          }
        }
        next++;
      }
    }
    break;
  }
  case 'ArrowLeft': {
    if(!_state.matrix.closed && highlitcell) {
      const prev = highlitcell.previousElementSibling;
      if(prev) events.textClick({target: prev});
    }
    else {
      const highlit = _state.viewdiv.querySelector('.highlit');
      const cur = highlit ? highlit.dataset.n : 0;
      let prev = parseInt(cur) -1;
      while(prev >= 0) {
        const prevlemmata = _state.viewdiv.querySelectorAll('[data-n="'+prev+'"]');
        for(const prevlemma of prevlemmata) {
          if(prevlemma && !prevlemma.classList.contains('invisible')) {
            events.textClick({target: prevlemma});
            return;
          }
        }
        prev--;
        if(highlitcell) {
          events.textClick({target: highlitcell.previousElementSibling});
          return;
        }
      }
    }
    break;
  }
  case 'ArrowUp': {
    if(_state.matrix.closed || !highlitcell) return;

    const tr = highlitcell.closest('tr'); 
    const prevtr = tr.previousElementSibling;
    if(!prevtr || !prevtr.dataset.n) return;
    const newtd = prevtr.querySelector(`td[data-n="${highlitcell.dataset.n}"]`);
    events.textClick({target: newtd});
    
    break;
  }
  case 'ArrowDown': {
    if(_state.matrix.closed || !highlitcell) return;
    const tr = highlitcell.closest('tr'); 
    const nexttr = tr.nextElementSibling;
    if(!nexttr || nexttr.tagName !== 'TR') return;
    const newtd = nexttr.querySelector(`td[data-n="${highlitcell.dataset.n}"]`);
    events.textClick({target: newtd});
  }
  } // end switch
};

events.textClick = (e,skipRight = false) => {
  if(e.target.closest('tr.header')) {
    //events.matrixHeaderClick(e); // nothing to do in the header anymore
    return;
  }
  if(_state.shifting) return;
  const targ = e.target.classList.contains('lemma') ? 
    e.target :
    e.target.closest('.lemma');

  if(targ) {
    if(!skipRight && e.ctrlKey) {
      events.rightClick(e);
      return;
    }

    const n = targ.dataset.n;
    const matrixrow = Find.highlitrow();
    multi.unHighlightAll();
    multi.highlightLemma(n);
    multi.repopulateTrees(n);
    view.xScroll(n,matrixrow);
    
    if(targ.tagName === 'TD')
      targ.classList.add('highlitcell');
    else {
      const textbox = targ.closest('.text-box');
      if(textbox) {
        const textid = textbox.dataset.id;
        const td = Find.tr(textid).querySelector(`td[data-n="${n}"]`);
        td.classList.add('highlitcell');
      }
    }
  }
};

events.textMouseup = () => {
  const clearSelection = () => {
    const sel = window.getSelection ? window.getSelection() : document.selection;
    if (sel) {
      if (sel.removeAllRanges) {
        sel.removeAllRanges();
      } else if (sel.empty) {
        sel.empty();
      }
    }
  };

  const nums = Find.selection();
  if(!nums) return;
  multi.highlightRange(nums);
  clearSelection();
};

events.treeMouseover = (tree,e) => {
  const targ = e.target.classList.contains('tree-lemma') ?
    e.target :
    e.target.closest('.tree-lemma');

  if(targ) {
    multi.highlightTreeLemma(targ.dataset.id);
    targ.addEventListener('mouseout',multi.unhighlightTrees);
  }

  const title = e.target.dataset.reconstructed;
  if(!title) return;

  const box = document.createElement('div');
  box.id = 'tooltip';
  box.style.top = e.pageY + 'px';//(e.clientY + 10) + 'px';
  box.style.left = e.pageX + 'px';//e.clientX + 'px';
  box.style.opacity = 0;
  box.style.transition = 'opacity 0.2s ease-in';
  _state.viewdiv.parentElement.appendChild(box);

  const textbox = document.createElement('div');
  textbox.appendChild(document.createTextNode(title));
  if(tree.script !== 0) // this is bound to the TreeBox 
    box.appendChild(changeScript(textbox,_state.scripts[this.script]));
  else
    box.appendChild(textbox);

  if(e.target.classList.contains('reconstructed')) {
    const treelemma = e.target.parentNode.querySelector('span.tree-lemma');
    if(treelemma && treelemma.dataset.hasOwnProperty('emended')) {
      const emendbox = document.createElement('div');
      emendbox.classList.add('emphasis');
      emendbox.appendChild(document.createTextNode(treelemma.textContent));
      if(this.script !== 0)
        box.prepend(changeScript(emendbox,_state.scripts[this.script]));
      else
        box.prepend(emendbox);
    }
  }

  const opac = window.getComputedStyle(box).opacity;
  box.style.opacity = 1;

  e.target.addEventListener('mouseout', removeBox);
};

events.treeClick = e => {
  if(e.target.classList.contains('witness'))
    newBox.text(e.target.dataset.key);
  //newBox.text(e.target.dataset.key,_texts);
  else if(e.target.classList.contains('reconstructed'))
    newBox.text(e.target.dataset.label);
  //newBox.text(e.target.dataset.label,_texts);
  else if(e.target.classList.contains('internal'))
    edit.startReconstruction(e);

  removeBox();
};

export { newBox, init };
