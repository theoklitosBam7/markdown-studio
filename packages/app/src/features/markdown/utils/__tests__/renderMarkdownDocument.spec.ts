import mermaid from 'mermaid'
import { describe, expect, it, vi } from 'vitest'

import {
  buildMarkdownDocumentHtml,
  getSuggestedExportFileName,
  renderMarkdownDocument,
} from '../renderMarkdownDocument'

describe('renderMarkdownDocument', () => {
  it('renders a standalone markdown body without editor source markers', async () => {
    const rendered = await renderMarkdownDocument({
      content: '# Title\n\nParagraph with **bold** text.',
      title: 'Demo',
    })

    expect(rendered.title).toBe('Demo')
    expect(rendered.bodyHtml).toContain('<h1>Title</h1>')
    expect(rendered.bodyHtml).toContain('<strong>bold</strong>')
    expect(rendered.bodyHtml).not.toContain('data-source-start')
    expect(rendered.bodyHtml).not.toContain('markdown-source-')
  })

  it('renders mermaid blocks into svg output', async () => {
    const renderSpy = vi.spyOn(mermaid, 'render').mockResolvedValue({
      bindFunctions: undefined,
      diagramType: 'flowchart-v2' as never,
      svg: '<svg><text>diagram</text></svg>',
    })

    try {
      const rendered = await renderMarkdownDocument({
        content: '```mermaid\ngraph TD; A-->B;\n```',
        title: 'Diagram',
      })

      expect(renderSpy).toHaveBeenCalled()
      expect(rendered.bodyHtml).toContain('<svg')
      expect(rendered.bodyHtml).not.toContain('class="mermaid"')
    } finally {
      renderSpy.mockRestore()
    }
  })

  it('builds a complete html document and export filenames', () => {
    const documentHtml = buildMarkdownDocumentHtml({
      bodyHtml: '<h1>Export</h1>',
      title: 'Export',
    })

    expect(documentHtml).toContain('<!DOCTYPE html>')
    expect(documentHtml).toContain('<title>Export</title>')
    expect(documentHtml).toContain('markdown-export-frame')
    expect(getSuggestedExportFileName('/tmp/notes.md', 'html')).toBe('notes.html')
    expect(getSuggestedExportFileName(null, 'pdf')).toBe('Untitled.pdf')
  })
})
