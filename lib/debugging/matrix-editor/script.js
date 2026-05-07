import CSV from './lib/csv.mjs';

import { xslt as _Xslt } from './lib/xslt.mjs';
import { Utils as _Utils } from './lib/utils.mjs';
import { Exporter as _Exporter } from './lib/export.mjs';
//import { actions as _Actions } from './lib/actions.mjs';

import { parseString } from './saktumivalib/browserutils.mjs';

import { edit, init as editorInit } from './lib/edit.mjs';
import { newBox, init as boxerInit } from './lib/box.mjs';

const _state = {
	teins: 'http://www.tei-c.org/ns/1.0',
	scripts: ['iast','devanagari','telugu','grantha','malayalam'],
	filename: null,
	xml: null,
	treelist: new Map(),
	trees: [],
	textboxes: [],
	matrix: null,
	viewdiv: null,
	descs: null,
	maxlemma: null,
	windows: [window],
	undo: [],
	redo: [],
	dragged: null, // th element, row dragging
	highlightanchor: null, // td element, click-and-drag cell selection
	editing: null, // td element, cell editing and new row naming
	shifting: null // [low, high] cell shifting
};

const Xslt = new _Xslt(_state);
const Utils = new _Utils(_state);
const Exporter = new _Exporter(Utils, Xslt); // change to dynamic import?
const { find: Find, check: Check, make: Make } = Utils;

// TODO: get rid of this?

/*** Multi-window updating functions ***/

const multi = {
	getAllWindows: function() {
		return window.mainWindow ?
			window.mainWindow.comboView.getWindows() :
			_state.windows;
	},

	forEachWindow: function(fn) {
		const windows = multi.getAllWindows();
		for(const win of windows) {
			if(win.closed) continue;
			if(fn(win) === false) break;
		}
	},

	highlightLemma: function(n,h) {
		var hide_invisibles = h ? true : false;
		multi.forEachWindow(win => {
			const to_highlight = win.comboView.getViewdiv().querySelectorAll('[data-n="'+n+'"]');
			for(const th of to_highlight) {
				if(!hide_invisibles || !th.classList.contains('invisible'))
					th.classList.add('highlit');
			}
			const trans_highlight = win.comboView.getViewdiv().querySelectorAll('[data-n-trans="'+n+'"]');
			for(const trh of trans_highlight) {
				trh.classList.add('translit');
			}
		});
	},
	
	highlightRange: function(nums) {
		if(!nums || nums.size === 0) return;
		multi.unHighlightAll();
	
		const [low,high] = Find.lowhigh(nums);
		if(high !== undefined) {
			for(let n=low;n<=high;n++) multi.highlightLemma(n,true);
		}
		else
			multi.highlightLemma(low);
		multi.repopulateTrees(low,high);
		for(const box of _state.viewdiv.querySelectorAll('.text-box'))
			if(!box.querySelector('.highlit'))
				box.querySelector('[data-n="'+low+'"]').classList.add('highlit');      
		view.xScroll(low);
	},

	highlightAll: function() {
		if(Check.anyhighlit()) multi.unHighlightAll();
		else multi.highlightRange(new Set([0,Find.maxlemma()]));
	},

	unHighlightAll: function() {
		multi.forEachWindow(win => {
			const unlight = win.comboView.getViewdiv().querySelectorAll('.highlit');
			for(const ul of unlight) {
				ul.classList.remove('highlit');
			}
			const untranslight = win.comboView.getViewdiv().querySelectorAll('.translit');
			for(const utl of untranslight) {
				utl.classList.remove('translit');
			}
			multi.unCelllightAll();
		});
	},
	unCelllightAll: function() {
		multi.forEachWindow(win => {
			const uncelllight = win.comboView.getViewdiv().querySelectorAll('.highlitcell');
			for(const ucl of uncelllight) {
				ucl.classList.remove('highlitcell');
			}
		});
	},

	rehighlight: function() {
		var highlit;
		multi.forEachWindow(win => {
			highlit = win.document.querySelectorAll('.highlit');
			if(highlit.length > 0) return false;
		});
		if(highlit.length > 0) {
			var nums = new Set();
			for(const lit of highlit)
				nums.add(lit.dataset.n);
			multi.highlightRange(nums);
		}
	},

	clearTrees: function() {
		multi.forEachWindow(win => {
			const trees = win.comboView.getTrees();
			for(const tree of trees) {
				tree.clearlemmata();
			}
		});
	},

	repopulateTrees: function(n,m) {
		multi.forEachWindow(win => {
			const trees = win.comboView.getTrees();
			for(const tree of trees) {
			//if(!tree.closed) {
				tree.populate(n,m);
				tree.colourizeVariants(n,m);
				/*if(tree.script !== 0 )*/ tree.updatescript();
			//}
			}
			// ugly hack
			/*    for(const el of document.getElementsByClassName('tree-lemma'))
		if(el.textContent === '')
			el.innerHTML = '&nbsp;&nbsp;&nbsp;';
*/
		});
	},
	highlightTreeLemma: function(id) {
		multi.forEachWindow(win => {
			const trees = win.comboView.getTrees();
			for(const tree of trees) {
			//if(tree.closed) continue;
				const targ = tree.boxdiv.querySelector('.tree-lemma[data-id="'+id+'"]');
                if(!targ) continue; // TODO: if(!targ) find parent of targ, targ-ac, targ-pc, etc.
				const lemmata = tree.boxdiv.querySelectorAll('.tree-lemma');
				for(const lemma of lemmata) {
					if(targ.dataset.nodes && lemma.dataset.nodes === targ.dataset.nodes)
						lemma.classList.add('highlit');
					else if(!targ.dataset.nodes && lemma.dataset.id === targ.dataset.id)
						lemma.classList.add('highlit');
				}
				//tree.clearsvg();
				//tree.drawlines(targ.dataset.nodes,targ.style.color);
				tree.clearLabels();
			}
		});
	},
	unhighlightTrees: function() {
		multi.forEachWindow(win => {
			const highlit = win.comboView.getViewdiv().querySelectorAll('.tree-lemma.highlit');
			for(const el of highlit) el.classList.remove('highlit');
			const trees = win.comboView.getTrees();
			for(const tree of trees) {
			//tree.clearsvg();
			//tree.drawlines();
				tree.clearLabels();
			}
		});
	},

};

