import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { describe, expect, it, vi } from 'vite-plus/test'

import WorkspaceResizeDivider from '../WorkspaceResizeDivider.vue'

const defaultProps = {
  controls: 'markdown-editor',
  disabled: false,
  instructions: 'Use the arrow keys to resize.',
  label: 'Markdown editor',
  max: 80,
  min: 20,
  value: 60,
  valueText: 'Editor 60 percent, Live Preview 40 percent',
}

function dispatchPointer(
  element: EventTarget,
  type: string,
  options: { button?: number; clientX: number; isPrimary?: boolean; pointerId: number },
) {
  const event = new Event(type, { bubbles: true, cancelable: true })
  Object.assign(event, {
    button: options.button ?? 0,
    clientX: options.clientX,
    isPrimary: options.isPrimary ?? true,
    pointerId: options.pointerId,
  })
  element.dispatchEvent(event)
}

describe('WorkspaceResizeDivider', () => {
  it('renders a named vertical separator with its current accessible value', () => {
    const wrapper = mount(WorkspaceResizeDivider, { props: defaultProps })
    const separator = wrapper.get('[role="separator"]')

    expect(separator.attributes()).toMatchObject({
      'aria-controls': 'markdown-editor',
      'aria-describedby': expect.any(String),
      'aria-label': 'Markdown editor',
      'aria-orientation': 'vertical',
      'aria-valuemax': '80',
      'aria-valuemin': '20',
      'aria-valuenow': '60',
      'aria-valuetext': 'Editor 60 percent, Live Preview 40 percent',
      tabindex: '0',
    })
    expect(wrapper.get(`#${separator.attributes('aria-describedby')}`).text()).toBe(
      'Use the arrow keys to resize.',
    )

    wrapper.unmount()
  })

  it('emits start, total displacement, and commit for an adjusted primary pointer', async () => {
    const wrapper = mount(WorkspaceResizeDivider, { props: defaultProps })
    const separator = wrapper.get('[role="separator"]').element

    dispatchPointer(separator, 'pointerdown', { clientX: 100, pointerId: 7 })
    dispatchPointer(window, 'pointermove', { clientX: 130, pointerId: 7 })
    dispatchPointer(window, 'pointermove', { clientX: 145, pointerId: 7 })
    dispatchPointer(window, 'pointerup', { clientX: 145, pointerId: 7 })

    expect(wrapper.emitted('start')).toEqual([[]])
    expect(wrapper.emitted('move')).toEqual([[30], [45]])
    expect(wrapper.emitted('commit')).toEqual([[]])
    expect(wrapper.emitted('cancel')).toBeUndefined()

    wrapper.unmount()
  })

  it('shows an explicit dragging state only while the gesture is active', async () => {
    const wrapper = mount(WorkspaceResizeDivider, { props: defaultProps })
    const separator = wrapper.get('[role="separator"]')

    dispatchPointer(separator.element, 'pointerdown', { clientX: 100, pointerId: 69 })
    await nextTick()
    expect(separator.classes()).toContain('workspace-resize-divider--dragging')
    dispatchPointer(window, 'pointerup', { clientX: 100, pointerId: 69 })
    await nextTick()
    expect(separator.classes()).not.toContain('workspace-resize-divider--dragging')

    wrapper.unmount()
  })

  it('emits zero displacement when the pointer returns to its start', () => {
    const wrapper = mount(WorkspaceResizeDivider, { props: defaultProps })
    const separator = wrapper.get('[role="separator"]').element

    dispatchPointer(separator, 'pointerdown', { clientX: 100, pointerId: 70 })
    dispatchPointer(window, 'pointermove', { clientX: 120, pointerId: 70 })
    dispatchPointer(window, 'pointermove', { clientX: 100, pointerId: 70 })

    expect(wrapper.emitted('move')).toEqual([[20], [0]])

    wrapper.unmount()
  })

  it('does not commit a click or accept secondary and unrelated pointers', () => {
    const wrapper = mount(WorkspaceResizeDivider, { props: defaultProps })
    const separator = wrapper.get('[role="separator"]').element

    dispatchPointer(separator, 'pointerdown', {
      clientX: 50,
      isPrimary: false,
      pointerId: 8,
    })
    dispatchPointer(separator, 'pointerdown', { clientX: 100, pointerId: 9 })
    dispatchPointer(window, 'pointermove', { clientX: 200, pointerId: 10 })
    dispatchPointer(window, 'pointerup', { clientX: 200, pointerId: 10 })
    dispatchPointer(window, 'pointerup', { clientX: 100, pointerId: 9 })

    expect(wrapper.emitted('start')).toEqual([[]])
    expect(wrapper.emitted('move')).toBeUndefined()
    expect(wrapper.emitted('commit')).toBeUndefined()
    expect(wrapper.emitted('cancel')).toBeUndefined()

    wrapper.unmount()
  })

  it('releases capture on pointer cancellation without duplicate lost-capture cancellation', () => {
    const wrapper = mount(WorkspaceResizeDivider, { props: defaultProps })
    const separator = wrapper.get('[role="separator"]').element as HTMLElement & {
      releasePointerCapture: (pointerId: number) => void
      setPointerCapture: (pointerId: number) => void
    }
    const release = vi.fn((pointerId: number) => {
      dispatchPointer(separator, 'lostpointercapture', { clientX: 100, pointerId })
    })
    separator.setPointerCapture = vi.fn()
    separator.releasePointerCapture = release

    dispatchPointer(separator, 'pointerdown', { clientX: 90, pointerId: 73 })
    dispatchPointer(window, 'pointercancel', { clientX: 90, pointerId: 73 })

    expect(release).toHaveBeenCalledWith(73)
    expect(wrapper.emitted('cancel')).toEqual([[]])

    wrapper.unmount()
  })

  it('keeps a completed gesture committed after pointer capture is lost', () => {
    const wrapper = mount(WorkspaceResizeDivider, { props: defaultProps })
    const separator = wrapper.get('[role="separator"]').element as HTMLElement & {
      releasePointerCapture: (pointerId: number) => void
      setPointerCapture: (pointerId: number) => void
    }
    const capture = vi.fn()
    const release = vi.fn(() => {
      dispatchPointer(separator, 'lostpointercapture', { clientX: 140, pointerId: 11 })
    })
    separator.setPointerCapture = capture
    separator.releasePointerCapture = release

    dispatchPointer(separator, 'pointerdown', { clientX: 100, pointerId: 11 })
    dispatchPointer(window, 'pointermove', { clientX: 140, pointerId: 11 })
    dispatchPointer(window, 'pointerup', { clientX: 140, pointerId: 11 })

    expect(capture).toHaveBeenCalledWith(11)
    expect(wrapper.emitted('commit')).toEqual([[]])
    expect(wrapper.emitted('cancel')).toBeUndefined()
    expect(release).toHaveBeenCalledWith(11)

    wrapper.unmount()
  })

  it('cancels active gestures and restores inline interaction styles', () => {
    const previousCursor = document.body.style.cursor
    const previousUserSelect = document.body.style.userSelect
    document.body.style.cursor = 'crosshair'
    document.body.style.userSelect = 'text'
    const wrapper = mount(WorkspaceResizeDivider, { props: defaultProps })
    const separator = wrapper.get('[role="separator"]').element

    dispatchPointer(separator, 'pointerdown', { clientX: 80, pointerId: 12 })
    expect(document.body.style.cursor).toBe('col-resize')
    expect(document.body.style.userSelect).toBe('none')
    dispatchPointer(window, 'pointercancel', { clientX: 80, pointerId: 12 })

    expect(wrapper.emitted('cancel')).toEqual([[]])
    expect(document.body.style.cursor).toBe('crosshair')
    expect(document.body.style.userSelect).toBe('text')

    dispatchPointer(separator, 'pointerdown', { clientX: 80, pointerId: 13 })
    dispatchPointer(separator, 'lostpointercapture', { clientX: 80, pointerId: 13 })
    expect(wrapper.emitted('cancel')).toEqual([[], []])

    wrapper.unmount()
    document.body.style.cursor = previousCursor
    document.body.style.userSelect = previousUserSelect
  })

  it('disables keyboard resizing but keeps double-click reset available', async () => {
    const wrapper = mount(WorkspaceResizeDivider, {
      props: { ...defaultProps, disabled: true },
    })
    const separator = wrapper.get('[role="separator"]')

    expect(separator.attributes('tabindex')).toBe('-1')
    await separator.trigger('keydown', { key: 'ArrowRight' })
    await separator.trigger('dblclick')

    expect(wrapper.emitted('step')).toBeUndefined()
    expect(wrapper.emitted('reset')).toEqual([[]])

    wrapper.unmount()
  })

  it('releases pointer capture when Escape cancels a gesture', async () => {
    const wrapper = mount(WorkspaceResizeDivider, { props: defaultProps })
    const separator = wrapper.get('[role="separator"]').element as HTMLElement & {
      releasePointerCapture: (pointerId: number) => void
      setPointerCapture: (pointerId: number) => void
    }
    const release = vi.fn()
    separator.setPointerCapture = vi.fn()
    separator.releasePointerCapture = release

    dispatchPointer(separator, 'pointerdown', { clientX: 90, pointerId: 18 })
    await wrapper.get('[role="separator"]').trigger('keydown', { key: 'Escape' })

    expect(wrapper.emitted('cancel')).toEqual([[]])
    expect(release).toHaveBeenCalledWith(18)

    wrapper.unmount()
  })

  it('cancels an unfocused drag on window Escape without duplicate lost-capture cancellation', () => {
    const wrapper = mount(WorkspaceResizeDivider, { props: defaultProps })
    const separator = wrapper.get('[role="separator"]').element as HTMLElement & {
      releasePointerCapture: (pointerId: number) => void
      setPointerCapture: (pointerId: number) => void
    }
    const release = vi.fn((pointerId: number) => {
      dispatchPointer(separator, 'lostpointercapture', { clientX: 100, pointerId })
    })
    separator.setPointerCapture = vi.fn()
    separator.releasePointerCapture = release

    dispatchPointer(separator, 'pointerdown', { clientX: 90, pointerId: 71 })
    window.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' }))

    expect(wrapper.emitted('cancel')).toEqual([[]])
    expect(release).toHaveBeenCalledWith(71)

    wrapper.unmount()
  })

  it('releases capture on blur, disable, and unmount without duplicate cancellation', async () => {
    const wrapper = mount(WorkspaceResizeDivider, { props: defaultProps })
    const separator = wrapper.get('[role="separator"]').element as HTMLElement & {
      releasePointerCapture: (pointerId: number) => void
      setPointerCapture: (pointerId: number) => void
    }
    const release = vi.fn((pointerId: number) => {
      dispatchPointer(separator, 'lostpointercapture', { clientX: 90, pointerId })
    })
    separator.setPointerCapture = vi.fn()
    separator.releasePointerCapture = release

    dispatchPointer(separator, 'pointerdown', { clientX: 90, pointerId: 72 })
    window.dispatchEvent(new Event('blur'))
    expect(wrapper.emitted('cancel')).toEqual([[]])
    dispatchPointer(separator, 'pointerdown', { clientX: 90, pointerId: 73 })
    await wrapper.setProps({ disabled: true })
    expect(wrapper.emitted('cancel')).toEqual([[], []])
    await wrapper.setProps({ disabled: false })
    dispatchPointer(separator, 'pointerdown', { clientX: 90, pointerId: 74 })
    wrapper.unmount()

    expect(release.mock.calls.map(([pointerId]) => pointerId)).toEqual([72, 73, 74])
  })

  it('cancels on Escape, window blur, disable, and unmount', async () => {
    const wrapper = mount(WorkspaceResizeDivider, { props: defaultProps })
    const separator = wrapper.get('[role="separator"]')

    dispatchPointer(separator.element, 'pointerdown', { clientX: 90, pointerId: 14 })
    await separator.trigger('keydown', { key: 'Escape' })
    dispatchPointer(separator.element, 'pointerdown', { clientX: 90, pointerId: 15 })
    window.dispatchEvent(new Event('blur'))
    dispatchPointer(separator.element, 'pointerdown', { clientX: 90, pointerId: 16 })
    await wrapper.setProps({ disabled: true })
    expect(wrapper.emitted('cancel')).toEqual([[], [], []])

    await wrapper.setProps({ disabled: false })
    dispatchPointer(separator.element, 'pointerdown', { clientX: 90, pointerId: 17 })
    wrapper.unmount()
    expect(document.body.style.userSelect).toBe('')
  })

  it('emits bounded keyboard adjustment intents', async () => {
    const wrapper = mount(WorkspaceResizeDivider, { props: defaultProps })
    const separator = wrapper.get('[role="separator"]')

    await separator.trigger('keydown', { key: 'ArrowLeft' })
    await separator.trigger('keydown', { key: 'ArrowRight', shiftKey: true })
    await separator.trigger('keydown', { key: 'Home' })
    await separator.trigger('keydown', { key: 'End' })

    expect(wrapper.emitted('step')).toEqual([
      [-1, false],
      [1, true],
    ])
    expect(wrapper.emitted('minimum')).toEqual([[]])
    expect(wrapper.emitted('maximum')).toEqual([[]])

    wrapper.unmount()
  })
})
