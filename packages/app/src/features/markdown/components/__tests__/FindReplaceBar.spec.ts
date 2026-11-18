import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vite-plus/test'

import FindReplaceBar from '../FindReplaceBar.vue'

function mountBar(overrides: Record<string, unknown> = {}) {
  return mount(FindReplaceBar, {
    props: {
      activeMatchNumber: 2,
      matchCase: false,
      matchCount: 7,
      query: 'needle',
      replaceText: '',
      showReplace: true,
      ...overrides,
    },
  })
}

describe('FindReplaceBar', () => {
  it('shows a compact match count with an accessible label', () => {
    const wrapper = mountBar()
    const count = wrapper.get('.find-replace-bar__count')

    expect(count.text()).toBe('2/7')
    expect(count.attributes('aria-label')).toBe('2 of 7 matches')
    wrapper.unmount()
  })

  it('emits navigation and close actions from labelled icon buttons', async () => {
    const wrapper = mountBar()

    await wrapper.get('button[aria-label="Find previous"]').trigger('click')
    await wrapper.get('button[aria-label="Find next"]').trigger('click')
    await wrapper.get('button[aria-label="Close find"]').trigger('click')

    expect(wrapper.emitted('previous')).toHaveLength(1)
    expect(wrapper.emitted('next')).toHaveLength(1)
    expect(wrapper.emitted('close')).toHaveLength(1)
    wrapper.unmount()
  })

  it('emits replace actions and the match-case toggle', async () => {
    const wrapper = mountBar()

    await wrapper.get('button[aria-label="Replace current"]').trigger('click')
    await wrapper.get('button[aria-label="Replace all"]').trigger('click')
    await wrapper.get('button[aria-label="Match case"]').trigger('click')

    expect(wrapper.emitted('replaceCurrent')).toHaveLength(1)
    expect(wrapper.emitted('replaceAll')).toHaveLength(1)
    expect(wrapper.emitted('update:match-case')).toEqual([[true]])
    wrapper.unmount()
  })
})
