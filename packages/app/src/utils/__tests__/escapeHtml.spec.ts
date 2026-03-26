import { describe, expect, it } from 'vitest'

import { escapeHtml } from '../escapeHtml'

describe('escapeHtml', () => {
  it('escapes text and attribute special characters', () => {
    expect(escapeHtml(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&#39;')
  })
})
