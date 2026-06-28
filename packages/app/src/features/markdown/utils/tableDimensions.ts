import type { TableDimensions } from '../types/workspace'

export interface TableDimensionBounds {
  maxColumns: number
  maxRows: number
  minColumns: number
  minRows: number
}

/**
 * Single source of truth for the dimension bounds enforced by both the
 * dimension picker (as the input `min`/`max`) and the insertion composable
 * (as the clamp range). Keep them in sync by reading from here, never by
 * redeclaring the literals.
 */
export const TABLE_DIMENSION_BOUNDS: TableDimensionBounds = {
  maxColumns: 50,
  maxRows: 50,
  minColumns: 1,
  minRows: 1,
}

export const DEFAULT_TABLE_DIMENSIONS: TableDimensions = { columns: 3, rows: 3 }

/**
 * Clamps each dimension into `[min, max]`. Non-finite values (e.g. `NaN` from
 * an empty `<input type="number">`) fall back to `min`, and fractional values
 * are truncated, so the result is always a valid table size.
 */
export function clampTableDimensions(
  value: TableDimensions,
  bounds: TableDimensionBounds = TABLE_DIMENSION_BOUNDS,
): TableDimensions {
  return {
    columns: clampDimension(value.columns, bounds.minColumns, bounds.maxColumns),
    rows: clampDimension(value.rows, bounds.minRows, bounds.maxRows),
  }
}

function clampDimension(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min
  }

  return Math.max(min, Math.min(max, Math.trunc(value)))
}
