// @vitest-environment node

import { describe, expect, it } from 'vitest'

import {
  assertExportInput,
  assertExternalUrl,
  assertSaveAsInput,
  assertSaveInput,
  assertWorkspaceDraft,
  assertWorkspaceDraftInput,
  getDefaultExportPath,
  getDefaultMarkdownPath,
} from '../src/validation'

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

  it('normalizes export payloads and paths', () => {
    expect(
      assertExportInput({
        documentHtml: '<html></html>',
        documentTitle: ' Demo ',
        suggestedPath: 'notes.md',
      }),
    ).toEqual({
      documentHtml: '<html></html>',
      documentTitle: 'Demo',
      suggestedPath: 'notes.md',
    })
    expect(getDefaultExportPath('html', 'notes.md')).toBe('notes.html')
    expect(getDefaultExportPath('pdf')).toBe('Untitled.pdf')
  })

  it('normalizes workspace draft payloads', () => {
    expect(
      assertWorkspaceDraftInput({
        activeDocument: {
          content: '# Edited',
          label: ' notes.md ',
          path: '/tmp/notes.md',
          savedContent: '# Saved',
        },
      }),
    ).toEqual({
      activeDocument: {
        content: '# Edited',
        label: 'notes.md',
        path: '/tmp/notes.md',
        savedContent: '# Saved',
      },
    })

    expect(
      assertWorkspaceDraft({
        activeDocument: {
          content: '# Edited',
          label: '',
          path: null,
          savedContent: '',
        },
        updatedAt: '2026-04-30T00:00:00.000Z',
        version: 1,
      }),
    ).toEqual({
      activeDocument: {
        content: '# Edited',
        label: 'Untitled.md',
        path: null,
        savedContent: '',
      },
      updatedAt: '2026-04-30T00:00:00.000Z',
      version: 1,
    })
  })
})
