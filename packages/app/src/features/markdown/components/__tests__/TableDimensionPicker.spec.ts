import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import { TABLE_DIMENSION_BOUNDS } from '../../utils/tableDimensions'
import TableDimensionPicker from '../TableDimensionPicker.vue'

function mountPicker(props: Record<string, unknown> = {}) {
  const container = document.createElement('div')
  document.body.appendChild(container)

  return mount(TableDimensionPicker, {
    attachTo: container,
    props: {
      columns: 3,
      isOpen: true,
      rows: 3,
      ...props,
    },
  })
}

describe('TableDimensionPicker', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders row and column inputs with the provided values', () => {
    const wrapper = mountPicker({ columns: 4, rows: 5 })

    const columnInput = wrapper.get('input[aria-label="Columns"]').element as HTMLInputElement
    const rowInput = wrapper.get('input[aria-label="Rows"]').element as HTMLInputElement

    expect(columnInput.value).toBe('4')
    expect(rowInput.value).toBe('5')
  })

  it('emits update events when input values change', async () => {
    const wrapper = mountPicker()

    const columnInput = wrapper.get('input[aria-label="Columns"]')
    await columnInput.setValue('5')

    expect(wrapper.emitted('update:columns')).toEqual([[5]])

    const rowInput = wrapper.get('input[aria-label="Rows"]')
    await rowInput.setValue('2')

    expect(wrapper.emitted('update:rows')).toEqual([[2]])
  })

  it('emits confirm when the form is submitted', async () => {
    const wrapper = mountPicker()

    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('confirm')).toHaveLength(1)
  })

  it('emits cancel when the close button is clicked', async () => {
    const wrapper = mountPicker()

    await wrapper.find('button[aria-label="Close dialog"]').trigger('click')

    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })

  it('emits cancel when Escape is pressed', async () => {
    const wrapper = mountPicker()

    document.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' }))

    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })

  it('emits confirm when Enter is pressed from an input', async () => {
    const wrapper = mountPicker()

    await wrapper.get('input[aria-label="Columns"]').trigger('keydown.enter')

    expect(wrapper.emitted('confirm')).toHaveLength(1)
  })

  it('reads input min and max attributes from the shared bounds', () => {
    const wrapper = mountPicker()

    const columnInput = wrapper.get('input[aria-label="Columns"]').element as HTMLInputElement
    const rowInput = wrapper.get('input[aria-label="Rows"]').element as HTMLInputElement

    expect(columnInput.min).toBe(String(TABLE_DIMENSION_BOUNDS.minColumns))
    expect(columnInput.max).toBe(String(TABLE_DIMENSION_BOUNDS.maxColumns))
    expect(rowInput.min).toBe(String(TABLE_DIMENSION_BOUNDS.minRows))
    expect(rowInput.max).toBe(String(TABLE_DIMENSION_BOUNDS.maxRows))
  })
})
