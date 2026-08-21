import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'downloads/*.apkg', 'downloads/*.tsv'],
      manifest: {
        name: 'EPSO AD5 Study Companion',
        short_name: 'AD5 Companion',
        description: 'A source-first, offline-ready study companion for EPSO/AD/427/26.',
        theme_color: '#153f63',
        background_color: '#f5f4ed',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: '/icon-maskable.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' }
        ]
      },
      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,svg,json,apkg,tsv}'],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        cleanupOutdatedCaches: true
      }
    })
  ],
  server: { port: 5173 },
  preview: { port: 4173 }
});
