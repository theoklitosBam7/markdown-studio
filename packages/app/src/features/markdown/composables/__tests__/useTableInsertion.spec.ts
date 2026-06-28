import { describe, expect, it, vi } from 'vitest'
import { shallowRef } from 'vue'

import type { EditorPaneAdapter } from '@/features/markdown/types'

import { generateTableTemplate } from '../../utils/tableTemplate'
import { useTableInsertion } from '../useTableInsertion'

function createEditorAdapter(): EditorPaneAdapter {
  return {
    focus: vi.fn(),
    focusAtOffset: vi.fn(async () => undefined),
    focusFindQuery: vi.fn(),
    getScrollState: vi.fn(() => null),
    insertText: vi.fn(async () => undefined),
    replaceAllContent: vi.fn(async () => undefined),
    replaceRange: vi.fn(async () => undefined),
    setSelectionRange: vi.fn(async () => undefined),
  }
}

describe('useTableInsertion', () => {
  it('opens the picker with a 3x3 default when insertTable is invoked', () => {
    const editorPane = shallowRef<EditorPaneAdapter>(createEditorAdapter())
    const tableInsertion = useTableInsertion({ editorPane })

    tableInsertion.openPicker()

    expect(tableInsertion.isPickerOpen.value).toBe(true)
    expect(tableInsertion.dimensions.value).toEqual({ columns: 3, rows: 3 })
  })

  it('inserts a GFM table with the selected dimensions when confirmed', async () => {
    const editorPane = shallowRef<EditorPaneAdapter>(createEditorAdapter())
    const tableInsertion = useTableInsertion({ editorPane })

    tableInsertion.openPicker()
    tableInsertion.setDimensions({ columns: 2, rows: 4 })
    await tableInsertion.confirmInsertion()

    expect(editorPane.value?.insertText).toHaveBeenCalledWith(
      generateTableTemplate({ columns: 2, rows: 4 }),
    )
    expect(tableInsertion.isPickerOpen.value).toBe(false)
  })

  it('closes the picker without inserting when cancelled', () => {
    const editorPane = shallowRef<EditorPaneAdapter>(createEditorAdapter())
    const tableInsertion = useTableInsertion({ editorPane })

    tableInsertion.openPicker()
    tableInsertion.closePicker()

    expect(editorPane.value?.insertText).not.toHaveBeenCalled()
    expect(tableInsertion.isPickerOpen.value).toBe(false)
  })

  it('clamps dimensions to configured bounds before inserting', async () => {
    const editorPane = shallowRef<EditorPaneAdapter>(createEditorAdapter())
    const tableInsertion = useTableInsertion({
      editorPane,
      maxColumns: 10,
      maxRows: 10,
      minColumns: 1,
      minRows: 1,
    })

    tableInsertion.openPicker()
    tableInsertion.setDimensions({ columns: 0, rows: 100 })
    await tableInsertion.confirmInsertion()

    expect(editorPane.value?.insertText).toHaveBeenCalledWith(
      generateTableTemplate({ columns: 1, rows: 10 }),
    )
  })

  it('falls back to the minimum dimension when a value is NaN (e.g. an empty input)', async () => {
    const editorPane = shallowRef<EditorPaneAdapter>(createEditorAdapter())
    const tableInsertion = useTableInsertion({ editorPane })

    tableInsertion.openPicker()
    tableInsertion.setDimensions({ columns: Number.NaN, rows: 3 })
    await tableInsertion.confirmInsertion()

    expect(editorPane.value?.insertText).toHaveBeenCalledWith(
      generateTableTemplate({ columns: 1, rows: 3 }),
    )
  })
})
