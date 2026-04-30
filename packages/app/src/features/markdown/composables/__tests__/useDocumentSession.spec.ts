import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, shallowRef } from 'vue'

import type { AppWindow } from '../../../../browser-window'

import { resetBrowserDocumentSessionForTests } from '../useDocumentActions'
import { useDocumentSession } from '../useDocumentSession'

const desktopMock = {
  commands: {
    onAppCommand: vi.fn(() => () => undefined),
  },
  documents: {
    clearLastOpened: vi.fn(async () => undefined),
    clearWorkspaceDraft: vi.fn(async () => undefined),
    open: vi.fn(async () => ({ content: '# Loaded', path: '/tmp/loaded.md' })),
    restoreLastOpened: vi.fn<() => Promise<{ content: string; path: string } | null>>(
      async () => null,
    ),
    restoreWorkspaceDraft: vi.fn(async () => null),
    save: vi.fn(async ({ path }: { path: null | string }) => ({ path: path ?? '/tmp/saved.md' })),
    saveAs: vi.fn(async () => ({ path: '/tmp/saved-as.md' })),
    saveWorkspaceDraft: vi.fn(async () => undefined),
  },
  editing: {
    insertText: vi.fn(async () => undefined),
  },
  exports: {
    exportHtml: vi.fn(async () => ({ path: '/tmp/exported.html' })),
    exportPdf: vi.fn(async () => ({ path: '/tmp/exported.pdf' })),
  },
  isDesktop: true,
  shell: {
    openExternal: vi.fn(async () => undefined),
  },
}

function createSession(initialContent = '# Draft') {
  const content = shallowRef(initialContent)
  const session = useDocumentSession({
    content,
    replaceContent: (value) => {
      content.value = value
    },
  })

  return { content, session }
}

