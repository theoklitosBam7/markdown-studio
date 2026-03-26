import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ViewToggle from '../ViewToggle.vue'

describe('ViewToggle', () => {
  it('renders only the provided modes', () => {
    const wrapper = mount(ViewToggle, {
      props: {
        availableModes: ['editor', 'preview'],
        modelValue: 'editor',
      },
    })

    const labels = wrapper.findAll('button').map((button) => button.text())

    expect(labels).toEqual(['Editor', 'Preview'])
    expect(wrapper.find('[data-mode="split"]').exists()).toBe(false)
  })

  it('emits the selected mode when clicked', async () => {
    const wrapper = mount(ViewToggle, {
      props: {
        availableModes: ['editor', 'preview'],
        modelValue: 'editor',
      },
    })

    await wrapper.get('[data-mode="preview"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([['preview']])
  })
})
