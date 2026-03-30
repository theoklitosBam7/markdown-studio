import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import Toolbar from '../Toolbar.vue'

function mountToolbar(overrides: Record<string, unknown> = {}) {
  const container = document.createElement('div')
  document.body.appendChild(container)

  return mount(Toolbar, {
    attachTo: container,
    props: {
      availableModes: ['editor', 'split', 'preview'],
      canOpenDocuments: true,
      canSaveDocuments: true,
      isCopied: false,
      isMobile: false,
      theme: 'light',
      viewMode: 'split',
      ...overrides,
    },
  })
}

describe('Toolbar', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders desktop controls with split mode available', () => {
    const wrapper = mountToolbar()

    expect(wrapper.find('.toolbar__desktop-controls').exists()).toBe(true)
    expect(wrapper.find('.toolbar__mobile-controls').exists()).toBe(false)
    expect(wrapper.text()).toContain('Open')
    expect(wrapper.text()).toContain('Save')
    expect(wrapper.get('[data-mode="split"]').text()).toBe('Split')
    expect(wrapper.find('button[aria-label="Switch to dark mode"]').exists()).toBe(true)
  })

  it('renders reachable mobile controls without split mode', () => {
    const wrapper = mountToolbar({
      availableModes: ['editor', 'preview'],
      isMobile: true,
      viewMode: 'editor',
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
    const wrapper = mountToolbar({
      availableModes: ['editor', 'preview'],
      canOpenDocuments: false,
      canSaveDocuments: false,
      viewMode: 'editor',
    })

    expect(wrapper.text()).not.toContain('Open')
    expect(wrapper.text()).not.toContain('Save')
  })

  describe('export menu', () => {
    it('closes the export menu when clicking outside', () => {
      const wrapper = mountToolbar()

      const summary = wrapper.get('.export-menu summary')
      summary.trigger('click')
      expect(wrapper.find('.export-menu').element.hasAttribute('open')).toBe(true)
      expect(wrapper.get('.export-menu__popover').isVisible()).toBe(true)

      document.body.click()
      expect(wrapper.find('.export-menu').element.hasAttribute('open')).toBe(false)
      expect(wrapper.get('.export-menu__popover').isVisible()).toBe(false)
    })

    it('keeps the export menu open when clicking inside the popover', () => {
      const wrapper = mountToolbar()

      const summary = wrapper.get('.export-menu summary')
      summary.trigger('click')
      expect(wrapper.find('.export-menu').element.hasAttribute('open')).toBe(true)

      wrapper.get('.export-menu__item').trigger('click')
      expect(wrapper.find('.export-menu').element.hasAttribute('open')).toBe(false)
    })

    it('removes the click-outside listener when the component is unmounted', () => {
      const wrapper = mountToolbar()
      const removeSpy = vi.spyOn(document, 'removeEventListener')

      wrapper.unmount()

      expect(removeSpy).toHaveBeenCalledWith('click', expect.any(Function), true)
      removeSpy.mockRestore()
    })
  })
})
