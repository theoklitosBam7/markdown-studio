import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'

import type { AppWindow } from '@/browser-window'
import type {
  EditorPaneAdapter,
  EditorWorkspaceController,
  EditorWorkspaceFindAction,
  PreviewPaneAdapter,
} from '@/features/markdown/types'

import { resetPwaStateForTests } from '@/composables/usePwa'

import { resetBrowserDocumentSessionForTests } from '../useDocumentActions'
import { useEditorWorkspaceController } from '../useEditorWorkspaceController'

function createEditorAdapter(): EditorPaneAdapter {
  return {
    focus: vi.fn(),
    focusAtOffset: vi.fn(async () => undefined),
    focusFindQuery: vi.fn(),
    getScrollState: vi.fn(() => null),
    replaceAllContent: vi.fn(async () => undefined),
    replaceRange: vi.fn(async () => undefined),
    setSelectionRange: vi.fn(async () => undefined),
  }
}

function createPreviewAdapter(): PreviewPaneAdapter {
  return {
    scrollToSourceOffset: vi.fn(),
  }
}

function createRouterForTest() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { component: { render: () => h('div') }, name: 'home', path: '/' },
      { component: { render: () => h('div') }, name: 'print-export', path: '/export/print' },
    ],
  })
}

async function mountWorkspace() {
  let workspace: EditorWorkspaceController | undefined

  const Harness = defineComponent({
    setup() {
      workspace = useEditorWorkspaceController()
      return () => h('div')
    },
  })

  const router = createRouterForTest()
  await router.push('/')
  await router.isReady()

  const wrapper = mount(Harness, {
    global: {
      plugins: [router],
    },
  })

  if (!workspace) {
    throw new Error('Workspace controller was not created.')
  }

  return {
    router,
    workspace,
    wrapper,
  }
}

