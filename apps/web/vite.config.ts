import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    VitePWA({
      devOptions: {
        enabled: false,
      },
      disable: process.env.VITE_DISABLE_PWA === 'true',
      includeAssets: [
        'apple-touch-icon-180x180.png',
        'favicon.ico',
        'logo.svg',
        'maskable-icon-512x512.png',
        'pwa-64x64.png',
        'pwa-192x192.png',
        'pwa-512x512.png',
      ],
      injectRegister: false,
      manifest: {
        background_color: '#f7f5f0',
        display: 'standalone',
        icons: [
          {
            sizes: '64x64',
            src: 'pwa-64x64.png',
            type: 'image/png',
          },
          {
            sizes: '192x192',
            src: 'pwa-192x192.png',
            type: 'image/png',
          },
          {
            sizes: '512x512',
            src: 'pwa-512x512.png',
            type: 'image/png',
          },
          {
            purpose: 'maskable',
            sizes: '512x512',
            src: 'maskable-icon-512x512.png',
            type: 'image/png',
          },
        ],
        name: 'Markdown Studio',
        scope: '/',
        short_name: 'Markdown Studio',
        start_url: '/',
        theme_color: '#2a5f4f',
      },
      registerType: 'prompt',
      strategies: 'generateSW',
      workbox: {
        globPatterns: ['**/*.{css,html,ico,js,json,png,svg,webmanifest}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('../../packages/app/src', import.meta.url)),
    },
  },
})
