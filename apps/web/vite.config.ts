import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import fs from 'fs';

const pkg = JSON.parse(fs.readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));

export default defineConfig({
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: 'auto',
      includeAssets: [
        'favicon.png',
        'og-image.png',
        'robots.txt',
        'sitemap.xml',
        'icons/apple-touch-icon.png',
        'icons/*.png',
      ],
      manifest: {
        name: 'Pixture - Precision Photo Printing & Grid Layout Studio',
        short_name: 'Pixture',
        description:
          'Precision photo printing, auto-fit grid layouts, cropping, and cut markings with Google-inspired design.',
        theme_color: '#1a73e8',
        background_color: '#f8f9fa',
        display: 'standalone',
        orientation: 'any',
        scope: './',
        start_url: './',
        categories: ['photography', 'utilities', 'productivity'],
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: false,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
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
