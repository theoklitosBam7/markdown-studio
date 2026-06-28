import { describe, expect, it } from 'vitest'

import {
  clampTableDimensions,
  DEFAULT_TABLE_DIMENSIONS,
  TABLE_DIMENSION_BOUNDS,
} from '../tableDimensions'

describe('tableDimensions', () => {
  describe('TABLE_DIMENSION_BOUNDS', () => {
    it('defines a contiguous 1–50 range for rows and columns', () => {
      expect(TABLE_DIMENSION_BOUNDS).toEqual({
        maxColumns: 50,
        maxRows: 50,
        minColumns: 1,
        minRows: 1,
      })
    })
  })

  describe('DEFAULT_TABLE_DIMENSIONS', () => {
    it('defaults to a 3×3 table', () => {
      expect(DEFAULT_TABLE_DIMENSIONS).toEqual({ columns: 3, rows: 3 })
    })
  })

  describe('clampTableDimensions', () => {
    it('clamps values above the maximum down to the bound', () => {
      expect(clampTableDimensions({ columns: 999, rows: 100 })).toEqual({ columns: 50, rows: 50 })
    })

    it('clamps values below the minimum up to the bound', () => {
      expect(clampTableDimensions({ columns: 0, rows: -5 })).toEqual({ columns: 1, rows: 1 })
    })

    it('falls back to the minimum for non-finite values such as NaN', () => {
      expect(clampTableDimensions({ columns: Number.NaN, rows: Number.NaN })).toEqual({
        columns: 1,
        rows: 1,
      })
    })

    it('truncates fractional values', () => {
      expect(clampTableDimensions({ columns: 2.9, rows: 4.5 })).toEqual({ columns: 2, rows: 4 })
    })

    it('honours a custom bounds argument', () => {
      expect(
        clampTableDimensions(
          { columns: 0, rows: 100 },
          { maxColumns: 10, maxRows: 10, minColumns: 1, minRows: 1 },
        ),
      ).toEqual({ columns: 1, rows: 10 })
    })

    it('leaves in-range integer values unchanged', () => {
      expect(clampTableDimensions({ columns: 4, rows: 7 })).toEqual({ columns: 4, rows: 7 })
    })
  })
})
