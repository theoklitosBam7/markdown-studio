// @vitest-environment node

import { describe, expect, it } from 'vite-plus/test'

import {
  assertDocumentFolderPaths,
  assertExportInput,
  assertExternalUrl,
  assertFolderListInput,
  assertSaveAsInput,
  assertSaveImageInput,
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

  it('accepts supported image payloads and rejects non-image filenames', () => {
    const data = new Uint8Array([1, 2, 3])

    expect(
      assertSaveImageInput({ data, documentPath: '/tmp/notes.md', filename: 'Diagram.WEBP' }),
    ).toEqual({ data, documentPath: '/tmp/notes.md', filename: 'Diagram.WEBP' })
    expect(() =>
      assertSaveImageInput({ data, documentPath: '/tmp/notes.md', filename: 'notes.txt' }),
    ).toThrow('Unsupported image format')
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

  it('accepts a folder list payload with an id and a relative path', () => {
    expect(assertFolderListInput({ folderId: 'folder-1', relativePath: 'notes' })).toEqual({
      folderId: 'folder-1',
      relativePath: 'notes',
    })
  })

  it('rejects a folder list payload with an empty id', () => {
    expect(() => assertFolderListInput({ folderId: '  ', relativePath: 'notes' })).toThrow(
      'A non-empty file path is required',
    )
  })

  it('rejects an absolute folder list path', () => {
    expect(() => assertFolderListInput({ folderId: 'folder-1', relativePath: '/etc' })).toThrow(
      'A relative path is required',
    )
    expect(() =>
      assertFolderListInput({ folderId: 'folder-1', relativePath: 'C:\\notes' }),
    ).toThrow('A relative path is required')
  })

  it('rejects a folder list path that climbs with parent segments', () => {
    expect(() =>
      assertFolderListInput({ folderId: 'folder-1', relativePath: '../outside' }),
    ).toThrow('A relative path is required')
  })

  it('accepts a persisted Document Folder path list', () => {
    expect(assertDocumentFolderPaths(['/tmp/notes', '/tmp/daily'])).toEqual([
      '/tmp/notes',
      '/tmp/daily',
    ])
    expect(assertDocumentFolderPaths([])).toEqual([])
  })

  it('rejects a persisted Document Folder list that is not an array', () => {
    expect(() => assertDocumentFolderPaths('/tmp/notes')).toThrow(
      'Document Folder list must be an array',
    )
  })

  it('rejects a persisted Document Folder entry that is empty', () => {
    expect(() => assertDocumentFolderPaths(['/tmp/notes', '  '])).toThrow(
      'A non-empty file path is required',
    )
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
