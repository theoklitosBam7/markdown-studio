import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'electron-vite'
import { builtinModules } from 'node:module'
import { fileURLToPath, URL } from 'node:url'
import vueDevTools from 'vite-plugin-vue-devtools'

const electronRuntimeExternals = [
  'electron',
  /^electron\/.+/,
  ...builtinModules.flatMap((module) => [module, `node:${module}`]),
]

export default defineConfig({
  main: {
    build: {
      externalizeDeps: {
        include: ['electron'],
      },
      lib: {
        entry: 'electron/main.ts',
        fileName: () => 'index.js',
        formats: ['es'],
      },
      rollupOptions: {
        external: electronRuntimeExternals,
      },
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('../../packages/app/src', import.meta.url)),
      },
    },
  },
  preload: {
    build: {
      externalizeDeps: {
        include: ['electron'],
      },
      lib: {
        entry: 'electron/preload.ts',
        formats: ['cjs'],
      },
      rollupOptions: {
        external: electronRuntimeExternals,
        output: {
          chunkFileNames: 'chunks/[name]-[hash].cjs',
          entryFileNames: 'preload.cjs',
          format: 'cjs',
        },
      },
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('../../packages/app/src', import.meta.url)),
      },
    },
  },
  renderer: {
    build: {
      rollupOptions: {
        input: 'index.html',
      },
    },
    plugins: [vue(), vueDevTools()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('../../packages/app/src', import.meta.url)),
      },
    },
    root: '.',
  },
})
