import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import OutlineSidebar from '../OutlineSidebar.vue'

describe('OutlineSidebar', () => {
  it('shows heading hierarchy and emits the selected source offset', async () => {
    const wrapper = mount(OutlineSidebar, {
      props: {
        activeHeadingId: 'block-1',
        headings: [
          { depth: 1, id: 'block-0', start: 0, text: 'Title' },
          { depth: 3, id: 'block-1', start: 18, text: 'Details' },
        ],
      },
    })

    const links = wrapper.findAll('.outline-sidebar__heading')
    expect(links.map((link) => link.text())).toEqual(['Title', 'Details'])
    expect(links[0]?.attributes('style')).toContain('--heading-depth: 0')
    expect(links[1]?.attributes('style')).toContain('--heading-depth: 2')
    expect(links[1]?.attributes('aria-current')).toBe('location')

    await links[1]?.trigger('click')

    expect(wrapper.emitted('navigate')).toEqual([[18]])
  })
})