const view = {
	toggleNormalize: function() {
		if(Check.normalizedView())
			view.showUnnormalized();
		else
			view.showNormalized();
	},
	showNormalized: function(box) {
		if(box) // called from Box.show()
			box.updatescript();
		else {
			const par = document.getElementById('views');
			par.classList.add('normalized');
			for(const textbox of _state.textboxes)
				textbox.updatescript();
			_state.matrix.updatescript();
			if(!Check.anyhighlit())
				multi.clearTrees();
			else
				multi.repopulateTrees(...Find.lowhigh(Find.highlit()));
		}

		view.updateAllHeaders(true);
		view.xScrollToHighlit();
	},
	showUnnormalized: function() {
		document.getElementById('views').classList.remove('normalized');
		_state.matrix.updatescript();
		
		for(const textbox of _state.textboxes)
			textbox.updatescript();
		
		if(!Check.anyhighlit())
			multi.clearTrees();
		else
			multi.repopulateTrees(...Find.lowhigh(Find.highlit()));

		view.updateAllHeaders(true);
		view.xScrollToHighlit();
	},

	toggleHeader: function() {
		const header = _state.matrix.boxdiv.querySelector('tr.header');
		if(header.style.display === 'none')
			header.style.display = 'table-row';
		else
			header.style.display = 'none';
	},

	updateHeaders(nums) {
		for(const num of nums) {
			const th = Find.firstth(num);
			const [count,unique] = Find.readings(num);
			const readspan = th.querySelector('span.readings');
			const readings = count < 2 ? count : `${count}(${unique.size})`;
			readspan.textContent = readings;
		}
	},

	updateAllHeaders(readingsonly = false) {
		const trs = [...Find.trs()];
		const trwalkers = trs.map(tr => Find.trWalker(tr));
		const tds = [...Find.tds(false,trs[0])];
		const ths = [...Find.ths()];
		const head = _state.matrix.boxdiv.querySelector('tr.header');
		const newTh = function() {
			const th = document.createElement('th');
			const span = document.createElement('span');
			span.classList.add('readings');
			th.appendChild(span);
			const form = document.createElement('form');
			form.innerHTML = '<div><input class="insignificant" type="checkbox">Insignificant</div><div><input class="binary" type="checkbox">Binary</div>';
			th.appendChild(form);
			head.appendChild(th);
			return th;
		};
	
		for(let n = 0;n<tds.length;n++) {
			const th = n >= ths.length ?
				newTh() : ths[n];
			const td = tds[n];

			th.dataset.ref = td.dataset.n;
			let count = 0;
			const unique = new Set();
			for(const walker of trwalkers) {
				const txt = walker.nextNode().textContent;
				if(txt !== '') {
					count++;
					unique.add(txt);
				}
			}
		
			const readings = count < 2 ? count : `${count}(${unique.size})`;
			th.querySelector('span.readings').textContent = readings;
			if(!readingsonly) {
				th.querySelector('input.insignificant').checked = td.dataset.insignificant ? true : false;
				th.querySelector('input.binary').checked = td.dataset.binary ? true : false;
			}
		}
		if(ths.length > tds.length) {
			for(let n=tds.length;n<ths.length;n++)
				head.removeChild(ths[n]);
		}
	},
	xScrollToHighlit: function() {
		const hl = Find.highlit();
		if(hl.size > 0) view.xScroll([...hl][0]);
	},    
	xScroll: function(num,row) {
		if(!num) return;
		const par = row || Find.firsttr();
		const el = Find.firsttd(num,par);
		const elrect = el.getBoundingClientRect();
		const matrix = _state.matrix.boxdiv;
		const matrixrect = matrix.getBoundingClientRect();
		const rightboundary = matrixrect.right;
		const anchorrect = par.querySelector('th').getBoundingClientRect();
		const leftboundary = anchorrect.right;
		const outright = elrect.right > rightboundary;
		const outleft = (elrect.left + 0.1) < leftboundary;
		if(outright) el.scrollIntoView({inline: 'end', block: 'nearest'});
		if(outleft) {
			el.scrollIntoView({inline: 'start', block: 'nearest'});
			matrix.scroll({left: matrix.scrollLeft - anchorrect.width});
		}
	},

  mssMenuPopulate() {
    var msshtml = '';
    const mss = [...Find.teis()].map(el => el.getAttribute('n'));
    for(const ms of mss) {
    //    msshtml += `<li data-name="${ms}">${_texts.get(ms).desc}</li>`;
      const label = document.querySelector(`tr[data-n="${ms}"] th`).innerHTML;
      msshtml += `<li data-name="${ms}">${label}</li>`;
    }
    document.getElementById('menu').querySelector('.ms').innerHTML = msshtml;
  },

  drawTrees() {
    for(const tree of _state.trees) {
    //if(!tree.closed)
      tree.draw();
    }
  }

};

