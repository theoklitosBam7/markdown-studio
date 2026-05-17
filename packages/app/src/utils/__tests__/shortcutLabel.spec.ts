import { describe, expect, it } from 'vitest'

import { formatShortcutLabel } from '../shortcutLabel'

describe('formatShortcutLabel', () => {
  it('formats macOS shortcut labels with glyphs', () => {
    expect(formatShortcutLabel(['Mod', 'Shift', 'S'], 'mac')).toBe('⌘⇧S')
  })

  it('formats Windows and Linux shortcut labels with text', () => {
    expect(formatShortcutLabel(['Mod', 'Shift', 'S'], 'other')).toBe('Ctrl+Shift+S')
  })
})
