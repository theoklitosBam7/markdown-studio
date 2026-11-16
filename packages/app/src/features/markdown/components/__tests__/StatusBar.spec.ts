import type { VueWrapper } from '@vue/test-utils'

import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import { nextTick } from 'vue'

import StatusBar from '../StatusBar.vue'

const wrappers: VueWrapper[] = []

function mountStatusBar(overrides: Record<string, unknown> = {}) {
  const wrapper = mount(StatusBar, {
    props: {
      chars: 7932,
      diagrams: 2,
      lines: 148,
      status: 'Opened draft.md',
      words: 1284,
      ...overrides,
    },
  })

  wrappers.push(wrapper)
  return wrapper
}

describe('StatusBar', () => {
  afterEach(async () => {
    for (const wrapper of wrappers) {
      wrapper.unmount()
    }
    wrappers.length = 0
    await nextTick()
    document.body.innerHTML = ''
  })

  it('shows all document statistics in one place', () => {
    const wrapper = mountStatusBar()

    expect(wrapper.text()).toContain('1,284 words')
    expect(wrapper.text()).toContain('7,932 chars')
    expect(wrapper.text()).toContain('148 lines')
    expect(wrapper.text()).toContain('2 diagrams')
    expect(wrapper.text()).toContain('Opened draft.md')
  })

  it('does not repeat document state or show a decorative status dot', () => {
    const wrapper = mountStatusBar()

    expect(wrapper.find('.status-dot').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Unsaved')
    expect(wrapper.text()).not.toContain('•')
  })

  it('uses the singular form for a single diagram', () => {
    const wrapper = mountStatusBar({ diagrams: 1 })

    expect(wrapper.text()).toContain('1 diagram')
    expect(wrapper.text()).not.toContain('1 diagrams')
  })
})