/*** Event listeners ***/

const fileSelect = function(func,e) {
	const f = e.target.files[0];
	const fs = [...e.target.files].slice(1);
	const reader = new FileReader();
	reader.onload = func.bind(null,f,fs);
	reader.readAsText(f);
};

const csvOrXml = function(f,fs,e) {
	_state.filename = f.name;
	document.title = document.title + `: ${_state.filename}`;
	const ext = _state.filename.split('.').pop();
	if(ext === 'csv') csvLoad(f,fs,e);
	else matrixLoad(fs,e.target.result);
};

const treeFileLoad = function(f,fs,e) {
	const treestr = e.target.result;
	const nexml = parseString(treestr);
  let n = 1;
  for(const tree of nexml.querySelectorAll('tree')) {
    const thisid = tree.getAttribute('id');
    if(_state.xml.querySelector(`tree[id="${thisid}"]`)) {
      let newid = `${thisid}(${n})`;
      n = n + 1;
      while(_state.xml.querySelector(`tree[id="${newid}"]`)) {
        newid = `${thisid}(${n})`;
        n = n + 1;
      }
      tree.setAttribute('id',newid);
      tree.setAttribute('label',`${tree.getAttribute('label')}(${n-1})`);
    }
  }
	const xenoData = _state.xml.querySelector('teiHeader > xenoData') || (function() {
		const header = _state.xml.querySelector('teiHeader') || (function() {
			const h = Make.xmlel('teiHeader');
			_state.xml.documentElement.appendChild(h);
			return h;})();
		const newel = Make.xmlel('xenoData');
		header.appendChild(newel);
		return newel;
	})();
	const stemmael = Make.xmlel('stemma');
	stemmael.setAttribute('format','nexml');
	stemmael.id = 'stemma' + [...xenoData.querySelectorAll('stemma')].length;
	stemmael.appendChild(nexml.firstChild.cloneNode(true));
	xenoData.appendChild(stemmael);

	// labels are correct with new version of SplitsTree5
	/*
	const otunodes = nexml.querySelectorAll('node[otu]');
	for(const otunode of otunodes) {
		const label = otunode.getAttribute('label');
		const otu = otunode.getAttribute('otu');
		if(label !== otu) otunode.setAttribute('label',otu);
	}
	*/
  const show = e.hasOwnProperty('noshow') ? false : true;
	treeXMLLoad(nexml,stemmael.id,show);
};

