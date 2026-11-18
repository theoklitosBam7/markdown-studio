import { readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vite-plus/test'

const source = readFileSync(
  path.resolve(process.cwd(), 'packages/app/src/features/markdown/components/PreviewPane.vue'),
  'utf8',
)

describe('Preview padding', () => {
  it('sizes the preview gutter from the pane width', () => {
    expect(source).toMatch(/\.preview-pane\s*\{[^}]*container-type:\s*inline-size/s)
    expect(source).toMatch(/\.preview-scroll\s*\{[^}]*padding:[^;]*cqi/s)
    expect(source).not.toContain('padding: 36px 48px')
  })
})
