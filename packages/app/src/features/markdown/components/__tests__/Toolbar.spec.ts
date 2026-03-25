import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Toolbar from '../Toolbar.vue'

describe('Toolbar', () => {
  it('renders desktop controls with split mode available', () => {
    const wrapper = mount(Toolbar, {
      props: {
        availableModes: ['editor', 'split', 'preview'],
        canOpenDocuments: true,
        canSaveDocuments: true,
        isCopied: false,
        isMobile: false,
        theme: 'light',
        viewMode: 'split',
      },
    })

    expect(wrapper.find('.toolbar__desktop-controls').exists()).toBe(true)
    expect(wrapper.find('.toolbar__mobile-controls').exists()).toBe(false)
    expect(wrapper.text()).toContain('Open')
    expect(wrapper.text()).toContain('Save')
    expect(wrapper.get('[data-mode="split"]').text()).toBe('Split')
    expect(wrapper.find('button[aria-label="Switch to dark mode"]').exists()).toBe(true)
  })

  it('renders reachable mobile controls without split mode', () => {
    const wrapper = mount(Toolbar, {
      props: {
        availableModes: ['editor', 'preview'],
        canOpenDocuments: true,
        canSaveDocuments: true,
        isCopied: false,
        isMobile: true,
        theme: 'light',
        viewMode: 'editor',
      },
    })

    expect(wrapper.find('.toolbar__mobile-controls').exists()).toBe(true)
    expect(wrapper.findAll('[data-mode="split"]')).toHaveLength(0)
    expect(wrapper.find('.toolbar__mobile-controls [data-mode="editor"]').exists()).toBe(true)
    expect(wrapper.find('.toolbar__mobile-controls [data-mode="preview"]').exists()).toBe(true)
    expect(
      wrapper.find('.toolbar__mobile-controls button[aria-label="Switch to dark mode"]').exists(),
    ).toBe(true)
  })

  it('hides open and save when document actions are unavailable', () => {
    const wrapper = mount(Toolbar, {
      props: {
        availableModes: ['editor', 'preview'],
        canOpenDocuments: false,
        canSaveDocuments: false,
        isCopied: false,
        isMobile: false,
        theme: 'light',
        viewMode: 'editor',
      },
    })

    expect(wrapper.text()).not.toContain('Open')
    expect(wrapper.text()).not.toContain('Save')
  })
})
