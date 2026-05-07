import { actions as _Actions } from './actions.mjs';
import Normalizer from './normalize.mjs';
import { processFile } from '../saktumivalib/collate.mjs';
import { parseString } from '../saktumivalib/browserutils.mjs';
import { showOpenFilePicker } from '../saktumivalib/native-file-system-adapter/es6.js';
import Realigner from './realign.mjs';

var _state, Actions, Find, Check, Make, multi, view, treeFileLoad;

const init = (state, utils, Multi, View, treefileload) => {
  _state = state;
  Find = utils.find;
  Check = utils.check;
  Make = utils.make;
  Actions = new _Actions(utils);
  multi = Multi;
  view = View;
  treeFileLoad = treefileload;
};

const edit = {
	undo: function() {
		const action = _state.undo.pop();
		if(action)
			action[0](...action[1]);
	},
	redo: function() {
		const action = _state.redo.pop();
		if(action)
			action[0](...action[1]);
	},
	doStack: function(entry,doing = 'do') {
		if(doing === 'undo') {
			entry[1].push('redo');
			_state.redo.push(entry);
		}
		else if(doing === 'redo') {
			entry[1].push('undo');
			_state.undo.push(entry);
		}
		else {
			entry[1].push('undo');
			_state.undo.push(entry);
			_state.redo = [];
		}
	},

	doMulti: function(dolist,doing) {
		const undolist = [];
		for(const item of dolist) {
			const ret = item[0](...item[1],'multido');
			undolist.unshift(ret);
		}
		edit.doStack([edit.doMulti,[undolist]],doing);
	},

	cellKeyDown: function(e) {
		switch(e.key) {
		case 'Enter':
			edit.editCell.finish(e);
			break;
		case 'Escape':
			edit.editCell.finish(e,true);
			break;
		case 'ArrowRight': {
			const pos = Find.cursorPos(e.target);
			if(pos[0] === pos[1] && window.getSelection().type === 'Caret') {
				e.preventDefault();
				edit.editCell.finish(e);
				e.target.dispatchEvent(new KeyboardEvent('keydown', {'key': 'ArrowRight'}));
				edit.editCell.start(Find.highlitcell()); 
			}
			break;
		}
		case 'ArrowLeft': {
			const pos = Find.cursorPos(e.target);
			if(pos[0] === 0) {
				e.preventDefault();
				edit.editCell.finish(e);
				e.target.dispatchEvent(new KeyboardEvent('keydown', {'key': 'ArrowLeft'}));
				edit.editCell.start(Find.highlitcell()); 
			}
			break;
		}
		
		}
	},
 
	startMarkAs: function(type,nums,e) {
		const targ = e.target.tagName === 'INPUT' ?
			e.target :
			e.target.querySelector('input');
		const numss = nums === false ?
			Find.highlit() :
			nums;
		const states = new Map([...numss].map(num => [num,!targ.checked]));
		edit.doMarkAs(type,states);
		/*        const cells = [...nums].reduce((acc,num) =>
		acc.concat([...document.querySelectorAll('.matrix table [data-n="'+num+'"]')]),
		[]);
	if(targ.checked === true)
		for(const cell of cells)
			delete cell.dataset.insignificant;
	else
		for(const cell of cells)
			cell.dataset.insignificant = 'true';
	_state.undo.push([edit.unmarkSignificance,[oldstates,true]]); */
	},

	startNewRow: function() {
		const tr = Make.row('new row');
		const th = tr.querySelector('th');
		th.contentEditable = true;
		th.addEventListener('blur',edit.finishNewRow);
		th.addEventListener('keydown',edit.thKeyDown);

		_state.matrix.boxdiv.querySelector('tbody').appendChild(tr);
		th.scrollIntoView();
		th.focus();
		document.execCommand('selectAll',false,null);
		_state.editing = th;
	},
  
  startUpdateRow: async () => {
    const defaultblock = _state.xml.querySelector('editorialDecl > segmentation > ab[type="blockid"]')?.innerHTML || _state.filename.split('.')[0];
    const newthings = {
      alltexts: new Map(),
      allblocks: new Set()
    };
    const pickopts = {
      types: [ {description: 'TEI XML', accept: {'text/xml': ['.xml']} } ],
      multiple: true
    };
    let fs = await showOpenFilePicker();
    for(const f of fs) {
      const file = await f.getFile();
      const text = await file.text();
      const teixml = parseString(text,file.name);
      const warnings = processFile(teixml,file.name,newthings);
      if(warnings.length !== 0)
        for(const warning of warnings) alert(warning);
    }
    const frag = document.createRange().createContextualFragment(
`<div style="display: flex; flex-direction: column; gap: 1rem" class="popup">
  <div style="display: flex; flex-direction: row; gap: 2rem">
    <div id="add_selectedtexts">
      ${[...newthings.alltexts.keys()].map(t => '<div><input type="checkbox" name="'+t+'" id="text_'+t+'" checked><label for="text_'+t+'">'+t+'</label></div>').join('')}
    </div>
    <div>
      <select id="add_selectedblock">
      ${[...newthings.allblocks].map(b => '<option'+( b===defaultblock ? ' selected' : '')+'>'+b+'</option>').join('')}
      </select>
    </div>
  </div>
  <!--div>
    <label for="realigndepth">Realignment depth</label><input type="number" id="realigndepth" value="0" step="1">
  </div-->
  <div style="display: flex; justify-content: center">
    <button type="submit">Add rows</button>
  </div>
</div>`
    );
    Make.blackout(frag,() => edit.finishUpdateRow(newthings.alltexts));
  },

  finishUpdateRow: function(alltexts) {
      const blackout = document.createElement('div');
      blackout.id = 'blackout';
      const spinner = document.createElement('div');
      spinner.id = 'spinner';
      blackout.appendChild(spinner);
      document.body.appendChild(blackout);
      const texts = new Set([...document.querySelectorAll('#add_selectedtexts input')].filter(i => i.checked).map(i => i.name));
      const blockel = document.getElementById('add_selectedblock');
      const block = blockel[blockel.selectedIndex].text;
      Realigner.init(_state);
      /*
      const opts = {
        realigndepth: document.getElementById('realigndepth').value 
      };
      */
      const bc = new BroadcastChannel('realigner');

      const ret = Realigner.realign(alltexts,texts,block/*,opts*/);

      bc.onmessage = e => {
        const {rows, tree, witnesses} = ret;
        const NS = _state.xml.documentElement.namespaceURI;
        for(const row of rows) {
          const existing = _state.xml.querySelector(`TEI[n="${row.siglum}"]`);
          if(existing) {
            while(existing.firstChild)
              existing.removeChild(existing.firstChild);
            existing.appendChild(row.text);
          }
          else {
            const TEI = _state.xml.createElementNS(NS,'TEI');
            TEI.setAttribute('n',row.siglum);
            TEI.appendChild(row.text);
            _state.xml.documentElement.appendChild(TEI);
          }
        }

        const listWit = _state.xml.querySelector('listWit');
        const tempel = _state.xml.createElementNS(NS,'TEI');
        tempel.innerHTML = witnesses;
        for(const witness of tempel.firstChild.childNodes) {
          if(witness.nodeType !== 1) continue;
          const xmlid = witness.getAttribute('xml:id');
          const existingwit = listWit.querySelector(`[*|id="${xmlid}"]`);
          // replace old <witness>, in case things have changed, i.e. added new subwitnesses
          if(existingwit)
            listWit.replaceChild(witness.cloneNode(true),existingwit);
          else
            listWit.appendChild(witness.cloneNode(true));
        }

        while(_state.matrix.boxdiv.firstChild)
          _state.matrix.boxdiv.removeChild(_state.matrix.boxdiv.firstChild);
        _state.matrix.makeTable();
        treeFileLoad(null,null,{target: {result: tree}, noshow: true });
        bc.close();
        document.getElementById('blackout').remove();
      };
    // TODO: undo
  },
	startRenameRow: function(/*n*/) {
	// TODO
	},

	startReconstruction: function(e) {
		const key = e.target.dataset.key;
		const tree = e.target.closest('.tree-box').myTree;
		const treename = tree.desc;
		//const blackout = document.createElement('div');
		//blackout.id = 'blackout';
		const frag = document.createRange().createContextualFragment(
			`<div id="reconstructionoptions" class="popup">
<form id="reconstructionform">
  <div>
	<label for="reconstructed_node_name">Label for node:</label>
	<input type="text" id="reconstructed_node_name" name="reconstructed_node_name" placeholder="${treename}-${key}" size="15">
  </div>
  <div style="width: 100%; display: flex; justify-content: center;padding-top: 1em;">
	<button type="submit">Add to matrix</button>
  </div>
</form>
</div>`);
		//blackout.appendChild(frag);
		//document.body.appendChild(blackout);
		const submitfunction = function(e) {
			e.preventDefault();
			const input = document.getElementById('blackout').querySelector('input');
			const label = input.value ? input.value : input.placeholder;
			edit.doReconstruction(tree,key,label);
			//document.body.removeChild(blackout);
		};
		//const submit = blackout.querySelector('button');
		//submit.addEventListener('click',submitfunction);
		//blackout.addEventListener('click',Exporter.blackoutClick);

		Make.blackout(frag,submitfunction);
		document.getElementById('reconstructed_node_name').focus();
	},

	thKeyDown: function(e) {
		if(e.key === 'Enter')
			edit.finishNewRow(e);
	},

	finishNewRow: function(e) {
		const th = _state.editing;
		//const th = e.target;
		const label = th.textContent;
		th.closest('tr').dataset.n = label;
	
		const tei = Make.tei(label);

		_state.xml.documentElement.appendChild(tei);
	
		_state.editing = null;
		th.contentEditable = false;
		th.removeEventListener('blur',edit.finishNewRow);
		th.removeEventListener('keydown',edit.thKeyDown);
		// view.updateAllHeaders(); // new row is empty
		edit.doStack([edit.doDeleteRow,[label]],'do');
	},

	doReconstruction: function(tree,key,label) {

		const tr = Make.row(label,'pending');
		tr.dataset.treename = tree.name;
		tr.dataset.nodename = key;
		const th = tr.querySelector('th');
		const spinner = document.createElement('div');
		spinner.id = 'spinner';
		th.prepend(spinner);

		const tei = Make.tei(label);
		tei.setAttribute('type','reconstructed');
		tei.setAttribute('corresp',tree.name);
		tei.setAttribute('select',`#${key}`);
	
		const tds = [...Find.tds(false,tr)];
		const words = [...Find.words(false,tei)];
	
		_state.matrix.boxdiv.querySelector('tbody').appendChild(tr);
		th.scrollIntoView();

		const fitchWorker = new Worker(new URL('./fitchworker.js', import.meta.url));
		const normalized = Check.normalizedView();
		const serialreadings = Find.serializedtexts(tree.nexml,normalized);
		const readings0 = new Map(serialreadings.map(arr => [arr[0],arr[1][0]]));

		fitchWorker.postMessage({readings:readings0,levels:tree.levels,num:0,id:key});
		fitchWorker.onmessage = function(e) {
			const n = e.data.n;
			const reading = e.data.result;
			tds[n].textContent = reading;
			tds[n].IAST = tds[n].cloneNode(true);
			tds[n].classList.remove('pending');
			words[n].textContent = reading;
			if(n < _state.maxlemma) {
				const readingsn = new Map(serialreadings.map(arr => [arr[0],arr[1][n+1]]));
				fitchWorker.postMessage({readings:readingsn,levels:tree.levels,num:n+1,id:key});
			}
			else {
				th.removeChild(spinner);
				_state.xml.documentElement.appendChild(tei);
				view.updateAllHeaders();
				tree.draw();
				const hl = Find.highlit();
				if(hl.size > 0) multi.repopulateTrees(...Find.lowhigh(hl));

				const mslist = document.getElementById('menu').querySelector('.ms');
				const liel = document.createElement('li');
				liel.setAttribute('data-name',label);
				liel.appendChild(document.createTextNode(label));
				mslist.appendChild(liel);
				
				edit.doStack([edit.doDeleteRow,[label]],'do');

			}
		};
	},

	doDeleteRow: function(label,doing = 'do') {
		const htmlrow = Find.tr(label);
		const xmlrow = Find.tei(label);
		const teis = [...Find.teis()];
		const index = teis.indexOf(xmlrow);

		htmlrow.parentNode.removeChild(htmlrow);
		xmlrow.parentNode.removeChild(xmlrow);
		view.updateAllHeaders();
		view.mssMenuPopulate();
		view.drawTrees();
		if(doing === 'multido')
			return [edit.doUndeleteRow,[htmlrow,xmlrow,index]];
		else
			edit.doStack([edit.doUndeleteRow,[htmlrow,xmlrow,index]],doing);
	},

	doUndeleteRow: function(htmlrow,xmlrow,index,doing = 'do') {
		const label = xmlrow.getAttribute('n');
		const teis = [...Find.teis()];
		if(index === teis.length) {
			_state.xml.documentElement.appendChild(xmlrow);
			_state.matrix.boxdiv.querySelector('tbody').appendChild(htmlrow);
		}
		else {
			const trs = [...Find.trs()];
			_state.xml.documentElement.insertBefore(xmlrow,teis[index]);
			trs[index].parentNode.insertBefore(htmlrow,trs[index]);
		}
		view.updateAllHeaders();
		view.mssMenuPopulate();
		view.drawTrees();
		if(doing === 'multido')
			return [edit.doDeleteRow,[label]];
		else
			edit.doStack([edit.doDeleteRow,[label]],doing);
	},

	doGroupWords: function() {
		let groupstart = 0;
		const todo = [];
		const empty = Find.emptyRows();
		for(let n=0;n<=_state.maxlemma;n++) {
			const tds = Find.tds(n);
			const classtest = tds[0].classList; 
			if(classtest.contains('group-start') ||
			   classtest.contains('group-internal') ||
			   classtest.contains('group-end')) {
				
				groupstart = n+1;
				continue;
			}

			let total = tds.length - empty.size;
			let spaced = 0;
			if(n === _state.maxlemma) spaced = total;
			else {
				for(let m=0;m<tds.length;m++) {
					if(empty.has(m)) continue;

					const td = tds[m];
					const txt = td.IAST ? td.IAST.textContent : td.textContent;
					//if(txt === '')
					//    total--;
					//else 
					if(txt.slice(-1) === ' ')
						spaced++;
				}
			}

			if(spaced / total >= 0.5) {
				if(groupstart === n) {
					groupstart++;
					continue;
				}
				else {
					const range = Find.range(groupstart,n);
					todo.push([edit.group.go,[range]]);
					groupstart = n+1;
				}
			}
		}

		edit.doMulti(todo);
	},

	doEmend: function(cellnum,rownum,doing = 'do') {
		const tr = [...Find.trs()][rownum];
		const td = Find.firsttd(cellnum,tr);
		td.dataset.emended = true;

		const text = Find.tei(rownum).querySelector('text');
		//const text = [...Find.texts()][rownum];
		const word = Find.firstword(cellnum,text);
		word.setAttribute('emended','true');
		if(doing === 'multido')
			return [edit.doUnemend,[cellnum,rownum]];
		else
			edit.doStack([edit.doUnemend,[cellnum,rownum]],doing);

	},

	doUnemend: function(cellnum,rownum,doing = 'do') {
		const tr = [...Find.trs()][rownum];
		const td = Find.firsttd(cellnum,tr);
		delete td.dataset.emended;

		const text = Find.tei(rownum).querySelector('text');
		//const text = [...Find.texts()][rownum];
		const word = Find.firstword(cellnum,text);
		word.removeAttribute('emended');
		if(doing === 'multido')
			return [edit.doEmend,[cellnum,rownum]];
		else
			edit.doStack([edit.doEmend,[cellnum,rownum]],doing);
	},

	doChangeCell: function(cellnum,rownum,celldata,doing = 'do') {
		const oldcelldata = edit.xmlChangeCell(cellnum,rownum,celldata);
		const cell = edit.htmlChangeCell(cellnum,rownum,celldata);
		//view.renormalize(cellnum-1,cellnum+1,rownum);    
		edit.refresh();
		view.updateAllHeaders(true);
		//events.textClick({target: cell});

		if(doing === 'multido')
			return [edit.doChangeCell,[cellnum,rownum,oldcelldata]];
		else
			edit.doStack([edit.doChangeCell,[cellnum,rownum,oldcelldata]],doing);
	},

	htmlChangeCell: function(cellnum,rownum,celldata) { // returns cell
		const row = Find.tr(rownum);
		//const row = [...Find.trs()][rownum];
		const cell = Find.firsttd(cellnum,row);
		//const row = document.querySelector('.matrix table')
		//                    .querySelectorAll('tr')[rownum];
		//const cell = row.querySelector('td[data-n="'+cellnum+'"]');
		edit.unnormalize(cell);
    if(celldata.hasOwnProperty('content')) {
      cell.textContent = celldata.content;
    }
    if(celldata.hasOwnProperty('normal')) {
      if(celldata.normal === null)
        delete cell.dataset.normal;
      else
        cell.dataset.normal = celldata.normal;
    }
		if(cell.IAST) cell.IAST = cell.cloneNode(true);
		return cell;
	},

	xmlChangeCell: function(cellnum,rownum,celldata) { // returns oldcontent
		const row = Find.tei(rownum).querySelector('text');
		//const row = [...Find.texts()][rownum];
		const cell = Find.firstword(cellnum,row);
		//const row = _state.xml.querySelectorAll('text')[rownum];
		//const cell = row.querySelector('w[n="'+cellnum+'"]');
		const oldnorm = cell.getAttribute('lemma');
		const oldcontent = cell.textContent;

    if(celldata.hasOwnProperty('normal')) {
      if(celldata.normal === null)
        cell.removeAttribute('lemma');
      else
        cell.setAttribute('lemma',celldata.normal);   
    }
    if(celldata.hasOwnProperty('content')) {
      if(cell.childNodes.length === 0) 
        cell.appendChild(document.createTextNode(celldata.content));
      else
        cell.textContent = celldata.content;
    }

		return {content: oldcontent, normal: oldnorm};
	},

	doMarkAs: function(type,states,doing = 'do') {
		const nums = [...states.keys()];
		const oldstates = Find.attr(type,nums);
		for(const num of nums) {
			const cells = Find.tds(num);
			const words = Find.words(num);
			//const cells = document.querySelectorAll('.matrix table td[data-n="'+num+'"]');
			//const words = _state.xml.querySelectorAll('w[n="'+num+'"]');
			if(states.get(num) === true) {
				for(const cell of cells) 
					cell.dataset[type] = 'true';
				for(const word of words)
					word.setAttribute(type,'true');
			}
			else {
				for(const cell of cells)
					delete cell.dataset[type];
				for(const word of words)
					word.removeAttribute(type);
			}
			const checkbox = Find.checkbox(num,type);
			checkbox.checked = states.get(num);
		}
		if(doing === 'multido')
			return [edit.doMarkAs,[type,oldstates]];
		edit.doStack([edit.doMarkAs,[type,oldstates]],doing);
	}, 

	refresh: function() {
		/*
	var newcsvarr = [];
	for(const [key,value] of _texts) {
		const par = _state.xml.querySelector('[n="'+key+'"] text');
		const text = [...par.querySelectorAll('w')].map(w => w.innerHTML);
		newcsvarr.push([key,{desc: value.desc, text: text}]);
	}
	_texts = new Map(newcsvarr);
	for(const box of _state.textboxes)
		box.refresh();
*/
		for(const textbox of _state.textboxes)
			textbox.refresh();
		multi.rehighlight();
		if(!Check.anyhighlit())
			multi.clearTrees();
		else
			multi.repopulateTrees(...Find.lowhigh(Find.highlit()));
	},

	/*    renumber: function(doc,parents,childs,attribute,start=0) {
	const rows = doc.querySelectorAll(parents);
	for(const row of rows) {
		const els = row.querySelectorAll(childs);
		for(var n=parseInt(start)+1;n < els.length;n++)
			els[n].setAttribute(attribute,n);
	}
},*/
	renumber: function(start=0) {
		const dorenumber = function(rowfunc,cellfunc,start) {
			const rows = rowfunc();
			for(const row of rows) {
				const els = [...cellfunc(false,row)];
				const attr = Find.whichattr(els[0]);
				for(let n=parseInt(start)+1;n < els.length;n++)
					els[n].setAttribute(attr,n);
			}
		};
		if(_state.matrix) {
			dorenumber(Find.trs,Find.tds,start);
			dorenumber(() => [true],Find.ths,start); // purple header row
		}
		dorenumber(Find.texts,Find.words,start);
		_state.maxlemma = Find.maxlemma();
	//_state.maxlemma = Find.firsttext().lastElementChild.getAttribute('n');
	},

	reIAST: function(nums) {
		const lemmata = [...nums].map(n => [...Find.lemmata(n)]).flat();
		for(const lemma of lemmata)
			lemma.IAST = lemma.cloneNode(true);
	},

	restyleGroups: function(ns,extend = false) {
		const pend = function(arr) {
			var newarr = [...arr];
			const prepend = parseInt(ns[0]) - 1;
			const postpend = parseInt(ns[ns.length-1]) + 1;
			newarr.unshift(prepend);
			newarr.push(postpend);
			return newarr;
		};        

		const nums = extend ? pend(ns) : ns;

		const changeClass = function(els,c_lass = false) {
			const classes = new Set(['group-start','group-internal','group-end']);
			if(c_lass) classes.delete(c_lass);

			for(const el of els) {
				for(const c of classes)
					el.classList.remove(c);
				if(c_lass)
					el.classList.add(c_lass);
			}
		};

		for(const num of nums) {
			const word = Find.firstword(num);
			const tds = Find.tds(num);
			if(tds.length === 0) continue;
			const cl = word.closest('cl');
			if(cl) {
				if(word === cl.firstElementChild)
					changeClass(tds,'group-start');
				else if(word === cl.lastElementChild) {
					changeClass(tds,'group-end');
				}
				else
					changeClass(tds,'group-internal');
			}
			else
				changeClass(tds);
		}
	},

  startUnnormalizeCells: function() {
    edit.startRenormalizeCells(false);
  },
  startRenormalizeCells: function(renormalize=true) {
		const cells = Find.highlitcells();
		if(cells.length === 0) return;
		const nums = new Set();
    const rows = new Set();
		for(const cell of cells) {
			nums.add(cell.dataset.n);
      rows.add(cell.closest('tr').dataset.n); // TODO: make more efficient
		}
    edit.doRenormalizeCells(rows,nums,renormalize);
  },

  doRenormalizeCells: function(rows,nums,renormalize=true,doing='do') {
	  const getSelectedFilters = () => {
      const ret = {groups: ['general']};

      const langmap = new Map([
        ['ta','tamil'],
        ['ta-Latn','tamil'],
        ['ta-Taml','tamil'],
        ['sa','sanskrit'],
        ['sa-Latn','sanskrit'],
        ['pi','pali']
        ]);

      const lang = langmap.get(_state.xml.documentElement.getAttribute('xml:lang'));
      if(lang) ret.groups.push(lang);

      const tagnames = _state.xml.querySelector('normalization[method="markup"]');
      if(tagnames)
        ret.names = [...tagnames.querySelectorAll('ab')].map(ab => ab.textContent);  
     
      return ret;
    };

		const changedrows = new Map();

		const htmlrows = [...Find.trs()];
		const xmlrows = [...Find.texts()];
		const rownums = [...htmlrows.keys()];
		
    const filteropts = renormalize ? getSelectedFilters() : null;

		const [startnum,endnum] = Find.lowhigh(nums);
		for(const r of rownums) {
			const xmlrow = xmlrows[r];
			const rowid = xmlrow.parentNode.getAttribute('n');
      if(!rows.has(rowid)) continue;

			const changedrow = new Map();
			const textbox = document.querySelector(`.text-box[data-id="${rowid}"]`);
			const allwords = [...Find.words(false,xmlrow)];
			const firstword = Find.firstword(startnum,xmlrow);
			const lastword = endnum ? Find.firstword(endnum,xmlrow) : firstword;
			const startn = allwords.indexOf(firstword);
			const endn = endnum ? allwords.indexOf(lastword) : startn;
			const words = allwords.slice(startn, endn + 1);

			const htmlrow = htmlrows[r];
			const alltds = [...Find.tds(false,htmlrow)];
			const tds = alltds.slice(startn, endn + 1);

			const unnormwords = words.map(w => w.textContent);
			const normwords = renormalize ? Normalizer(unnormwords,filteropts) : null;
			
			for(let n=0;n<unnormwords.length;n++) {
				const word = words[n];
				const unnormword = unnormwords[n];
				const td = tds[n];

				const oldlemma = word.hasAttribute('lemma') ?
					word.getAttribute('lemma') :
					false;
				if(oldlemma !== false) {
          changedrow.set(td.dataset.n,oldlemma);
          edit.unnormalize(word);
          edit.unnormalize(td);
				}
				else changedrow.set(td.dataset.n,null);

				if(normwords && normwords[n] !== unnormword) {
					word.setAttribute('lemma',normwords[n]);
					td.dataset.normal = normwords[n];
					if(textbox)
						textbox.querySelector(`.lemma[data-n="${td.dataset.n}"]`)
                   .dataset.normal = normwords[n];
				}
			}
			changedrows.set(r,changedrow);
		}
		view.showNormalized();
		// TODO: do this more efficiently rather than refreshing every box; also do trees
		view.updateAllHeaders(true);
		view.xScrollToHighlit();

		edit.doStack([edit.doUnrenormalize,[changedrows]],doing);
  },

	startRenormalize: function(nums) {
		const numss = nums === false ?
			Find.highlit() :
			nums;
		edit.doRenormalize(Math.min(...numss),Math.max(...numss));
	},

	doRenormalize: function(startnum, endnum, rownum=false, doing='do') {
		//if(!Check.normalizedView()) view.showNormalized();
	  const getSelectedFilters = () => {
      const ret = {groups: ['general']};

      const langmap = new Map([
        ['ta','tamil'],
        ['ta-Latn','tamil'],
        ['ta-Taml','tamil'],
        ['sa','sanskrit'],
        ['sa-Latn','sanskrit'],
        ['pi','pali']
        ]);

      const lang = langmap.get(_state.xml.documentElement.getAttribute('xml:lang'));
      if(lang) ret.groups.push(lang);

      const tagnames = _state.xml.querySelector('normalization[method="markup"]');
      if(tagnames)
        ret.names = [...tagnames.querySelectorAll('ab')].map(ab => ab.textContent);  
     
      return ret;
    };

		const changedrows = new Map();

		const htmlrows = [...Find.trs()];
		const xmlrows = [...Find.texts()];
		const rownums = rownum ? [rownum] : [...htmlrows.keys()];
		
    const filteropts = getSelectedFilters();

		for(const r of rownums) {
			const changedrow = new Map();
			const xmlrow = xmlrows[r];
			const rowid = xmlrow.parentNode.getAttribute('n');
			const textbox = document.querySelector(`.text-box[data-id="${rowid}"]`);
			const allwords = [...Find.words(false,xmlrow)];
			const firstword = Find.firstword(startnum,xmlrow);
			const lastword = Find.firstword(endnum,xmlrow);
			const startn = allwords.indexOf(firstword);
			const endn = allwords.indexOf(lastword);
			const words = allwords.slice(startn, endn + 1);

			const htmlrow = htmlrows[r];
			const alltds = [...Find.tds(false,htmlrow)];
			const tds = alltds.slice(startn, endn + 1);

			const unnormwords = words.map(w => w.textContent);
			const normwords = Normalizer(unnormwords,filteropts);
			
			for(let n=0;n<normwords.length;n++) {
				const word = words[n];
				const normword = normwords[n];
				const unnormword = unnormwords[n];
				const td = tds[n];

				const oldlemma = word.hasAttribute('lemma') ?
					word.getAttribute('lemma') :
					false;
				if(oldlemma !== false) {
					if(oldlemma === normword) continue;
					else {
						changedrow.set(td.dataset.n,oldlemma);
						edit.unnormalize(word);
						edit.unnormalize(td);
					}
				}
				else changedrow.set(td.dataset.n,null);

				if(normword !== unnormword) {
					word.setAttribute('lemma',normword);
					td.dataset.normal = normword;
					if(textbox)
						textbox.querySelector(`.lemma[data-n="${td.dataset.n}"]`)
							   .dataset.normal = normword;
					///*if(showNormalized)*/ td.textContent = normword;
				}
			}
			changedrows.set(r,changedrow);
		}
		view.showNormalized();
		// TODO: do this more efficiently rather than refreshing every box; also do trees
		view.updateAllHeaders(true);
		view.xScrollToHighlit();

		edit.doStack([edit.doUnrenormalize,[changedrows]],doing);
	},
	
	doUnrenormalize: function(rowsmap,doing = 'undo') {
		if(!Check.normalizedView()) view.showNormalized();
		const undomap = new Map();
		const htmlrows = [...Find.trs()];
		const xmlrows = [...Find.texts()];

		for(const [rownum, row] of rowsmap.entries()) {
			const htmlrow = htmlrows[rownum];
			const xmlrow = xmlrows[rownum];
			const undorowmap = new Map();

			for(const [n, normword] of row.entries()) {
				const td = Find.firsttd(n,htmlrow);
				const word = Find.firstword(n,xmlrow);

				const undo = word.hasAttribute('lemma') ?
					word.getAttribute('lemma') :
					null;
				undorowmap.set(n,undo);
				
				if(normword === null) {
					edit.unnormalize(td);
					edit.unnormalize(word);
				}
				else {
					td.dataset.normal = normword;
					word.setAttribute('lemma',normword);
					/*if(showNormalized)*/ td.textContent = normword;
				}
			}
			undomap.set(rownum,undorowmap);
		}
		edit.doStack([edit.doUnrenormalize,[undomap]],doing);
	},

	startUnnormalize: function(nums) {
		const numss = nums === false ?
			Find.highlit() :
			nums;
		edit.doUnnormalize(Math.min(...numss),Math.max(...numss));
	},

	doUnnormalize: function(startnum, endnum, rownum=false, doing='do') {
		//if(!Check.normalizedView()) view.showNormalized();
		const changedrows = new Map();

		const htmlrows = [...Find.trs()];
		const xmlrows = [...Find.texts()];
		const rownums = rownum ? [rownum] : [...htmlrows.keys()];

		for(const r of rownums) {
			const changedrow = new Map();
			const xmlrow = xmlrows[r];
			const rowid = xmlrow.parentNode.getAttribute('n');
			const textbox = document.querySelector(`.text-box[data-id="${rowid}"]`);
			const allwords = [...Find.words(false,xmlrow)];
			const firstword = Find.firstword(startnum,xmlrow);
			const lastword = Find.firstword(endnum,xmlrow);
			const startn = allwords.indexOf(firstword);
			const endn = allwords.indexOf(lastword);
			const words = allwords.slice(startn, endn + 1);

			const htmlrow = htmlrows[r];
			const alltds = [...Find.tds(false,htmlrow)];
			const tds = alltds.slice(startn, endn + 1);

			const unnormwords = words.map(w => w.textContent);
			
			for(let n=0;n<unnormwords.length;n++) {
				const word = words[n];
				const unnormword = unnormwords[n];
				const td = tds[n];

				const oldlemma = word.hasAttribute('lemma') ?
                          word.getAttribute('lemma') :
                          false;
				if(oldlemma !== false) {
          changedrow.set(td.dataset.n,oldlemma);
          edit.unnormalize(word);
          edit.unnormalize(td);
				}
				else changedrow.set(td.dataset.n,null);
			}
			changedrows.set(r,changedrow);
		}
		view.showNormalized();
		view.updateAllHeaders(true);
		view.xScrollToHighlit();

		edit.doStack([edit.doUnrenormalize,[changedrows]],doing);
	},
	
	unnormalize: function(cell) {
		if(cell.hasOwnProperty('IAST'))
			cell.textContent = cell.IAST.textContent;
		if(cell.dataset && cell.dataset.hasOwnProperty('normal')) {
			delete cell.dataset.normal;
		}
		if(cell.getAttribute('lemma'))
			cell.removeAttribute('lemma');
	},

}; // end edit

