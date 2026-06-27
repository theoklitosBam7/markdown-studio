import { describe, expect, it } from 'vitest'

import { generateTableTemplate } from '../tableTemplate'

describe('generateTableTemplate', () => {
  it('creates a default 3x3 GFM table', () => {
    expect(generateTableTemplate()).toBe(
      [
        '| Header 1 | Header 2 | Header 3 |',
        '| --- | --- | --- |',
        '|  |  |  |',
        '|  |  |  |',
      ].join('\n'),
    )
  })

  it('supports configurable dimensions', () => {
    expect(generateTableTemplate({ columns: 2, rows: 2 })).toBe(
      ['| Header 1 | Header 2 |', '| --- | --- |', '|  |  |'].join('\n'),
    )
  })

  it('clamps invalid dimensions to at least one row and column', () => {
    expect(generateTableTemplate({ columns: 0, rows: 0 })).toBe('| Header 1 |\n| --- |')
  })

  it('renders as a valid markdown table', async () => {
    const { renderMarkdownDocument } = await import('../renderMarkdownDocument')
    const rendered = await renderMarkdownDocument({
      content: generateTableTemplate(),
      title: 'Table',
    })

    expect(rendered.bodyHtml).toContain('<table>')
    expect(rendered.bodyHtml).toContain('<th>Header 1</th>')
    expect(rendered.bodyHtml).toContain('<td></td>')
  })
})
