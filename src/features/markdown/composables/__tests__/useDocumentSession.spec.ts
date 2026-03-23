import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, shallowRef } from 'vue'

import { resetBrowserDocumentSessionForTests } from '../useDocumentActions'
import { useDocumentSession } from '../useDocumentSession'

const desktopMock = {
  commands: {
    onAppCommand: vi.fn(() => () => undefined),
  },
  documents: {
    open: vi.fn(async () => ({ content: '# Loaded', path: '/tmp/loaded.md' })),
    save: vi.fn(async ({ path }: { path: null | string }) => ({ path: path ?? '/tmp/saved.md' })),
    saveAs: vi.fn(async () => ({ path: '/tmp/saved-as.md' })),
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
  const originalDesktop = window.desktop
  const originalConfirm = window.confirm
  const originalCreateObjectURL = URL.createObjectURL
  const originalRevokeObjectURL = URL.revokeObjectURL
  const originalShowSaveFilePicker = window.showSaveFilePicker
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    resetBrowserDocumentSessionForTests()
    window.desktop = desktopMock
    window.confirm = vi.fn(() => true)
    vi.clearAllMocks()
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  })

  afterEach(() => {
    resetBrowserDocumentSessionForTests()
    consoleWarnSpy.mockRestore()
    window.desktop = originalDesktop
    window.confirm = originalConfirm
    window.showSaveFilePicker = originalShowSaveFilePicker
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
    window.desktop = undefined

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
    window.desktop = undefined
    window.showSaveFilePicker = undefined

    const { session } = createSession('# Download me')
    const anchorClickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined)
    const createObjectUrlSpy = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:markdown-studio')
    const revokeObjectUrlSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)

    await session.saveDocument()

    expect(createObjectUrlSpy).toHaveBeenCalled()
    expect(anchorClickSpy).toHaveBeenCalled()
    expect(revokeObjectUrlSpy).toHaveBeenCalledWith('blob:markdown-studio')
    expect(session.currentPath.value).toBe('Untitled.md')
    expect(session.isDirty.value).toBe(false)
  })

  it('writes in place on the web after a persistent file handle is acquired', async () => {
    window.desktop = undefined

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
    window.showSaveFilePicker = showSaveFilePicker

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
    window.desktop = undefined

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
    window.showSaveFilePicker = vi.fn(async () => {
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