edit.moveRow = {
  start: function(targ,e) {
		_state.dragged = targ;
		_state.dragged.classList.add('dragging');
		if(e.type !== 'dragstart') {
			for(const tr of Find.trs())
				tr.classList.add('moveinprogress');
			_state.matrix.boxdiv.querySelector('table').addEventListener('mousedown',edit.moveRow.finish);
		}
	},
  do: function(movetr,appendafter,doing = 'do') {
		const table = movetr.parentNode;
		//const trs = [...table.children];
		const trs = [...Find.trs()];
		const oldsib = movetr.previousElementSibling;
		const previndex = trs.indexOf(movetr);
		const appendindex = appendafter !== null ?
			trs.indexOf(appendafter) :
			null;
		const HTMLMove = () => {
			if(appendafter === -1)
				table.insertBefore(movetr,table.firstChild);
			else if(appendafter.nextElementSibling)
				table.insertBefore(movetr,appendafter.nextElementSibling);
			else
				table.appendChild(movetr);
		};
		const XMLMove = () => {
			const root = _state.xml.documentElement;
			const teis = [...Find.teis()];
			const moverow = teis[previndex];
			if(appendindex === -1)
			//if(appendindex === null)
				root.insertBefore(moverow,teis[0]);
			else {
				const appendxml = teis[appendindex];
				if(appendxml.nextElementSibling)
					root.insertBefore(moverow,appendxml.nextElementSibling);
				else
					root.appendChild(moverow);
			}
		};
		HTMLMove();
		XMLMove();
		if(doing === 'multido')
			return [edit.moveRow.do,[movetr,oldsib]];
		else
			edit.doStack([edit.moveRow.do,[movetr,oldsib]],doing);
	},

	finish: function(e) {
		const tr = e.target.nodeType === 1 ?
			e.target.closest('tr') :
			e.target.parentElement.closest('tr');
		if(tr)
			edit.moveRow.do(_state.dragged,tr,'do');
		if(e.type !== 'drop') {
			for(const tr of Find.trs())
				tr.classList.remove('moveinprogress');
			_state.matrix.boxdiv.querySelector('table').removeEventListener('mousedown',edit.moveRow.finish);
		}
		else {
			for(const tr of Find.trs())
				tr.classList.remove('dragenter');
		}
		_state.dragged.classList.remove('dragging');
		_state.dragged = null;
	},

};

