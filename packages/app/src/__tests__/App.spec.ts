import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import App from '../App.vue'
import MarkdownStudioView from '../views/MarkdownStudioView.vue'

describe('App', () => {
  it('renders the routed app view', async () => {
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
  })
})
