import type { ShallowRef } from 'vue'

import { readonly, shallowRef } from 'vue'

import type { EditorPaneAdapter, TableDimensions } from '../types/workspace'

import {
  clampTableDimensions,
  DEFAULT_TABLE_DIMENSIONS,
  TABLE_DIMENSION_BOUNDS,
  type TableDimensionBounds,
} from '../utils/tableDimensions'
import { generateTableTemplate } from '../utils/tableTemplate'

export interface TableInsertionApi {
  closePicker(): void
  confirmInsertion(): Promise<void>
  dimensions: Readonly<ShallowRef<TableDimensions>>
  isPickerOpen: Readonly<ShallowRef<boolean>>
  openPicker(): void
  setDimensions(dimensions: TableDimensions): void
}

export interface UseTableInsertionOptions {
  defaultDimensions?: TableDimensions
  editorPane: ShallowRef<EditorPaneAdapter | null>
  maxColumns?: number
  maxRows?: number
  minColumns?: number
  minRows?: number
}

export function useTableInsertion(options: UseTableInsertionOptions): TableInsertionApi {
  const {
    defaultDimensions = DEFAULT_TABLE_DIMENSIONS,
    editorPane,
    maxColumns = TABLE_DIMENSION_BOUNDS.maxColumns,
    maxRows = TABLE_DIMENSION_BOUNDS.maxRows,
    minColumns = TABLE_DIMENSION_BOUNDS.minColumns,
    minRows = TABLE_DIMENSION_BOUNDS.minRows,
  } = options
  const bounds: TableDimensionBounds = { maxColumns, maxRows, minColumns, minRows }
  const isPickerOpen = shallowRef(false)
  const dimensions = shallowRef<TableDimensions>(clampTableDimensions(defaultDimensions, bounds))

  function openPicker(): void {
    dimensions.value = clampTableDimensions(defaultDimensions, bounds)
    isPickerOpen.value = true
  }

  function closePicker(): void {
    isPickerOpen.value = false
  }

  function setDimensions(nextDimensions: TableDimensions): void {
    dimensions.value = clampTableDimensions(nextDimensions, bounds)
  }

  async function confirmInsertion(): Promise<void> {
    const tableTemplate = generateTableTemplate(clampTableDimensions(dimensions.value, bounds))
    // Close synchronously before the await so a rapid double-submit cannot
    // insert a second table while the first is still being written.
    isPickerOpen.value = false
    await editorPane.value?.insertText(tableTemplate)
    editorPane.value?.focus()
  }

  return {
    closePicker,
    confirmInsertion,
    dimensions: readonly(dimensions),
    isPickerOpen: readonly(isPickerOpen),
    openPicker,
    setDimensions,
  }
}
