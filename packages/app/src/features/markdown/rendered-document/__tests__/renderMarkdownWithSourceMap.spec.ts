import { describe, expect, it } from 'vitest'

import { renderMarkdownWithSourceMap } from '../renderMarkdownWithSourceMap'

describe('renderMarkdownWithSourceMap', () => {
  it('tracks source offsets for common markdown blocks', () => {
    const content = [
      '# Heading',
      '',
      'Paragraph text',
      '',
      '> Quote',
      '',
      '- First',
      '- Second',
      '',
      '| A | B |',
      '| - | - |',
      '| 1 | 2 |',
      '',
      '```js',
      'console.log(1)',
      '```',
      '',
      '---',
    ].join('\n')

    const { html, sourceMap } = renderMarkdownWithSourceMap(content)

    expect(sourceMap.map((entry) => entry.type)).toEqual([
      'heading',
      'paragraph',
      'blockquote',
      'list_item',
      'list_item',
      'table',
      'code',
      'hr',
    ])
    expect(sourceMap[0]).toMatchObject({ start: 0, type: 'heading' })
    expect(sourceMap[1]?.start).toBe(content.indexOf('Paragraph text'))
    expect(sourceMap[3]?.start).toBe(content.indexOf('- First'))
    expect(sourceMap[4]?.start).toBe(content.indexOf('- Second'))
    expect(sourceMap[6]?.start).toBe(content.indexOf('```js'))
    expect(html).toContain('data-source-start="0"')
    expect(html).toContain('<li id="markdown-source-block-3" data-source-id=')
    expect(html).toContain('<table id="markdown-source-block-5" data-source-id=')
  })

  it('tracks task list checkbox source offsets', () => {
    const content = '- [ ] First task\n- [x] Second task'

    const { html, sourceMap } = renderMarkdownWithSourceMap(content)

    expect(sourceMap).toEqual([
      expect.objectContaining({ checkboxEnd: 5, checkboxStart: 2, type: 'list_item' }),
      expect.objectContaining({ checkboxEnd: 22, checkboxStart: 19, type: 'list_item' }),
    ])
    expect(html).toContain('data-checkbox-start="2" data-checkbox-end="5"')
    expect(html).toContain('data-checkbox-start="19" data-checkbox-end="22"')
  })

  it('keeps repeated blocks distinct by offset', () => {
    const content = ['Repeat me', '', 'Repeat me'].join('\n')

    const { sourceMap } = renderMarkdownWithSourceMap(content)

    expect(sourceMap).toHaveLength(2)
    expect(sourceMap[0]?.start).toBe(0)
    expect(sourceMap[1]?.start).toBe('Repeat me\n\n'.length)
    expect(sourceMap[0]?.id).not.toBe(sourceMap[1]?.id)
  })
})