describe('useEditorWorkspaceController', () => {
  const appWindow = window as AppWindow
  const originalDesktop = appWindow.desktop
  const originalConfirm = window.confirm

  beforeEach(() => {
    resetBrowserDocumentSessionForTests()
    resetPwaStateForTests()
    appWindow.desktop = undefined
    window.confirm = vi.fn(() => true)
    window.localStorage.clear()
    window.sessionStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    resetBrowserDocumentSessionForTests()
    resetPwaStateForTests()
    appWindow.desktop = originalDesktop
    window.confirm = originalConfirm
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('opens replace from the global shortcut and focuses the editor find query', async () => {
    const { workspace, wrapper } = await mountWorkspace()
    const editor = createEditorAdapter()
    workspace.attach.editor(editor)

    workspace.system.handleGlobalKeydown(
      new KeyboardEvent('keydown', {
        ctrlKey: true,
        key: 'h',
      }),
    )
    await nextTick()

    expect(workspace.find.state.value.isOpen).toBe(true)
    expect(workspace.find.state.value.showReplace).toBe(true)
    expect(editor.focusFindQuery).toHaveBeenCalledTimes(1)

    wrapper.unmount()
  })

  it('replaces the current match through the editor adapter and restores editor focus', async () => {
    const { workspace, wrapper } = await mountWorkspace()
    const editor = createEditorAdapter()
    workspace.attach.editor(editor)
    await flushPromises()
    vi.mocked(editor.focus).mockClear()

    workspace.editor.updateContent('cat dog cat')
    await workspace.find.dispatch({ type: 'set-query', value: 'cat' })
    await workspace.find.dispatch({ type: 'set-replace-text', value: 'fox' })

    await workspace.find.dispatch({ type: 'replace-current' })

    expect(editor.replaceRange).toHaveBeenCalledWith(0, 3, 'fox')
    expect(editor.focus).toHaveBeenCalledTimes(1)
    expect(workspace.find.state.value.activeMatchIndex).toBe(0)

    wrapper.unmount()
  })

  it('syncs preview position from editor scroll only in split mode', async () => {
    const { workspace, wrapper } = await mountWorkspace()
    const preview = createPreviewAdapter()
    workspace.attach.preview(preview)

    workspace.editor.updateContent('one\ntwo\nthree\nfour')
    workspace.editor.setViewMode('split')
    workspace.editor.syncPreviewToEditorPosition({
      clientHeight: 200,
      contentLength: workspace.state.content.value.length,
      lineHeight: 20,
      scrollHeight: 400,
      scrollTop: 40,
    })

    expect(preview.scrollToSourceOffset).toHaveBeenCalledWith(8)

    vi.mocked(preview.scrollToSourceOffset).mockClear()
    workspace.editor.setViewMode('preview')
    workspace.editor.syncPreviewToEditorPosition({
      clientHeight: 200,
      contentLength: workspace.state.content.value.length,
      lineHeight: 20,
      scrollHeight: 400,
      scrollTop: 40,
    })

    expect(preview.scrollToSourceOffset).not.toHaveBeenCalled()

    wrapper.unmount()
  })

  it('jumps from preview to editor offsets only while split view is active', async () => {
    const { workspace, wrapper } = await mountWorkspace()
    const editor = createEditorAdapter()
    workspace.attach.editor(editor)

    workspace.editor.setViewMode('split')
    await workspace.preview.jumpToOffset(12)
    expect(editor.focusAtOffset).toHaveBeenCalledWith(12)

    vi.mocked(editor.focusAtOffset).mockClear()
    workspace.editor.setViewMode('editor')
    await workspace.preview.jumpToOffset(24)
    expect(editor.focusAtOffset).not.toHaveBeenCalled()

    workspace.editor.setViewMode('split')
    workspace.system.handleViewportResize(640)
    await workspace.preview.jumpToOffset(32)
    expect(editor.focusAtOffset).not.toHaveBeenCalled()

    wrapper.unmount()
  })

  it('handles all supported find actions without throwing', async () => {
    const { workspace, wrapper } = await mountWorkspace()
    const editor = createEditorAdapter()
    workspace.attach.editor(editor)

    workspace.editor.updateContent('cat dog cat')

    const actions: EditorWorkspaceFindAction[] = [
      { type: 'open' },
      { type: 'open-replace' },
      { type: 'close' },
      { type: 'next' },
      { type: 'previous' },
      { type: 'set-query', value: 'cat' },
      { type: 'set-match-case', value: true },
      { type: 'set-replace-text', value: 'fox' },
      { type: 'replace-current' },
      { type: 'replace-all' },
    ]

    for (const action of actions) {
      await expect(workspace.find.dispatch(action)).resolves.toBeUndefined()
    }

    wrapper.unmount()
  })

  it('loads an example by id through the document api and restores editor focus', async () => {
    const { workspace, wrapper } = await mountWorkspace()
    const editor = createEditorAdapter()
    workspace.attach.editor(editor)
    await flushPromises()
    vi.mocked(editor.focus).mockClear()

    await workspace.document.loadExample('flowchart-diagram')

    expect(workspace.state.content.value).toContain('# Git Feature Branch Workflow')
    expect(workspace.state.statusText.value).toContain('Loaded example: Flowchart diagram')
    expect(editor.focus).toHaveBeenCalledTimes(1)

    wrapper.unmount()
  })

  it('warns and keeps the editor unchanged when an unknown example id is requested', async () => {
    const { workspace, wrapper } = await mountWorkspace()
    const editor = createEditorAdapter()
    const warningSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    workspace.attach.editor(editor)
    workspace.editor.updateContent('# Existing content')
    await flushPromises()
    vi.mocked(editor.focus).mockClear()

    await workspace.document.loadExample('unknown-example-id')

    expect(workspace.state.content.value).toBe('# Existing content')
    expect(editor.focus).not.toHaveBeenCalled()
    expect(warningSpy).toHaveBeenCalledWith('Unknown example id received: unknown-example-id')

    wrapper.unmount()
  })

  it('collapses split view to editor mode on mobile viewport changes', async () => {
    const { workspace, wrapper } = await mountWorkspace()

    workspace.editor.setViewMode('split')
    workspace.system.handleViewportResize(640)

    expect(workspace.state.isMobile.value).toBe(true)
    expect(workspace.state.viewMode.value).toBe('editor')
    expect(workspace.state.availableModes.value).toEqual(['editor', 'preview'])

    wrapper.unmount()
  })

  it('restores a stored draft during startup on the web', async () => {
    vi.useFakeTimers()
    window.localStorage.setItem(
      'markdown-studio:web-draft',
      JSON.stringify({
        content: '# Restored draft',
        label: 'notes.md',
      }),
    )

    const { workspace, wrapper } = await mountWorkspace()
    await flushPromises()

    expect(workspace.state.content.value).toBe('# Restored draft')
    expect(workspace.state.displayName.value).toBe('notes.md')
    expect(workspace.state.isDirty.value).toBe(true)

    wrapper.unmount()
  })

  it('restores the last opened desktop document during startup', async () => {
    const restoreLastOpened = vi.fn(async () => ({
      content: '# Desktop restored',
      path: '/tmp/desktop-restored.md',
    }))

    window.localStorage.setItem(
      'markdown-studio:web-draft',
      JSON.stringify({
        content: '# Web draft should be ignored',
        label: 'draft.md',
      }),
    )
    appWindow.desktop = {
      commands: {
        onAppCommand: vi.fn(() => () => undefined),
      },
      documents: {
        clearLastOpened: async () => undefined,
        clearWorkspaceDraft: async () => undefined,
        open: async () => null,
        restoreLastOpened,
        restoreWorkspaceDraft: async () => null,
        save: async () => null,
        saveAs: async () => null,
        saveWorkspaceDraft: async () => undefined,
      },
      editing: {
        insertText: async () => undefined,
      },
      exports: {
        exportHtml: async () => null,
        exportPdf: async () => null,
      },
      isDesktop: true,
      shell: {
        openExternal: async () => undefined,
      },
    }

    const { workspace, wrapper } = await mountWorkspace()
    await flushPromises()

    expect(restoreLastOpened).toHaveBeenCalledTimes(1)
    expect(workspace.state.content.value).toBe('# Desktop restored')
    expect(workspace.state.displayName.value).toBe('desktop-restored.md')
    expect(workspace.state.isDirty.value).toBe(false)

    wrapper.unmount()
  })

  it('restores an unsaved desktop draft before the last opened document during startup', async () => {
    const restoreLastOpened = vi.fn(async () => ({
      content: '# Saved file',
      path: '/tmp/saved-file.md',
    }))
    const restoreWorkspaceDraft = vi.fn(async () => ({
      activeDocument: {
        content: '# Unsaved desktop edit',
        label: 'saved-file.md',
        path: '/tmp/saved-file.md',
        savedContent: '# Saved file',
      },
      updatedAt: '2026-04-30T00:00:00.000Z',
      version: 1 as const,
    }))

    appWindow.desktop = {
      commands: {
        onAppCommand: vi.fn(() => () => undefined),
      },
      documents: {
        clearLastOpened: async () => undefined,
        clearWorkspaceDraft: async () => undefined,
        open: async () => null,
        restoreLastOpened,
        restoreWorkspaceDraft,
        save: async () => null,
        saveAs: async () => null,
        saveWorkspaceDraft: async () => undefined,
      },
      editing: {
        insertText: async () => undefined,
      },
      exports: {
        exportHtml: async () => null,
        exportPdf: async () => null,
      },
      isDesktop: true,
      shell: {
        openExternal: async () => undefined,
      },
    }

    const { workspace, wrapper } = await mountWorkspace()
    await flushPromises()

    expect(restoreWorkspaceDraft).toHaveBeenCalledTimes(1)
    expect(restoreLastOpened).not.toHaveBeenCalled()
    expect(workspace.state.content.value).toBe('# Unsaved desktop edit')
    expect(workspace.state.displayName.value).toBe('saved-file.md')
    expect(workspace.state.isDirty.value).toBe(true)
    expect(workspace.state.statusText.value).toContain('Restored unsaved changes')

    wrapper.unmount()
  })

  it('does not fall back to web draft storage during desktop startup', async () => {
    const restoreLastOpened = vi.fn(async () => null)

    window.localStorage.setItem(
      'markdown-studio:web-draft',
      JSON.stringify({
        content: '# Web draft should be ignored',
        label: 'draft.md',
      }),
    )
    appWindow.desktop = {
      commands: {
        onAppCommand: vi.fn(() => () => undefined),
      },
      documents: {
        clearLastOpened: async () => undefined,
        clearWorkspaceDraft: async () => undefined,
        open: async () => null,
        restoreLastOpened,
        restoreWorkspaceDraft: async () => null,
        save: async () => null,
        saveAs: async () => null,
        saveWorkspaceDraft: async () => undefined,
      },
      editing: {
        insertText: async () => undefined,
      },
      exports: {
        exportHtml: async () => null,
        exportPdf: async () => null,
      },
      isDesktop: true,
      shell: {
        openExternal: async () => undefined,
      },
    }

    const { workspace, wrapper } = await mountWorkspace()
    await flushPromises()

    expect(restoreLastOpened).toHaveBeenCalledTimes(1)
    expect(workspace.state.content.value).not.toBe('# Web draft should be ignored')
    expect(workspace.state.displayName.value).toBe('Untitled.md')
    expect(workspace.state.isDirty.value).toBe(false)

    wrapper.unmount()
  })

  it('restores editor focus after every document lifecycle action', async () => {
    const open = vi.fn(async () => ({ content: '# Opened', path: 'opened.md' }))
    const save = vi.fn(async () => ({ path: 'saved.md' }))

    appWindow.desktop = {
      commands: {
        onAppCommand: vi.fn(() => () => undefined),
      },
      documents: {
        clearLastOpened: async () => undefined,
        clearWorkspaceDraft: async () => undefined,
        open,
        restoreLastOpened: async () => null,
        restoreWorkspaceDraft: async () => null,
        save,
        saveAs: async () => null,
        saveWorkspaceDraft: async () => undefined,
      },
      editing: {
        insertText: async () => undefined,
      },
      exports: {
        exportHtml: async () => null,
        exportPdf: async () => null,
      },
      isDesktop: true,
      shell: {
        openExternal: async () => undefined,
      },
    }

    const { workspace, wrapper } = await mountWorkspace()
    const editor = createEditorAdapter()
    workspace.attach.editor(editor)
    await flushPromises()
    vi.mocked(editor.focus).mockClear()

    await workspace.document.open()
    await workspace.document.save()
    await workspace.document.startNew()

    window.localStorage.setItem(
      'markdown-studio:web-draft',
      JSON.stringify({
        content: '# Restored from storage',
        label: 'draft.md',
      }),
    )

    await workspace.document.restoreDraft()
    await workspace.document.loadExample('flowchart-diagram')

    expect(open).toHaveBeenCalledTimes(1)
    expect(save).toHaveBeenCalledTimes(1)
    expect(editor.focus).toHaveBeenCalledTimes(5)

    wrapper.unmount()
  })

  it('auto-starts on mount and stops desktop command subscriptions on unmount', async () => {
    const removeDesktopCommandListener = vi.fn()
    const onAppCommand = vi.fn(() => removeDesktopCommandListener)

    appWindow.desktop = {
      commands: {
        onAppCommand,
      },
      documents: {
        clearLastOpened: vi.fn(async () => undefined),
        clearWorkspaceDraft: vi.fn(async () => undefined),
        open: async () => null,
        restoreLastOpened: async () => null,
        restoreWorkspaceDraft: async () => null,
        save: async () => null,
        saveAs: async () => null,
        saveWorkspaceDraft: async () => undefined,
      },
      editing: {
        insertText: async () => undefined,
      },
      exports: {
        exportHtml: async () => null,
        exportPdf: async () => null,
      },
      isDesktop: true,
      shell: {
        openExternal: async () => undefined,
      },
    }

    const { workspace, wrapper } = await mountWorkspace()
    await flushPromises()

    expect(onAppCommand).toHaveBeenCalledTimes(1)
    expect(workspace.state.isDesktop.value).toBe(true)

    // Verify idempotency: calling start() again should not re-register listeners
    await workspace.system.start()
    expect(onAppCommand).toHaveBeenCalledTimes(1) // Still only called once from the first start

    wrapper.unmount()

    expect(removeDesktopCommandListener).toHaveBeenCalledTimes(1)
  })
})
