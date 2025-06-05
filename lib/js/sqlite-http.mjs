import {createSQLiteThread, createHttpBackend} from './sqlite-wasm-http/index.mjs';

const openDb = async dburl => {
    const httpBackend = createHttpBackend({
        maxPageSize: 4096,
        timeout: 60000,
        cacheSize: 50 * 1024, // 50 MB should cache the whole db
        backendType: 'sync'

    });
    const db = await createSQLiteThread({http: httpBackend});
    await db('open', {filename: 'file:' + encodeURI(dburl),vfs: 'http'});
    return db;
};

export default openDb;
