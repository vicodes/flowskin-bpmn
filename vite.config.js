import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'demo',
   base: '/flowskin-bpmn/',                                                                  
  build: {                                                                                  
    outDir: resolve(__dirname, 'dist'),                                                     
    emptyOutDir: true,                                                                      
  },  
  server: {
    port: 3000,
    open: true,
    fs: { allow: [resolve(__dirname)] },
  },
  resolve: {
    alias: {
      'flowskin-bpmn': resolve(__dirname, 'lib/index.js'),
    },
  },
});
