import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  define: {
    // Stamp every build with a unique version so the app can detect new deployments
    '__BUILD_VERSION__': JSON.stringify(new Date().toISOString()),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'lucky.jpg', 'robots.txt'],
      strategies: 'generateSW',

      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,jpg,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        navigationPreload: false,

        runtimeCaching: [
          {
            urlPattern: /\/api\/(menu|add-ons|discounts|bundles)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'lucky-boba-menu-cache',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\/api\/(categories|sub-categories|cups)/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'lucky-boba-category-cache',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\/api\/(sales|cash-transactions|cash-counts|receipts|void)/,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /\/api\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'lucky-boba-api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 2 },
              networkTimeoutSeconds: 10,
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],

        skipWaiting: true,
        clientsClaim: true,
      },

      manifest: {
        name: 'Lucky Boba POS',
        short_name: 'Lucky Boba',
        description: 'Lucky Boba Point of Sale System',
        theme_color: '#3b2063',
        background_color: '#f4f2fb',
        display: 'standalone',
        orientation: 'landscape',
        start_url: '/cashier',
        scope: '/',
        icons: [
          { src: '/lucky.jpg', sizes: '192x192', type: 'image/jpeg' },
          { src: '/lucky.jpg', sizes: '512x512', type: 'image/jpeg' },
        ],
      },

      devOptions: { enabled: false },
    }),
  ],

  build: {
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor':    ['lucide-react'],
          'chart-vendor': ['recharts'],
        },
      },
    },
  },

  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  },
});