edit.merge =  {
  start: function(nums,/*e*/) {
		const numss = nums === false ?
			Find.highlit() :
			nums;
		const clgroups = Find.clauses(numss,true);
		if(!clgroups) {
			edit.merge.do(numss,'do');
		}
		else if(clgroups[0] === null) {
			const args = clgroups.filter(s => s!== null)
				.map(s => [edit.ungroup.go,[s]])
				.concat([[edit.merge.do,[numss]]]);
			edit.doMulti(args,'do');
		}
		else { /* ungroups everything; otherwise undo doesn't regroup properly */
			//const toremove = Find.clausesToRemove(clgroups,numss);
			//if(!toremove)
			//    edit.doMerge(numss,'do');
			//else {
			//    const args = toremove.map(s => [edit.ungroup.go,[s]])
				const args = clgroups.map(s => [edit.ungroup.go,[s]])
					.concat([[edit.merge.do,[numss]]]);
				edit.doMulti(args,'do');
			//}

		}
	},
	do: function(nums,doing = 'do') {
		/*        const merge = function(doc,selector,tag,attribute,nums) {
		const rows = doc.querySelectorAll(selector);
		var rowsclone = [];
		for(const row of rows) {
			const arr = [...nums].map(n => {
					const cell = row.querySelector(tag+'['+attribute+'="'+n+'"]');
					edit.unnormalize(cell);
					return cell;
				});
			const arrclone = arr.map(el => el.cloneNode(true));
			rowsclone.push(arrclone);
			const reduced = arr.reduce(function(acc,cur) {
				if(cur.hasChildNodes()) {
					const targ = cur.IAST ? cur.IAST : cur;
					if(acc.hasChildNodes())
						acc.appendChild(document.createTextNode(' '));
					while(targ.firstChild)
						acc.appendChild(targ.firstChild)
				}
				cur.parentNode.removeChild(cur);
				return acc;
				});
			reduced.normalize();
			reduced.IAST = reduced.cloneNode(true);
		}
		return [doc,selector,tag,attribute,rowsclone];
	} */
		const merge = function(rowfunc,cellfunc,nums) {
			const rows = rowfunc();
			var rowsclone = [];
			for(const row of rows) {
				/*
				const arr = [...nums].map(n => {
					const cell = cellfunc(n,row);
					edit.unnormalize(cell);
					return cell;
				});
				*/
				const nummap = n => cellfunc(n,row);
				const arr = [...nums].map(nummap);
				const arrclone = arr.map(el => el.cloneNode(true));
				rowsclone.push(arrclone);
				//for(const a of arr) edit.unnormalize(a);
				if(arr[0].dataset) {
          if(arr[0].dataset.normal === undefined) {
            for(const a of arr) {
              if(a.dataset.normal !== undefined) {
                arr[0].dataset.normal = arr[0].textContent;
                arr[0].IAST.dataset.normal = arr[0].textContent;
                break;
              }
            }
          }
				}
				else {
          if(!arr[0].hasAttribute('lemma')) {
            for(const a of arr) {
              if(a.hasAttribute('lemma')) {
                arr[0].setAttribute('lemma',arr[0].textContent);
                break;
              }
            }
          }
        }
				const reduced = arr.reduce(function(acc,cur) {
          if(cur.dataset) {
            const curr = cur.hasOwnProperty('IAST') ? cur.IAST : cur;

            if(curr.dataset.normal !== undefined) {
              acc.dataset.normal = acc.dataset.normal + curr.dataset.normal;
              if(acc.IAST)
                acc.IAST.dataset.normal = acc.IAST.dataset.normal + curr.dataset.normal;
            }
            else if(acc.dataset.normal) {
              acc.dataset.normal = acc.dataset.normal + curr.textContent;
              if(acc.IAST)
                acc.IAST.dataset.normal = acc.IAST.dataset.normal + curr.textContent;
            }
          }
          else {
            if(cur.hasAttribute('lemma'))
              acc.setAttribute('lemma',acc.getAttribute('lemma') + cur.getAttribute('lemma'));
            else if(acc.hasAttribute('lemma'))
              acc.setAttribute('lemma',acc.getAttribute('lemma') + cur.textContent);
          }

					if(cur.hasChildNodes()) { // TODO: deprecated
						while(cur.firstChild)
							acc.appendChild(cur.firstChild);
            if(acc.IAST)
              while(cur.IAST.firstChild)
                acc.IAST.appendChild(cur.IAST.firstChild);
					}

					cur.parentNode.removeChild(cur);
					return acc;
				});
				reduced.normalize();
        if(reduced.IAST)
          reduced.IAST.normalize();
        /*
				if(reduced.dataset) {
					delete reduced.dataset.normal;
					reduced.IAST = reduced.cloneNode(true);
				}
				else 
					reduced.removeAttribute('lemma');
        */
			}
			return [rowfunc,cellfunc,rowsclone];
		};
		//const oldhtml = merge(document,'.matrix tr','td','data-n',nums);
		//const oldxml = merge(_state.xml,'text','w','n',nums);
		const oldhtml = merge(Find.trs,Find.firsttd,nums);
		const oldxml = merge(Find.texts,Find.firstword,nums);
		const start = parseInt([...nums][0]);
		edit.renumber(start);
		//edit.renumber(document,'.matrix tr','td','data-n',start);
		//edit.renumber(_state.xml,'text','w','n',start);
		edit.restyleGroups(nums);
		//view.renormalize(start,start+1);
		edit.refresh();
		view.updateAllHeaders();
		//view.updateHeaders(nums);

		if(doing === 'multido')
			return [edit.merge.undo,[oldhtml,oldxml]];
		else
			edit.doStack([edit.merge.undo,[oldhtml,oldxml]],doing);
	},

  undo: function(oldhtml,oldxml,doing = 'undo') {
		/*        const unmerge = function(doc,parents,childs,attribute,oldels) {
		const nums = oldels[0].map(el => el.getAttribute(attribute));
		const firstn = nums[0];
		const rows = doc.querySelectorAll(parents);
		for(var n=0;n<rows.length;n++) {
			const lastchild = oldels[n].pop();
			const anchor = rows[n].querySelector(childs+'['+attribute+'="'+firstn+'"]');
			anchor.parentNode.replaceChild(lastchild,anchor);
			for(const cell of oldels[n]) 
				lastchild.parentNode.insertBefore(cell,lastchild);
		}
		edit.renumber(doc,parents,childs,attribute,firstn);
		return nums;
	} */
		const unmerge = function(rowfunc,cellfunc,oldels) {
			const attr = Find.whichattr(oldels[0][0]);
			const nums = oldels[0].map(el => el.getAttribute(attr));
			const firstn = nums[0];
			const rows = rowfunc();
			for(var n=0;n<rows.length;n++) {
				const lastchild = oldels[n].pop();
				const anchor = cellfunc(firstn,rows[n]);
				anchor.parentNode.replaceChild(lastchild,anchor);
				for(const cell of oldels[n]) 
					lastchild.parentNode.insertBefore(cell,lastchild);
			}
			return nums;
		};
		unmerge(...oldhtml);
		const nums = unmerge(...oldxml);
		const sortednums = [...nums].sort((a,b) => parseInt(a)-parseInt(b));
		const start = sortednums[0];
		edit.renumber(start);
		edit.reIAST(nums);
		//const end = parseInt(sortednums[sortednums.length-1])+1;
		//view.renormalize(start,end);
		edit.refresh();
		edit.restyleGroups(nums);
		view.updateAllHeaders();

		if(doing === 'multido')
			return [edit.merge.do,[nums]];
		else 
			edit.doStack([edit.merge.do,[nums]],doing);
	}
};

