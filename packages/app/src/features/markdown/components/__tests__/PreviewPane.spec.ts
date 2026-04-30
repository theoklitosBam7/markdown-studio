import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import type { AppWindow } from '../../../../browser-window'

import PreviewPane from '../PreviewPane.vue'

describe('PreviewPane', () => {
  const appWindow = window as AppWindow
  const originalDesktop = appWindow.desktop

  beforeEach(() => {
    appWindow.desktop = undefined
  })

  afterEach(() => {
    appWindow.desktop = originalDesktop
  })

  it('rerenders mermaid diagrams when the theme changes', async () => {
    const wrapper = mount(PreviewPane, {
      props: {
        html: '<div class="mermaid-wrap"><div class="mermaid">graph TD; A-->B;</div></div>',
        sourceMap: [],
        theme: 'light',
        wordCount: 1,
      },
    })

    await nextTick()
    await nextTick()

    expect(wrapper.emitted('renderDiagrams')).toHaveLength(1)
    const initialPreview = wrapper.find('.rendered-md').element

    await wrapper.setProps({ theme: 'dark' })
    await nextTick()
    await nextTick()

    expect(wrapper.emitted('renderDiagrams')).toHaveLength(2)
    expect(wrapper.find('.rendered-md').element).not.toBe(initialPreview)
    expect(wrapper.find('.mermaid').exists()).toBe(true)
  })

  it('emits the matching source offset when preview content is double clicked', async () => {
    const wrapper = mount(PreviewPane, {
      props: {
        html: '<p data-source-id="block-1" data-source-start="12" data-source-end="24">Hello</p>',
        sourceMap: [{ end: 24, id: 'block-1', start: 12, type: 'paragraph' }],
        theme: 'light',
        wordCount: 1,
      },
    })

    await nextTick()
    await wrapper.get('[data-source-id="block-1"]').trigger('dblclick')

    expect(wrapper.emitted('jumpToOffset')).toEqual([[12]])
  })

  it('preserves source attributes across sanitization and rerenders', async () => {
    const wrapper = mount(PreviewPane, {
      props: {
        html: '<p data-source-id="block-1" data-source-start="0" data-source-end="5">Hello</p>',
        sourceMap: [{ end: 5, id: 'block-1', start: 0, type: 'paragraph' }],
        theme: 'light',
        wordCount: 1,
      },
    })

    await nextTick()

    let sourceElement = wrapper.get('[data-source-id="block-1"]')
    expect(sourceElement.attributes('data-source-start')).toBe('0')
    expect(sourceElement.attributes('data-source-end')).toBe('5')

    await wrapper.setProps({ theme: 'dark' })
    await nextTick()
    await nextTick()

    sourceElement = wrapper.get('[data-source-id="block-1"]')
    expect(sourceElement.attributes('data-source-start')).toBe('0')
    expect(sourceElement.attributes('data-source-end')).toBe('5')
  })

  it('strips iframe embeds in desktop mode and opens safe external links via the shell bridge', async () => {
    const openExternal = vi.fn(async () => undefined)
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
        exportHtml: async () => null,
        exportPdf: async () => null,
      },
      isDesktop: true,
      shell: {
        openExternal,
      },
    }

    const wrapper = mount(PreviewPane, {
      props: {
        html: '<iframe src="https://example.com"></iframe><p><a href="https://example.com">Read more</a></p>',
        sourceMap: [],
        theme: 'light',
        wordCount: 2,
      },
    })

    await nextTick()
    expect(wrapper.html()).not.toContain('<iframe')

    await wrapper.get('a').trigger('click')
    expect(openExternal).toHaveBeenCalledWith('https://example.com/')
  })
})
