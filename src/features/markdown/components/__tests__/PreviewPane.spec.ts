import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import PreviewPane from '../PreviewPane.vue'

describe('PreviewPane', () => {
  it('rerenders mermaid diagrams when the theme changes', async () => {
    const wrapper = mount(PreviewPane, {
      props: {
        html: '<div class="mermaid-wrap"><div class="mermaid">graph TD; A-->B;</div></div>',
        theme: 'light',
        wordCount: 1,
      },
    })

    await nextTick()
    await nextTick()

    expect(wrapper.emitted('renderDiagrams')).toHaveLength(1)
    const initialPreview = wrapper.find('.rendered-md').element

    await wrapper.setProps({ theme: 'dark' })
    await nextTick()
    await nextTick()

    expect(wrapper.emitted('renderDiagrams')).toHaveLength(2)
    expect(wrapper.find('.rendered-md').element).not.toBe(initialPreview)
    expect(wrapper.find('.mermaid').exists()).toBe(true)
  })
})