edit.group = {
  start: function(nums,/*e*/) {
    const numss = nums === false ?
      Find.highlit() :
      nums;
    if(Check.grouped())
      edit.ungroup.start(numss);
    else
      edit.group.go(numss,'do');
  },
  go: function(nums,doing = 'do') {
    Actions.group(nums);

    for(const textbox of _state.textboxes)
      textbox.refresh();

    if(doing === 'multido')
      return [edit.ungroup.go,[nums]];
    else edit.doStack([edit.ungroup.go,[nums]],doing);
  },

};

edit.ungroup = {
  start: function(nums) {
    const clgroups = Find.clauses(nums);
    const args = [...clgroups].map(s => [edit.ungroup.go,[s]]);
    edit.doMulti(args,'do');
  },
  go: function(nums,doing = 'do') {
    Actions.ungroup(nums);

    for(const textbox of _state.textboxes)
      textbox.refresh();

    if(doing === 'multido')
      return [edit.group.go,[nums]];
    else
      edit.doStack([edit.group.go,[nums]],doing);
  },

};

edit.addCol = {
  append: function() {
    const highlit = Find.highlit();
    const insertafter = highlit.size === 0 ? _state.maxlemma : Math.max(...highlit);
    edit.addCol.go({mode: 'append', start: insertafter});
  },
  insert: () => {
    const highlit = Find.highlit();
    const insertbefore = highlit.size === 0 ? 0 : Math.min(...highlit);
    edit.addCol.go({mode: null, start: insertbefore});
  },
  go: function(opts,doing = 'do') {
    // opts = { mode: 'append' || 'insert', start, xml, html }
    const insert = function(rowfunc,cellfunc,els,newfunc) {
      const rows = rowfunc();
      for(var n=0;n<rows.length;n++) {
        const anchor = cellfunc(opts.start,rows[n]);
        if(opts.mode === 'append') {
          if(!els) {
            const newcell = newfunc(opts.start + 1);
            anchor.insertAdjacentElement('afterend',newcell);
          }
          else {
            for(const cell of els[n].reverse())
              anchor.insertAdjacentElement('afterend',cell);
          }
        }
        else {
          if(!els) {
            const newcell = newfunc(opts.start);
            anchor.insertAdjacentElement('beforebegin',newcell);
          }
          else {
            for(const cell of els[n])
              anchor.insertAdjacentElement('beforebegin',cell);
          }
        }
      }
      return els ? els[0].length : 1;
    };

    multi.unHighlightAll();

    var len;
    if(opts.hasOwnProperty('xml')) {
      insert(...opts.xml);
      len = insert(...opts.html);
    }
    else {
      insert(Find.trs,Find.firsttd,null,Make.emptycell);
      insert(Find.texts,Find.firstword,null,Make.emptyword);
      len = 1;
    }

    const nums = opts.mode === 'append' ? 
      [...Array(len).keys()].map(n => opts.start + n + 1) : 
      [...Array(len).keys()].map(n => opts.start + n);

    edit.renumber(opts.start);

    multi.highlightRange(new Set(nums));

    edit.refresh();
    edit.reIAST(nums);
    edit.restyleGroups(nums,true);
    view.updateAllHeaders();

    if(doing === 'multido')
      return [edit.removeCol.go,[nums]];
    else
      edit.doStack([edit.removeCol.go,[nums]],doing);
  }
};
	
