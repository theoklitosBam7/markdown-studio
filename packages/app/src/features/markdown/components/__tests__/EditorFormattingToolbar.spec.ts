import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vite-plus/test'

import EditorFormattingToolbar from '../EditorFormattingToolbar.vue'

describe('EditorFormattingToolbar', () => {
  it('shows accessible controls for common Markdown formatting', () => {
    const wrapper = mount(EditorFormattingToolbar)

    expect(wrapper.get('[aria-label="Editor formatting"]').isVisible()).toBe(true)
    expect(wrapper.get('button[aria-label="Undo"]').isVisible()).toBe(true)
    expect(wrapper.get('button[aria-label="Redo"]').isVisible()).toBe(true)
    expect(wrapper.get('select[aria-label="Set heading level"]').isVisible()).toBe(true)
    expect(wrapper.get('button[aria-label="Bold"]').isVisible()).toBe(true)
    expect(wrapper.get('button[aria-label="Italic"]').isVisible()).toBe(true)
    expect(wrapper.get('button[aria-label="Insert link"]').isVisible()).toBe(true)
    expect(wrapper.get('button[aria-label="Inline code"]').isVisible()).toBe(true)
    expect(wrapper.get('button[aria-label="Bulleted list"]').isVisible()).toBe(true)
    expect(wrapper.get('button[aria-label="More formatting"]').isVisible()).toBe(true)

    wrapper.unmount()
  })

  it('emits formatting commands from toolbar controls', async () => {
    const wrapper = mount(EditorFormattingToolbar)

    await wrapper.get('button[aria-label="Bold"]').trigger('click')
    await wrapper.get('button[aria-label="Undo"]').trigger('click')

    expect(wrapper.emitted('format')).toEqual([
      [{ style: 'bold', type: 'style' }],
      [{ direction: 'undo', type: 'history' }],
    ])

    wrapper.unmount()
  })

  it('emits heading and block formatting commands', async () => {
    const wrapper = mount(EditorFormattingToolbar)

    await wrapper.get('select[aria-label="Set heading level"]').setValue('2')
    await wrapper.get('button[aria-label="More formatting"]').trigger('click')
    expect(wrapper.get('button[aria-label="More formatting"]').attributes('aria-expanded')).toBe(
      'true',
    )
    expect(wrapper.get('.editor-formatting-toolbar__menu').isVisible()).toBe(true)
    await wrapper.get('.editor-formatting-toolbar__menu button').trigger('click')

    expect(wrapper.emitted('format')).toEqual([
      [{ level: 2, type: 'heading' }],
      [{ style: 'numbered-list', type: 'block' }],
    ])

    wrapper.unmount()
  })
})
