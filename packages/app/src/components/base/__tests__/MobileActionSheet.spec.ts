import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { nextTick } from 'vue'
import { FileText, FolderOpen, Save, Trash2 } from '@lucide/vue'

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
        groups: [
          {
            items: [
              { action: vi.fn(), icon: FolderOpen, label: 'Open' },
              { action: vi.fn(), icon: Save, label: 'Save' },
            ],
            label: 'Document',
          },
          {
            items: [{ action: vi.fn(), icon: Trash2, label: 'Delete', variant: 'danger' as const }],
            label: 'Danger',
          },
        ],
        isOpen: false,
        title: 'Test Actions',
        ...overrides,
      },
    })
  }

  function getActionButtons(): Element[] {
    return Array.from(document.querySelectorAll('.mobile-action-sheet__action'))
  }

  function getCancelButton(): Element | null {
    return document.querySelector('.mobile-action-sheet__cancel')
  }

  function pressKey(key: string, options: KeyboardEventInit = {}): void {
    document
      .querySelector('.mobile-action-sheet')
      ?.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key, ...options }))
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

  it('renders action groups in order with their labels', () => {
    mountSheet({ isOpen: true })

    const labels = Array.from(document.querySelectorAll('.mobile-action-sheet__group')).map(
      (group) => group.querySelector('.mobile-action-sheet__group-label')?.textContent,
    )
    const actions = getActionButtons()

    expect(labels).toEqual(['Document', 'Danger'])
    expect(actions).toHaveLength(3)
    expect(actions[0]?.textContent).toContain('Open')
    expect(actions[0]?.querySelector('svg.lucide')).not.toBeNull()
    expect(actions[1]?.textContent).toContain('Save')
    expect(actions[2]?.textContent).toContain('Delete')
    expect(actions[2]?.classList.contains('mobile-action-sheet__action--danger')).toBe(true)
  })

  it('keeps cancel out of the scrolling region', () => {
    mountSheet({ isOpen: true })

    const scroll = document.querySelector('.mobile-action-sheet__scroll')
    const cancel = getCancelButton()

    expect(scroll).not.toBeNull()
    expect(cancel).not.toBeNull()
    expect(scroll?.contains(cancel)).toBe(false)
    expect(document.querySelector('.mobile-action-sheet__footer')?.contains(cancel)).toBe(true)
  })

  it('exposes a labelled dialog without menu roles', () => {
    mountSheet({ isOpen: true })

    const sheet = document.querySelector('.mobile-action-sheet')
    const titledBy = sheet?.getAttribute('aria-labelledby')

    expect(sheet?.getAttribute('role')).toBe('dialog')
    expect(sheet?.getAttribute('aria-modal')).toBe('true')
    expect(document.getElementById(titledBy ?? '')?.textContent).toBe('Test Actions')
    expect(document.querySelector('[role="menu"]')).toBeNull()
    expect(getActionButtons().some((action) => action.hasAttribute('role'))).toBe(false)
  })

  it('moves focus into the dialog when it opens', async () => {
    mountSheet({ isOpen: true })
    await nextTick()

    expect(document.activeElement?.classList.contains('mobile-action-sheet')).toBe(true)
  })

  it('keeps keyboard focus inside the dialog', async () => {
    mountSheet({ isOpen: true })
    await nextTick()

    const actions = getActionButtons()
    const cancel = getCancelButton()

    // Forward from the last control wraps to the first action.
    ;(cancel as HTMLElement).focus()
    pressKey('Tab')
    expect(document.activeElement).toBe(actions[0])

    // Backward from the first action wraps to the last control.
    ;(actions[0] as HTMLElement).focus()
    pressKey('Tab', { shiftKey: true })
    expect(document.activeElement).toBe(cancel)
  })

  it('returns focus to the trigger when it closes', async () => {
    const trigger = document.createElement('button')
    document.body.appendChild(trigger)
    trigger.focus()

    const wrapper = mountSheet({ isOpen: true })
    await nextTick()
    expect(document.activeElement).not.toBe(trigger)

    await getCancelButton()?.dispatchEvent(new MouseEvent('click'))
    document
      .querySelector('.mobile-action-sheet-backdrop')
      ?.dispatchEvent(new Event('animationend'))
    await nextTick()

    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(document.activeElement).toBe(trigger)
  })

  it('calls action and closes when action is clicked', async () => {
    const openAction = vi.fn()
    const saveAction = vi.fn()

    mountSheet({
      groups: [
        {
          items: [
            { action: openAction, icon: FolderOpen, label: 'Open' },
            { action: saveAction, icon: Save, label: 'Save' },
          ],
          label: 'Document',
        },
      ],
      isOpen: true,
    })

    await getActionButtons()[0]?.dispatchEvent(new MouseEvent('click'))

    expect(openAction).toHaveBeenCalledTimes(1)
    expect(saveAction).not.toHaveBeenCalled()
  })

  it('passes the tapped element to the action', async () => {
    const action = vi.fn()

    mountSheet({
      groups: [{ items: [{ action, icon: Save, label: 'Switch theme' }], label: 'More' }],
      isOpen: true,
    })

    const button = getActionButtons()[0]
    await button?.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(action).toHaveBeenCalledWith(button)
  })

  it('renders disabled actions with helper text and does not call them', async () => {
    const exportPdf = vi.fn()

    mountSheet({
      groups: [
        {
          items: [
            {
              action: exportPdf,
              description: 'PDF export is unavailable on mobile. Use HTML instead.',
              disabled: true,
              icon: FileText,
              label: 'Export as PDF',
            },
          ],
          label: 'Export',
        },
      ],
      isOpen: true,
    })

    const actions = getActionButtons()
    expect(actions).toHaveLength(1)
    expect(actions[0]?.hasAttribute('disabled')).toBe(true)
    expect(actions[0]?.classList.contains('mobile-action-sheet__action--disabled')).toBe(true)
    expect(actions[0]?.textContent).toContain('Export as PDF')
    expect(actions[0]?.textContent).toContain('Use HTML instead')

    await actions[0]?.dispatchEvent(new MouseEvent('click'))

    expect(exportPdf).not.toHaveBeenCalled()
  })

  it('closes when cancel button is clicked', async () => {
    const wrapper = mountSheet({ isOpen: true })

    await getCancelButton()?.dispatchEvent(new MouseEvent('click'))

    // Simulate animationend on backdrop
    document
      .querySelector('.mobile-action-sheet-backdrop')
      ?.dispatchEvent(new Event('animationend'))

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
    document
      .querySelector('.mobile-action-sheet-backdrop')
      ?.dispatchEvent(new Event('animationend'))

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
