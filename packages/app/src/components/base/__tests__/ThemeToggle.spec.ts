import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vite-plus/test'

import ThemeToggle from '../ThemeToggle.vue'

describe('ThemeToggle', () => {
  it('uses Lucide icons for both themes', () => {
    const wrapper = mount(ThemeToggle, {
      props: {
        theme: 'light',
      },
    })

    expect(wrapper.findAll('svg.lucide')).toHaveLength(2)
    expect(wrapper.find('button[aria-label="Switch to dark mode"]').exists()).toBe(true)
  })

  it('emits the next theme on click', async () => {
    const wrapper = mount(ThemeToggle, {
      props: {
        theme: 'light',
      },
    })

    await wrapper.trigger('click')

    expect(wrapper.emitted('toggle')).toEqual([[{ theme: 'dark' }]])
  })
})
