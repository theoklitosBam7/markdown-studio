import vue from '@vitejs/plugin-vue'
import { builtinModules, createRequire } from 'node:module'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite-plus'
import vueDevTools from 'vite-plugin-vue-devtools'

const desktopPackage = createRequire(import.meta.url)('./package.json')
const desktopRoot = fileURLToPath(new URL('.', import.meta.url))
const appSource = fileURLToPath(new URL('../../packages/app/src', import.meta.url))

const electronRuntimeExternals = [
  'electron',
  /^electron\/.+/,
  ...builtinModules.flatMap((module) => [module, `node:${module}`]),
]

const electronCommon = {
  define: {
    'process.env': 'process.env',
  },
  resolve: {
    alias: {
      '@': appSource,
    },
    browserField: false,
    conditions: ['node'],
    mainFields: ['module', 'jsnext:main', 'jsnext'],
  },
  root: desktopRoot,
  ssr: {
    noExternal: true as const,
  },
}

const electronBuildCommon = {
  assetsDir: 'chunks',
  copyPublicDir: false,
  emptyOutDir: true,
  minify: false,
  modulePreload: false,
  reportCompressedSize: false,
  ssr: true,
  target: 'node24' as const,
}

interface ElectronConfigOptions {
  chunkFileNames: string
  entry: string
  entryFileName: string
  format: 'cjs' | 'es'
  outDir: string
}

function createElectronConfig(options: ElectronConfigOptions) {
  return defineConfig({
    ...electronCommon,
    build: {
      ...electronBuildCommon,
      outDir: options.outDir,
      rollupOptions: {
        external: electronRuntimeExternals,
        input: options.entry,
        output: {
          chunkFileNames: options.chunkFileNames,
          entryFileNames: options.entryFileName,
          format: options.format,
        },
      },
    },
  })
}

export const mainConfig = createElectronConfig({
  chunkFileNames: 'chunks/[name]-[hash].js',
  entry: fileURLToPath(new URL('./electron/main.ts', import.meta.url)),
  entryFileName: 'main.js',
  format: 'es',
  outDir: fileURLToPath(new URL('./out/main', import.meta.url)),
})

export const preloadConfig = createElectronConfig({
  chunkFileNames: 'chunks/[name]-[hash].cjs',
  entry: fileURLToPath(new URL('./electron/preload.ts', import.meta.url)),
  entryFileName: 'preload.cjs',
  format: 'cjs',
  outDir: fileURLToPath(new URL('./out/preload', import.meta.url)),
})

export const rendererConfig = defineConfig({
  base: './',
  build: {
    emptyOutDir: true,
    outDir: fileURLToPath(new URL('./out/renderer', import.meta.url)),
    reportCompressedSize: false,
    rollupOptions: {
      input: fileURLToPath(new URL('./index.html', import.meta.url)),
    },
    target: 'chrome108',
  },
  define: {
    __APP_VERSION__: JSON.stringify(desktopPackage.version),
  },
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      '@': appSource,
    },
  },
  root: desktopRoot,
})

export default rendererConfig
