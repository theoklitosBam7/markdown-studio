import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vite-plus/test'

import ViewToggle from '../ViewToggle.vue'

describe('ViewToggle', () => {
  it('shows a clear icon for each available workspace view', () => {
    const wrapper = mount(ViewToggle, {
      props: {
        availableModes: ['editor', 'split', 'preview'],
        modelValue: 'split',
      },
    })

    expect(wrapper.findAll('button svg.lucide')).toHaveLength(3)
  })

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
    expect(wrapper.get('[data-mode="editor"]').attributes('aria-pressed')).toBe('true')
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
