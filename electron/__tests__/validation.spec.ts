// @vitest-environment node

import { describe, expect, it } from 'vitest'

import {
  assertExternalUrl,
  assertSaveAsInput,
  assertSaveInput,
  getDefaultMarkdownPath,
} from '../shared/validation'

describe('desktop validation', () => {
  it('normalizes valid save input', () => {
    expect(assertSaveInput({ content: '# Hello', path: '/tmp/demo.md' })).toEqual({
      content: '# Hello',
      path: '/tmp/demo.md',
    })
  })

  it('rejects unsupported external protocols', () => {
    expect(() => assertExternalUrl('file:///tmp/test.md')).toThrow('Unsupported external URL')
  })

  it('ensures save-as paths default to markdown filenames', () => {
    expect(assertSaveAsInput({ content: 'body', suggestedPath: 'notes' })).toEqual({
      content: 'body',
      suggestedPath: 'notes',
    })
    expect(getDefaultMarkdownPath('notes')).toBe('notes.md')
    expect(getDefaultMarkdownPath()).toBe('Untitled.md')
  })
})
