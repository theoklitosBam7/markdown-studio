import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import MobileActionSheet from '../MobileActionSheet.vue'

describe('MobileActionSheet', () => {
  let container: HTMLDivElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  function mountSheet(overrides: Record<string, unknown> = {}) {
    return mount(MobileActionSheet, {
      attachTo: container,
      props: {
        actions: [
          { action: vi.fn(), icon: '📂', label: 'Open' },
          { action: vi.fn(), icon: '💾', label: 'Save' },
          { action: vi.fn(), icon: '🗑️', label: 'Delete', variant: 'danger' as const },
        ],
        isOpen: false,
        title: 'Test Actions',
        ...overrides,
      },
    })
  }

  it('does not render when closed', () => {
    mountSheet({ isOpen: false })
    expect(document.querySelector('.mobile-action-sheet-backdrop')).toBeNull()
    expect(document.querySelector('.mobile-action-sheet')).toBeNull()
  })

  it('renders when opened', async () => {
    mountSheet({ isOpen: true })

    // Sheet is teleported to body
    const backdrop = document.querySelector('.mobile-action-sheet-backdrop')
    const sheet = document.querySelector('.mobile-action-sheet')

    expect(backdrop).not.toBeNull()
    expect(sheet).not.toBeNull()
    expect(sheet?.querySelector('.mobile-action-sheet__title')?.textContent).toBe('Test Actions')
  })

  it('renders all action items', async () => {
    mountSheet({ isOpen: true })

    const actions = document.querySelectorAll('.mobile-action-sheet__action')
    expect(actions).toHaveLength(3)

    expect(actions[0]?.textContent).toContain('📂')
    expect(actions[0]?.textContent).toContain('Open')

    expect(actions[1]?.textContent).toContain('💾')
    expect(actions[1]?.textContent).toContain('Save')

    expect(actions[2]?.textContent).toContain('🗑️')
    expect(actions[2]?.textContent).toContain('Delete')
    expect(actions[2]?.classList.contains('mobile-action-sheet__action--danger')).toBe(true)
  })

  it('calls action and closes when action is clicked', async () => {
    const openAction = vi.fn()
    const saveAction = vi.fn()

    mountSheet({
      actions: [
        { action: openAction, icon: '📂', label: 'Open' },
        { action: saveAction, icon: '💾', label: 'Save' },
      ],
      isOpen: true,
    })

    const actions = document.querySelectorAll('.mobile-action-sheet__action')
    await actions[0]?.dispatchEvent(new MouseEvent('click'))

    expect(openAction).toHaveBeenCalledTimes(1)
    expect(saveAction).not.toHaveBeenCalled()
  })

  it('closes when cancel button is clicked', async () => {
    const wrapper = mountSheet({ isOpen: true })

    const cancelButton = document.querySelector('.mobile-action-sheet__cancel')
    expect(cancelButton).not.toBeNull()

    await cancelButton?.dispatchEvent(new MouseEvent('click'))

    // Simulate animationend on backdrop
    const backdrop = document.querySelector('.mobile-action-sheet-backdrop')
    backdrop?.dispatchEvent(new Event('animationend'))

    await nextTick()

    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('closes when backdrop is clicked', async () => {
    const wrapper = mountSheet({ isOpen: true })

    const backdrop = document.querySelector('.mobile-action-sheet-backdrop')
    expect(backdrop).not.toBeNull()

    // Click on backdrop (not the sheet itself)
    await backdrop?.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    // Simulate animationend on backdrop
    backdrop?.dispatchEvent(new Event('animationend'))

    await nextTick()

    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('closes on escape key', async () => {
    const wrapper = mountSheet({ isOpen: true })

    // Simulate escape key
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

    // Simulate animationend on backdrop
    const backdrop = document.querySelector('.mobile-action-sheet-backdrop')
    backdrop?.dispatchEvent(new Event('animationend'))

    await nextTick()

    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('removes event listeners on unmount', async () => {
    const wrapper = mountSheet({ isOpen: true })
    const removeSpy = vi.spyOn(document, 'removeEventListener')

    wrapper.unmount()

    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    removeSpy.mockRestore()
  })

  it('does not close when clicking inside the sheet', async () => {
    mountSheet({ isOpen: true })

    const sheet = document.querySelector('.mobile-action-sheet')
    expect(sheet).not.toBeNull()

    await sheet?.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    // Wait a bit
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Sheet should still be visible
    expect(document.querySelector('.mobile-action-sheet')).not.toBeNull()
  })
})
