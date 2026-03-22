import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, shallowRef } from 'vue'

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

describe('useDocumentSession', () => {
  const originalDesktop = window.desktop
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    window.desktop = desktopMock
    vi.clearAllMocks()
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  })

  afterEach(() => {
    consoleWarnSpy.mockRestore()
    window.desktop = originalDesktop
  })

  it('opens and replaces the current document content', async () => {
    const content = shallowRef('# Draft')
    const session = useDocumentSession({
      content,
      replaceContent: (value) => {
        content.value = value
      },
    })

    await session.openDocument()
    await nextTick()

    expect(content.value).toBe('# Loaded')
    expect(session.currentPath.value).toBe('/tmp/loaded.md')
    expect(session.isDirty.value).toBe(false)
  })

  it('tracks dirty state and save branching', async () => {
    const content = shallowRef('# Draft')
    const session = useDocumentSession({
      content,
      replaceContent: (value) => {
        content.value = value
      },
    })

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
    const content = shallowRef('# Draft')
    const session = useDocumentSession({
      content,
      replaceContent: (value) => {
        content.value = value
      },
    })

    await session.handleAppCommand('document:saveAs')

    expect(desktopMock.documents.saveAs).toHaveBeenCalled()
    expect(session.currentPath.value).toBe('/tmp/saved-as.md')
  })

  it('ignores unrelated app commands without saving', async () => {
    const content = shallowRef('# Draft')
    const session = useDocumentSession({
      content,
      replaceContent: (value) => {
        content.value = value
      },
    })

    await session.handleAppCommand('document:new' as never)

    expect(desktopMock.documents.saveAs).not.toHaveBeenCalled()
    expect(consoleWarnSpy).toHaveBeenCalledWith('Unhandled app command: document:new')
  })
})