const treeXMLLoad = function(nexml,stemmaid,show=true) {
	const trees = nexml.querySelectorAll('tree');
	const treemenu = document.querySelector('#treemenu ul');
	for(const tree of trees) {
		const id = tree.id;
		const xclone = nexml.cloneNode(true);
		for(const tclone of xclone.querySelectorAll('tree')) {
			if(tclone.id !== id)
				tclone.parentNode.removeChild(tclone);
		}
		const label = tree.getAttribute('label') || 'New Tree ' + _state.treelist.size;
		_state.treelist.set(`#${stemmaid} #${id}`,xclone);
		const li = document.createElement('li');
		li.dataset.name = label;
		li.dataset.treeid = id;
		li.dataset.stemmaid = stemmaid;
		li.appendChild(document.createTextNode(label));
		treemenu.insertBefore(li,treemenu.lastElementChild);

		if(show) newBox.tree(stemmaid,id);
	}
};

const csvLoad = function(f,fs,e) {
	const csvarr = CSV.parse(e.target.result,{delimiter: ','});
	_state.xml = document.implementation.createDocument(_state.teins,'',null);
	const teicorpus = Make.xmlel('teiCorpus');
	const teiheader = Make.xmlel('teiHeader');
	teicorpus.appendChild(teiheader);
	_state.xml.appendChild(teicorpus);

	for(const c of csvarr) {
		const name = c[0];
		const arr = c.slice(1);
		const tei = Make.xmlel('TEI');
		tei.setAttribute('n',name);
		const text = Make.xmlel('text');
		for(let n=0;n<arr.length;n++) {
			const word = arr[n];
			const newEl = Make.xmlel('w');
			if(word)
				newEl.appendChild(document.createTextNode(word));
			newEl.setAttribute('n',n);
			text.appendChild(newEl);
		}
		tei.appendChild(text);
		teicorpus.appendChild(tei);
	}
	_state.xml.normalize();

	_state.maxlemma = Find.maxlemma();
	
	//if(fs.length > 0) csvLoadAdditional(fs);

	menuPopulate();
};

const matrixLoad = (fs,str) => {
	_state.xml = parseString(str);
	
	if(_state.xml.documentElement.getAttribute('xml:lang') === 'ta')
		_state.scripts = ['iast','tamil'];

	const trees = _state.xml.querySelectorAll('teiHeader xenoData stemma nexml');
	for(const tree of trees) {
		const nexml = document.implementation.createDocument('http://www.nexml.org/2009','',null);
		nexml.appendChild(tree.cloneNode(true));
		treeXMLLoad(nexml,tree.closest('stemma').id,false);
	}

	_state.maxlemma = Find.maxlemma();
	
	if(fs.length > 0) matrixLoadAdditional(fs);

	else menuPopulate();

};

	const setDiff = (setA,setB)  => {
		const ret = new Set(setA);
		for(const el of setB) ret.delete(el);
		return ret;
	};
	const setIntersection = (a,b) => {
		const ret = new Set();
		for(const el of a)
			if(b.has(el)) ret.add(el);
		return ret;
	};

