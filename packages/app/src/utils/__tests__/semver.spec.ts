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

  it('strips desktop-v prefix before comparing', () => {
    expect(compareSemver('desktop-v0.2.0', 'desktop-v0.3.0')).toBe(-1)
    expect(compareSemver('desktop-v0.2.0', 'desktop-v0.2.0')).toBe(0)
    expect(compareSemver('desktop-v1.0.0', 'desktop-v0.9.0')).toBe(1)
  })

  it('compares mixed tag formats', () => {
    expect(compareSemver('desktop-v1.2.3', '1.2.3')).toBe(0)
    expect(compareSemver('desktop-v1.2.3', 'v1.2.4')).toBe(-1)
    expect(compareSemver('1.3.0', 'desktop-v1.2.0')).toBe(1)
  })

  it('throws on invalid version strings', () => {
    expect(() => compareSemver('not-a-version', '1.0.0')).toThrow('Invalid semver')
    expect(() => compareSemver('1.0.0', '')).toThrow('Invalid semver')
  })
})
