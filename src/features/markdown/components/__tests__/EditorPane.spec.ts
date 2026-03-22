import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import EditorPane from '../EditorPane.vue'

describe('EditorPane', () => {
  const originalGetComputedStyle = window.getComputedStyle

  afterEach(() => {
    window.getComputedStyle = originalGetComputedStyle
  })

  it('focuses the editor at an offset and centers the caret line', async () => {
    window.getComputedStyle = vi.fn(() => ({ lineHeight: '20px' }) as CSSStyleDeclaration)

    const wrapper = mount(EditorPane, {
      attachTo: document.body,
      props: {
        content: 'line 1\nline 2\nline 3\nline 4\nline 5\nline 6',
        lineCount: 6,
      },
    })

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
})