edit.removeCol = {
  start: function(nums,/*e*/) {
    const numss = nums === false ?
      Find.highlit() :
      nums;

    const clgroups = Find.clauses(numss);
    if(!clgroups) {
      edit.removeCol.go(numss,'do');
    }
    else { /* ungroups everything; otherwise undo doesn't regroup properly */
      //const toremove = Find.clausesToRemove(clgroups,numss,1);
      //if(!toremove)
      //    edit.removeCol.go(numss,'do');
      //else {
      //    const args = toremove.map(s => [edit.ungroup.go,[s]])
        const args = clgroups.map(s => [edit.ungroup.go,[s]])
          .concat([[edit.removeCol.go,[numss]]]);
        edit.doMulti(args,'do');
      //}
    }
  },
  go: function(nums,doing = 'do') {
    const remove = function(rowfunc,cellfunc) {
      const nummap = (n,row) => {
        const cell = cellfunc(n,row);
        edit.unnormalize(cell);
        return cell;
      };
      const rows = rowfunc();
      const rowsclone = [];
      for(const row of rows) {
        const arr = [...nums].map(n => nummap(n,row));
        const arrclone = arr.map(el => el.cloneNode(true));
        rowsclone.push(arrclone);
        for(const td of arr)
          td.parentNode.removeChild(td);
      }
      return [rowfunc,cellfunc,rowsclone];
    };
    
    const opts = { mode: 'insert' };

    const parsednums = [...nums].map(n => parseInt(n));
    const start = Math.min(...nums);
    const end = Math.max(...nums);
    
    const last = Find.firstword(end);
    if(!last.nextElementSibling)
      opts.mode = 'append';
    
    const oldhtml = remove(Find.trs,Find.firsttd);
    const oldxml = remove(Find.texts,Find.firstword);
    
    edit.renumber(start-1);
    edit.refresh();
    edit.restyleGroups(nums,true);
    view.updateAllHeaders();
    
    opts.html = oldhtml;
    opts.xml = oldxml;  
    if(opts.mode === 'append')
      opts.start = start-1;
    else
      opts.start = start;

    if(doing === 'multido')
      return [edit.addCol.go,[opts]];
    else
      edit.doStack([edit.addCol.go,[opts]],doing);
  }
};

