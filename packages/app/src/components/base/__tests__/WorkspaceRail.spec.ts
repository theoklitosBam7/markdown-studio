import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vite-plus/test'

import WorkspaceRail from '../WorkspaceRail.vue'

describe('WorkspaceRail', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('opens a labeled menu for the existing document actions', async () => {
    const wrapper = mount(WorkspaceRail, {
      props: {
        canExportPdf: false,
        canOpenDocuments: true,
        canSaveDocuments: true,
        isCopied: false,
        isOutlineOpen: false,
        pdfExportUnavailableReason: 'PDF export is unavailable in this browser.',
      },
    })

    expect(wrapper.find('[aria-label="Document actions"][aria-expanded="false"]').exists()).toBe(
      true,
    )
    expect(wrapper.find('.workspace-rail__actions-panel').exists()).toBe(false)

    await wrapper.get('button[aria-label="Document actions"]').trigger('click')

    const panel = wrapper.get('.workspace-rail__actions-panel')
    expect(panel.attributes('aria-label')).toBe('Document actions')
    expect(panel.text()).toContain('Open')
    expect(panel.text()).toContain('Save')
    expect(panel.text()).toContain('Examples')
    expect(panel.text()).toContain('Copy MD')
    expect(panel.text()).toContain('Export HTML')
    expect(panel.text()).toContain('Export PDF')
    expect(panel.text()).toContain('PDF export is unavailable in this browser.')
    expect(wrapper.get('button[aria-label="Export PDF"]').attributes('disabled')).toBeDefined()

    wrapper.unmount()
  })

  it('forwards document actions from the rail menu', async () => {
    const wrapper = mount(WorkspaceRail, {
      props: {
        canExportPdf: true,
        canOpenDocuments: true,
        canSaveDocuments: true,
        isCopied: false,
        isOutlineOpen: false,
      },
    })

    await wrapper.get('button[aria-label="Document actions"]').trigger('click')
    await wrapper.get('button[aria-label="Open document"]').trigger('click')
    await wrapper.get('button[aria-label="Document actions"]').trigger('click')
    await wrapper.get('button[aria-label="Save document"]').trigger('click')
    await wrapper.get('button[aria-label="Document actions"]').trigger('click')
    await wrapper.get('button[aria-label="Load examples"]').trigger('click')
    await wrapper.get('button[aria-label="Document actions"]').trigger('click')
    await wrapper.get('button[aria-label="Insert table"]').trigger('click')
    await wrapper.get('button[aria-label="Document actions"]').trigger('click')
    await wrapper.get('button[aria-label="Clear document"]').trigger('click')
    await wrapper.get('button[aria-label="Document actions"]').trigger('click')
    await wrapper.get('button[aria-label="Copy Markdown"]').trigger('click')
    await wrapper.get('button[aria-label="Document actions"]').trigger('click')
    await wrapper.get('button[aria-label="Export HTML"]').trigger('click')
    await wrapper.get('button[aria-label="Document actions"]').trigger('click')
    await wrapper.get('button[aria-label="Export PDF"]').trigger('click')

    expect(wrapper.emitted('openDocument')).toHaveLength(1)
    expect(wrapper.emitted('saveDocument')).toHaveLength(1)
    expect(wrapper.emitted('openExamples')).toHaveLength(1)
    expect(wrapper.emitted('insertTable')).toHaveLength(1)
    expect(wrapper.emitted('clear')).toHaveLength(1)
    expect(wrapper.emitted('copy')).toHaveLength(1)
    expect(wrapper.emitted('exportHtml')).toHaveLength(1)
    expect(wrapper.emitted('exportPdf')).toHaveLength(1)

    wrapper.unmount()
  })

  it('closes the action menu when Escape is pressed', async () => {
    const wrapper = mount(WorkspaceRail, {
      props: {
        isOutlineOpen: false,
      },
    })

    await wrapper.get('button[aria-label="Document actions"]').trigger('click')
    await wrapper.get('.workspace-rail__actions-panel').trigger('keydown.esc')

    expect(wrapper.find('.workspace-rail__actions-panel').exists()).toBe(false)
    expect(wrapper.get('button[aria-label="Document actions"]').attributes('aria-expanded')).toBe(
      'false',
    )

    wrapper.unmount()
  })

  it('keeps Outline and Find actions available', async () => {
    const toggleOutline = vi.fn()
    const find = vi.fn()
    const wrapper = mount(WorkspaceRail, {
      attrs: {
        onFind: find,
        onToggleOutline: toggleOutline,
      },
      props: {
        isOutlineOpen: false,
      },
    })

    await wrapper.get('button[aria-label="Show document outline"]').trigger('click')
    await wrapper.get('button[aria-label="Find in document"]').trigger('click')

    expect(toggleOutline).toHaveBeenCalledOnce()
    expect(find).toHaveBeenCalledOnce()

    wrapper.unmount()
  })
})
