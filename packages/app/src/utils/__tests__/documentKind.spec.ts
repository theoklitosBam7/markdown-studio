import { describe, expect, it } from 'vite-plus/test'

import { resolveDocumentKind } from '../documentKind'

describe('resolveDocumentKind', () => {
  it.each(['index.html', 'PAGE.HTM', '/docs/site/index.html'])(
    'recognizes %s as HTML',
    (nameOrPath: string) => {
      expect(resolveDocumentKind(nameOrPath)).toBe('html')
    },
  )

  it.each(['notes.md', 'notes.txt', '', 'README', 'archive.html.txt'])(
    'treats %s as Markdown',
    (nameOrPath: string) => {
      expect(resolveDocumentKind(nameOrPath)).toBe('markdown')
    },
  )
})
