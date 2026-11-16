import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vite-plus/test'

import WorkspaceRail from '../WorkspaceRail.vue'

describe('WorkspaceRail', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('keeps only secondary actions in the labeled document actions menu', async () => {
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
    expect(panel.text()).toContain('Examples')
    expect(panel.text()).toContain('Table')
    expect(panel.text()).toContain('Copy MD')
    expect(panel.text()).toContain('Clear')
    expect(panel.text()).not.toContain('Open')
    expect(panel.text()).not.toContain('Save')
    expect(panel.text()).not.toContain('Export HTML')
    expect(panel.text()).not.toContain('Export PDF')

    wrapper.unmount()
  })

  it('forwards remaining document actions from the rail menu', async () => {
    const wrapper = mount(WorkspaceRail, {
      props: {
        isCopied: false,
        isOutlineOpen: false,
      },
    })

    await wrapper.get('button[aria-label="Document actions"]').trigger('click')
    await wrapper.get('button[aria-label="Load examples"]').trigger('click')
    await wrapper.get('button[aria-label="Document actions"]').trigger('click')
    await wrapper.get('button[aria-label="Insert table"]').trigger('click')
    await wrapper.get('button[aria-label="Document actions"]').trigger('click')
    await wrapper.get('button[aria-label="Clear document"]').trigger('click')
    await wrapper.get('button[aria-label="Document actions"]').trigger('click')
    await wrapper.get('button[aria-label="Copy Markdown"]').trigger('click')

    expect(wrapper.emitted('openExamples')).toHaveLength(1)
    expect(wrapper.emitted('insertTable')).toHaveLength(1)
    expect(wrapper.emitted('clear')).toHaveLength(1)
    expect(wrapper.emitted('copy')).toHaveLength(1)

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
