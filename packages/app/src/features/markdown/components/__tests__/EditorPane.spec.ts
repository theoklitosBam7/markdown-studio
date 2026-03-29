import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { AppWindow } from '@/browser-window'

import EditorPane from '../EditorPane.vue'

function mountEditorPane(overrides: Record<string, unknown> = {}) {
  return mount(EditorPane, {
    attachTo: document.body,
    props: {
      activeMatchIndex: -1,
      content: 'line 1\nline 2\nline 3\nline 4\nline 5\nline 6',
      findOpen: false,
      lineCount: 6,
      matchCase: false,
      matchCount: 0,
      matches: [],
      query: '',
      replaceText: '',
      showReplace: false,
      ...overrides,
    },
  })
}

describe('EditorPane', () => {
  const appWindow = window as AppWindow
  const originalGetComputedStyle = window.getComputedStyle
  const originalDesktop = appWindow.desktop

  afterEach(() => {
    window.getComputedStyle = originalGetComputedStyle
    appWindow.desktop = originalDesktop
    vi.restoreAllMocks()
  })

  it('focuses the editor at an offset and centers the caret line', async () => {
    window.getComputedStyle = vi.fn(() => ({ lineHeight: '20px' }) as CSSStyleDeclaration)

    const wrapper = mountEditorPane()

    const textarea = wrapper.get('textarea').element as HTMLTextAreaElement
    Object.defineProperty(textarea, 'clientHeight', { configurable: true, value: 80 })
    Object.defineProperty(textarea, 'scrollHeight', { configurable: true, value: 300 })
    let scrollTop = 0
    Object.defineProperty(textarea, 'scrollTop', {
      configurable: true,
      get: () => scrollTop,
      set: (value: number) => {
        scrollTop = value
        textarea.dispatchEvent(new Event('scroll'))
      },
    })

    await (
      wrapper.vm as unknown as { focusAtOffset: (offset: number) => Promise<void> }
    ).focusAtOffset(21)

    expect(document.activeElement).toBe(textarea)
    expect(textarea.selectionStart).toBe(21)
    expect(textarea.selectionEnd).toBe(21)
    expect(textarea.scrollTop).toBe(20)
    expect(wrapper.emitted('scroll')).toEqual([
      [
        {
          clientHeight: 80,
          contentLength: 41,
          lineHeight: 20,
          scrollHeight: 300,
          scrollTop: 20,
        },
      ],
    ])

    wrapper.unmount()
  })

  it('emits find and replace shortcut requests from the editor textarea', async () => {
    const wrapper = mountEditorPane()

    await wrapper.get('textarea').trigger('keydown', { ctrlKey: true, key: 'f' })
    await wrapper.get('textarea').trigger('keydown', { key: 'h', metaKey: true })

    expect(wrapper.emitted('request-find')).toHaveLength(1)
    expect(wrapper.emitted('request-replace')).toHaveLength(1)
  })

  it('renders the inline find UI and emits navigation and close actions', async () => {
    const wrapper = mountEditorPane({
      activeMatchIndex: 1,
      findOpen: true,
      matchCount: 3,
      matches: [
        { end: 4, index: 0, length: 4 },
        { end: 10, index: 6, length: 4 },
        { end: 16, index: 12, length: 4 },
      ],
      query: 'line',
      replaceText: 'row',
      showReplace: true,
    })

    expect(wrapper.text()).toContain('2 of 3')

    const [queryInput, replaceInput] = wrapper.findAll('input')

    expect(queryInput).toBeDefined()
    expect(replaceInput).toBeDefined()

    await queryInput!.trigger('keydown', { key: 'Enter' })
    await queryInput!.trigger('keydown', { key: 'Enter', shiftKey: true })
    await replaceInput!.trigger('keydown', { key: 'Escape' })

    expect(wrapper.emitted('find:next')).toHaveLength(1)
    expect(wrapper.emitted('find:previous')).toHaveLength(1)
    expect(wrapper.emitted('find:close')).toHaveLength(1)
  })

  it('disables replace actions when there are no matches', () => {
    const wrapper = mountEditorPane({
      findOpen: true,
      matchCount: 0,
      query: 'missing',
      showReplace: true,
    })

    const replaceButtons = wrapper
      .findAll('button')
      .filter((button) => ['Replace', 'Replace All'].includes(button.text()))

    expect(replaceButtons).toHaveLength(2)
    expect(replaceButtons.every((button) => button.attributes('disabled') !== undefined)).toBe(true)
  })

  it('prefers the Electron native edit path on desktop', async () => {
    const insertText = vi.fn(async (value: string) => {
      const textarea = document.activeElement as HTMLTextAreaElement
      textarea.setRangeText(value, textarea.selectionStart, textarea.selectionEnd, 'end')
      textarea.dispatchEvent(new Event('input', { bubbles: true }))
    })

    appWindow.desktop = {
      commands: {
        onAppCommand: () => () => undefined,
      },
      documents: {
        open: async () => null,
        save: async () => null,
        saveAs: async () => null,
      },
      editing: {
        insertText,
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

    const wrapper = mountEditorPane({
      content: 'item one item two',
      lineCount: 1,
    })

    const textarea = wrapper.get('textarea').element as HTMLTextAreaElement
    textarea.value = 'item one item two'

    await (
      wrapper.vm as unknown as {
        replaceRange: (start: number, end: number, replacement: string) => Promise<void>
      }
    ).replaceRange(0, 4, 'entry')

    expect(insertText).toHaveBeenCalledWith('entry')
    expect(textarea.value).toBe('entry one item two')
    expect(wrapper.emitted('update:content')).toEqual([['entry one item two']])
  })

  it('prefers the native browser edit command for replacements on web', async () => {
    const wrapper = mountEditorPane({
      content: 'item one item two',
      lineCount: 1,
    })

    const textarea = wrapper.get('textarea').element as HTMLTextAreaElement
    textarea.value = 'item one item two'
    const execCommandSpy = vi.fn((_command: string, _showUi: boolean, value?: string) => {
      textarea.setRangeText(String(value), textarea.selectionStart, textarea.selectionEnd, 'end')
      textarea.dispatchEvent(new Event('input', { bubbles: true }))
      return true
    })

    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: execCommandSpy,
    })

    await (
      wrapper.vm as unknown as {
        replaceRange: (start: number, end: number, replacement: string) => Promise<void>
      }
    ).replaceRange(0, 4, 'entry')

    expect(textarea.value).toBe('entry one item two')
    expect(execCommandSpy).toHaveBeenCalledWith('insertText', false, 'entry')
    expect(wrapper.emitted('update:content')).toEqual([['entry one item two']])
  })

  it('falls back to setRangeText when execCommand is unavailable', async () => {
    const wrapper = mountEditorPane({
      content: 'item one item two',
      lineCount: 1,
    })

    const textarea = wrapper.get('textarea').element as HTMLTextAreaElement
    textarea.value = 'item one item two'

    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: vi.fn(() => false),
    })

    await (
      wrapper.vm as unknown as {
        replaceRange: (start: number, end: number, replacement: string) => Promise<void>
      }
    ).replaceRange(0, 4, 'entry')

    expect(textarea.value).toBe('entry one item two')
    expect(wrapper.emitted('update:content')).toEqual([['entry one item two']])
  })

  it('does not move focus away from the editor when clicking find controls', async () => {
    const wrapper = mountEditorPane({
      activeMatchIndex: 0,
      content: 'item one item two',
      findOpen: true,
      lineCount: 1,
      matchCount: 2,
      matches: [
        { end: 4, index: 0, length: 4 },
        { end: 13, index: 9, length: 4 },
      ],
      query: 'item',
    })

    const textarea = wrapper.get('textarea').element as HTMLTextAreaElement
    textarea.focus()
    expect(document.activeElement).toBe(textarea)

    await wrapper.get('button').trigger('mousedown')

    expect(document.activeElement).toBe(textarea)
  })
})
