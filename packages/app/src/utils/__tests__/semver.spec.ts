import { describe, expect, it } from 'vitest'

import { compareSemver } from '../semver'

describe('compareSemver', () => {
  it('returns 0 for equal versions', () => {
    expect(compareSemver('1.0.0', '1.0.0')).toBe(0)
    expect(compareSemver('0.2.0', '0.2.0')).toBe(0)
  })

  it('returns -1 when a is less than b (major)', () => {
    expect(compareSemver('1.0.0', '2.0.0')).toBe(-1)
  })

  it('returns -1 when a is less than b (minor)', () => {
    expect(compareSemver('0.1.0', '0.2.0')).toBe(-1)
  })

  it('returns -1 when a is less than b (patch)', () => {
    expect(compareSemver('0.2.0', '0.2.1')).toBe(-1)
  })

  it('returns 1 when a is greater than b', () => {
    expect(compareSemver('2.0.0', '1.0.0')).toBe(1)
    expect(compareSemver('0.3.0', '0.2.0')).toBe(1)
    expect(compareSemver('0.2.1', '0.2.0')).toBe(1)
  })

  it('strips v prefix before comparing', () => {
    expect(compareSemver('v0.2.0', 'v0.3.0')).toBe(-1)
    expect(compareSemver('0.2.0', 'v0.2.0')).toBe(0)
    expect(compareSemver('v1.0.0', '0.9.0')).toBe(1)
  })
})
