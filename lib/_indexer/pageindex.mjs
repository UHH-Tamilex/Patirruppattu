import Fs from 'fs';
import Process from 'process';
import Path from 'path';
import Jsdom from 'jsdom';

const go = () => {
    const template = Fs.readFileSync('index-template.html',{encoding: 'utf-8'});
    const dir = '../../';
    const files = Fs.readdirSync(dir);
    const flist = [];
    const regex = new RegExp(`^${Process.argv[2]}.*\\.xml$`);
    files.forEach((f) => {
        if(regex.test(f))
            flist.push(f);
    });
    
    flist.sort((a,b) =>
        parseInt(a.replaceAll(/\D/g,'')) - parseInt(b.replaceAll(/\D/g,''))
    );

    const list = [];
    for(const f of flist) {
        const xmlTxt = Fs.readFileSync(dir + f,{encoding: 'utf-8'});
        const parser = new (new Jsdom.JSDOM('')).window.DOMParser();
        const xmlDoc = parser.parseFromString(xmlTxt,'text/xml');
        const title = xmlDoc.querySelector('titleStmt title').textContent
                      .replaceAll(/\d+/g,"<span class='num trad'>$&</span>");
        list.push(`<li><a href="${f}">${title}</a></li>`);
    }
    const out = template.replace('<!-- insert list here -->',list.join(''))
                        .replaceAll('<!-- insert title here -->',process.argv[3]);
    Fs.writeFileSync('../../index.html',out);
};

go();