describe('useDocumentSession', () => {
  const appWindow = window as AppWindow
  const originalDesktop = appWindow.desktop
  const originalConfirm = window.confirm
  const originalCreateObjectURL = URL.createObjectURL
  const originalRevokeObjectURL = URL.revokeObjectURL
  const originalShowSaveFilePicker = appWindow.showSaveFilePicker
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    resetBrowserDocumentSessionForTests()
    appWindow.desktop = desktopMock
    window.confirm = vi.fn(() => true)
    vi.clearAllMocks()
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  })

  afterEach(() => {
    resetBrowserDocumentSessionForTests()
    consoleWarnSpy.mockRestore()
    appWindow.desktop = originalDesktop
    window.confirm = originalConfirm
    appWindow.showSaveFilePicker = originalShowSaveFilePicker
    URL.createObjectURL = originalCreateObjectURL
    URL.revokeObjectURL = originalRevokeObjectURL
    vi.restoreAllMocks()
  })

  it('opens and replaces the current document content in desktop mode', async () => {
    const { content, session } = createSession()

    await session.openDocument()
    await nextTick()

    expect(content.value).toBe('# Loaded')
    expect(session.currentPath.value).toBe('/tmp/loaded.md')
    expect(session.isDirty.value).toBe(false)
    expect(session.canOpenDocuments.value).toBe(true)
    expect(session.canSaveDocuments.value).toBe(true)
  })

  it('restores the last opened desktop document as clean saved work', async () => {
    desktopMock.documents.restoreLastOpened.mockResolvedValueOnce({
      content: '# Restored file',
      path: '/tmp/restored.md',
    })
    const { content, session } = createSession()

    await session.restoreLastOpenedDocument()
    await nextTick()

    expect(content.value).toBe('# Restored file')
    expect(session.currentPath.value).toBe('/tmp/restored.md')
    expect(session.displayName.value).toBe('restored.md')
    expect(session.isDirty.value).toBe(false)
    expect(session.statusText.value).toBe('Restored restored.md')
  })

  it('restores a saved web draft as unsaved work', async () => {
    const { content, session } = createSession()

    await session.restoreDraft({
      content: '# Restored draft',
      label: 'notes.md',
    })
    await nextTick()

    expect(content.value).toBe('# Restored draft')
    expect(session.currentPath.value).toBe(null)
    expect(session.displayName.value).toBe('notes.md')
    expect(session.isDirty.value).toBe(true)
    expect(session.statusText.value).toContain('Restored local draft')
  })

  it('restores a desktop workspace draft against its saved baseline', async () => {
    const { content, session } = createSession()

    await session.restoreWorkspaceDraft({
      content: '# Unsaved desktop edit',
      label: 'notes.md',
      path: '/tmp/notes.md',
      savedContent: '# Saved file',
    })
    await nextTick()

    expect(content.value).toBe('# Unsaved desktop edit')
    expect(session.currentPath.value).toBe('/tmp/notes.md')
    expect(session.displayName.value).toBe('notes.md')
    expect(session.isDirty.value).toBe(true)
    expect(session.statusText.value).toContain('Restored unsaved changes')
  })

  it('tracks dirty state and save branching in desktop mode', async () => {
    const { content, session } = createSession()

    content.value = '# Draft updated'
    await nextTick()

    expect(session.isDirty.value).toBe(true)

    await session.saveDocument()

    expect(desktopMock.documents.save).toHaveBeenCalledWith({
      content: '# Draft updated',
      path: null,
    })
    expect(session.currentPath.value).toBe('/tmp/saved.md')
    expect(session.isDirty.value).toBe(false)
  })

  it('clears previous file and edited state when loading an example', async () => {
    const { content, session } = createSession()

    await session.openDocument()
    content.value = '# Edited loaded file'
    await nextTick()

    expect(session.currentPath.value).toBe('/tmp/loaded.md')
    expect(session.isDirty.value).toBe(true)
    expect(session.statusText.value).toContain('Edited')

    await session.loadExampleDocument({
      content: '# Example content',
      title: 'Flowchart diagram',
    })
    await nextTick()

    expect(content.value).toBe('# Example content')
    expect(session.currentPath.value).toBe(null)
    expect(session.displayName.value).toBe('Untitled.md')
    expect(session.isDirty.value).toBe(false)
    expect(session.statusText.value).toBe('Loaded example: Flowchart diagram')
    expect(desktopMock.documents.clearLastOpened).toHaveBeenCalled()
  })

  it('handles app command routing', async () => {
    const { session } = createSession()

    await session.handleAppCommand('document:saveAs')

    expect(desktopMock.documents.saveAs).toHaveBeenCalled()
    expect(session.currentPath.value).toBe('/tmp/saved-as.md')
  })

  it('ignores unrelated app commands without saving', async () => {
    const { session } = createSession()

    await session.handleAppCommand('document:new' as never)

    expect(desktopMock.documents.saveAs).not.toHaveBeenCalled()
    expect(consoleWarnSpy).toHaveBeenCalledWith('Unhandled app command: document:new')
  })

  it('opens a browser document and clears dirty state in web mode', async () => {
    appWindow.desktop = undefined

    const { content, session } = createSession()
    const file = new File(['# Web Loaded'], 'notes.md', { type: 'text/markdown' })
    const clickSpy = vi
      .spyOn(HTMLInputElement.prototype, 'click')
      .mockImplementation(function mockClick(this: HTMLInputElement) {
        Object.defineProperty(this, 'files', {
          configurable: true,
          value: [file],
        })
        this.dispatchEvent(new Event('change'))
      })

    content.value = '# Edited'
    await nextTick()

    await session.openDocument()
    await nextTick()

    expect(clickSpy).toHaveBeenCalled()
    expect(content.value).toBe('# Web Loaded')
    expect(session.currentPath.value).toBe('notes.md')
    expect(session.isDirty.value).toBe(false)
  })

  it('downloads the current content when saving on the web without a persistent handle', async () => {
    appWindow.desktop = undefined
    appWindow.showSaveFilePicker = undefined

    const { session } = createSession('# Download me')
    const anchorClickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined)
    const createObjectUrlSpy = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:markdown-studio')
    const revokeObjectUrlSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)

    vi.useFakeTimers()
    try {
      await session.saveDocument()

      expect(createObjectUrlSpy).toHaveBeenCalled()
      expect(anchorClickSpy).toHaveBeenCalled()
      expect(revokeObjectUrlSpy).not.toHaveBeenCalled()

      await vi.advanceTimersByTimeAsync(1000)

      expect(revokeObjectUrlSpy).toHaveBeenCalledWith('blob:markdown-studio')
      expect(session.currentPath.value).toBe('Untitled.md')
      expect(session.isDirty.value).toBe(false)
    } finally {
      vi.useRealTimers()
    }
  })

  it('writes in place on the web after a persistent file handle is acquired', async () => {
    appWindow.desktop = undefined

    const writes: string[] = []
    const close = vi.fn(async () => undefined)
    const write = vi.fn(async (value: string) => {
      writes.push(value)
    })
    const createWritable = vi.fn(
      async () =>
        ({
          close,
          write,
        }) as unknown as FileSystemWritableFileStream,
    )
    const fileHandle = {
      createWritable,
      kind: 'file',
      name: 'saved-from-web.md',
    } as unknown as FileSystemFileHandle
    const showSaveFilePicker = vi.fn(async () => fileHandle)
    appWindow.showSaveFilePicker = showSaveFilePicker

    const { content, session } = createSession('# First pass')

    await session.saveDocumentAs()

    content.value = '# Second pass'
    await nextTick()

    await session.saveDocument()

    expect(showSaveFilePicker).toHaveBeenCalledTimes(1)
    expect(createWritable).toHaveBeenCalledTimes(2)
    expect(writes).toEqual(['# First pass', '# Second pass'])
    expect(session.currentPath.value).toBe('saved-from-web.md')
    expect(session.isDirty.value).toBe(false)
  })

  it('leaves the session unchanged when browser open or save is canceled', async () => {
    appWindow.desktop = undefined

    const { content, session } = createSession('# Draft')
    const clickSpy = vi
      .spyOn(HTMLInputElement.prototype, 'click')
      .mockImplementation(function mockClick(this: HTMLInputElement) {
        Object.defineProperty(this, 'files', {
          configurable: true,
          value: [],
        })
        this.dispatchEvent(new Event('change'))
      })
    appWindow.showSaveFilePicker = vi.fn(async () => {
      throw new DOMException('Canceled', 'AbortError')
    })

    await session.openDocument()
    await session.saveDocument()

    expect(clickSpy).toHaveBeenCalled()
    expect(content.value).toBe('# Draft')
    expect(session.currentPath.value).toBe(null)
    expect(session.isDirty.value).toBe(false)
  })
})
