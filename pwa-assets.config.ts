import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  images: ['apps/web/public/logo.svg'],
  preset: minimal2023Preset,
})