edit.removeEmptyRows = () => {
  const labels = Find.emptyRows(true);
  const dolist = [...labels].map(l => [edit.doDeleteRow,[l]]);
  edit.doMulti(dolist,'do');
};
	
edit.removeEmptyColumns = () => {
  const nums = Find.empty();
  const clgroups = Find.clauses(nums);
  if(!clgroups) {
    edit.removeCol.go(nums,'do');
  }
  else {
    const toremove = Find.clausesToRemove(clgroups,nums,1);
    if(!toremove)
      edit.removeCol.go(nums,'do');
    else {
      const args = toremove.map(s => [edit.ungroup.go,[s]])
        .concat([[edit.removeCol.go,[nums]]]);
      edit.doMulti(args,'do');
    }
  }
};

edit.editCell = {
  start: function(el) {
        //const cell = el || document.querySelector('.matrix td.highlitcell');
		const cell = el || Find.highlitcell();
		if(!cell) return;

    for(const el of _state.matrix.boxdiv.querySelectorAll('td.highlit'))
        if(el !== cell) el.classList.remove('highlit');

    const allhighlit = Find.highlitcells();
    if(allhighlit.length > 1) {
        for(const el of allhighlit)
            if(el !== cell) el.classList.remove('highlitcell');
    }
		//cell.classList.add('highlitcell');
    
		const normalized = Check.normalizedView();
    const realcell = cell.hasOwnProperty('IAST') ? cell.IAST : cell;
		if(normalized) {
      if(cell.dataset.hasOwnProperty('normal'))
        cell.dataset.oldnormal = cell.dataset.normal;
      else
        cell.dataset.oldnormal = realcell.textContent;
    }
    else {
      cell.dataset.olddata = realcell.textContent;
    }
	
		cell.contentEditable = 'true';
		cell.focus();
		_state.editing = cell;
		events.selectAll(cell);
		cell.addEventListener('blur',edit.editCell.finish);
		cell.addEventListener('keydown',edit.cellKeyDown);
	},
	finish: function(e,cancel = false) {
		//const cell = e.target;
		//cell.classList.remove('highlitcell');
		const cell = _state.editing;
		_state.editing = null;
		cell.contentEditable = 'false';
		cell.removeEventListener('blur',edit.editCell.finish);
		cell.removeEventListener('keydown',edit.cellKeyDown);
		cell.blur();
		events.deselect();
		const content = cell.textContent;
		
		const cellnum = parseInt(cell.dataset.n);
		const tr = cell.closest('tr');
		const rownum = tr.dataset.n;
    
    const normalized = cell.dataset.hasOwnProperty('oldnormal');
    const oldcontent = normalized ? cell.dataset.oldnormal : cell.dataset.olddata;
		if(cancel) {
      cell.textContent = oldcontent; // TODO: change script
			return;
		}
		if(content === oldcontent) {
			if(normalized)
        delete cell.dataset.oldnormal;
      else
        delete cell.dataset.olddata;
			return;
		}
	  /*
		if(!cell.hasOwnProperty('IAST'))
			cell.IAST = cell.cloneNode(true);
    */
    if(normalized) {
      cell.dataset.normal = content;
      edit.xmlChangeCell(cellnum,rownum,{normal: content});
    }
    else {
      cell.IAST.textContent = content;
      delete cell.dataset.normal;
      edit.xmlChangeCell(cellnum,rownum,{content: content, normal: null});
    }

		if(tr.dataset.hasOwnProperty('treename') && !cell.dataset.hasOwnProperty('emended')) {
			const emendaction = edit.doEmend(cellnum,rownum,'multido');
			const dolist = [];
      if(normalized)
        dolist.push([edit.doChangeCell,[cellnum,rownum,{normal: cell.dataset.oldnormal}]]);
      else
        dolist.push([edit.doChangeCell,[cellnum,rownum,{content: cell.dataset.olddata}]]);
			dolist.push(emendaction);
			edit.doStack([edit.doMulti,[dolist]],'do');
		}
		else {
      if(normalized)
        edit.doStack([edit.doChangeCell,[cellnum,rownum,{normal: cell.dataset.oldnormal}]],'do');
      else
        edit.doStack([edit.doChangeCell,[cellnum,rownum,{content: cell.dataset.olddata}]],'do');
    }
    if(normalized)
      delete cell.dataset.oldnormal;
    else
      delete cell.dataset.olddata;

		edit.refresh();
		view.updateAllHeaders(true);
		cell.classList.add('highlitcell');
	}
};

