import { readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vite-plus/test'

const source = readFileSync(
  path.resolve(process.cwd(), 'packages/app/src/styles/global.css'),
  'utf8',
)

function contrastRatio(foreground: string, background: string): number {
  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background))
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background))
  return (lighter + 0.05) / (darker + 0.05)
}

function readThemeBlock(selector: string): string {
  const start = source.indexOf(selector)
  if (start === -1) throw new Error(`Missing theme block ${selector}`)

  const open = source.indexOf('{', start)
  const close = source.indexOf('}', open)
  return source.slice(open + 1, close)
}

function relativeLuminance(hex: string): number {
  const channels = [1, 3, 5].map((index) => Number.parseInt(hex.slice(index, index + 2), 16) / 255)
  const [red, green, blue] = channels.map((channel) =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  )

  return 0.2126 * red! + 0.7152 * green! + 0.0722 * blue!
}

function token(block: string, name: string): string {
  const match = new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`).exec(block)
  if (!match?.[1]) throw new Error(`Missing token --${name}`)
  return match[1]
}

describe('design tokens', () => {
  it.each([
    ['light', ':root'],
    ['dark', "[data-theme='dark']"],
  ])('%s text tokens meet AA contrast on the surface', (_name, selector) => {
    const theme = readThemeBlock(selector)
    const surface = token(theme, 'surface')

    for (const name of ['text', 'text-muted', 'text-faint']) {
      expect(contrastRatio(token(theme, name), surface)).toBeGreaterThanOrEqual(4.5)
    }
  })
})
