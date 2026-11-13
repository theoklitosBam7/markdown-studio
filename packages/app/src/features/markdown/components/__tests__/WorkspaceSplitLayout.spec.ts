import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { nextTick } from 'vue'

import WorkspaceSplitLayout from '../WorkspaceSplitLayout.vue'

function dispatchPointer(target: EventTarget, type: string, clientX: number): void {
  const event = new Event(type, { bubbles: true, cancelable: true })
  Object.assign(event, { button: 0, clientX, isPrimary: true, pointerId: 1 })
  target.dispatchEvent(event)
}

describe('WorkspaceSplitLayout', () => {
  let containerWidth = 1024
  let notifyResize: () => void

  beforeEach(() => {
    containerWidth = 1024
    notifyResize = () => undefined
    window.localStorage.clear()
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
      () => new DOMRect(0, 0, containerWidth, 800),
    )
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          notifyResize = callback
        }
        disconnect() {}
        observe() {}
      },
    )
  })

  afterEach(() => {
    window.localStorage.clear()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('gives the editor and Live Preview equal shares with a separate gutter by default', () => {
    const wrapper = mount(WorkspaceSplitLayout, {
      props: { viewMode: 'split' },
      slots: {
        editor: '<textarea>Existing Markdown Document</textarea>',
        preview: '<p>Rendered Markdown Document</p>',
      },
    })

    expect(wrapper.get<HTMLElement>('.workspace-split').element.style.gridTemplateColumns).toBe(
      'minmax(0, 0.5fr) 24px minmax(0, 0.5fr)',
    )
    expect(wrapper.get('[aria-label="Markdown editor"]').find('textarea').element.value).toBe(
      'Existing Markdown Document',
    )
    expect(wrapper.get('[aria-label="Live Preview"]').text()).toBe('Rendered Markdown Document')
    expect(window.localStorage.getItem('markdown-studio:workspace-split-ratio')).toBeNull()
    wrapper.unmount()
  })

  it.each([
    [1024, 'Drag to resize. Double-click to reset. Use Left and Right Arrow when focused.'],
    [500, 'Double-click to reset the width.'],
  ])('provides hover guidance for the divider at %i pixels', async (width, title) => {
    containerWidth = width
    const wrapper = mount(WorkspaceSplitLayout, { props: { viewMode: 'split' } })
    await nextTick()

    expect(wrapper.get('[role="separator"]').attributes('title')).toBe(title)
    wrapper.unmount()
  })

  it('restores the saved editor share without writing a default on mount', async () => {
    window.localStorage.setItem('markdown-studio:workspace-split-ratio', '0.6')
    const wrapper = mount(WorkspaceSplitLayout, { props: { viewMode: 'split' } })
    await nextTick()

    expect(wrapper.get<HTMLElement>('.workspace-split').element.style.gridTemplateColumns).toBe(
      'minmax(0, 0.6fr) 24px minmax(0, 0.4fr)',
    )
    expect(window.localStorage.getItem('markdown-studio:workspace-split-ratio')).toBe('0.6')
    wrapper.unmount()
  })

  it.each([
    ['ArrowLeft', false, '0.49', '49'],
    ['ArrowRight', false, '0.51', '51'],
    ['ArrowRight', true, '0.55', '55'],
    ['ArrowLeft', true, '0.45', '45'],
    ['Home', false, '0.28', '28'],
    ['End', false, '0.72', '72'],
  ])(
    'adjusts only the editor preference with %s and Shift=%s',
    async (key, shiftKey, saved, percentage) => {
      window.localStorage.setItem('markdown-studio:workspace-sidebar-width', '320')
      const wrapper = mount(WorkspaceSplitLayout, { props: { viewMode: 'split' } })
      await nextTick()
      const divider = wrapper.get('[role="separator"]')

      expect(divider.attributes('aria-label')).toBe('Markdown editor width')
      expect(wrapper.get(`#${divider.attributes('aria-controls')}`).attributes('aria-label')).toBe(
        'Markdown editor',
      )
      await divider.trigger('keydown', { key, shiftKey })

      expect(Number(divider.attributes('aria-valuenow'))).toBeCloseTo(Number(percentage))
      expect(window.localStorage.getItem('markdown-studio:workspace-split-ratio')).toBe(saved)
      expect(window.localStorage.getItem('markdown-studio:workspace-sidebar-width')).toBe('320')
      wrapper.unmount()
    },
  )

  it('lets a user submit an editor percentage without dragging', async () => {
    const wrapper = mount(WorkspaceSplitLayout, {
      attachTo: document.body,
      props: { viewMode: 'split' },
    })
    await nextTick()
    await wrapper.get('button[aria-label="Pane widths"]').trigger('click')
    const input = wrapper.get<HTMLInputElement>('input[aria-label="Editor percentage"]')
    expect(input.element.value).toBe('50')
    await input.setValue('65')
    await wrapper.get('form').trigger('submit')
    expect(window.localStorage.getItem('markdown-studio:workspace-split-ratio')).toBe('0.65')
    expect(wrapper.get('[role="separator"]').attributes('aria-valuetext')).toBe(
      'Editor 65 percent, Live Preview 35 percent',
    )
    wrapper.unmount()
  })

  it('dismisses the width panel on an outside click without saving a draft or stealing focus', async () => {
    window.localStorage.setItem('markdown-studio:workspace-split-ratio', '0.6')
    const wrapper = mount(WorkspaceSplitLayout, {
      attachTo: document.body,
      props: { viewMode: 'split' },
      slots: { editor: '<textarea>Keep editing</textarea>' },
    })
    await nextTick()
    const trigger = wrapper.get('button[aria-label="Pane widths"]')
    await trigger.trigger('click')
    await wrapper.get('input').setValue('65')
    await wrapper.get('input').trigger('click')
    expect(trigger.attributes('aria-expanded')).toBe('true')

    await wrapper.get('textarea').trigger('click')

    expect(wrapper.find('form').exists()).toBe(false)
    expect(trigger.attributes('aria-expanded')).toBe('false')
    expect(document.activeElement).not.toBe(trigger.element)
    expect(window.localStorage.getItem('markdown-studio:workspace-split-ratio')).toBe('0.6')
    await trigger.trigger('click')
    expect(wrapper.get<HTMLInputElement>('input').element.value).toBe('60')
    wrapper.unmount()
  })

  it('ignores an empty percentage instead of replacing the saved share', async () => {
    window.localStorage.setItem('markdown-studio:workspace-split-ratio', '0.6')
    const wrapper = mount(WorkspaceSplitLayout, { props: { viewMode: 'split' } })
    await nextTick()
    await wrapper.get('button[aria-label="Pane widths"]').trigger('click')
    await wrapper.get('input').setValue('')
    await wrapper.get('form').trigger('submit')
    expect(window.localStorage.getItem('markdown-studio:workspace-split-ratio')).toBe('0.6')
    wrapper.unmount()
  })

  it('lets a user close the width panel without applying an unfinished value', async () => {
    const wrapper = mount(WorkspaceSplitLayout, {
      attachTo: document.body,
      props: { viewMode: 'split' },
    })
    await nextTick()
    const trigger = wrapper.get('button[aria-label="Pane widths"]')
    await trigger.trigger('click')
    await wrapper.get('input').setValue('65')
    await wrapper.get('button[aria-label="Close width controls"]').trigger('click')

    expect(wrapper.find('form').exists()).toBe(false)
    expect(document.activeElement).toBe(trigger.element)
    expect(window.localStorage.getItem('markdown-studio:workspace-split-ratio')).toBeNull()
    wrapper.unmount()
  })

  it('closes the width controls with Escape and returns focus to their trigger', async () => {
    const wrapper = mount(WorkspaceSplitLayout, {
      attachTo: document.body,
      props: { viewMode: 'split' },
    })
    await nextTick()
    const trigger = wrapper.get<HTMLButtonElement>('button[aria-label="Pane widths"]')
    await trigger.trigger('click')
    const input = wrapper.get('input')
    expect(document.activeElement).toBe(input.element)
    await input.trigger('keydown', { key: 'Escape' })
    expect(wrapper.find('form').exists()).toBe(false)
    expect(document.activeElement).toBe(trigger.element)
    expect(window.localStorage.getItem('markdown-studio:workspace-split-ratio')).toBeNull()
    wrapper.unmount()
  })

  it.each(['button', 'double-click'])(
    'resets only the editor preference through %s even without a usable range',
    async (method) => {
      window.localStorage.setItem('markdown-studio:workspace-split-ratio', '0.7')
      window.localStorage.setItem('markdown-studio:workspace-sidebar-width', '320')
      containerWidth = 500
      const wrapper = mount(WorkspaceSplitLayout, { props: { viewMode: 'split' } })
      await nextTick()
      expect(wrapper.get('[role="separator"]').attributes('tabindex')).toBe('-1')
      await wrapper.get('button[aria-label="Pane widths"]').trigger('click')
      expect(wrapper.get('input').attributes('disabled')).toBeDefined()
      if (method === 'button') {
        await wrapper.get('.workspace-width-control__reset').trigger('click')
      } else {
        await wrapper.get('[role="separator"]').trigger('dblclick')
      }
      expect(window.localStorage.getItem('markdown-studio:workspace-split-ratio')).toBe('0.5')
      expect(window.localStorage.getItem('markdown-studio:workspace-sidebar-width')).toBe('320')
      wrapper.unmount()
    },
  )

  it('drafts a drag from the displayed share and saves only after release', async () => {
    window.localStorage.setItem('markdown-studio:workspace-split-ratio', '0.9')
    window.localStorage.setItem('markdown-studio:workspace-sidebar-width', '320')
    const wrapper = mount(WorkspaceSplitLayout, { props: { viewMode: 'split' } })
    await nextTick()
    const divider = wrapper.get('[role="separator"]')
    dispatchPointer(divider.element, 'pointerdown', 720)
    dispatchPointer(window, 'pointermove', 620)
    await nextTick()
    expect(Number(divider.attributes('aria-valuenow'))).toBeCloseTo(62)
    expect(window.localStorage.getItem('markdown-studio:workspace-split-ratio')).toBe('0.9')
    dispatchPointer(window, 'pointerup', 620)
    await nextTick()
    expect(window.localStorage.getItem('markdown-studio:workspace-split-ratio')).toBe('0.62')
    expect(window.localStorage.getItem('markdown-studio:workspace-sidebar-width')).toBe('320')
    wrapper.unmount()
  })

  it('does not save a constrained click or a cancelled drag', async () => {
    window.localStorage.setItem('markdown-studio:workspace-split-ratio', '0.9')
    const wrapper = mount(WorkspaceSplitLayout, { props: { viewMode: 'split' } })
    await nextTick()
    const divider = wrapper.get('[role="separator"]')
    dispatchPointer(divider.element, 'pointerdown', 720)
    dispatchPointer(window, 'pointerup', 720)
    containerWidth = 2024
    notifyResize()
    await nextTick()
    expect(Number(divider.attributes('aria-valuenow'))).toBeCloseTo(86)
    expect(window.localStorage.getItem('markdown-studio:workspace-split-ratio')).toBe('0.9')

    dispatchPointer(divider.element, 'pointerdown', 1720)
    dispatchPointer(window, 'pointermove', 1520)
    await nextTick()
    window.dispatchEvent(new Event('blur'))
    await nextTick()
    expect(Number(divider.attributes('aria-valuenow'))).toBeCloseTo(86)
    expect(window.localStorage.getItem('markdown-studio:workspace-split-ratio')).toBe('0.9')
    wrapper.unmount()
  })

  it('shows the effective percentage after clamping a submitted value', async () => {
    const wrapper = mount(WorkspaceSplitLayout, { props: { viewMode: 'split' } })
    await nextTick()
    await wrapper.get('button[aria-label="Pane widths"]').trigger('click')
    const input = wrapper.get<HTMLInputElement>('input')
    await input.setValue('99')
    await wrapper.get('form').trigger('submit')
    expect(window.localStorage.getItem('markdown-studio:workspace-split-ratio')).toBe('0.72')
    expect(input.element.value).toBe('72')
    wrapper.unmount()
  })

  it('temporarily clamps the saved share to pane limits and restores it when space returns', async () => {
    window.localStorage.setItem('markdown-studio:workspace-split-ratio', '0.6')
    const wrapper = mount(WorkspaceSplitLayout, { props: { viewMode: 'split' } })
    await nextTick()

    containerWidth = 624
    notifyResize()
    await nextTick()
    expect(wrapper.get<HTMLElement>('.workspace-split').element.style.gridTemplateColumns).toBe(
      'minmax(0, 0.5333333333333333fr) 24px minmax(0, 0.4666666666666667fr)',
    )
    expect(window.localStorage.getItem('markdown-studio:workspace-split-ratio')).toBe('0.6')

    containerWidth = 576
    notifyResize()
    await nextTick()
    expect(wrapper.get<HTMLElement>('.workspace-split').element.style.gridTemplateColumns).toBe(
      'minmax(0, 0.5fr) 24px minmax(0, 0.5fr)',
    )

    containerWidth = 1024
    notifyResize()
    await nextTick()
    expect(wrapper.get<HTMLElement>('.workspace-split').element.style.gridTemplateColumns).toBe(
      'minmax(0, 0.6fr) 24px minmax(0, 0.4fr)',
    )
    expect(window.localStorage.getItem('markdown-studio:workspace-split-ratio')).toBe('0.6')
    wrapper.unmount()
  })

  it('keeps pane instances while single-pane modes remove the hidden pane and gutter from layout', async () => {
    const wrapper = mount(WorkspaceSplitLayout, {
      attachTo: document.body,
      props: { viewMode: 'split' },
      slots: { editor: '<textarea>Keep this document</textarea>', preview: '<p>Preview</p>' },
    })
    const editor = wrapper.get('textarea').element
    const preview = wrapper.get('[aria-label="Live Preview"] p').element

    await wrapper.setProps({ viewMode: 'editor' })
    expect(wrapper.get('[aria-label="Markdown editor"]').isVisible()).toBe(true)
    expect(wrapper.get('[aria-label="Live Preview"]').isVisible()).toBe(false)
    expect(wrapper.find('.workspace-split__gutter').exists()).toBe(false)
    expect(wrapper.get<HTMLElement>('.workspace-split').element.style.gridTemplateColumns).toBe(
      'minmax(0, 1fr)',
    )

    await wrapper.setProps({ viewMode: 'preview' })
    expect(wrapper.get('[aria-label="Markdown editor"]').isVisible()).toBe(false)
    expect(wrapper.get('[aria-label="Live Preview"]').isVisible()).toBe(true)

    await wrapper.setProps({ viewMode: 'split' })
    expect(wrapper.get('textarea').element).toBe(editor)
    expect(wrapper.get('[aria-label="Live Preview"] p').element).toBe(preview)
    wrapper.unmount()
  })
})