edit.shiftCell = {
	start: () => {
		const cells = Find.highlitcells();
		if(cells.length === 0) return;
		const nums = new Set();
		for(const cell of cells) {
      if(cell.textContent !== '' || cell.dataset.hasOwnProperty('normal'))
        cell.classList.add('dragging');
			nums.add(cell.dataset.n);
		}
    _state.shifting = nums;
		multi.unHighlightAll();
	},
	
	do: e => {
    const key = e.key;

		if(key === 'Enter') {
            e.preventDefault();
			edit.shiftCell.finish();
		}
		else if(key === 'ArrowRight' || key === 'ArrowLeft') {
            e.preventDefault();
			const trs = Find.trs();
			const tomove = [];
			for(const tr of trs) {
				const highlit = tr.querySelectorAll('td.dragging');
				if(highlit.length === 0) continue;

				const origcell = key === 'ArrowRight' ? highlit[highlit.length-1] : highlit[0];
				const newcell = key === 'ArrowRight' ? 
					Find.adjacentRight(origcell) : Find.adjacentLeft(origcell);

				if(!newcell || newcell.textContent !== '' || newcell.dataset.hasOwnProperty('normal')) {
          const dir = key === 'ArrowRight' ? 'right' : 'left';
					for(const cell of _state.matrix.boxdiv.querySelectorAll('.dragging'))
            warningFlash(cell,dir);
					return;
				}
				for(const cell of highlit) {
					if(key === 'ArrowRight')
						tomove.unshift([cell,Find.adjacentRight(cell)]);
					else
						tomove.push([cell,Find.adjacentLeft(cell)]);
				}
			}
			for(const pair of tomove) {
        switchCells(...pair);
        pair[0].classList.remove('dragging');
        pair[1].classList.add('dragging');
      }
		}
	},

	finish: () => {
		const dolist = [];
		const nums = new Set();
    for(const d of _state.matrix.boxdiv.querySelectorAll('.dragging'))
      nums.add(d.dataset.n);
    for(const d of _state.shifting)
      nums.add(d);
    
		const trs = _state.matrix.boxdiv.querySelectorAll('tr:has(td.dragging)');
		for(const tr of trs) {
			//for(let cellnum=low; cellnum<=(high||low); cellnum++) {
      for(const cellnum of nums) {
				const rownum = tr.dataset.n;
				const cell = tr.querySelector(`td[data-n="${cellnum}"]`);
				cell.classList.remove('dragging');
				const node = cell.hasOwnProperty('IAST') ? cell.IAST : cell;
				
				const stuff = { content: node.textContent };

				if(node.dataset.hasOwnProperty('normal')) 
          stuff.normal = node.dataset.normal;
        else
          stuff.normal = null;

				const oldcelldata = edit.xmlChangeCell(cellnum,rownum,stuff);
				dolist.push([edit.doChangeCell,[cellnum,rownum,oldcelldata]]);
			}
		}

		edit.doStack([edit.doMulti,[dolist]],'do');
		_state.shifting = null;
		multi.clearTrees();
	},
};

