import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick, shallowRef } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'

import type { AppWindow } from '../../../../browser-window'

import { useDocumentExport } from '../useDocumentExport'

const content = shallowRef('# Export\n\nBody copy')
const currentPath = shallowRef<null | string>('/tmp/export-notes.md')
const displayName = shallowRef('export-notes.md')
const isMobile = shallowRef(false)

const Harness = defineComponent({
  setup() {
    return useDocumentExport({
      content,
      currentPath,
      displayName,
      isMobile,
    })
  },
  template: '<div />',
})

function createRouterForTest() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { component: Harness, path: '/' },
      { component: { template: '<div />' }, name: 'print-export', path: '/export/print' },
    ],
  })
}

describe('useDocumentExport', () => {
  const appWindow = window as AppWindow
  const originalDesktop = appWindow.desktop
  const originalCreateObjectURL = URL.createObjectURL
  const originalRevokeObjectURL = URL.revokeObjectURL
  const originalOpen = window.open

  beforeEach(() => {
    content.value = '# Export\n\nBody copy'
    currentPath.value = '/tmp/export-notes.md'
    displayName.value = 'export-notes.md'
    isMobile.value = false
    appWindow.desktop = undefined
    window.localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    appWindow.desktop = originalDesktop
    URL.createObjectURL = originalCreateObjectURL
    URL.revokeObjectURL = originalRevokeObjectURL
    window.open = originalOpen
    vi.restoreAllMocks()
  })

  it('downloads standalone html in the browser', async () => {
    const router = createRouterForTest()
    await router.push('/')
    await router.isReady()

    const wrapper = mount(Harness, {
      global: {
        plugins: [router],
      },
    })
    const anchorClickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined)
    const createObjectUrlSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:export-html')
    const revokeObjectUrlSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)

    vi.useFakeTimers()
    try {
      await (wrapper.vm as unknown as { exportHtml: () => Promise<void> }).exportHtml()

      expect(createObjectUrlSpy).toHaveBeenCalled()
      expect(anchorClickSpy).toHaveBeenCalled()
      expect(revokeObjectUrlSpy).not.toHaveBeenCalled()

      await vi.advanceTimersByTimeAsync(1000)

      expect(revokeObjectUrlSpy).toHaveBeenCalledWith('blob:export-html')
    } finally {
      vi.useRealTimers()
    }
  })

  it('opens the print route for web pdf export', async () => {
    const router = createRouterForTest()
    await router.push('/')
    await router.isReady()

    const wrapper = mount(Harness, {
      global: {
        plugins: [router],
      },
    })
    const popupWindow = {
      location: { href: '' },
      name: '',
    } as unknown as Window
    const openSpy = vi.fn<
      (url?: string | URL, target?: string, features?: string) => null | Window
    >(() => popupWindow)
    window.open = openSpy as typeof window.open

    await (wrapper.vm as unknown as { exportPdf: () => Promise<void> }).exportPdf()
    await nextTick()

    const openCalls = openSpy.mock.calls as Array<[string, string]>
    expect(openSpy).toHaveBeenCalledTimes(1)
    expect(openCalls[0]?.[0]).toBe('')
    expect(openCalls[0]?.[1]).toBe('_blank')
    expect(popupWindow.location.href).toMatch(/^\/export\/print\?job=/)
    expect(popupWindow.name).toContain('"title":"export-notes"')
    expect(window.localStorage.length).toBe(1)
  })

  it('blocks pdf export on mobile web with a stable reason', async () => {
    isMobile.value = true

    const router = createRouterForTest()
    await router.push('/')
    await router.isReady()

    const wrapper = mount(Harness, {
      global: {
        plugins: [router],
      },
    })
    const openSpy = vi.fn()
    window.open = openSpy as typeof window.open

    const viewModel = wrapper.vm as unknown as {
      canExportPdf: boolean
      exportPdf: () => Promise<void>
      pdfExportUnavailableReason: string
    }

    expect(viewModel.canExportPdf).toBe(false)
    expect(viewModel.pdfExportUnavailableReason).toContain('Export as HTML instead')
    await expect(viewModel.exportPdf()).rejects.toThrow(
      "PDF export isn't available on mobile or installed PWAs yet. Use Export as HTML instead.",
    )
    expect(openSpy).not.toHaveBeenCalled()
  })

  it('allows pdf export on desktop browsers even when PWA is installed', async () => {
    const router = createRouterForTest()
    await router.push('/')
    await router.isReady()

    const wrapper = mount(Harness, {
      global: {
        plugins: [router],
      },
    })

    const viewModel = wrapper.vm as unknown as {
      canExportPdf: boolean
      pdfExportUnavailableReason: string
    }

    expect(viewModel.canExportPdf).toBe(true)
    expect(viewModel.pdfExportUnavailableReason).toBe('')
  })

  it('delegates exports to the desktop bridge when available', async () => {
    const exportHtml = vi.fn(async () => ({ path: '/tmp/export.html' }))
    const exportPdf = vi.fn(async () => ({ path: '/tmp/export.pdf' }))
    appWindow.desktop = {
      commands: {
        onAppCommand: () => () => undefined,
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
        exportHtml,
        exportPdf,
      },
      isDesktop: true,
      shell: {
        openExternal: async () => undefined,
      },
    }

    const router = createRouterForTest()
    await router.push('/')
    await router.isReady()

    const wrapper = mount(Harness, {
      global: {
        plugins: [router],
      },
    })

    await (wrapper.vm as unknown as { exportHtml: () => Promise<void> }).exportHtml()
    await (wrapper.vm as unknown as { exportPdf: () => Promise<void> }).exportPdf()

    expect(exportHtml).toHaveBeenCalledWith(
      expect.objectContaining({
        documentHtml: expect.stringContaining('<!DOCTYPE html>'),
        suggestedPath: 'export-notes.html',
      }),
    )
    expect(exportPdf).toHaveBeenCalledWith(
      expect.objectContaining({
        documentHtml: expect.stringContaining('<!DOCTYPE html>'),
        suggestedPath: 'export-notes.pdf',
      }),
    )
  })
})
