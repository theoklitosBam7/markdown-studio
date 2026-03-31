import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import MobileToolbarActions from '../MobileToolbarActions.vue'

describe('MobileToolbarActions', () => {
  let container: HTMLDivElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  function mountToolbar(overrides: Record<string, unknown> = {}) {
    return mount(MobileToolbarActions, {
      attachTo: container,
      props: {
        availableModes: ['editor', 'preview'],
        canInstall: false,
        canOpenDocuments: true,
        canSaveDocuments: true,
        isCopied: false,
        theme: 'light',
        viewMode: 'editor',
        ...overrides,
      },
    })
  }

  it('renders with brand name', () => {
    const wrapper = mountToolbar()

    expect(wrapper.find('.mobile-toolbar-actions__brand').exists()).toBe(true)
    expect(wrapper.text()).toContain('Markdown Studio')
  })

  it('renders ViewToggle with available modes', () => {
    const wrapper = mountToolbar({
      availableModes: ['editor', 'preview'],
      viewMode: 'editor',
    })

    expect(wrapper.find('[data-mode="editor"]').exists()).toBe(true)
    expect(wrapper.find('[data-mode="preview"]').exists()).toBe(true)
    expect(wrapper.find('[data-mode="split"]').exists()).toBe(false)
  })

  it('renders ThemeToggle', () => {
    const wrapper = mountToolbar({ theme: 'light' })

    expect(wrapper.find('button[aria-label="Switch to dark mode"]').exists()).toBe(true)
  })

  it('renders hamburger menu button', () => {
    const wrapper = mountToolbar()

    expect(wrapper.find('button[aria-label="Menu"]').exists()).toBe(true)
    expect(wrapper.find('.mobile-toolbar-actions__menu-btn').exists()).toBe(true)
  })

  it('opens action sheet when hamburger menu is clicked', async () => {
    mountToolbar()

    const menuButton = document.querySelector('button[aria-label="Menu"]')
    expect(menuButton).not.toBeNull()

    await menuButton?.dispatchEvent(new MouseEvent('click'))

    // Action sheet is teleported to body
    expect(document.querySelector('.mobile-action-sheet')).not.toBeNull()
    expect(document.querySelector('.mobile-action-sheet-backdrop')).not.toBeNull()
  })

  it('includes all CTAs in action sheet', async () => {
    mountToolbar({
      canInstall: true,
      canOpenDocuments: true,
      canSaveDocuments: true,
    })

    const menuButton = document.querySelector('button[aria-label="Menu"]')
    await menuButton?.dispatchEvent(new MouseEvent('click'))

    const actions = document.querySelectorAll('.mobile-action-sheet__action')
    const actionLabels = Array.from(actions).map((el) => el.textContent)

    // Check that each action is present (includes icon + label)
    expect(actionLabels.some((label) => label?.includes('Open'))).toBe(true)
    expect(actionLabels.some((label) => label?.includes('Save'))).toBe(true)
    expect(actionLabels.some((label) => label?.includes('Install App'))).toBe(true)
    expect(actionLabels.some((label) => label?.includes('Load Examples'))).toBe(true)
    expect(actionLabels.some((label) => label?.includes('Copy Markdown'))).toBe(true)
    expect(actionLabels.some((label) => label?.includes('Clear Document'))).toBe(true)
    expect(actionLabels.some((label) => label?.includes('Export as HTML'))).toBe(true)
    expect(actionLabels.some((label) => label?.includes('Export as PDF'))).toBe(true)
    expect(actionLabels.some((label) => label?.includes('View on GitHub'))).toBe(true)
  })

  it('disables pdf export with guidance when unavailable', async () => {
    mountToolbar({
      canExportPdf: false,
      pdfExportUnavailableReason:
        "PDF export isn't available on mobile or installed PWAs yet. Use Export as HTML instead.",
    })

    const menuButton = document.querySelector('button[aria-label="Menu"]')
    await menuButton?.dispatchEvent(new MouseEvent('click'))

    const actions = document.querySelectorAll('.mobile-action-sheet__action')
    const pdfAction = Array.from(actions).find((el) => el.textContent?.includes('Export as PDF'))

    expect(pdfAction).not.toBeNull()
    expect(pdfAction?.hasAttribute('disabled')).toBe(true)
    expect(pdfAction?.textContent).toContain('Use Export as HTML instead')
  })

  it('emits openDocument when Open action is clicked', async () => {
    const wrapper = mountToolbar({ canOpenDocuments: true })

    const menuButton = document.querySelector('button[aria-label="Menu"]')
    await menuButton?.dispatchEvent(new MouseEvent('click'))

    const actions = document.querySelectorAll('.mobile-action-sheet__action')
    const openAction = Array.from(actions).find((el) => el.textContent?.includes('Open'))

    await openAction?.dispatchEvent(new MouseEvent('click'))

    expect(wrapper.emitted('openDocument')).toHaveLength(1)
  })

  it('emits saveDocument when Save action is clicked', async () => {
    const wrapper = mountToolbar({ canSaveDocuments: true })

    const menuButton = document.querySelector('button[aria-label="Menu"]')
    await menuButton?.dispatchEvent(new MouseEvent('click'))

    const actions = document.querySelectorAll('.mobile-action-sheet__action')
    const saveAction = Array.from(actions).find((el) => el.textContent?.includes('Save'))

    await saveAction?.dispatchEvent(new MouseEvent('click'))

    expect(wrapper.emitted('saveDocument')).toHaveLength(1)
  })

  it('does not show Open/Save buttons outside action sheet', () => {
    const wrapper = mountToolbar({
      canOpenDocuments: true,
      canSaveDocuments: true,
    })

    // Open and Save should NOT be directly visible in toolbar
    // They should only be in the action sheet
    const toolbar = wrapper.find('.mobile-toolbar-actions')
    expect(toolbar.text()).not.toContain('Open')
    expect(toolbar.text()).not.toContain('Save')

    // Only hamburger menu should be visible in toolbar
    const menuButtons = wrapper.findAll('button[aria-label="Menu"]')
    expect(menuButtons.length).toBe(1)

    // Verify Open and Save are NOT in the DOM outside the action sheet
    const toolbarButtons = toolbar.findAll('button')
    const toolbarButtonLabels = Array.from(toolbarButtons).map((btn) => btn.text().toLowerCase())
    expect(toolbarButtonLabels.some((label) => label?.includes('open'))).toBe(false)
    expect(toolbarButtonLabels.some((label) => label?.includes('save'))).toBe(false)
  })

  it('uses brand-short on very small screens', () => {
    const wrapper = mountToolbar()

    expect(wrapper.find('.brand-short').exists()).toBe(true)
    expect(wrapper.find('.brand-full').exists()).toBe(true)
  })

  it('shows "Copied!" text when isCopied is true', async () => {
    mountToolbar({ isCopied: true })

    const menuButton = document.querySelector('button[aria-label="Menu"]')
    await menuButton?.dispatchEvent(new MouseEvent('click'))

    const actions = document.querySelectorAll('.mobile-action-sheet__action')
    const actionTexts = Array.from(actions).map((el) => el.textContent)

    expect(actionTexts.some((text) => text?.includes('Copied!'))).toBe(true)
  })

  it('emits update:viewMode when ViewToggle changes', async () => {
    const wrapper = mountToolbar({ viewMode: 'editor' })

    const previewButton = wrapper.find('[data-mode="preview"]')
    await previewButton.trigger('click')

    expect(wrapper.emitted('update:viewMode')).toHaveLength(1)
    expect(wrapper.emitted('update:viewMode')?.[0]).toEqual(['preview'])
  })

  it('emits update:theme when ThemeToggle changes', async () => {
    const wrapper = mountToolbar({ theme: 'light' })

    const themeButton = wrapper.find('button[aria-label="Switch to dark mode"]')
    await themeButton.trigger('click')

    expect(wrapper.emitted('update:theme')).toHaveLength(1)
  })

  it('opens GitHub in new tab when GitHub action is clicked', async () => {
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null)

    mountToolbar()

    const menuButton = document.querySelector('button[aria-label="Menu"]')
    await menuButton?.dispatchEvent(new MouseEvent('click'))

    const actions = document.querySelectorAll('.mobile-action-sheet__action')
    const githubAction = Array.from(actions).find((el) =>
      el.textContent?.includes('View on GitHub'),
    )

    expect(githubAction).not.toBeNull()
    await githubAction?.dispatchEvent(new MouseEvent('click'))

    expect(windowOpenSpy).toHaveBeenCalledWith(
      'https://github.com/theoklitosBam7/markdown-studio',
      '_blank',
      'noopener,noreferrer',
    )

    windowOpenSpy.mockRestore()
  })
})