const switchCells = (a,b) => {
  const hasIAST = a.hasOwnProperty('IAST');

  b.textContent = a.textContent;
  if(hasIAST) {
    if(!b.hasOwnProperty('IAST'))
      b.IAST = b.cloneNode(true);
    b.IAST.textContent = a.IAST.textContent;
  }
  else {
    if(b.hasOwnProperty('IAST'))
      delete b.IAST;
  }
  a.textContent = '';

  if(a.dataset.hasOwnProperty('normal')) {
    b.dataset.normal = a.dataset.normal;
    if(hasIAST)
      b.IAST.dataset.normal = a.IAST.dataset.normal;
    delete a.dataset.normal;
  }
  if(hasIAST) a.IAST = a.cloneNode(true);
};

const slideOne = (rows,direction) => {
  const newrows = [];
  for(const row of rows) {
    //const origcell = direction === 'left' ? row[0] : row[row.length-1];
    const origcell = row[0];
    const newcell = direction === 'left' ? 
      Find.adjacentLeft(origcell) : Find.adjacentRight(origcell);

    if(!newcell || newcell.textContent !== '' || newcell.dataset.hasOwnProperty('normal'))
      return;
    
    const newrow = row.map(c => direction === 'left' ? Find.adjacentLeft(c) : Find.adjacentRight(c));
    newrows.push(newrow);
  }
  return newrows;
};

const warningFlash = (cell, direction = 'left') => {
  const flasher = direction === 'left' ?
    [{ filter: 'drop-shadow(-4px 0 4px rgb(198,158,19))'}, { filter: 'none' }] :
    [{ filter: 'drop-shadow(4px 0 4px rgb(198,158,19))'}, { filter: 'none' }];
  const timer = {
    duration: 300,
    iterations: 1
  };
  cell.animate(flasher,timer);
};

edit.slideCellLeft = () => edit.slideCell('left');
edit.slideCellRight = () => edit.slideCell('right');
edit.slideCell = (direction = 'left') => {
  const trs = Find.trs();
  const starts = [];
  const rownums = [];
  for(const tr of trs) {
    const highlit = tr.querySelectorAll('td.highlitcell');
    if(highlit.length === 0) continue;

    const row = [];
    for(const cell of highlit) {
      if(cell.textContent !== '' || cell.dataset.hasOwnProperty('normal')) {
        if(direction === 'left') row.push(cell);
        else row.unshift(cell);
      }
    }
    if(row.length !== 0) {
      rownums.push(tr.dataset.n);
      starts.push(row);
    }
  }
  let cur = [...starts];
  let changed = false;
  while(true) {
    const newcur = slideOne(cur,direction);
    if(!newcur) break;
    changed = true;
    cur = newcur;
  }

  if(!changed) {
    for(const row of starts)
      for(const cell of row) warningFlash(cell,direction);
    return;
  }

  const tochange = new Map();
  for(let n=0;n<starts.length;n++) {
    const cellnums = new Set();
    for(let m=0;m<starts[n].length;m++) {
			switchCells(starts[n][m],cur[n][m]);
      cur[n][m].classList.remove('dragging');
      cellnums.add(starts[n][m].dataset.n);
      cellnums.add(cur[n][m].dataset.n);
    }
    tochange.set(rownums[n],cellnums);
  }

  const dolist = [];
  for(const [rownum, cellnums] of tochange.entries()) {
    const htmlrow = Find.tr(rownum);
    for(const cellnum of cellnums) {
      const cell = htmlrow.querySelector(`td[data-n="${cellnum}"]`);
      const node = cell.hasOwnProperty('IAST') ? cell.IAST : cell;
    
      const stuff = { content: node.textContent };

      if(node.dataset.hasOwnProperty('normal')) 
        stuff.normal = node.dataset.normal;
      else
        stuff.normal = null;

      const oldcelldata = edit.xmlChangeCell(cellnum,rownum,stuff);
      dolist.push([edit.doChangeCell,[cellnum,rownum,oldcelldata]]);
    }
  }
  edit.doStack([edit.doMulti,[dolist]],'do');
  multi.clearTrees();
  multi.unHighlightAll(); 
};

const events = {
  selectAll: el => {
		const range = document.createRange();
		range.selectNodeContents(el);
		const sel = window.getSelection();
		sel.removeAllRanges();
		sel.addRange(range);
	},

  deselect: () => {
		const sel = window.getSelection();
		if(sel.removeAllRanges) sel.removeAllRanges();
		else if(sel.empty) sel.empty();
	}
}

export { edit, init };
