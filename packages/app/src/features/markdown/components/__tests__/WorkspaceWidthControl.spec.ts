import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vite-plus/test'

import WorkspaceWidthControl from '../WorkspaceWidthControl.vue'

describe('WorkspaceWidthControl', () => {
  it('closes on document Escape and restores focus to the trigger', async () => {
    const wrapper = mount(WorkspaceWidthControl, {
      attachTo: document.body,
      props: {
        disabled: false,
        fieldLabel: 'Width',
        inputLabel: 'Width in percent',
        label: 'Pane widths',
        max: 100,
        min: 0,
        resetLabel: 'Reset widths',
        step: 1,
        unit: '%',
        value: 50,
      },
    })
    const trigger = wrapper.get('button[aria-label="Pane widths"]')

    await trigger.trigger('click')
    expect(wrapper.find('.workspace-width-control__panel').exists()).toBe(true)

    document.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' }))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.workspace-width-control__panel').exists()).toBe(false)
    expect(document.activeElement).toBe(trigger.element)

    wrapper.unmount()
    document.body.innerHTML = ''
  })
})
