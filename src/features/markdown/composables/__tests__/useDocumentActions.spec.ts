import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { resetBrowserDocumentSessionForTests, useDocumentActions } from '../useDocumentActions'

const desktopMock = {
  commands: {
    onAppCommand: vi.fn(() => () => undefined),
  },
  documents: {
    open: vi.fn(async () => ({ content: '# Loaded', path: '/tmp/loaded.md' })),
    save: vi.fn(async () => ({ path: '/tmp/saved.md' })),
    saveAs: vi.fn(async () => ({ path: '/tmp/saved-as.md' })),
  },
  isDesktop: true,
  shell: {
    openExternal: vi.fn(async () => undefined),
  },
}

describe('useDocumentActions', () => {
  const originalDesktop = window.desktop
  const originalShowOpenFilePicker = window.showOpenFilePicker
  const originalCreateObjectURL = URL.createObjectURL
  const originalRevokeObjectURL = URL.revokeObjectURL
  const originalShowSaveFilePicker = window.showSaveFilePicker

  beforeEach(() => {
    resetBrowserDocumentSessionForTests()
    window.desktop = undefined
    restoreOpenFilePicker()
    restoreSaveFilePicker()
    vi.clearAllMocks()
  })

  afterEach(() => {
    resetBrowserDocumentSessionForTests()
    window.desktop = originalDesktop
    restoreOpenFilePicker()
    restoreSaveFilePicker()
    URL.createObjectURL = originalCreateObjectURL
    URL.revokeObjectURL = originalRevokeObjectURL
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  function restoreOpenFilePicker(): void {
    const descriptor = {
      configurable: true,
      value: originalShowOpenFilePicker,
      writable: true,
    }
    Object.defineProperty(window, 'showOpenFilePicker', descriptor)
    Object.defineProperty(globalThis, 'showOpenFilePicker', descriptor)
  }

  function restoreSaveFilePicker(): void {
    const descriptor = {
      configurable: true,
      value: originalShowSaveFilePicker,
      writable: true,
    }
    Object.defineProperty(window, 'showSaveFilePicker', descriptor)
    Object.defineProperty(globalThis, 'showSaveFilePicker', descriptor)
  }

  it('reports document actions as available in the browser without the desktop bridge', () => {
    const actions = useDocumentActions()

    expect(actions.isDesktop.value).toBe(false)
    expect(actions.canOpenDocuments.value).toBe(true)
    expect(actions.canSaveDocuments.value).toBe(true)
  })

  it('delegates to the desktop bridge when available', async () => {
    window.desktop = desktopMock

    const actions = useDocumentActions()

    await actions.open()
    await actions.save({ content: '# Draft', path: null })
    await actions.saveAs({ content: '# Draft', suggestedPath: 'draft.md' })

    expect(actions.isDesktop.value).toBe(true)
    expect(desktopMock.documents.open).toHaveBeenCalled()
    expect(desktopMock.documents.save).toHaveBeenCalledWith({ content: '# Draft', path: null })
    expect(desktopMock.documents.saveAs).toHaveBeenCalledWith({
      content: '# Draft',
      suggestedPath: 'draft.md',
    })
  })

  it('falls back to download when the browser save picker is unavailable', async () => {
    window.showSaveFilePicker = undefined

    const actions = useDocumentActions()
    const anchorClickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined)
    const createObjectUrlSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:actions')
    const revokeObjectUrlSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)

    const saved = await actions.saveAs({ content: '# Saved', suggestedPath: 'browser-note' })

    expect(saved).toEqual({ path: 'browser-note.md' })
    expect(createObjectUrlSpy).toHaveBeenCalled()
    expect(anchorClickSpy).toHaveBeenCalled()
    expect(revokeObjectUrlSpy).toHaveBeenCalledWith('blob:actions')
  })

  it('returns null when the browser save picker is canceled', async () => {
    window.showSaveFilePicker = vi.fn(async () => {
      throw new DOMException('Canceled', 'AbortError')
    })

    const actions = useDocumentActions()
    const anchorClickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined)

    const saved = await actions.saveAs({ content: '# Saved', suggestedPath: 'browser-note.md' })

    expect(saved).toBe(null)
    expect(anchorClickSpy).not.toHaveBeenCalled()
  })

  it('returns null when the browser open picker is canceled', async () => {
    window.showOpenFilePicker = vi.fn(async () => {
      throw new DOMException('Canceled', 'AbortError')
    })

    const actions = useDocumentActions()

    await expect(actions.open()).resolves.toBe(null)
  })

  it('waits for a delayed file input change event after the window regains focus', async () => {
    window.showOpenFilePicker = undefined

    const actions = useDocumentActions()
    vi.useFakeTimers()

    const selectedFile = new File(['# Loaded from fallback'], 'fallback.md', {
      type: 'text/markdown',
    })
    const clickSpy = vi
      .spyOn(HTMLInputElement.prototype, 'click')
      .mockImplementation(function mockClick(this: HTMLInputElement) {
        window.dispatchEvent(new Event('blur'))
        window.dispatchEvent(new Event('focus'))

        window.setTimeout(() => {
          Object.defineProperty(this, 'files', {
            configurable: true,
            value: [selectedFile],
          })

          this.dispatchEvent(new Event('change'))
        }, 50)
      })

    const openPromise = actions.open()
    await vi.runAllTimersAsync()

    await expect(openPromise).resolves.toEqual({
      content: '# Loaded from fallback',
      path: 'fallback.md',
    })
    expect(clickSpy).toHaveBeenCalled()
  })

  it('falls back to the file input when the browser open picker fails', async () => {
    const pickerError = new DOMException('Denied', 'SecurityError')
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const selectedFile = new File(['# Fallback file'], 'fallback-from-picker.md', {
      type: 'text/markdown',
    })

    window.showOpenFilePicker = vi.fn(async () => {
      throw pickerError
    })

    const clickSpy = vi
      .spyOn(HTMLInputElement.prototype, 'click')
      .mockImplementation(function mockClick(this: HTMLInputElement) {
        Object.defineProperty(this, 'files', {
          configurable: true,
          value: [selectedFile],
        })

        this.dispatchEvent(new Event('change'))
      })

    const actions = useDocumentActions()

    await expect(actions.open()).resolves.toEqual({
      content: '# Fallback file',
      path: 'fallback-from-picker.md',
    })
    expect(clickSpy).toHaveBeenCalled()
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Falling back to the browser file input after picker failure:',
      pickerError,
    )
  })

  it('reuses the browser file handle after opening with the file system access picker', async () => {
    const actions = useDocumentActions()
    const writes: string[] = []
    const handle = {
      createWritable: vi.fn(async () => ({
        close: async () => undefined,
        write: async (value: string) => {
          writes.push(value)
        },
      })),
      getFile: vi.fn(async () => new File(['# Loaded'], 'loaded.md', { type: 'text/markdown' })),
      kind: 'file',
      name: 'loaded.md',
    } as unknown as FileSystemFileHandle

    window.showOpenFilePicker = vi.fn(async () => [handle])
    const showSaveFilePickerSpy = vi.fn()
    window.showSaveFilePicker = showSaveFilePickerSpy

    await expect(actions.open()).resolves.toEqual({
      content: '# Loaded',
      path: 'loaded.md',
    })

    await expect(actions.save({ content: '# Updated', path: 'loaded.md' })).resolves.toEqual({
      path: 'loaded.md',
    })

    expect(showSaveFilePickerSpy).not.toHaveBeenCalled()
    expect(writes).toEqual(['# Updated'])
  })

  it('returns null when reading a selected browser file fails', async () => {
    const actions = useDocumentActions()
    const handle = {
      getFile: vi.fn(async () => new File(['binary'], 'broken.md', { type: 'text/markdown' })),
      kind: 'file',
      name: 'broken.md',
    } as unknown as FileSystemFileHandle
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const readAsTextSpy = vi.spyOn(FileReader.prototype, 'readAsText').mockImplementation(() => {
      throw new DOMException('Denied', 'NotReadableError')
    })

    window.showOpenFilePicker = vi.fn(async () => [handle])

    await expect(actions.open()).resolves.toBe(null)
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to open the selected file:',
      expect.any(DOMException),
    )
    expect(readAsTextSpy).toHaveBeenCalled()
  })

  it('preserves the current document name when save falls back to download', async () => {
    window.showSaveFilePicker = undefined

    const actions = useDocumentActions()
    const anchorClickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined)
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:actions')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)

    const saved = await actions.save({ content: '# Saved', path: 'notes.md' })

    expect(saved).toEqual({ path: 'notes.md' })
    expect(anchorClickSpy).toHaveBeenCalled()
  })
})
