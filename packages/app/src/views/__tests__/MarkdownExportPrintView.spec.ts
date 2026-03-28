import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'

import MarkdownExportPrintView from '../MarkdownExportPrintView.vue'

const PRINT_JOB_KEY = 'markdown-studio:print-export:'

function createRouterForTest() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [{ component: MarkdownExportPrintView, path: '/export/print' }],
  })
}

describe('MarkdownExportPrintView', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('prints after image readiness times out', async () => {
    const router = createRouterForTest()
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => undefined)
    const completeSpy = vi
      .spyOn(HTMLImageElement.prototype, 'complete', 'get')
      .mockReturnValue(false)

    window.localStorage.setItem(
      `${PRINT_JOB_KEY}job-1`,
      JSON.stringify({
        bodyHtml: '<img alt="diagram" src="/missing.png">',
        title: 'Export',
      }),
    )

    vi.useFakeTimers()
    await router.push('/export/print?job=job-1')
    await router.isReady()

    const Root = defineComponent({
      components: { RouterView },
      template: '<RouterView />',
    })

    mount(Root, {
      global: {
        plugins: [router],
      },
    })

    await nextTick()
    await nextTick()

    expect(printSpy).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(5000)

    expect(completeSpy).toHaveBeenCalled()
    expect(printSpy).toHaveBeenCalledTimes(1)
  })
})
