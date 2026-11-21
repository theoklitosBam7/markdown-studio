import type { DesktopApi } from '@markdown-studio/desktop-contract/types'
import type { ActiveDocumentKind } from '@/types/document'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { effectScope, nextTick, shallowRef } from 'vue'

import type { AppWindow } from '@/browser-window'
import { captureVueWarning } from '@/__tests__/testEnvironment'

import { useDesktopDraftPersistence } from '../useDesktopDraftPersistence'

function createDesktopMock(): DesktopApi {
  return {
    commands: {
      onAppCommand: vi.fn(() => () => undefined),
    },
    documents: {
      clearLastOpened: vi.fn(async () => undefined),
      clearWorkspaceDraft: vi.fn(async () => undefined),
      open: vi.fn(async () => null),
      restoreLastOpened: vi.fn(async () => null),
      restoreWorkspaceDraft: vi.fn(async () => null),
      save: vi.fn(async () => null),
      saveAs: vi.fn(async () => null),
      saveWorkspaceDraft: vi.fn(async () => undefined),
    },
    editing: {
      insertText: vi.fn(async () => undefined),
    },
    exports: {
      exportHtml: vi.fn(async () => null),
      exportPdf: vi.fn(async () => null),
    },
    install: {
      isHomebrew: async () => false,
    },
    isDesktop: true,
    shell: {
      openExternal: vi.fn(async () => undefined),
    },
  }
}

describe('useDesktopDraftPersistence', () => {
  const appWindow = window as AppWindow
  const originalDesktop = appWindow.desktop
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.useFakeTimers()
    appWindow.desktop = createDesktopMock()
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(captureVueWarning)
  })

  afterEach(() => {
    appWindow.desktop = originalDesktop
    consoleWarnSpy.mockRestore()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('restores a persisted desktop draft as unsaved work', async () => {
    const desktop = createDesktopMock()
    vi.mocked(desktop.documents.restoreWorkspaceDraft).mockResolvedValueOnce({
      activeDocument: {
        content: '# Edited',
        label: 'notes.md',
        path: '/tmp/notes.md',
        savedContent: '# Saved',
      },
      updatedAt: '2026-04-30T00:00:00.000Z',
      version: 1,
    })
    appWindow.desktop = desktop
    const restoreDraft = vi.fn(async () => undefined)

    const scope = effectScope()
    const persistence = scope.run(() =>
      useDesktopDraftPersistence({
        content: shallowRef(''),
        currentPath: shallowRef(null),
        displayName: shallowRef('Untitled.md'),
        documentKind: shallowRef<ActiveDocumentKind>('markdown'),
        isDesktop: shallowRef(true),
        isDirty: shallowRef(false),
        restoreDraft,
        savedContent: shallowRef(''),
      }),
    )

    await expect(persistence?.restoreStoredDraft()).resolves.toBe(true)

    expect(restoreDraft).toHaveBeenCalledWith({
      content: '# Edited',
      label: 'notes.md',
      path: '/tmp/notes.md',
      savedContent: '# Saved',
    })

    scope.stop()
  })

  it('debounces dirty desktop draft writes after startup restore completes', async () => {
    const desktop = appWindow.desktop as DesktopApi
    const content = shallowRef('# Saved')
    const currentPath = shallowRef<null | string>('/tmp/notes.md')
    const displayName = shallowRef('notes.md')
    const isDirty = shallowRef(false)
    const savedContent = shallowRef('# Saved')

    const scope = effectScope()
    const persistence = scope.run(() =>
      useDesktopDraftPersistence({
        content,
        currentPath,
        displayName,
        documentKind: shallowRef<ActiveDocumentKind>('markdown'),
        isDesktop: shallowRef(true),
        isDirty,
        restoreDraft: vi.fn(async () => undefined),
        savedContent,
      }),
    )

    await persistence?.restoreStoredDraft()
    content.value = '# Edited'
    isDirty.value = true
    await nextTick()
    await vi.advanceTimersByTimeAsync(250)

    expect(desktop.documents.saveWorkspaceDraft).toHaveBeenCalledWith({
      activeDocument: {
        content: '# Edited',
        label: 'notes.md',
        path: '/tmp/notes.md',
        savedContent: '# Saved',
      },
    })

    scope.stop()
  })

  it('clears the desktop draft when the document becomes clean', async () => {
    const desktop = appWindow.desktop as DesktopApi
    const isDirty = shallowRef(true)

    const scope = effectScope()
    const persistence = scope.run(() =>
      useDesktopDraftPersistence({
        content: shallowRef('# Edited'),
        currentPath: shallowRef(null),
        displayName: shallowRef('Untitled.md'),
        documentKind: shallowRef<ActiveDocumentKind>('markdown'),
        isDesktop: shallowRef(true),
        isDirty,
        restoreDraft: vi.fn(async () => undefined),
        savedContent: shallowRef(''),
      }),
    )

    await persistence?.restoreStoredDraft()
    isDirty.value = false
    await nextTick()

    expect(desktop.documents.clearWorkspaceDraft).toHaveBeenCalledTimes(1)

    scope.stop()
  })

  it('cancels a pending Markdown draft when an HTML document opens', async () => {
    const desktop = appWindow.desktop as DesktopApi
    const content = shallowRef('# Saved')
    const currentPath = shallowRef('/tmp/notes.md')
    const displayName = shallowRef('notes.md')
    const documentKind = shallowRef<ActiveDocumentKind>('markdown')
    const isDirty = shallowRef(false)
    const savedContent = shallowRef('# Saved')
    const scope = effectScope()
    const persistence = scope.run(() =>
      useDesktopDraftPersistence({
        content,
        currentPath,
        displayName,
        documentKind,
        isDesktop: shallowRef(true),
        isDirty,
        restoreDraft: vi.fn(async () => undefined),
        savedContent,
      }),
    )

    await persistence?.restoreStoredDraft()
    content.value = '# Edited'
    isDirty.value = true
    await nextTick()
    await vi.advanceTimersByTimeAsync(100)

    documentKind.value = 'html'
    content.value = '<h1>HTML document</h1>'
    savedContent.value = content.value
    currentPath.value = '/tmp/report.html'
    displayName.value = 'report.html'
    isDirty.value = false
    await nextTick()
    await vi.advanceTimersByTimeAsync(250)

    expect(desktop.documents.saveWorkspaceDraft).not.toHaveBeenCalled()
    scope.stop()
  })

  it('does not write a desktop draft while an HTML preview is active', async () => {
    const desktop = appWindow.desktop as DesktopApi
    const content = shallowRef('<p>Page</p>')

    const scope = effectScope()
    const persistence = scope.run(() =>
      useDesktopDraftPersistence({
        content,
        currentPath: shallowRef('/tmp/page.html'),
        displayName: shallowRef('page.html'),
        documentKind: shallowRef<ActiveDocumentKind>('html'),
        isDesktop: shallowRef(true),
        isDirty: shallowRef(true),
        restoreDraft: vi.fn(async () => undefined),
        savedContent: shallowRef('<p>Page</p>'),
      }),
    )

    await persistence?.restoreStoredDraft()
    content.value = '<p>Updated</p>'
    await nextTick()
    await vi.advanceTimersByTimeAsync(250)

    expect(desktop.documents.saveWorkspaceDraft).not.toHaveBeenCalled()

    scope.stop()
  })
})
