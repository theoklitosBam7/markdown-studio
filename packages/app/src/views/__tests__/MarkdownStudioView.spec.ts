import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import type { AppWindow } from '@/browser-window'

import { resetPwaStateForTests } from '@/composables/usePwa'
import { resetBrowserDocumentSessionForTests } from '@/features/markdown/composables/useDocumentActions'
import { generateTableTemplate } from '@/features/markdown/utils/tableTemplate'

import MarkdownStudioView from '../MarkdownStudioView.vue'

function dispatchWindowKeydown(key: string, overrides: Partial<KeyboardEventInit> = {}): void {
  window.dispatchEvent(
    new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key, ...overrides }),
  )
}

function getButtonByText(text: string): HTMLButtonElement | undefined {
  return Array.from(document.body.querySelectorAll('button')).find(
    (button): button is HTMLButtonElement => button.textContent?.trim() === text,
  )
}

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
  const originalCss = window.CSS
  const originalDesktop = appWindow.desktop
  const originalConfirm = window.confirm

  beforeEach(() => {
    resetBrowserDocumentSessionForTests()
    resetPwaStateForTests()
    appWindow.desktop = undefined
    window.CSS = {
      ...originalCss,
      escape: originalCss?.escape ?? ((value: string) => value),
    }
    window.confirm = vi.fn(() => true)
    window.localStorage.clear()
    window.sessionStorage.clear()
    HTMLElement.prototype.scrollIntoView ??= vi.fn()
    vi.clearAllMocks()
  })

  afterEach(() => {
    document.body.innerHTML = ''
    resetBrowserDocumentSessionForTests()
    resetPwaStateForTests()
    window.CSS = originalCss
    appWindow.desktop = originalDesktop
    window.confirm = originalConfirm
    vi.restoreAllMocks()
  })

  it('updates the matching Markdown task when its Live Preview checkbox is clicked', async () => {
    const { wrapper } = await mountMarkdownStudioView()
    const textarea = wrapper.get('textarea')
    await textarea.setValue('- [ ] First task\n- [ ] Second task')
    await flushPromises()

    const checkboxes = wrapper.findAll<HTMLInputElement>('.rendered-md input[type="checkbox"]')
    expect(checkboxes).toHaveLength(2)

    await checkboxes[1]!.trigger('click')
    await flushPromises()

    expect((textarea.element as HTMLTextAreaElement).value).toBe(
      '- [ ] First task\n- [x] Second task',
    )

    wrapper.unmount()
  })

  it('opens the document outline and navigates the editor to a selected heading', async () => {
    const { wrapper } = await mountMarkdownStudioView()
    const textarea = wrapper.get('textarea')
    const content = '# Introduction\nBody\n## Details\nMore'
    await textarea.setValue(content)
    await flushPromises()

    await wrapper.get('button[aria-label="Show document outline"]').trigger('click')
    await flushPromises()

    const outline = wrapper.get('nav[aria-label="Document outline"]')
    expect(outline.findAll('button').map((button) => button.text())).toEqual([
      'Introduction',
      'Details',
    ])

    await outline.findAll('button')[1]?.trigger('click')
    await flushPromises()

    expect((textarea.element as HTMLTextAreaElement).selectionStart).toBe(
      content.indexOf('## Details'),
    )

    wrapper.unmount()
  })

  it('inserts a default table when the toolbar insert table button is clicked', async () => {
    const { wrapper } = await mountMarkdownStudioView()
    const textarea = wrapper.get('textarea').element as HTMLTextAreaElement
    const contentBeforeInsert = textarea.value
    const cursorOffset = 12
    textarea.setSelectionRange(cursorOffset, cursorOffset)

    await wrapper.get('button[aria-label="Insert table"]').trigger('click')
    await flushPromises()

    const confirmButton = wrapper.find('button[type="submit"]')
    expect(confirmButton.exists()).toBe(true)
    await confirmButton.trigger('click')
    await flushPromises()

    const expectedTable = generateTableTemplate({ columns: 3, rows: 3 })
    const expectedContent =
      contentBeforeInsert.slice(0, cursorOffset) +
      expectedTable +
      contentBeforeInsert.slice(cursorOffset)

    expect(textarea.value).toBe(expectedContent)

    wrapper.unmount()
  })

  it('opens the table dimension picker from the Command Palette before inserting', async () => {
    const { wrapper } = await mountMarkdownStudioView()
    const textarea = wrapper.get('textarea').element as HTMLTextAreaElement
    const contentBeforeInsert = textarea.value
    const cursorOffset = 12
    textarea.setSelectionRange(cursorOffset, cursorOffset)

    dispatchWindowKeydown('k', { metaKey: true })
    await flushPromises()

    const commandPaletteInput = document.body.querySelector(
      'input[placeholder="Search commands"]',
    ) as HTMLInputElement | null
    expect(commandPaletteInput).not.toBeNull()

    const insertTableCommand = getButtonByText('Insert Table')
    expect(insertTableCommand).toBeDefined()
    insertTableCommand?.click()
    await flushPromises()

    expect(textarea.value).toBe(contentBeforeInsert)

    const columnInput = wrapper.get('input[aria-label="Columns"]').element as HTMLInputElement
    const rowInput = wrapper.get('input[aria-label="Rows"]').element as HTMLInputElement
    expect(columnInput.value).toBe('3')
    expect(rowInput.value).toBe('3')

    await wrapper.get('button[type="submit"]').trigger('click')
    await flushPromises()

    const expectedTable = generateTableTemplate({ columns: 3, rows: 3 })
    const expectedContent =
      contentBeforeInsert.slice(0, cursorOffset) +
      expectedTable +
      contentBeforeInsert.slice(cursorOffset)

    expect(textarea.value).toBe(expectedContent)

    wrapper.unmount()
  })

  it('suppresses global shortcuts while the table dimension picker is open', async () => {
    const { wrapper } = await mountMarkdownStudioView()

    await wrapper.get('button[aria-label="Insert table"]').trigger('click')
    await flushPromises()

    dispatchWindowKeydown('k', { metaKey: true })
    await flushPromises()

    expect(document.body.querySelector('input[placeholder="Search commands"]')).toBeNull()
    expect(wrapper.find('input[aria-label="Columns"]').exists()).toBe(true)

    wrapper.unmount()
  })

  it('inserts a non-default table when custom dimensions are confirmed', async () => {
    const { wrapper } = await mountMarkdownStudioView()
    const textarea = wrapper.get('textarea').element as HTMLTextAreaElement
    const contentBeforeInsert = textarea.value
    const cursorOffset = 12
    textarea.setSelectionRange(cursorOffset, cursorOffset)

    await wrapper.get('button[aria-label="Insert table"]').trigger('click')
    await flushPromises()

    await wrapper.get('input[aria-label="Columns"]').setValue('4')
    await wrapper.get('input[aria-label="Rows"]').setValue('2')
    await wrapper.get('button[type="submit"]').trigger('click')
    await flushPromises()

    const expectedTable = generateTableTemplate({ columns: 4, rows: 2 })
    const expectedContent =
      contentBeforeInsert.slice(0, cursorOffset) +
      expectedTable +
      contentBeforeInsert.slice(cursorOffset)

    expect(textarea.value).toBe(expectedContent)

    wrapper.unmount()
  })
})
