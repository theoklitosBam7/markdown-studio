import { describe, expect, it } from 'vitest'

import { parseReleaseLine, validateChangesetSource } from './validate-changeset-scopes.mjs'

describe('parseReleaseLine', () => {
  it('accepts single-quoted package names', () => {
    expect(parseReleaseLine("'@markdown-studio/desktop': patch")).toEqual({
      packageName: '@markdown-studio/desktop',
      releaseType: 'patch',
    })
  })

  it('accepts double-quoted package names', () => {
    expect(parseReleaseLine('"markdown-studio": minor')).toEqual({
      packageName: 'markdown-studio',
      releaseType: 'minor',
    })
  })
})

describe('validateChangesetSource', () => {
  it('allows single-quoted package keys in changeset frontmatter', () => {
    expect(() =>
      validateChangesetSource(
        `---
'@markdown-studio/desktop': patch
---

Fix desktop packaging.
`,
        '.changeset/example.md',
      ),
    ).not.toThrow()
  })

  it('still rejects packages outside the allowed release scope', () => {
    expect(() =>
      validateChangesetSource(
        `---
'@markdown-studio/app': patch
---

Internal package change.
`,
        '.changeset/example.md',
      ),
    ).toThrow('Disallowed package "@markdown-studio/app"')
  })
})
