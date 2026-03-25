import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/markdown-studio/',
  build: {
    emptyOutDir: true,
    outDir: 'dist',
  },
})
