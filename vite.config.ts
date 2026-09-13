import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  server: { host: '127.0.0.1' },
  build: {
    rollupOptions: {
      input: {
        main: resolve(process.cwd(), 'index.html'),
        gallery: resolve(process.cwd(), 'gallery.html'),
      },
      output: { manualChunks: { three: ['three'] } },
    },
  },
});
