import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  worker:{
    format: "es"
  },
  build: {
    target: "ES2022",
  },
  plugins: [react(), VitePWA({
    registerType: 'prompt',
    injectRegister: "script",

    pwaAssets: {
      disabled: false,
      config: true,
    },

    manifest: {
      name: 'micro-tracker',
      short_name: 'micro',
      description: 'Store and process microscopy images',
      theme_color: '#ffffff',
    },

    workbox: {
      globPatterns: ['**/*'],
      cleanupOutdatedCaches: true,
      clientsClaim: true,
      maximumFileSizeToCacheInBytes: 164_000_000,
    },

    includeAssets: [
      "**/*",
    ],

    devOptions: {
      enabled: false,
      navigateFallback: 'index.html',
      suppressWarnings: true,
      type: 'module',
    },
  })],
})