import Fs from 'fs';
import Path from 'path';
import Process from 'process';
import Jsdom from 'jsdom';
import sqlite3 from 'better-sqlite3';
import {Sanscript} from '../js/sanscript.mjs';
import {decodeRLE, findLines} from '../debugging/utils.mjs';
import {gramAbbreviations, gramMap, dbSchema} from '../debugging/abbreviations.mjs';

const CONCATRIGHT = Symbol.for('concatright');
const CONCATLEFT = Symbol.for('concatleft');

const dbValues = Object.values(dbSchema).reduce((acc,cur) => {
        for(const c of cur) acc.push(c);
        return acc;
    },[]);
dbValues.sort((a,b) => b.length - a.length);

const dbKeys = Object.keys(dbSchema);
const importantKeys = ['pos','number','gender','nouncase','person','aspect','voice'];
const dbops = {
    open: (f) => {
        const db = new sqlite3(f);
        db.pragma('journal_mode = WAL');
        db.pragma('foreign_keys = ON');
        return db;
    },

    close: (db) => {
        db.prepare('VACUUM').run();
        db.close();
    }
};

const dir = '../..';
var fulldb;

const go = () => {
    const db = dbops.open('../../index.db');
    db.prepare('DROP TABLE IF EXISTS [citations]').run();
    db.prepare('CREATE TABLE [citations] ('+
        'lemma TEXT, '+
        'gloss TEXT, '+
        'citation TEXT, ' +
        'line INTEGER, ' +
        'filename TEXT' +
        ')').run();
    const regex = new RegExp(`^${Process.argv[2]}.*\\.xml$`);
    Fs.readdir(dir,(err, files) => {
        if(err) return console.log(err);
        const collator = new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'});
        files.sort(collator.compare);
        for(const f of files) {
            if(regex.test(f))
                addToDb(dir + '/' + f,db);
        }
    });
};

const getForm = entry => {
    const simple = entry.querySelector('form[type="simple"]')?.textContent;
    const form = entry.querySelector('form')?.textContent;
    return simple || form;
};

const prepWordEntry = entry => {
    const type = entry.getAttribute('type');
    if(type === 'main' || type === 'supp') return;
    const lemma = entry.closest('standOff[type="wordsplit"]').querySelector('entry[type="main"]');
    if(!lemma) return;

    const ret = {
        lemma: getForm(lemma)
    };
    ret.gloss = getForm(entry);

    return ret;
};

const addToDb = (fname,db) => {
    console.log(fname);
    const basename = Path.basename(fname);
    const f = Fs.readFileSync(fname,{encoding: 'utf-8'});
    const dom = new Jsdom.JSDOM('');
    const parser = new dom.window.DOMParser();
    const doc = parser.parseFromString(f,'text/xml');
    const standOffs = doc.querySelectorAll('standOff[type="wordsplit"]');
    for(const standOff of standOffs) {
        const citation = standOff.getAttribute('corresp').replace(/^#/,'');
        findLines(doc,citation,standOff);
        const entries = standOff.querySelectorAll('entry:has(> form)');
        
        for(let n=0;n<entries.length;n++) {
            const entry = entries[n];
            const ins = prepWordEntry(entry);
            if(ins === undefined) continue;
            const linenum = entry.closest('[linenum]').getAttribute('linenum');
            const dbobj = Object.assign({
                citation: citation,
                line: parseInt(linenum) + 1,
                filename: basename
            },ins);

            db.prepare('INSERT INTO citations VALUES (@lemma, @gloss, @citation, @line, @filename)').run(dbobj);
        }
        // TODO: Also do compounds
    }
};
go();
