import mermaid from 'mermaid'
import { describe, expect, it, vi } from 'vitest'

import { buildExportHtml, renderExport, renderPreview } from '..'

describe('Rendered Markdown Document', () => {
  it('renders raw live preview html with source map anchors', () => {
    const rendered = renderPreview({
      content: '# Title\n\n<iframe src="https://example.com"></iframe>',
    })

    expect(rendered.bodyHtml).toContain('data-source-start="0"')
    expect(rendered.bodyHtml).toContain('<h1')
    expect(rendered.sourceMap.map((entry) => entry.type)).toContain('heading')
  })

  it('renders export html without editor source markers', async () => {
    const rendered = await renderExport({
      content: '# Export\n\nBody copy',
      title: 'Export',
    })

    expect(rendered.title).toBe('Export')
    expect(rendered.bodyHtml).toContain('<h1>Export</h1>')
    expect(rendered.bodyHtml).not.toContain('data-source-start')
    expect(rendered.bodyHtml).not.toContain('markdown-source-')
  })

  it('keeps mermaid failures local to the rendered document', async () => {
    const renderSpy = vi.spyOn(mermaid, 'render').mockRejectedValue(new Error('Broken diagram'))

    try {
      const rendered = await renderExport({
        content: '```mermaid\ngraph TD; A-->B;\n```',
        title: 'Diagram',
      })

      expect(rendered.bodyHtml).toContain('Mermaid error: Broken diagram')
      expect(rendered.diagnostics).toEqual([
        expect.objectContaining({
          code: 'mermaid-render-failed',
          message: 'Broken diagram',
          severity: 'warning',
        }),
      ])
    } finally {
      renderSpy.mockRestore()
    }
  })

  it('builds standalone html around a rendered markdown body', () => {
    const html = buildExportHtml({
      bodyHtml: '<h1>Export</h1>',
      title: 'Export',
    })

    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('<title>Export</title>')
    expect(html).toContain('markdown-export-frame')
  })
})
