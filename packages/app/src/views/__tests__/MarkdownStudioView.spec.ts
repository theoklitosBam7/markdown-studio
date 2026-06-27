import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import type { AppWindow } from '@/browser-window'

import { resetPwaStateForTests } from '@/composables/usePwa'
import { resetBrowserDocumentSessionForTests } from '@/features/markdown/composables/useDocumentActions'
import { generateTableTemplate } from '@/features/markdown/utils/tableTemplate'

import MarkdownStudioView from '../MarkdownStudioView.vue'

async function mountMarkdownStudioView() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        component: MarkdownStudioView,
        path: '/',
      },
    ],
  })

  await router.push('/')
  await router.isReady()

  const wrapper = mount(MarkdownStudioView, {
    attachTo: document.body,
    global: {
      plugins: [router],
    },
  })

  await flushPromises()

  return { router, wrapper }
}

describe('MarkdownStudioView', () => {
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
    document.body.innerHTML = ''
    resetBrowserDocumentSessionForTests()
    resetPwaStateForTests()
    appWindow.desktop = originalDesktop
    window.confirm = originalConfirm
    vi.restoreAllMocks()
  })

  it('inserts a default table when the toolbar insert table button is clicked', async () => {
    const { wrapper } = await mountMarkdownStudioView()
    const textarea = wrapper.get('textarea').element as HTMLTextAreaElement
    const contentBeforeInsert = textarea.value
    const cursorOffset = 12
    textarea.setSelectionRange(cursorOffset, cursorOffset)

    await wrapper.get('button[aria-label="Insert table"]').trigger('click')
    await flushPromises()

    const expectedTable = generateTableTemplate({ columns: 3, rows: 3 })
    const expectedContent =
      contentBeforeInsert.slice(0, cursorOffset) +
      expectedTable +
      contentBeforeInsert.slice(cursorOffset)

    expect(textarea.value).toBe(expectedContent)

    wrapper.unmount()
  })
})