const loadAdditionalGo = (add,e) => {
  const newxml = parseString(e.target.result);
	
	const oldteis = new Map();
	for(const tei of Find.teis()) {
		const siglum = tei.getAttribute('n');
		oldteis.set(siglum,tei);
	}

	const newteis = new Map();
	for(const tei of newxml.querySelectorAll('TEI')) {
		const siglum = tei.getAttribute('n');
		if(oldteis.has(siglum)) {
			newteis.set(siglum,tei);
			continue;
		}

		const wit = newxml.querySelector(`witness[*|id="${siglum}"]`);

		// if _state.xml has XXac/XXpc and newxml has XX
		const oldac = _state.xml.querySelector(`witness[*|id="${siglum}"] [n="ac"]`);
		if(oldac && oldteis.has(oldac.getAttribute('xml:id'))) {
			newteis.set(siglum + 'ac',tei);
			const pcrow = tei.cloneNode(true);
			pcrow.setAttribute('n',siglum + 'pc');
			tei.after(pcrow);
			newteis.set(siglum + 'pc',pcrow);
			continue;
		}
		
		// if _state.xml has XX and newxml has XXac/XXpc
		const acpc = wit?.getAttribute('n');
		const parid = wit?.parentNode.closest('witness')?.getAttribute('xml:id');
		if(acpc !== null && oldteis.has(parid)) {
			const oldrow = oldteis.get(parid);
			oldrow.setAttribute('n',parid + 'ac');
			const pcrow = oldrow.cloneNode(true);
			pcrow.setAttribute('n',parid + 'pc');
			oldrow.after(pcrow);
			oldteis.set(parid + 'ac',oldrow);
			oldteis.set(parid + 'pc',pcrow);
			oldteis.delete(parid);
		}
		// if _state.xml has XX and newxml has XX-A, XX-B, etc.
		else if(!oldteis.has(siglum) && parid && oldteis.has(parid)) {
			const oldrow = oldteis.get(parid);
			const newrow = oldrow.cloneNode(true);
			newrow.setAttribute('n',siglum);
			oldrow.after(newrow);
			oldteis.set(siglum,newrow);
		}
		// TODO: if _state.xml has XX-A, XX-B, etc. and newxml has only XX

		newteis.set(siglum,tei);
	}
	const oldsigla = new Set(oldteis.keys());
	const newsigla = new Set(newteis.keys());

	const tofill = setDiff(oldsigla,newsigla);
	const toadd  = setDiff(newsigla,oldsigla);
	const toappend = setIntersection(newsigla,oldsigla);
	
	if(toadd.size > 0) { // we want to have the <cl>s too
		const template = _state.xml.querySelector('TEI').cloneNode(true);
		for(const w of template.querySelectorAll('w')) {
			w.innerHTML = '';
			if(w.hasAttribute('lemma')) w.removeAttribute('lemma');
		}
		for(const key of toadd) {
			const newtei = template.cloneNode(true);
			newtei.setAttribute('n',key);
			_state.xml.documentElement.appendChild(newtei);
			const addtext = newteis.get(key).querySelector('text').cloneNode(true);
			const text = newtei.querySelector('text');
			while(addtext.firstChild)
				text.appendChild(addtext.firstChild);
		}
	}
	if(tofill.size > 0) {
		const template = newxml.querySelector('text').cloneNode(true);
		for(const w of template.querySelectorAll('w')) {
			w.innerHTML = '';
			if(w.hasAttribute('lemma')) w.removeAttribute('lemma');
		}
		for(const el of tofill) {
			const text = oldteis.get(el).querySelector('text');
			const newtext = template.cloneNode(true);
			while(newtext.firstChild)
				text.appendChild(newtext.firstChild);
		}
	}

	for(const key of toappend) {
		const oldtext = oldteis.get(key).querySelector('text');
		const newtext = newteis.get(key).querySelector('text').cloneNode(true);
		while(newtext.firstChild)
			oldtext.appendChild(newtext.firstChild);
	}

	edit.renumber(_state.maxlemma);

	if(add.length > 0) matrixLoadAdditional(add);
	else menuPopulate();
};

const matrixLoadAdditional = function(fs) {
	const f = fs[0];
	const fss = fs.slice(1);
	if(typeof f === 'string')
		loadAdditionalGo(fss,{target: {result: f}});
	else {
		const reader = new FileReader();
		reader.onload = loadAdditionalGo.bind(null,fss);
		reader.readAsText(f);
	}
	
};

