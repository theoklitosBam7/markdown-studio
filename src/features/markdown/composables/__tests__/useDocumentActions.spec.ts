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
  const originalCreateObjectURL = URL.createObjectURL
  const originalRevokeObjectURL = URL.revokeObjectURL
  const originalShowSaveFilePicker = window.showSaveFilePicker

  beforeEach(() => {
    resetBrowserDocumentSessionForTests()
    window.desktop = undefined
    window.showSaveFilePicker = originalShowSaveFilePicker
    vi.clearAllMocks()
  })

  afterEach(() => {
    resetBrowserDocumentSessionForTests()
    window.desktop = originalDesktop
    window.showSaveFilePicker = originalShowSaveFilePicker
    URL.createObjectURL = originalCreateObjectURL
    URL.revokeObjectURL = originalRevokeObjectURL
    vi.restoreAllMocks()
  })

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
    const actions = useDocumentActions()

    const openPromise = actions.open()
    const input = document.querySelector('input[type="file"]')

    expect(input).toBeInstanceOf(HTMLInputElement)
    input?.dispatchEvent(new Event('cancel'))

    await expect(openPromise).resolves.toBe(null)
    expect(document.querySelector('input[type="file"]')).toBeNull()
  })

  it('returns null when focus returns without a selected file', async () => {
    const actions = useDocumentActions()

    const openPromise = actions.open()
    const input = document.querySelector('input[type="file"]')

    expect(input).toBeInstanceOf(HTMLInputElement)
    window.dispatchEvent(new Event('blur'))
    window.dispatchEvent(new Event('focus'))

    await expect(openPromise).resolves.toBe(null)
    expect(document.querySelector('input[type="file"]')).toBeNull()
  })

  it('opens the selected browser file and cleans up the temporary input', async () => {
    const actions = useDocumentActions()
    const file = new File(['# Loaded'], 'loaded.md', { type: 'text/markdown' })

    const openPromise = actions.open()
    const input = document.querySelector('input[type="file"]')

    expect(input).toBeInstanceOf(HTMLInputElement)
    Object.defineProperty(input, 'files', {
      configurable: true,
      get: () => [file],
    })
    input?.dispatchEvent(new Event('change'))

    await expect(openPromise).resolves.toEqual({
      content: '# Loaded',
      path: 'loaded.md',
    })
    expect(document.querySelector('input[type="file"]')).toBeNull()
  })

  it('returns null when reading the selected browser file fails', async () => {
    const actions = useDocumentActions()
    const file = new File(['binary'], 'broken.md', { type: 'text/markdown' })
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const readAsTextSpy = vi.spyOn(FileReader.prototype, 'readAsText').mockImplementation(() => {
      throw new DOMException('Denied', 'NotReadableError')
    })

    const openPromise = actions.open()
    const input = document.querySelector('input[type="file"]')

    expect(input).toBeInstanceOf(HTMLInputElement)
    Object.defineProperty(input, 'files', {
      configurable: true,
      get: () => [file],
    })
    input?.dispatchEvent(new Event('change'))

    await expect(openPromise).resolves.toBe(null)
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to open the selected file:',
      expect.any(DOMException),
    )
    expect(readAsTextSpy).toHaveBeenCalled()
    expect(document.querySelector('input[type="file"]')).toBeNull()
  })
})
