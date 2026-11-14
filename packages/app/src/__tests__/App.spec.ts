import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vite-plus/test'
import { createMemoryHistory, createRouter } from 'vue-router'

import App from '../App.vue'
import MarkdownStudioView from '../views/MarkdownStudioView.vue'

describe('App', () => {
  afterEach(() => vi.restoreAllMocks())

  it('renders the routed app view', async () => {
    const createRange = document.createRange.bind(document)
    vi.spyOn(document, 'createRange').mockImplementation(() => {
      const range = createRange()
      range.getBoundingClientRect = () => new DOMRect()
      return range
    })
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          component: MarkdownStudioView,
          path: '/',
        },
      ],
    })

    await router.push('/')

    const wrapper = mount(App, {
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.find('.markdown-studio').exists()).toBe(true)
    expect(wrapper.text()).toContain('Markdown')
    wrapper.unmount()
  })
})
