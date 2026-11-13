import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { nextTick } from 'vue'

import WorkspaceSidebarLayout from '../WorkspaceSidebarLayout.vue'

function dispatchPointer(
  target: EventTarget,
  type: string,
  options: { clientX: number; pointerId: number },
): void {
  const event = new Event(type, { bubbles: true, cancelable: true })
  Object.assign(event, {
    button: 0,
    clientX: options.clientX,
    isPrimary: true,
    pointerId: options.pointerId,
  })
  target.dispatchEvent(event)
}

describe('WorkspaceSidebarLayout', () => {
  let rowWidth = 1296
  let notifyResize: () => void

  beforeEach(() => {
    rowWidth = 1296
    notifyResize = () => undefined
    window.localStorage.clear()
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
      () => new DOMRect(0, 0, rowWidth, 800),
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

  it('gives the visible sidebar its default width and a separate gutter', async () => {
    const wrapper = mount(WorkspaceSidebarLayout, {
      props: { isMobile: false, kind: 'outline', viewMode: 'split', visible: true },
      slots: {
        default: '<main>Editor Workspace</main>',
        sidebar: '<nav>Document outline</nav>',
      },
    })
    await nextTick()

    expect(wrapper.get('.workspace-sidebar__region').element.getAttribute('style')).toContain(
      '248px',
    )
    expect(wrapper.get('[role="separator"]').attributes('aria-label')).toBe('Outline width')
    expect(wrapper.get('[role="separator"]').attributes('title')).toBe(
      'Drag to resize. Double-click to reset. Use Left and Right Arrow when focused.',
    )
    expect(wrapper.get('.workspace-sidebar__region').text()).toBe('Document outline')
    expect(wrapper.get('.workspace-sidebar__content').text()).toBe('Editor Workspace')
    expect(window.localStorage.getItem('markdown-studio:workspace-sidebar-width')).toBeNull()
    wrapper.unmount()
  })

  it('lets the open sidebar width popup extend beyond its gutter without clipping', async () => {
    const wrapper = mount(WorkspaceSidebarLayout, {
      props: { isMobile: false, kind: 'outline', viewMode: 'split', visible: true },
    })
    await nextTick()

    await wrapper.get('button[aria-label="Sidebar width"]').trigger('click')
    expect(wrapper.find('.workspace-width-control__panel').exists()).toBe(true)
    wrapper.unmount()
  })

  it('keeps the panel open between its controls and dismisses it when keyboard focus leaves', async () => {
    const wrapper = mount(WorkspaceSidebarLayout, {
      attachTo: document.body,
      props: { isMobile: false, kind: 'outline', viewMode: 'split', visible: true },
      slots: { default: '<button>Continue editing</button>' },
    })
    await nextTick()
    const trigger = wrapper.get('button[aria-label="Sidebar width"]')
    await trigger.trigger('click')
    await wrapper.get('input').setValue('360')
    wrapper.get<HTMLButtonElement>('.workspace-width-control__reset').element.focus()
    await nextTick()
    expect(wrapper.find('form').exists()).toBe(true)

    const outside = wrapper.get<HTMLButtonElement>('.workspace-sidebar__content button')
    outside.element.focus()
    await nextTick()

    expect(wrapper.find('form').exists()).toBe(false)
    expect(document.activeElement).toBe(outside.element)
    expect(window.localStorage.getItem('markdown-studio:workspace-sidebar-width')).toBeNull()
    await trigger.trigger('click')
    expect(wrapper.get<HTMLInputElement>('input').element.value).toBe('248')
    wrapper.unmount()
  })

  it('saves a sidebar drag only after the pointer moves and commits', async () => {
    const wrapper = mount(WorkspaceSidebarLayout, {
      props: { isMobile: false, kind: 'outline', viewMode: 'split', visible: true },
    })
    await nextTick()
    const divider = wrapper.get('[role="separator"]')
    expect(divider.attributes('tabindex')).toBe('0')

    dispatchPointer(divider.element, 'pointerdown', { clientX: 100, pointerId: 1 })
    dispatchPointer(window, 'pointermove', { clientX: 140, pointerId: 1 })
    await nextTick()
    expect(window.localStorage.getItem('markdown-studio:workspace-sidebar-width')).toBeNull()
    expect(wrapper.get('.workspace-sidebar__region').element.getAttribute('style')).toContain(
      '288px',
    )
    dispatchPointer(window, 'pointerup', { clientX: 140, pointerId: 1 })

    expect(window.localStorage.getItem('markdown-studio:workspace-sidebar-width')).toBe('288')
    wrapper.unmount()
  })

  it('does not retain a draft after a plain click at a constrained width', async () => {
    window.localStorage.setItem('markdown-studio:workspace-sidebar-width', '248')
    rowWidth = 800
    const wrapper = mount(WorkspaceSidebarLayout, {
      props: { isMobile: false, kind: 'outline', viewMode: 'split', visible: true },
    })
    await nextTick()
    const divider = wrapper.get('[role="separator"]').element

    dispatchPointer(divider, 'pointerdown', { clientX: 100, pointerId: 8 })
    dispatchPointer(window, 'pointerup', { clientX: 100, pointerId: 8 })
    rowWidth = 1296
    notifyResize()
    await nextTick()

    expect(wrapper.get('.workspace-sidebar__region').element.getAttribute('style')).toContain(
      '248px',
    )
    expect(window.localStorage.getItem('markdown-studio:workspace-sidebar-width')).toBe('248')
    wrapper.unmount()
  })

  it('does not save a drag that returns to its constrained starting width', async () => {
    window.localStorage.setItem('markdown-studio:workspace-sidebar-width', '248')
    rowWidth = 800
    const wrapper = mount(WorkspaceSidebarLayout, {
      props: { isMobile: false, kind: 'outline', viewMode: 'split', visible: true },
    })
    await nextTick()
    const divider = wrapper.get('[role="separator"]').element

    dispatchPointer(divider, 'pointerdown', { clientX: 100, pointerId: 9 })
    dispatchPointer(window, 'pointermove', { clientX: 120, pointerId: 9 })
    dispatchPointer(window, 'pointermove', { clientX: 100, pointerId: 9 })
    dispatchPointer(window, 'pointerup', { clientX: 100, pointerId: 9 })

    expect(window.localStorage.getItem('markdown-studio:workspace-sidebar-width')).toBe('248')
    rowWidth = 1296
    notifyResize()
    await nextTick()
    expect(wrapper.get('.workspace-sidebar__region').element.getAttribute('style')).toContain(
      '248px',
    )
    wrapper.unmount()
  })

  it('cancels a draft and removes the closing separator from tab order', async () => {
    const wrapper = mount(WorkspaceSidebarLayout, {
      props: { isMobile: false, kind: 'outline', viewMode: 'split', visible: true },
      slots: { default: '<main>Editor Workspace</main>' },
    })
    await nextTick()
    const divider = wrapper.get('[role="separator"]')

    dispatchPointer(divider.element, 'pointerdown', { clientX: 100, pointerId: 2 })
    dispatchPointer(window, 'pointermove', { clientX: 140, pointerId: 2 })
    await nextTick()
    await wrapper.setProps({ visible: false })

    expect(window.localStorage.getItem('markdown-studio:workspace-sidebar-width')).toBeNull()
    expect(wrapper.find('[role="separator"]').exists()).toBe(false)
    expect(wrapper.get('.workspace-sidebar__content').text()).toBe('Editor Workspace')
    wrapper.unmount()
  })

  it('cleans up an active divider gesture when its kind or mode changes', async () => {
    const originalUserSelect = document.body.style.userSelect
    document.body.style.userSelect = 'text'
    const wrapper = mount(WorkspaceSidebarLayout, {
      props: { isMobile: false, kind: 'outline', viewMode: 'split', visible: true },
      slots: { default: '<main>Editor Workspace</main>' },
    })
    await nextTick()
    const editorContent = wrapper.get('.workspace-sidebar__content').element

    dispatchPointer(wrapper.get('[role="separator"]').element, 'pointerdown', {
      clientX: 100,
      pointerId: 10,
    })
    expect(document.body.style.userSelect).toBe('none')
    await wrapper.setProps({ kind: 'folders' })
    expect(document.body.style.userSelect).toBe('text')
    expect(wrapper.get('.workspace-sidebar__content').element).toBe(editorContent)

    dispatchPointer(wrapper.get('[role="separator"]').element, 'pointerdown', {
      clientX: 100,
      pointerId: 11,
    })
    expect(document.body.style.userSelect).toBe('none')
    await wrapper.setProps({ viewMode: 'editor' })
    expect(document.body.style.userSelect).toBe('text')
    expect(wrapper.get('.workspace-sidebar__content').element).toBe(editorContent)

    wrapper.unmount()
    document.body.style.userSelect = originalUserSelect
  })

  it('does not hide the Editor Workspace when a narrow mobile sidebar is closed', async () => {
    rowWidth = 600
    const wrapper = mount(WorkspaceSidebarLayout, {
      props: { isMobile: true, kind: 'outline', viewMode: 'editor', visible: false },
      slots: { default: '<main>Editor Workspace</main>' },
    })

    expect(wrapper.get('.workspace-sidebar-layout').classes()).not.toContain(
      'workspace-sidebar-layout--mobile-narrow',
    )
    expect(wrapper.get('.workspace-sidebar__content').text()).toBe('Editor Workspace')
    wrapper.unmount()
  })

  it('keeps reset available when the sidebar has no resize range', async () => {
    window.localStorage.setItem('markdown-studio:workspace-sidebar-width', '400')
    rowWidth = 800
    const wrapper = mount(WorkspaceSidebarLayout, {
      props: { isMobile: false, kind: 'outline', viewMode: 'split', visible: true },
    })
    await nextTick()

    await wrapper.get('button[aria-label="Sidebar width"]').trigger('click')
    const input = wrapper.get('input[aria-label="Sidebar width in pixels"]')
    expect((input.element as HTMLInputElement).disabled).toBe(true)
    await wrapper.get('.workspace-width-control__reset').trigger('click')

    expect(window.localStorage.getItem('markdown-studio:workspace-sidebar-width')).toBe('248')
    wrapper.unmount()
  })

  it('keeps mobile outline and Document Folders sizing distinct without a divider', async () => {
    window.localStorage.setItem('markdown-studio:workspace-sidebar-width', '400')
    rowWidth = 600
    const wrapper = mount(WorkspaceSidebarLayout, {
      props: { isMobile: true, kind: 'outline', viewMode: 'editor', visible: true },
      slots: { default: '<main>Editor Workspace</main>', sidebar: '<nav>Mobile sidebar</nav>' },
    })
    await nextTick()

    expect(wrapper.get('.workspace-sidebar__region').element.getAttribute('style')).toContain(
      '100%',
    )
    expect(wrapper.find('[role="separator"]').exists()).toBe(false)
    expect(wrapper.find('.workspace-sidebar__content').exists()).toBe(true)

    await wrapper.setProps({ kind: 'folders' })
    expect(wrapper.get('.workspace-sidebar__region').element.getAttribute('style')).toContain(
      '248px',
    )
    expect(wrapper.find('[role="separator"]').exists()).toBe(false)
    expect(window.localStorage.getItem('markdown-studio:workspace-sidebar-width')).toBe('400')
    wrapper.unmount()
  })

  it('keeps landscape mobile above 700 pixels in the baseline row presentation', async () => {
    window.localStorage.setItem('markdown-studio:workspace-sidebar-width', '400')
    rowWidth = 800
    const wrapper = mount(WorkspaceSidebarLayout, {
      props: { isMobile: true, kind: 'outline', viewMode: 'editor', visible: true },
      slots: { default: '<main>Editor Workspace</main>', sidebar: '<nav>Mobile outline</nav>' },
    })
    await nextTick()

    expect(wrapper.get('.workspace-sidebar__region').element.getAttribute('style')).toContain(
      '248px',
    )
    expect(wrapper.get('.workspace-sidebar-layout').classes()).not.toContain(
      'workspace-sidebar-layout--mobile-narrow',
    )
    expect(wrapper.find('[role="separator"]').exists()).toBe(false)
    expect(window.localStorage.getItem('markdown-studio:workspace-sidebar-width')).toBe('400')
    wrapper.unmount()
  })

  it('clamps a valid numeric width to the current sidebar maximum', async () => {
    const wrapper = mount(WorkspaceSidebarLayout, {
      props: { isMobile: false, kind: 'outline', viewMode: 'split', visible: true },
    })
    await nextTick()

    await wrapper.get('button[aria-label="Sidebar width"]').trigger('click')
    await wrapper.get('input[aria-label="Sidebar width in pixels"]').setValue('900')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.get('.workspace-sidebar__region').element.getAttribute('style')).toContain(
      '480px',
    )
    expect(window.localStorage.getItem('markdown-studio:workspace-sidebar-width')).toBe('480')
    wrapper.unmount()
  })

  it('restores a saved sidebar width after a temporary narrow-row clamp', async () => {
    window.localStorage.setItem('markdown-studio:workspace-sidebar-width', '400')
    const wrapper = mount(WorkspaceSidebarLayout, {
      props: { isMobile: false, kind: 'outline', viewMode: 'split', visible: true },
    })
    await nextTick()
    expect(wrapper.get('.workspace-sidebar__region').element.getAttribute('style')).toContain(
      '400px',
    )

    rowWidth = 800
    notifyResize()
    await nextTick()
    expect(wrapper.get('.workspace-sidebar__region').element.getAttribute('style')).toContain(
      '200px',
    )
    expect(window.localStorage.getItem('markdown-studio:workspace-sidebar-width')).toBe('400')

    rowWidth = 1296
    notifyResize()
    await nextTick()
    expect(wrapper.get('.workspace-sidebar__region').element.getAttribute('style')).toContain(
      '400px',
    )
    wrapper.unmount()
  })

  it('keeps a 200 pixel sidebar when the split-mode budget is below its minimum', async () => {
    rowWidth = 800
    const wrapper = mount(WorkspaceSidebarLayout, {
      props: { isMobile: false, kind: 'outline', viewMode: 'split', visible: true },
    })
    await nextTick()

    expect(wrapper.get('.workspace-sidebar__region').element.getAttribute('style')).toContain(
      '200px',
    )
    expect(wrapper.get('.workspace-sidebar__area').element.getAttribute('style')).toContain('224px')
    expect(wrapper.get('[role="separator"]').attributes('aria-valuemin')).toBe('200')
    expect(wrapper.get('[role="separator"]').attributes('aria-valuemax')).toBe('200')
    expect(wrapper.get('[role="separator"]').attributes('tabindex')).toBe('-1')
    expect(window.localStorage.getItem('markdown-studio:workspace-sidebar-width')).toBeNull()
    wrapper.unmount()
  })
})
