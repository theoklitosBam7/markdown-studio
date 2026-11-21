import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vite-plus/test'

import HtmlPreviewFrame from '../HtmlPreviewFrame.vue'

describe('HtmlPreviewFrame', () => {
  it('renders prepared HTML in a sandbox with no extra permissions', () => {
    const wrapper = mount(HtmlPreviewFrame, {
      props: {
        preview: {
          sandbox: '',
          srcdoc: '<!doctype html><html><body><p>Ready</p></body></html>',
        },
      },
    })

    const frame = wrapper.get('iframe')

    expect(frame.attributes('title')).toBe('HTML preview')
    expect(frame.attributes('sandbox')).toBe('')
    expect(frame.attributes('srcdoc')).toContain('<p>Ready</p>')
    expect(frame.attributes('allow-same-origin')).toBeUndefined()
    expect(frame.attributes('allow-scripts')).toBeUndefined()
  })

  it('recreates the frame when sandbox permissions change', async () => {
    const wrapper = mount(HtmlPreviewFrame, {
      props: {
        preview: { sandbox: '', srcdoc: '<p>Ready</p>' },
      },
    })
    const staticFrame = wrapper.get('iframe').element

    await wrapper.setProps({
      preview: { sandbox: 'allow-scripts', srcdoc: '<p>Ready</p>' },
    })

    const scriptFrame = wrapper.get('iframe').element

    expect(scriptFrame).not.toBe(staticFrame)
    expect(scriptFrame.getAttribute('sandbox')).toBe('allow-scripts')
  })

  it('replaces the rendered document when the preview changes', async () => {
    const wrapper = mount(HtmlPreviewFrame, {
      props: {
        preview: { sandbox: '', srcdoc: '<p>First</p>' },
      },
    })

    await wrapper.setProps({
      preview: { sandbox: '', srcdoc: '<p>Second</p>' },
    })

    expect(wrapper.get('iframe').attributes('srcdoc')).toContain('<p>Second</p>')
  })
})