const menuPopulate = function() {
	const savebox = new menuItem('Save As...');
	savebox.setFunction(Exporter.saveAs);
	savebox.setStyle({fontWeight: 'bold'});

	const expbox = new menuBox('Export');
	expbox.populate([
		{text: 'TEI corpus', func: Exporter.showOptions.bind(null,Exporter.xml,Exporter.options)},
		{text: 'TEI apparatus', func: Exporter.showOptions.bind(null,Exporter.xml,Exporter.appOptions)},
		{text: 'CSV', func: Exporter.showOptions.bind(null,Exporter.csv,Exporter.options)},
		{text: 'NEXUS', func: Exporter.showOptions.bind(null,Exporter.nexus,Exporter.options)}
	]);
	const editbox = new menuBox('Edit');
	editbox.populate([
		{text: 'Undo',/* shortcut: 'Ctrl-z',*/ greyout: Check.undo, func: edit.undo},
		{text: 'Redo',/* shortcut: 'Ctrl-r',*/ greyout: Check.redo, func: edit.redo},
		{text: 'Select all',
			alt: 'Deselect all',
			toggle: Check.anyhighlit,
			func: multi.highlightAll
		},
		{text: 'Group by whitespace',
			func: edit.doGroupWords
		},
		{text: 'Delete empty columns',
			func: edit.removeEmptyColumns
		},
		{text: 'Delete empty rows',
			func: edit.removeEmptyRows
		}
	]);

	const columnbox = new menuBox('Column');
	columnbox.populate([
		{text: '(Re)normalize column',
			alt: '(Re)normalize columns',
			greyout: Check.anyhighlit,
			toggle: Check.manyhighlit,
			func: edit.startRenormalize.bind(null,false)
		},
		{text: 'Unnormalize column',
			alt: 'Unnormalize columns',
			greyout: Check.anyhighlit,
			toggle: Check.manyhighlit,
			func: edit.startUnnormalize.bind(null,false)
		},
		{text: 'Delete column',
			alt: 'Delete columns',
			greyout: Check.anyhighlit,
			toggle: Check.manyhighlit,
			func: edit.removeCol.start.bind(null,false)
		},
		{text: 'Merge columns',
			greyout: Check.manyhighlit,
			func: edit.merge.start.bind(null,false)
		},
		{text: 'Group columns',
			alt: 'Ungroup columns',
			greyout: Check.oneGrouped,
			toggle: Check.grouped,
			func: edit.group.start.bind(null,false),
		},
		{text: 'Insert column',
			greyout: Check.anyhighlit,
			func: edit.addCol.insert
		},
		{text: 'Append column',
			greyout: Check.anyhighlit,
			func: edit.addCol.append
		},
		{text: 'Mark insignificant',
			checkbox: Check.checkbox.bind(null,'insignificant'),
			greyout: Check.anyhighlit,
			func: edit.startMarkAs.bind(null,'insignificant',false)
		},
		{text: 'Mark binary',
			checkbox: Check.checkbox.bind(null,'binary'),
			greyout: Check.anyhighlit,
			func: edit.startMarkAs.bind(null,'binary',false)
		}
	]);

	const rowbox = new menuBox('Row');
	rowbox.populate([
		{text: 'New row',
			func: edit.startNewRow,
		},
		{text: 'Insert/Update row from file',
			func: edit.startUpdateRow,
		}
	]);

	const cellbox = new menuBox('Cell');
	cellbox.populate([
		{text: 'Shift cell',
		 alt: 'Shift cells',
		 shortcut: 's',
		 greyout: Check.highlitcell,
	     toggle: Check.manyhighlitcells,
		 func: edit.shiftCell.start,
		},
		{text: 'Slide cell left',
		 alt: 'Slide cells left',
		 shortcut: 'l',
		 greyout: Check.highlitcell,
	     toggle: Check.manyhighlitcells,
		 func: edit.slideCellLeft,
		},
		{text: 'Slide cell right',
		 alt: 'Slide cells right',
		 shortcut: 'r',
		 greyout: Check.highlitcell,
	     toggle: Check.manyhighlitcells,
		 func: edit.slideCellRight,
		},
		{text: 'Unnormalize cell',
			alt: 'Unnormalize cells',
			greyout: Check.highlitcell,
			toggle: Check.manyhighlitcells,
			func: edit.startUnnormalizeCells
		},
		{text: '(Re)normalize cell',
			alt: '(Re)normalize cells',
			greyout: Check.highlitcell,
			toggle: Check.manyhighlitcells,
			func: edit.startRenormalizeCells
		},
		{text: 'Edit cell',
		 shortcut: 'e',
		 greyout: Check.highlitcell,
		 func: edit.editCell.start.bind(null,false),
		}
	]);
	
	const viewbox = new menuBox('View');
	viewbox.populate([
		{text: 'Header',
			checkbox: Check.headerView,
			func: view.toggleHeader,
		},
		{text: 'Normalized',
			checkbox: Check.normalizedView,
			greyout: Check.anyNormalized,
			func: view.toggleNormalize,
		},
	]);

	const left_menu = document.getElementById('left_menu');
	left_menu.appendChild(viewbox.box);
	left_menu.appendChild(editbox.box);
	left_menu.appendChild(columnbox.box);
	left_menu.appendChild(rowbox.box);
	left_menu.appendChild(cellbox.box);
	left_menu.appendChild(expbox.box);
	left_menu.appendChild(savebox.box);

	const views = document.getElementById('views');
	views.style.justifyContent = 'flex-start';
	views.removeChild(views.querySelector('#splash'));

	newBox.matrix();

	view.mssMenuPopulate();

	const matrixmenu = document.getElementById('matrixmenu');
	matrixmenu.addEventListener('click',newBox.matrix);
	matrixmenu.removeChild(matrixmenu.querySelector('ul'));
	document.getElementById('mssmenu').style.display = 'block';
	document.getElementById('treemenu').style.display = 'block';

};

