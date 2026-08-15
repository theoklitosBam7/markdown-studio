import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { configDefaults, defineConfig, lazyPlugins } from 'vite-plus'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig({
  plugins: lazyPlugins(() => [vue(), vueDevTools()]),
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    exclude: [...configDefaults.exclude],
  },
})
