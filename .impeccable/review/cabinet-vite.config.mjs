import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite-plus';

export default defineConfig({
    root: resolve('.impeccable/review'),
    publicDir: false,
    cacheDir: resolve('node_modules/.vite-cabinet-review'),
    plugins: [react(), tailwindcss()],
    resolve: { alias: { '@': resolve('resources/js'), '/resources': resolve('resources'), '/public': resolve('public') } },
    optimizeDeps: {entries: ['procedural-cabinet.html', 'procedural-archive.html']},
    server: { host: '127.0.0.1', port: 5174, strictPort: true,
        fs: {allow: [resolve('.')]},
        watch: {ignored: ['**/.impeccable/review/chrome-*/**', '**/graphify-out/**', '**/vendor/**']},
    },
});
