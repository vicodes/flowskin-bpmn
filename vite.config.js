import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'demo',
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
