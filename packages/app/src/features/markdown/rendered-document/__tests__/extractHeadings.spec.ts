import { describe, expect, it } from 'vitest'

import { extractHeadings } from '../extractHeadings'

describe('extractHeadings', () => {
  it('returns ordered outline headings from Source Navigation entries', () => {
    const headings = extractHeadings([
      { depth: 1, end: 8, id: 'block-0', start: 0, text: 'Title', type: 'heading' },
      { end: 20, id: 'block-1', start: 9, type: 'paragraph' },
      { depth: 3, end: 34, id: 'block-2', start: 21, text: 'Details', type: 'heading' },
    ])

    expect(headings).toEqual([
      { depth: 1, id: 'block-0', start: 0, text: 'Title' },
      { depth: 3, id: 'block-2', start: 21, text: 'Details' },
    ])
  })
})
