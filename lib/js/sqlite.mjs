import initSqlJs from './sql-wasm.js';
/*
import {createSQLiteThread, createHttpBackend} from './sqlite-wasm-http/index.mjs';

const openDb = async dburl => {
    const httpBackend = createHttpBackend({
        maxPageSize: 4096,
        timeout: 60000,
        cacheSize: 50 * 1024 * 1024, // 50 MB should cache the whole db
        backendType: 'sync'

    });
    const db = await createSQLiteThread({http: httpBackend});
    await db('open', {filename: 'file:' + encodeURI(dburl),vfs: 'http'});
    return db;
};
*/

const openDb = async dburl => {
    const sqlPromise = initSqlJs({
        locateFile: file => `./lib/js/${file}`
    });
    const dataPromise = fetch(dburl).then(r => r.arrayBuffer());
    const [SQL, buf] = await Promise.all([sqlPromise, dataPromise]);
    return (new SQL.Database(new Uint8Array(buf)));
};


export default openDb;
