import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'

enableAutoUnmount(afterEach)

import type { AppWindow } from '@/browser-window'

import EditorPane from '../EditorPane.vue'

function mountEditorPane(overrides: Record<string, unknown> = {}) {
  const wrapper = mount(EditorPane, {
    attachTo: document.body,
    props: {
      content: 'line 1\nline 2\nline 3\nline 4\nline 5\nline 6',
      findState: {
        activeMatchIndex: -1,
        isOpen: false,
        matchCase: false,
        matchCount: 0,
        matches: [],
        query: '',
        replaceText: '',
        showReplace: false,
      },
      'onUpdate:content': (content: string) => {
        void wrapper.setProps({ content })
      },
      ...overrides,
    },
  })
  return wrapper
}

describe('EditorPane', () => {
  const appWindow = window as AppWindow
  const originalGetComputedStyle = window.getComputedStyle
  const originalDesktop = appWindow.desktop

  beforeEach(() => {
    Object.defineProperty(Range.prototype, 'getBoundingClientRect', {
      configurable: true,
      value: function (this: Range) {
        return (
          this.startContainer.parentElement
            ?.closest('.match-overlay__line')
            ?.getBoundingClientRect() ?? new DOMRect()
        )
      },
    })
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      if (!this.classList.contains('match-overlay__line')) return new DOMRect()
      const index = Array.from(this.parentElement?.children ?? []).indexOf(this)
      return new DOMRect(0, 24 + index * 20, 400, 20)
    })
  })

  afterEach(() => {
    window.getComputedStyle = originalGetComputedStyle
    appWindow.desktop = originalDesktop
    vi.restoreAllMocks()
  })

  it('applies display preferences without replacing the editor or changing its selection or content', async () => {
    const wrapper = mountEditorPane()
    const editor = wrapper.get('textarea').element
    editor.setSelectionRange(2, 9, 'backward')
    await wrapper.setProps({
      displayPreferences: {
        fontSizePx: 20,
        lineHeight: 2,
        tabWidth: 4,
        wordWrap: false,
        writingColumn: { characters: 60, kind: 'characters' },
      },
    })

    expect(wrapper.get('textarea').element).toBe(editor)
    expect(wrapper.get('textarea').attributes('wrap')).toBe('off')
    expect(editor.selectionStart).toBe(2)
    expect(editor.selectionEnd).toBe(9)
    expect(editor.selectionDirection).toBe('backward')
    expect(wrapper.emitted('update:content')).toBeUndefined()
  })

  it('keeps the visible source line instead of jumping to an offscreen caret after reflow', async () => {
    let rowHeight = 20
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      if (!this.classList.contains('match-overlay__line')) return new DOMRect()
      const index = Array.from(this.parentElement?.children ?? []).indexOf(this)
      return new DOMRect(0, 24 + index * rowHeight, 400, rowHeight)
    })
    const wrapper = mountEditorPane()
    await wrapper.vm.$nextTick()
    const editor = wrapper.get('textarea').element
    editor.setSelectionRange(41, 41)
    editor.scrollTop = 65
    await wrapper.get('textarea').trigger('scroll')

    rowHeight = 40
    await wrapper.setProps({
      displayPreferences: {
        fontSizePx: 20,
        lineHeight: 2,
        tabWidth: 2,
        wordWrap: true,
        writingColumn: { characters: 80, kind: 'characters' },
      },
    })
    await vi.waitFor(() => expect(editor.scrollTop).toBe(105))
    expect(wrapper.vm.getScrollState()?.firstVisibleSourceOffset).toBe(14)
    expect(editor.selectionStart).toBe(41)
    expect(editor.selectionEnd).toBe(41)
  })

  it('preserves the current viewport when layout changes before the native scroll event', async () => {
    let rowHeight = 20
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      if (!this.classList.contains('match-overlay__line')) return new DOMRect()
      const index = Array.from(this.parentElement?.children ?? []).indexOf(this)
      return new DOMRect(0, 24 + index * rowHeight, 400, rowHeight)
    })
    const wrapper = mountEditorPane()
    await wrapper.vm.$nextTick()
    const editor = wrapper.get('textarea').element
    editor.scrollTop = 65

    await wrapper.setProps({
      displayPreferences: {
        fontSizePx: 20,
        lineHeight: 2,
        tabWidth: 2,
        wordWrap: true,
        writingColumn: { characters: 80, kind: 'characters' },
      },
    })
    rowHeight = 40
    await vi.waitFor(() => expect(editor.scrollTop).toBe(105))
    expect(wrapper.vm.getScrollState()?.firstVisibleSourceOffset).toBe(14)
  })

  it('reports the current document source position before the next scheduled measurement frame', async () => {
    const wrapper = mountEditorPane()
    await wrapper.vm.$nextTick()
    const editor = wrapper.get('textarea').element
    editor.scrollTop = 44
    await wrapper.get('textarea').trigger('scroll')
    await wrapper.setProps({ content: 'abcdefghij\n2\n3' })
    expect(wrapper.vm.getScrollState()?.firstVisibleSourceOffset).toBe(11)
  })

  it('shows line numbers for the active Markdown Document', async () => {
    const wrapper = mountEditorPane({
      content: 'Heading\n\nParagraph',
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.get('.editor-line-numbers').text()).toBe('123')

    wrapper.unmount()
  })

  it('numbers every source line in a long Markdown Document', async () => {
    const content = Array.from({ length: 61 }, (_, index) => `Line ${index + 1}`).join('\n')
    const wrapper = mountEditorPane({ content })
    await wrapper.vm.$nextTick()

    expect(wrapper.findAll('.editor-line-numbers li')).toHaveLength(61)
    expect(wrapper.get('.line-count').text()).toBe('61 lines')

    wrapper.unmount()
  })

  it('wraps selected source text in bold Markdown from the formatting toolbar', async () => {
    const wrapper = mountEditorPane({
      content: 'write this',
    })
    const editor = wrapper.get('textarea').element as HTMLTextAreaElement
    editor.focus()
    editor.setSelectionRange(6, 10)

    await wrapper.get('button[aria-label="Bold"]').trigger('click')
    await flushPromises()

    expect(editor.value).toBe('write **this**')
    expect(editor.selectionStart).toBe(8)
    expect(editor.selectionEnd).toBe(12)
    expect(wrapper.emitted('update:content')).toEqual([['write **this**']])

    wrapper.unmount()
  })

  it('highlights the initial logical line on render', async () => {
    window.getComputedStyle = vi.fn(
      () => ({ lineHeight: '20px', paddingTop: '24px' }) as CSSStyleDeclaration,
    )

    const wrapper = mountEditorPane()
    await wrapper.vm.$nextTick()

    expect(wrapper.get('.active-line-highlight').attributes('style')).toContain('height: 20px')
    expect(wrapper.get('.active-line-highlight').attributes('style')).toContain('top: 124px')

    wrapper.unmount()
  })

  it('follows a collapsed caret without requiring text selection', async () => {
    window.getComputedStyle = vi.fn(
      () => ({ lineHeight: '20px', paddingTop: '24px' }) as CSSStyleDeclaration,
    )

    const wrapper = mountEditorPane()
    const textarea = wrapper.get('textarea').element as HTMLTextAreaElement

    textarea.focus()
    textarea.setSelectionRange(14, 14)
    document.dispatchEvent(new Event('selectionchange'))
    await wrapper.vm.$nextTick()

    expect(textarea.selectionStart).toBe(textarea.selectionEnd)
    expect(wrapper.get('.active-line-highlight').attributes('style')).toContain('top: 64px')

    wrapper.unmount()
  })

  it('highlights the logical line containing the caret', async () => {
    window.getComputedStyle = vi.fn(
      () => ({ lineHeight: '20px', paddingTop: '24px' }) as CSSStyleDeclaration,
    )

    const wrapper = mountEditorPane()
    const textarea = wrapper.get('textarea').element as HTMLTextAreaElement

    textarea.setSelectionRange(14, 14)
    await wrapper.get('textarea').trigger('select')

    expect(wrapper.get('.active-line-highlight').attributes('style')).toContain('top: 64px')

    wrapper.unmount()
  })

  it('highlights the selection head for backward selections', async () => {
    window.getComputedStyle = vi.fn(
      () => ({ lineHeight: '20px', paddingTop: '24px' }) as CSSStyleDeclaration,
    )

    const wrapper = mountEditorPane()
    const textarea = wrapper.get('textarea').element as HTMLTextAreaElement

    textarea.setSelectionRange(0, 14, 'backward')
    await wrapper.get('textarea').trigger('select')

    expect(wrapper.get('.active-line-highlight').attributes('style')).toContain('top: 24px')

    wrapper.unmount()
  })

  it('retains a muted active-line highlight when editor focus moves elsewhere', async () => {
    const wrapper = mountEditorPane()
    const textarea = wrapper.get('textarea')

    await textarea.trigger('focus')
    expect(wrapper.get('.active-line-highlight').classes()).toContain(
      'active-line-highlight--focused',
    )

    await textarea.trigger('blur')
    expect(wrapper.find('.active-line-highlight').exists()).toBe(true)
    expect(wrapper.get('.active-line-highlight').classes()).not.toContain(
      'active-line-highlight--focused',
    )

    wrapper.unmount()
  })

  it('keeps the active-line highlight synchronized with editor scrolling', async () => {
    window.getComputedStyle = vi.fn(
      () => ({ lineHeight: '20px', paddingTop: '24px' }) as CSSStyleDeclaration,
    )

    const wrapper = mountEditorPane()
    const textarea = wrapper.get('textarea').element as HTMLTextAreaElement

    textarea.setSelectionRange(14, 14)
    await wrapper.get('textarea').trigger('select')
    textarea.scrollTop = 30
    await wrapper.get('textarea').trigger('scroll')

    expect(wrapper.get('.active-line-highlight').attributes('style')).toContain('top: 34px')

    wrapper.unmount()
  })

  it('scrolls the Find mirror in both axes while keeping the gutter fixed horizontally', async () => {
    const wrapper = mountEditorPane()
    const textarea = wrapper.get('textarea').element
    textarea.scrollLeft = 120
    textarea.scrollTop = 30
    await wrapper.get('textarea').trigger('scroll')

    expect(wrapper.get('.match-overlay__content').attributes('style')).toContain(
      'translate(-120px, -30px)',
    )
    expect(wrapper.get('.editor-line-numbers').attributes('style') ?? '').not.toContain(
      'translateX',
    )
  })

  it('updates the active-line highlight after programmatic selection', async () => {
    window.getComputedStyle = vi.fn(
      () => ({ lineHeight: '20px', paddingTop: '24px' }) as CSSStyleDeclaration,
    )

    const wrapper = mountEditorPane()
    const textarea = wrapper.get('textarea').element as HTMLTextAreaElement
    Object.defineProperty(textarea, 'clientHeight', { configurable: true, value: 80 })

    await (
      wrapper.vm as unknown as {
        setSelectionRange: (start: number, end: number) => Promise<void>
      }
    ).setSelectionRange(21, 21)

    expect(wrapper.get('.active-line-highlight').attributes('style')).toContain('top: 40px')

    wrapper.unmount()
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
    expect(textarea.scrollTop).toBe(44)
    expect(wrapper.emitted('scroll')).toEqual([
      [
        {
          firstVisibleSourceOffset: 7,
          scrollTop: 44,
        },
      ],
    ])

    wrapper.unmount()
  })

  it('inserts the chosen number of spaces through the native edit path on Tab', async () => {
    const wrapper = mountEditorPane({
      content: 'beforeSELECTafter',
      displayPreferences: {
        fontSizePx: 16,
        lineHeight: 1.7,
        tabWidth: 4,
        wordWrap: true,
        writingColumn: { kind: 'full-width' },
      },
    })
    const editor = wrapper.get('textarea').element
    editor.focus()
    editor.setSelectionRange(6, 12)
    const insert = vi.fn((_command: string, _showUi: boolean, text: string) => {
      editor.setRangeText(text, editor.selectionStart, editor.selectionEnd, 'end')
      editor.dispatchEvent(new Event('input', { bubbles: true }))
      return true
    })
    Object.defineProperty(document, 'execCommand', { configurable: true, value: insert })
    await wrapper.get('textarea').trigger('keydown', { key: 'Tab' })
    await flushPromises()
    expect(insert).toHaveBeenCalledWith('insertText', false, '    ')
    expect(editor.value).toBe('before    after')
    expect(editor.selectionStart).toBe(10)
    expect(editor.selectionEnd).toBe(10)
  })

  it('leaves modified Tab keys to normal browser focus and platform behavior', () => {
    const wrapper = mountEditorPane()
    const editor = wrapper.get('textarea').element
    for (const modifier of ['shiftKey', 'altKey', 'ctrlKey', 'metaKey']) {
      const event = new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        key: 'Tab',
        [modifier]: true,
      })
      editor.dispatchEvent(event)
      expect(event.defaultPrevented).toBe(false)
    }
    expect(wrapper.emitted('update:content')).toBeUndefined()
  })

  it('emits find and replace shortcut requests from the editor textarea', async () => {
    const wrapper = mountEditorPane()

    await wrapper.get('textarea').trigger('keydown', { ctrlKey: true, key: 'f' })
    await wrapper.get('textarea').trigger('keydown', { key: 'h', metaKey: true })

    expect(wrapper.emitted('find-action')).toEqual([[{ type: 'open' }], [{ type: 'open-replace' }]])
  })

  it('renders the inline find UI and emits navigation and close actions', async () => {
    const wrapper = mountEditorPane({
      findState: {
        activeMatchIndex: 1,
        isOpen: true,
        matchCase: false,
        matchCount: 3,
        matches: [
          { end: 4, index: 0, length: 4 },
          { end: 10, index: 6, length: 4 },
          { end: 16, index: 12, length: 4 },
        ],
        query: 'line',
        replaceText: 'row',
        showReplace: true,
      },
    })

    expect(wrapper.text()).toContain('2 of 3')

    const [queryInput, replaceInput] = wrapper.findAll('input')

    expect(queryInput).toBeDefined()
    expect(replaceInput).toBeDefined()

    await queryInput!.trigger('keydown', { key: 'Enter' })
    await queryInput!.trigger('keydown', { key: 'Enter', shiftKey: true })
    await replaceInput!.trigger('keydown', { key: 'Escape' })

    expect(wrapper.emitted('find-action')).toEqual([
      [{ type: 'next' }],
      [{ type: 'previous' }],
      [{ type: 'close' }],
    ])
  })

  it('disables replace actions when there are no matches', () => {
    const wrapper = mountEditorPane({
      findState: {
        activeMatchIndex: -1,
        isOpen: true,
        matchCase: false,
        matchCount: 0,
        matches: [],
        query: 'missing',
        replaceText: '',
        showReplace: true,
      },
    })

    const replaceButtons = wrapper
      .findAll('button')
      .filter((button) => ['Replace', 'Replace All'].includes(button.text()))

    expect(replaceButtons).toHaveLength(2)
    expect(replaceButtons.every((button) => button.attributes('disabled') !== undefined)).toBe(true)
  })

  it('highlights the editor while an image is dragged over it', async () => {
    const wrapper = mountEditorPane({ documentPath: '/tmp/notes.md' })
    const pane = wrapper.get('.editor-pane')
    await pane.trigger('dragover', {
      dataTransfer: {
        files: [],
        items: [{ kind: 'file', type: 'image/png' }],
      },
    })
    expect(wrapper.get('.image-drop-overlay').isVisible()).toBe(true)
    expect(wrapper.get('.image-drop-label').text()).toBe('Drop image to add it')

    await pane.trigger('dragleave')
    expect(wrapper.get('.image-drop-overlay').isVisible()).toBe(false)
  })

  it('does not highlight unsupported files', async () => {
    const wrapper = mountEditorPane({ documentPath: '/tmp/notes.md' })
    const pane = wrapper.get('.editor-pane')
    const textFile = new File(['notes'], 'notes.txt', { type: 'text/plain' })

    await pane.trigger('dragover', { dataTransfer: { files: [textFile] } })

    expect(wrapper.get('.image-drop-overlay').isVisible()).toBe(false)
  })

  it('saves a dropped image and inserts Markdown at the cursor on desktop', async () => {
    const insertText = vi.fn(async (value: string) => {
      const textarea = document.activeElement as HTMLTextAreaElement
      textarea.setRangeText(value, textarea.selectionStart, textarea.selectionEnd, 'end')
      textarea.dispatchEvent(new Event('input', { bubbles: true }))
    })
    const saveImage = vi.fn(async () => ({
      filename: 'diagram.png',
      relativePath: './.markdown-studio/assets/diagram.png',
    }))
    appWindow.desktop = {
      commands: { onAppCommand: () => () => undefined },
      documents: {
        clearLastOpened: async () => undefined,
        clearWorkspaceDraft: async () => undefined,
        open: async () => null,
        restoreLastOpened: async () => null,
        restoreWorkspaceDraft: async () => null,
        save: async () => null,
        saveAs: async () => null,
        saveWorkspaceDraft: async () => undefined,
      },
      editing: { insertText },
      exports: { exportHtml: async () => null, exportPdf: async () => null },
      images: { save: saveImage },
      install: { isHomebrew: async () => false },
      isDesktop: true,
      shell: { openExternal: async () => undefined },
    }

    const wrapper = mountEditorPane({
      content: 'before after',
      documentPath: '/tmp/notes.md',
    })
    const textarea = wrapper.get('textarea').element as HTMLTextAreaElement
    textarea.value = 'before after'
    textarea.setSelectionRange(6, 6)
    const file = new File([new Uint8Array([1, 2, 3])], 'Diagram.png', { type: 'image/png' })
    Object.defineProperty(file, 'arrayBuffer', {
      value: async () => new Uint8Array([1, 2, 3]).buffer,
    })

    await wrapper.get('.editor-pane').trigger('drop', {
      dataTransfer: { files: [file] },
    })
    await flushPromises()

    expect(saveImage).toHaveBeenCalledWith({
      data: new Uint8Array([1, 2, 3]),
      documentPath: '/tmp/notes.md',
      filename: 'Diagram.png',
    })
    expect(insertText).toHaveBeenCalledWith('![diagram.png](./.markdown-studio/assets/diagram.png)')
    expect(textarea.value).toBe('before![diagram.png](./.markdown-studio/assets/diagram.png) after')
  })

  it('ignores image drops for an unsaved Markdown Document', async () => {
    const saveImage = vi.fn()
    appWindow.desktop = {
      commands: { onAppCommand: () => () => undefined },
      documents: {
        clearLastOpened: async () => undefined,
        clearWorkspaceDraft: async () => undefined,
        open: async () => null,
        restoreLastOpened: async () => null,
        restoreWorkspaceDraft: async () => null,
        save: async () => null,
        saveAs: async () => null,
        saveWorkspaceDraft: async () => undefined,
      },
      editing: { insertText: vi.fn() },
      exports: { exportHtml: async () => null, exportPdf: async () => null },
      images: { save: saveImage },
      install: { isHomebrew: async () => false },
      isDesktop: true,
      shell: { openExternal: async () => undefined },
    }
    const wrapper = mountEditorPane({ documentPath: null })
    const image = new File(['image'], 'diagram.png', { type: 'image/png' })

    await wrapper.get('.editor-pane').trigger('drop', {
      dataTransfer: { files: [image] },
    })

    expect(saveImage).not.toHaveBeenCalled()
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
        insertText,
      },
      exports: {
        exportHtml: async () => null,
        exportPdf: async () => null,
      },
      install: {
        isHomebrew: async () => false,
      },
      isDesktop: true,
      shell: {
        openExternal: async () => undefined,
      },
    }

    const wrapper = mountEditorPane({
      content: 'item one item two',
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

  it('inserts text at the current cursor position on web', async () => {
    const wrapper = mountEditorPane({
      content: 'before after',
    })

    const textarea = wrapper.get('textarea').element as HTMLTextAreaElement
    textarea.value = 'before after'
    textarea.setSelectionRange(6, 6)

    const execCommandSpy = vi.fn((_command: string, _showUi: boolean, value?: string) => {
      textarea.setRangeText(String(value), textarea.selectionStart, textarea.selectionEnd, 'end')
      textarea.dispatchEvent(new Event('input', { bubbles: true }))
      return true
    })

    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: execCommandSpy,
    })

    await (wrapper.vm as unknown as { insertText: (text: string) => Promise<void> }).insertText(
      '| table |',
    )

    expect(textarea.value).toBe('before| table | after')
    expect(execCommandSpy).toHaveBeenCalledWith('insertText', false, '| table |')
    expect(wrapper.emitted('update:content')).toEqual([['before| table | after']])
  })

  it('does not move focus away from the editor when clicking find controls', async () => {
    const wrapper = mountEditorPane({
      content: 'item one item two',
      findState: {
        activeMatchIndex: 0,
        isOpen: true,
        matchCase: false,
        matchCount: 2,
        matches: [
          { end: 4, index: 0, length: 4 },
          { end: 13, index: 9, length: 4 },
        ],
        query: 'item',
        replaceText: '',
        showReplace: false,
      },
    })

    const textarea = wrapper.get('textarea').element as HTMLTextAreaElement
    textarea.focus()
    expect(document.activeElement).toBe(textarea)

    await wrapper.get('button').trigger('mousedown')

    expect(document.activeElement).toBe(textarea)
  })
})
