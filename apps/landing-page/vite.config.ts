import { defineConfig } from 'vite-plus'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  build: {
    emptyOutDir: true,
    outDir: 'dist',
  },
})