/*
const fullTreeMouseover = function(e) {
	const targ = e.target.classList.contains('littletree') ?
		e.target :
		e.target.closest('.littletree');
	if(targ) {
		const littlelines = document.getElementById('full-tree').querySelectorAll('line.littletree');
		for(const line of littlelines) {
			line.style.stroke = 'rgb(179,18,125)';
		}
		const littletext = document.getElementById('full-tree').querySelectorAll('text.littletree');
		for(const text of littletext) {
			text.style.fill = 'rgb(179,18,125)';
		}
	}
};

const fullTreeMouseout = function(e) {
	const targ = e.target.classList.contains('littletree') ?
		e.target :
		e.target.closest('.littletree');
	if(targ) {
		const littlelines = document.getElementById('full-tree').querySelectorAll('line.littletree');
		for(const line of littlelines) {
			line.style.stroke = '#80a0ff';
		}
		const littletext = document.getElementById('full-tree').querySelectorAll('text.littletree');
		for(const text of littletext) {
			text.style.fill = 'black';
		}
	}
};
*/
/*
const fullTreeClick = function(e) {
const targ = e.target.classList.contains('littletree') ?
	e.target :
	e.target.closest('.littletree');
if(targ) {
	document.getElementById('full-tree').style.display = 'none';
	comboView.maininit();
	newBox.tree(document.querySelector('.tree li').dataset.name);
}
}
*/
const events = {
	menuMouseover(e) {
		const targ = e.target.classList.contains('menubox') ?
			e.target :
			e.target.closest('.menubox');
		if(targ) {
			const ul = targ.querySelector('ul');
			if(ul) ul.style.display = 'block';
			targ.classList.add('open');
		}
	},
	menuMouseout(e) {
		const targ = e.target.classList.contains('menubox') ?
			e.target :
			e.target.closest('.menubox');
		if(targ) {
			const ul = targ.querySelector('ul');
			if(ul) ul.style.display = 'none';
			targ.classList.remove('open');
		}
	},
	menuClick(e) {
		if(!e.target.parentElement) return;
		/*
	if(e.target.parentElement.className === 'ed') {
		events.menuMouseout(e);
		newBox.text(e.target.dataset.name,_editions);
	}
*/
		if(e.target.parentElement.className === 'ms') {
			events.menuMouseout(e);
			newBox.text(e.target.dataset.name);
		//newBox.text(e.target.dataset.name,_texts);
		}
		if(e.target.parentElement.className === 'tree') {
			events.menuMouseout(e);
			if(e.target.closest('li[data-name]'))
				newBox.tree(e.target.dataset.stemmaid,e.target.dataset.treeid);
		}
	},
};

/*
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
*/
/*** Classes ***/

class menuItem {
	constructor(name) {
		this.name = name;
		this.box = document.createElement('div');
		this.box.classList.add('menubox');
		const heading = document.createElement('div');
		heading.classList.add('heading');
		heading.appendChild(document.createTextNode(name));
		this.box.appendChild(heading);
		this.box.addEventListener('mouseup',this.click.bind(this));
	}
	setFunction(func) {
		this.func = func;
	}
	setStyle(obj) {
		for(const [key, val] of Object.entries(obj))
		this.box.style[key] = val;
	}
	click(e) {
		this.func(e);
	}
}
class menuBox {
	constructor(name) {
		this.name = name;
		this.box = document.createElement('div');
		this.box.classList.add('menubox');
		const heading = document.createElement('div');
		heading.classList.add('heading');
		heading.appendChild(document.createTextNode(name));
		this.box.appendChild(heading);
		heading.addEventListener('mouseover',this.checkConditions.bind(this));
		this.box.addEventListener('mouseup',this.click.bind(this));
		this.items = new Map();
		this.conditions = new Map();
	}

	populate(items) {
		const ul = this.box.querySelector('ul') || 
		(function(obj) {
			const newul = document.createElement('ul');
			obj.box.appendChild(newul);
			return newul;})(this);
		for(const item of items) {
			const li = document.createElement('li');

			if(item.hasOwnProperty('checkbox')) {
				const form = document.createElement('span');
				const input = document.createElement('input');
				input.type = 'checkbox';
				input.addEventListener('click',e => e.preventDefault());
				form.appendChild(input);
				form.appendChild(document.createTextNode(item.text));
				li.appendChild(form);
				this.conditions.set(input,item.checkbox);
			}
			else {
				const span = document.createElement('span');
				span.appendChild(document.createTextNode(item.text));
				if(item.hasOwnProperty('toggle')) {
					span.dataset.text = item.text;
					span.dataset.alt = item.alt;
					this.conditions.set(span,item.toggle);
				}
				li.appendChild(span);
			}
		
			if(item.hasOwnProperty('shortcut')) {
				const frag = document.createRange().createContextualFragment(
					`<div class="shortcut">${item.shortcut}</div>`
				);
				li.appendChild(frag);
			}
			if(item.hasOwnProperty('greyout')) {
				this.conditions.set(li,item.greyout);
			}
		
			this.items.set(li,item.func);
			ul.appendChild(li);
		}
	}

	click(e) {
		const li = e.target.tagName === 'LI' ?
			e.target :
			e.target.closest('li');
		if(li && !li.classList.contains('greyedout')) {
			const func = this.items.get(li);
			if(func) {
				func(e);
				this.checkConditions();
			}
		}
	}

