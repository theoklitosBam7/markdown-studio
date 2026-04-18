import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'

import type { AppWindow } from '@/browser-window'
import type {
  EditorPaneAdapter,
  EditorWorkspaceController,
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

    expect(workspace.state.isFindReplaceOpen.value).toBe(true)
    expect(workspace.state.showReplace.value).toBe(true)
    expect(editor.focusFindQuery).toHaveBeenCalledTimes(1)

    wrapper.unmount()
  })

  it('replaces the current match through the editor adapter and restores editor focus', async () => {
    const { workspace, wrapper } = await mountWorkspace()
    const editor = createEditorAdapter()
    workspace.attach.editor(editor)

    workspace.editor.updateContent('cat dog cat')
    workspace.find.setQuery('cat')
    workspace.find.setReplaceText('fox')

    await workspace.find.replaceCurrent()

    expect(editor.replaceRange).toHaveBeenCalledWith(0, 3, 'fox')
    expect(editor.focus).toHaveBeenCalledTimes(1)
    expect(workspace.state.activeMatchIndex.value).toBe(0)

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

    wrapper.unmount()
  })

  it('loads an example and restores editor focus after the update flushes', async () => {
    const { workspace, wrapper } = await mountWorkspace()
    const editor = createEditorAdapter()
    workspace.attach.editor(editor)

    await workspace.editor.loadExample({
      content: '# Example content',
      desc: 'Example description',
      title: 'Example title',
    })

    expect(workspace.state.content.value).toBe('# Example content')
    expect(editor.focus).toHaveBeenCalledTimes(1)

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

  it('auto-starts on mount and stops desktop command subscriptions on unmount', async () => {
    const removeDesktopCommandListener = vi.fn()
    const onAppCommand = vi.fn(() => removeDesktopCommandListener)

    appWindow.desktop = {
      commands: {
        onAppCommand,
      },
      documents: {
        open: async () => null,
        save: async () => null,
        saveAs: async () => null,
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
