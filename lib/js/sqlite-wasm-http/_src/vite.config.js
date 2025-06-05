import {defineConfig} from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, 'index.js'),
            formats: ['es'],
        },
        rollupOptions: {
            output: {
                format: 'esm',
            }
        }
    },
    worker: {
        format: 'es'
    },
});
