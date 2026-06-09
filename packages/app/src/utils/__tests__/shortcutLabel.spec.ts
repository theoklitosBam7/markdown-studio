import { describe, expect, it, vi } from 'vitest'

import { formatShortcutLabel, getShortcutPlatform } from '../shortcutLabel'

describe('formatShortcutLabel', () => {
  it('formats macOS shortcut labels with glyphs', () => {
    expect(formatShortcutLabel(['Mod', 'Shift', 'S'], 'mac')).toBe('⌘⇧S')
  })

  it('formats Windows and Linux shortcut labels with text', () => {
    expect(formatShortcutLabel(['Mod', 'Shift', 'S'], 'other')).toBe('Ctrl+Shift+S')
  })

  it('formats Alt key', () => {
    expect(formatShortcutLabel(['Mod', 'Alt', 'F'], 'mac')).toBe('⌘⌥F')
    expect(formatShortcutLabel(['Mod', 'Alt', 'F'], 'other')).toBe('Ctrl+Alt+F')
  })

  it('formats Enter key', () => {
    expect(formatShortcutLabel(['Enter'], 'mac')).toBe('↩')
    expect(formatShortcutLabel(['Enter'], 'other')).toBe('Enter')
  })

  it('formats bare single-character keys as uppercase', () => {
    expect(formatShortcutLabel(['?'], 'mac')).toBe('?')
    expect(formatShortcutLabel(['?'], 'other')).toBe('?')
  })

  it('uses default platform when not provided', () => {
    const platformSpy = vi.spyOn(navigator, 'platform', 'get').mockReturnValue('Win32')

    expect(formatShortcutLabel(['Mod', 'K'])).toBe('Ctrl+K')

    platformSpy.mockRestore()
  })
})

describe('getShortcutPlatform', () => {
  it('returns "mac" for macOS platforms', () => {
    const platformSpy = vi.spyOn(navigator, 'platform', 'get').mockReturnValue('MacIntel')
    expect(getShortcutPlatform()).toBe('mac')
    platformSpy.mockRestore()
  })

  it('returns "mac" for iOS platforms', () => {
    const platformSpy = vi.spyOn(navigator, 'platform', 'get').mockReturnValue('iPhone')
    expect(getShortcutPlatform()).toBe('mac')
    platformSpy.mockRestore()
  })

  it('returns "other" for Windows platforms', () => {
    const platformSpy = vi.spyOn(navigator, 'platform', 'get').mockReturnValue('Win32')
    expect(getShortcutPlatform()).toBe('other')
    platformSpy.mockRestore()
  })

  it('returns "other" when navigator is undefined', () => {
    const originalNavigator = globalThis.navigator
    // @ts-expect-error — simulating non-browser environment
    globalThis.navigator = undefined
    expect(getShortcutPlatform()).toBe('other')
    globalThis.navigator = originalNavigator
  })
})
