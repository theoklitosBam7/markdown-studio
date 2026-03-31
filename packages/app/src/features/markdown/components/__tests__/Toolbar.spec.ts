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
    expect(wrapper.find('.mobile-toolbar-actions').exists()).toBe(false)
    expect(wrapper.text()).toContain('Open')
    expect(wrapper.text()).toContain('Save')
    expect(wrapper.get('[data-mode="split"]').text()).toBe('Split')
    expect(wrapper.find('button[aria-label="Switch to dark mode"]').exists()).toBe(true)
  })

  it('renders GitHub link on desktop', () => {
    const wrapper = mountToolbar()

    const githubLink = wrapper.find('a.github-link')
    expect(githubLink.exists()).toBe(true)
    expect(githubLink.attributes('href')).toBe('https://github.com/theoklitosBam7/markdown-studio')
    expect(githubLink.attributes('target')).toBe('_blank')
    expect(githubLink.attributes('rel')).toBe('noopener noreferrer')
    expect(githubLink.text()).toContain('GitHub')
  })

  it('renders mobile layout with hamburger menu', () => {
    const wrapper = mountToolbar({
      availableModes: ['editor', 'preview'],
      isMobile: true,
      viewMode: 'editor',
    })

    // Mobile should not show desktop controls
    expect(wrapper.find('.toolbar__desktop-controls').exists()).toBe(false)
    expect(wrapper.find('.export-menu').exists()).toBe(false)

    // Mobile should show new mobile toolbar
    expect(wrapper.find('.mobile-toolbar-actions').exists()).toBe(true)

    // Should have ViewToggle with editor/preview modes (no split)
    expect(wrapper.findAll('[data-mode="split"]')).toHaveLength(0)
    expect(wrapper.find('.mobile-toolbar-actions [data-mode="editor"]').exists()).toBe(true)
    expect(wrapper.find('.mobile-toolbar-actions [data-mode="preview"]').exists()).toBe(true)

    // Should have hamburger menu button
    expect(wrapper.find('.mobile-toolbar-actions__menu-btn').exists()).toBe(true)
    expect(wrapper.find('button[aria-label="Menu"]').exists()).toBe(true)

    // Should have theme toggle
    expect(
      wrapper.find('.mobile-toolbar-actions button[aria-label="Switch to dark mode"]').exists(),
    ).toBe(true)
  })

  it('opens action sheet when hamburger menu is clicked', async () => {
    const wrapper = mountToolbar({
      availableModes: ['editor', 'preview'],
      isMobile: true,
      viewMode: 'editor',
    })

    const menuButton = wrapper.find('button[aria-label="Menu"]')
    expect(menuButton.exists()).toBe(true)

    await menuButton.trigger('click')

    // Action sheet is teleported to body, check document
    expect(document.querySelector('.mobile-action-sheet')).not.toBeNull()
    expect(document.querySelector('.mobile-action-sheet-backdrop')).not.toBeNull()
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

  it('renders an install action only when installation is available', async () => {
    const wrapper = mountToolbar({
      canInstall: true,
    })

    const installButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Install'))

    expect(installButton).toBeDefined()

    await installButton?.trigger('click')

    expect(installButton?.classes()).toContain('toolbar-btn--primary')
    expect(wrapper.emitted('install')).toHaveLength(1)
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
