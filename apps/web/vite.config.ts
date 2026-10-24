import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@pixture/design-tokens': path.resolve(__dirname, '../../packages/design-tokens/src'),
      '@pixture/layout-engine': path.resolve(__dirname, '../../packages/layout-engine/src'),
      '@pixture/print-core': path.resolve(__dirname, '../../packages/print-core/src'),
      '@pixture/i18n': path.resolve(__dirname, '../../packages/i18n/src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
