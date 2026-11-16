import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vite-plus/test'

import ClearDocumentDialog from '../ClearDocumentDialog.vue'

describe('ClearDocumentDialog', () => {
  it('emits cancel and confirm from its actions', async () => {
    const wrapper = mount(ClearDocumentDialog, {
      attachTo: document.body,
      props: { isOpen: true },
    })

    await wrapper.get('button[aria-label="Cancel clear"]').trigger('click')
    await wrapper.get('button[aria-label="Confirm clear"]').trigger('click')

    expect(wrapper.emitted('cancel')).toHaveLength(1)
    expect(wrapper.emitted('confirm')).toHaveLength(1)

    wrapper.unmount()
    document.body.innerHTML = ''
  })
})
