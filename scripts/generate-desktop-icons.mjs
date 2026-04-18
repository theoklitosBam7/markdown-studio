/**
 * Generate desktop app icons from logo.svg.
 *
 * Produces:
 *   apps/desktop/build/icon.ico  – Windows multi-resolution (16, 32, 48, 256)
 *   apps/desktop/build/icon.png  – Linux 1024×1024 (also used by electron-builder to auto-generate .icns for macOS)
 *
 * Usage: pnpm generate-desktop-icons
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import pngToIco from 'png-to-ico'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')

const svgPath = join(rootDir, 'apps/web/public/logo.svg')
const outDir = join(rootDir, 'apps/desktop/build')

try {
  mkdirSync(outDir, { recursive: true })

  const svgBuffer = readFileSync(svgPath)

  // ── PNG (Linux + macOS fallback) ─────────────────────────────
  console.log('Generating icon.png (1024×1024)…')
  const pngBuffer = await sharp(svgBuffer).resize(1024, 1024).png().toBuffer()
  writeFileSync(join(outDir, 'icon.png'), pngBuffer)

  // ── ICO (Windows, multi-resolution) ─────────────────────────
  const icoSizes = [16, 32, 48, 256]
  console.log(`Generating icon.ico (${icoSizes.join(', ')})…`)
  const pngs = await Promise.all(
    icoSizes.map((s) => sharp(svgBuffer).resize(s, s).png().toBuffer()),
  )

  const icoBuffer = await pngToIco(pngs)
  writeFileSync(join(outDir, 'icon.ico'), icoBuffer)

  console.log(`\nIcons written to ${outDir}/`)
  console.log('  icon.ico – Windows multi-resolution (16, 32, 48, 256)')
  console.log('  icon.png – Linux 1024×1024 (electron-builder auto-generates .icns for macOS)')
} catch (err) {
  console.error('Failed to generate desktop icons:', err.message)
  process.exit(1)
}
