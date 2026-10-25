import type { VueWrapper } from '@vue/test-utils'

import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import { nextTick } from 'vue'

import Toolbar from '../Toolbar.vue'

const wrappers: VueWrapper[] = []

function mountToolbar(overrides: Record<string, unknown> = {}) {
  const container = document.createElement('div')
  document.body.appendChild(container)

  const wrapper = mount(Toolbar, {
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

  wrappers.push(wrapper)

  return wrapper
}

describe('Toolbar', () => {
  afterEach(async () => {
    for (const wrapper of wrappers) {
      wrapper.unmount()
    }
    wrappers.length = 0
    await nextTick()
    document.body.innerHTML = ''
  })

  it('renders desktop controls with split mode available', () => {
    const wrapper = mountToolbar()

    expect(wrapper.find('.toolbar__desktop-controls').exists()).toBe(true)
    expect(wrapper.find('.mobile-toolbar-actions').exists()).toBe(false)
    expect(wrapper.get('[data-mode="split"]').text()).toBe('Split')
    expect(wrapper.find('button[aria-label="Switch to dark mode"]').exists()).toBe(true)
    expect(wrapper.find('.toolbar__brand-group').exists()).toBe(false)
    expect(wrapper.find('.toolbar__actions').exists()).toBe(false)
  })

  it('uses a Lucide icon for the keyboard shortcuts control', () => {
    const wrapper = mountToolbar()

    expect(wrapper.find('button[aria-label="Keyboard shortcuts"] svg.lucide').exists()).toBe(true)
  })

  it('shows the active Markdown Document and its unsaved state', () => {
    const wrapper = mountToolbar({
      documentName: 'draft.md',
      isDirty: true,
    })

    expect(wrapper.get('.toolbar__document strong').text()).toBe('draft.md')
    expect(wrapper.get('.toolbar__document-status').text()).toBe('Unsaved changes')
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

  it('renders keyboard shortcuts as an accessible icon control', async () => {
    const wrapper = mountToolbar()

    const shortcutsButton = wrapper.get('button[aria-label="Keyboard shortcuts"]')
    expect(shortcutsButton.attributes('title')).toBe('Keyboard shortcuts')
    expect(shortcutsButton.find('svg[aria-hidden="true"]').exists()).toBe(true)

    await shortcutsButton.trigger('click')

    expect(wrapper.emitted('openShortcuts')).toHaveLength(1)
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

    // Theme switching lives in the action sheet, not in the header row
    expect(wrapper.find('.mobile-toolbar-actions .theme-toggle').exists()).toBe(false)
  })

  it('keeps the outline toggle available in the compact mobile toolbar', async () => {
    const wrapper = mountToolbar({
      availableModes: ['editor', 'preview'],
      isMobile: true,
      isOutlineOpen: false,
      viewMode: 'editor',
    })

    const outlineButton = wrapper.get('button[aria-label="Show document outline"]')
    expect(outlineButton.classes()).toContain('icon-only')

    await outlineButton.trigger('click')

    expect(wrapper.emitted('toggleOutline')).toHaveLength(1)
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

  it('forwards insert-table from mobile action sheet', async () => {
    const wrapper = mountToolbar({
      availableModes: ['editor', 'preview'],
      isMobile: true,
      viewMode: 'editor',
    })

    const menuButton = wrapper.find('button[aria-label="Menu"]')
    await menuButton.trigger('click')

    const actions = document.querySelectorAll('.mobile-action-sheet__action')
    const tableAction = Array.from(actions).find((el) => el.textContent?.includes('Insert Table'))

    await tableAction?.dispatchEvent(new MouseEvent('click'))

    expect(wrapper.emitted('insertTable')).toHaveLength(1)
  })

  it('keeps document actions in the mobile action sheet', async () => {
    const wrapper = mountToolbar({
      availableModes: ['editor', 'preview'],
      isMobile: true,
      viewMode: 'editor',
    })

    await wrapper.get('button[aria-label="Menu"]').trigger('click')

    const actions = Array.from(document.querySelectorAll('.mobile-action-sheet__action'))
    expect(actions.some((action) => action.textContent?.includes('Open'))).toBe(true)
    expect(actions.some((action) => action.textContent?.includes('Save'))).toBe(true)
  })
})
