import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import ThemeToggle from '../ThemeToggle.vue'

describe('ThemeToggle', () => {
  it('emits the next theme and button origin on click', async () => {
    const wrapper = mount(ThemeToggle, {
      props: {
        theme: 'light',
      },
    })

    vi.spyOn(wrapper.element, 'getBoundingClientRect').mockReturnValue({
      bottom: 44,
      height: 24,
      left: 10,
      right: 34,
      toJSON: () => ({}),
      top: 20,
      width: 24,
      x: 10,
      y: 20,
    })

    await wrapper.trigger('click')

    expect(wrapper.emitted('toggle')).toEqual([
      [
        {
          origin: {
            x: 22,
            y: 32,
          },
          theme: 'dark',
        },
      ],
    ])
  })
})
