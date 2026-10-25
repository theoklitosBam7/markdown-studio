import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test'

import MobileToolbarActions from '../MobileToolbarActions.vue'

describe('MobileToolbarActions', () => {
  let container: HTMLDivElement
  const mountedToolbars: { unmount: () => void }[] = []

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    for (const wrapper of mountedToolbars.splice(0)) {
      wrapper.unmount()
    }

    document.body.innerHTML = ''
  })

  function mountToolbar(overrides: Record<string, unknown> = {}) {
    const wrapper = mount(MobileToolbarActions, {
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

    mountedToolbars.push(wrapper)
    return wrapper
  }

  function getMenuButton(): HTMLElement | null {
    return document.querySelector('button[aria-label="Menu"]')
  }

  async function openSheet(): Promise<void> {
    await getMenuButton()?.dispatchEvent(new MouseEvent('click'))
  }

  function getSheetActions(): Element[] {
    return Array.from(document.querySelectorAll('.mobile-action-sheet__action'))
  }

  function findSheetAction(label: string): Element | undefined {
    return getSheetActions().find((action) => action.textContent?.includes(label))
  }

  function getGroupLabels(): (string | undefined)[] {
    return Array.from(document.querySelectorAll('.mobile-action-sheet__group-label')).map((label) =>
      label.textContent?.trim(),
    )
  }

  it('shows the document name as the primary identity', () => {
    const wrapper = mountToolbar({ documentName: 'draft.md' })

    expect(wrapper.get('.mobile-toolbar-actions__document-name').text()).toBe('draft.md')
    expect(wrapper.find('.mobile-toolbar-actions__brand').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Markdown Studio')
  })

  it('shows the unsaved state of the active document', () => {
    const wrapper = mountToolbar({ documentName: 'draft.md', isDirty: true })

    expect(wrapper.get('.mobile-toolbar-actions__document-status').text()).toBe('Unsaved')
  })

  it('renders the header controls in one row', () => {
    const wrapper = mountToolbar()

    expect(wrapper.findAll('.mobile-toolbar-actions__row')).toHaveLength(1)
    expect(wrapper.find('button[aria-label="Menu"]').exists()).toBe(true)
    expect(wrapper.find('[data-mode="editor"]').exists()).toBe(true)
    expect(wrapper.find('[data-mode="preview"]').exists()).toBe(true)
    expect(wrapper.find('button[aria-label="Show document outline"]').exists()).toBe(true)
  })

  it('describes the menu button as a dialog trigger', async () => {
    const wrapper = mountToolbar()
    const menuButton = getMenuButton()

    expect(menuButton?.getAttribute('aria-haspopup')).toBe('dialog')
    expect(menuButton?.getAttribute('aria-expanded')).toBe('false')
    expect(menuButton?.getAttribute('aria-controls')).toBe('mobile-action-sheet')

    await openSheet()

    expect(getMenuButton()?.getAttribute('aria-expanded')).toBe('true')
    expect(document.getElementById('mobile-action-sheet')?.getAttribute('role')).toBe('dialog')

    wrapper.unmount()
  })

  it('offers the theme switch in the action sheet instead of the header', async () => {
    const wrapper = mountToolbar({ theme: 'light' })

    expect(wrapper.find('.theme-toggle').exists()).toBe(false)

    await openSheet()

    const themeAction = findSheetAction('Switch to dark mode')
    expect(themeAction).toBeDefined()

    await themeAction?.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    const emitted = wrapper.emitted('update:theme')
    expect(emitted).toHaveLength(1)
    expect(emitted?.[0]?.[0]).toMatchObject({ theme: 'dark' })
  })

  it('labels the theme action with the next theme', async () => {
    mountToolbar({ theme: 'dark' })

    await openSheet()

    expect(findSheetAction('Switch to light mode')).toBeDefined()
    expect(findSheetAction('Switch to dark mode')).toBeUndefined()
  })

  it('groups the sheet actions and keeps the destructive action last', async () => {
    mountToolbar()

    await openSheet()

    expect(getGroupLabels()).toEqual(['Document', 'Edit', 'Export', 'Appearance', 'More', 'Danger'])
    expect(getSheetActions().at(-1)?.textContent).toContain('Clear Document')
  })

  it('marks the outline button as pressed and hides the view toggle while open', () => {
    const wrapper = mountToolbar({ isOutlineOpen: true })

    const outlineButton = wrapper.get('button[aria-label="Hide document outline"]')

    expect(outlineButton.attributes('aria-pressed')).toBe('true')
    expect(outlineButton.classes()).toContain('active')
    expect(wrapper.find('[data-mode="editor"]').exists()).toBe(false)
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

  it('opens the action sheet when the menu is clicked', async () => {
    mountToolbar()

    await openSheet()

    expect(document.querySelector('.mobile-action-sheet')).not.toBeNull()
    expect(document.querySelector('.mobile-action-sheet-backdrop')).not.toBeNull()
  })

  it('includes every action in the sheet', async () => {
    mountToolbar()

    await openSheet()

    const labels = getSheetActions().map((action) => action.textContent)
    for (const expected of [
      'Open',
      'Save',
      'Find in Document',
      'Load Examples',
      'Insert Table',
      'Copy Markdown',
      'Export as HTML',
      'Export as PDF',
      'Switch to dark mode',
      'View on GitHub',
      'Keyboard Shortcuts',
      'Clear Document',
    ]) {
      expect(labels.some((label) => label?.includes(expected))).toBe(true)
    }
  })

  it('offers Install App when the app can be installed', async () => {
    mountToolbar({ canInstall: true })

    await openSheet()

    expect(findSheetAction('Install App')).toBeDefined()
  })

  it('uses SVG icons in the sheet', async () => {
    mountToolbar()

    await openSheet()

    const actions = getSheetActions()
    const icons = document.querySelectorAll('.mobile-action-sheet__icon svg')

    expect(actions.length).toBeGreaterThan(0)
    expect(icons.length).toBe(actions.length)
  })

  it('opens Find from the sheet', async () => {
    const wrapper = mountToolbar()

    await openSheet()
    await findSheetAction('Find in Document')?.dispatchEvent(new MouseEvent('click'))

    expect(wrapper.emitted('openFind')).toHaveLength(1)
  })

  it('disables pdf export with guidance when unavailable', async () => {
    mountToolbar({
      canExportPdf: false,
      pdfExportUnavailableReason:
        "PDF export isn't available on mobile or installed PWAs yet. Use Export as HTML instead.",
    })

    await openSheet()

    const pdfAction = findSheetAction('Export as PDF')

    expect(pdfAction).not.toBeNull()
    expect(pdfAction?.hasAttribute('disabled')).toBe(true)
    expect(pdfAction?.textContent).toContain('Use Export as HTML instead')
  })

  it('emits openDocument when Open is clicked', async () => {
    const wrapper = mountToolbar({ canOpenDocuments: true })

    await openSheet()
    await findSheetAction('Open')?.dispatchEvent(new MouseEvent('click'))

    expect(wrapper.emitted('openDocument')).toHaveLength(1)
  })

  it('emits saveDocument when Save is clicked', async () => {
    const wrapper = mountToolbar({ canSaveDocuments: true })

    await openSheet()
    await findSheetAction('Save')?.dispatchEvent(new MouseEvent('click'))

    expect(wrapper.emitted('saveDocument')).toHaveLength(1)
  })

  it('emits insertTable when Insert Table is clicked', async () => {
    const wrapper = mountToolbar()

    await openSheet()
    await findSheetAction('Insert Table')?.dispatchEvent(new MouseEvent('click'))

    expect(wrapper.emitted('insertTable')).toHaveLength(1)
  })

  it('does not put Open and Save in the header', () => {
    const wrapper = mountToolbar({ canOpenDocuments: true, canSaveDocuments: true })
    const header = wrapper.get('.mobile-toolbar-actions__row')

    expect(header.findAll('button[aria-label="Open"]')).toHaveLength(0)
    expect(header.findAll('button[aria-label="Save"]')).toHaveLength(0)
  })

  it('labels the copied state in the sheet', async () => {
    mountToolbar({ isCopied: true })

    await openSheet()

    expect(findSheetAction('Copied!')).toBeDefined()
  })

  it('emits update:viewMode when ViewToggle changes', async () => {
    const wrapper = mountToolbar({ viewMode: 'editor' })

    await wrapper.get('[data-mode="preview"]').trigger('click')

    expect(wrapper.emitted('update:viewMode')?.[0]).toEqual(['preview'])
  })
})