	checkConditions() {
		const checked = new Map();
		for(const [el, func] of this.conditions) {
			const result =  // see if condition already checked
				checked.get(func) || 
				(function() {
					const x = func(); 
					checked.set(func,x); 
					return x;
				})();
			if(el.tagName === 'INPUT') {
				el.checked = result;
			}
			else if (el.tagName === 'SPAN') {
				if(result) 
					el.textContent = el.dataset.alt;
				else
					el.textContent = el.dataset.text;
			}
			else if(el.tagName === 'LI') {
				if(!result) el.classList.add('greyedout');
				else el.classList.remove('greyedout');
			}
		}
	}
}
/*
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
		drawTrees();
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
		this.updatescript();
		this.boxdiv.classList.add(_state.scripts[this.script]);
		this.boxdiv.classList.remove(oldscript);
	}

	updatescript(lemmata) {
		const nodes = lemmata ?
			lemmata.map(l => this.boxdiv.querySelector(`.lemma[data-n=${l}]`)) :
			this.boxdiv.querySelectorAll('.lemma,.tree-lemma');
		for(const node of nodes) {
			const hasNormalized = node.dataset.hasOwnProperty('normal');
			if(!hasNormalized && node.textContent.trim() === '') continue;
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
		this.boxdiv.addEventListener('mouseover',events.treeMouseover.bind(this));
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
			const edges = this.getPath(...nodes.split(';')).path;
			const nodeset = new Set();
			for(const edge of edges) {
				nodeset.add(edge.getAttribute('target'));
				nodeset.add(edge.getAttribute('source'));
			}
			for(const node of nodeset) {
				const el = this.nexml.evaluate('//nex:node[@id="'+node+'"]',this.nexml,this.nsResolver,XPathResult.FIRST_ORDERED_NODE_TYPE,null).singleNodeValue;
				//const edges = this.nexml.evaluate('//nex:edge[@source="'+node+'"]|//nex:edge[@target="'+node+'"]',this.nexml,this.nsResolver,XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,null);
				if(!el.getAttribute('root'))
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
		const lemmata = [];
		const aliases = [];
		for(const el of this.boxdiv.querySelectorAll('span.tree-lemma')) {
	    const key = el.dataset.id;
			// ignore reconstructions and texts not in current tree
			if(!this.nexml.querySelector(`otu[label="${key}"]`))
				continue;
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
*/

const urlBasename = str => {
	const start = str.lastIndexOf('/');
	if(start === -1) return str;	
	return str.slice(start+1);
};

const maybeLoadData = async () => {
		const bc = new BroadcastChannel('matrix-editor');
		bc.onmessage = e => {
			csvOrXml(e.data.f,e.data.fs,e.data.e);
			bc.close();
		};
		bc.postMessage('ready');

		const url = (new URLSearchParams(window.location.search)).get('url');
		if(url) {
			const decoded = decodeURIComponent(url);
			const res = await fetch(decoded, {cache: 'no-cache'});
			const data = await res.text();
			const f = {name: urlBasename(decoded)};
			const ev = {target: {result: data}};
			csvOrXml(f,[],ev);
		}
};

window.comboView = {
	branchinit: () => {
		window.comboView.init();
		if(window.startbox !== undefined) {
			if(window.startbox.tree)
				newBox.tree(window.startbox.tree.stemmaid,window.startbox.tree.id);
			else if(window.startbox.text)
				newBox.text(window.startbox.text.name,window.startbox.text.map);
		}
	},
	maininit: async () => {
		const menu = document.getElementById('menu');
		menu.addEventListener('mouseover', events.menuMouseover);
		menu.addEventListener('mouseout', events.menuMouseout);
		menu.addEventListener('click',events.menuClick);
		// }
		menu.querySelector('#file').addEventListener('change',fileSelect.bind(null,csvOrXml),false);
		menu.querySelector('#treefile').addEventListener('change',fileSelect.bind(null,treeFileLoad),false);
		menu.style.display = 'block';

		await window.comboView.init();
	},
	init: async () => {
		_state.viewdiv = document.getElementById('views');
		_state.descs = document.getElementById('descs');
		//_state.viewdiv.addEventListener('click',events.textClick);
		//        _state.viewdiv.addEventListener('mouseover',lemmaMouseover);
		//document.addEventListener('keydown',events.keyDown,{capture: true});
		//document.addEventListener('contextmenu',events.rightClick);
		//document.addEventListener('mouseup',contextMenu.remove);
    editorInit(_state, Utils, multi, view, treeFileLoad);
    boxerInit(_state, Xslt, Utils, edit, multi, view);
		await Xslt.init();
		maybeLoadData();
	},
	getWindows: () => _state.windows,
	addWindow: (win) => { _state.windows.push(win); },
	getViewdiv: () => _state.viewdiv,
	getTrees: () => _state.trees
};

window.addEventListener('load',window.comboView.maininit);
