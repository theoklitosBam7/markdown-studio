import { describe, expect, it } from 'vitest'

import { isBareSingleChar, isEditableElement, normalizeEvent, normalizeKeys } from '../keyboard'

describe('normalizeKeys', () => {
  it('lowercases all keys and joins with +', () => {
    expect(normalizeKeys(['Mod', 'Shift', 'G'])).toBe('mod+shift+g')
  })

  it('returns single key unchanged except lowercased', () => {
    expect(normalizeKeys(['F'])).toBe('f')
  })
})

describe('normalizeEvent', () => {
  it('produces "mod+key" for Meta+letter', () => {
    const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true })
    expect(normalizeEvent(event)).toBe('mod+k')
  })

  it('produces "mod+shift+key" for Meta+Shift+letter', () => {
    const event = new KeyboardEvent('keydown', { key: 'S', metaKey: true, shiftKey: true })
    expect(normalizeEvent(event)).toBe('mod+shift+s')
  })

  it('produces "mod+shift+key" for Ctrl+Shift+letter', () => {
    const event = new KeyboardEvent('keydown', { ctrlKey: true, key: 'S', shiftKey: true })
    expect(normalizeEvent(event)).toBe('mod+shift+s')
  })

  it('ignores alt modifier', () => {
    const event = new KeyboardEvent('keydown', { altKey: true, key: 'f', metaKey: true })
    expect(normalizeEvent(event)).toBe('mod+f')
  })

  it('produces "mod+key" for Ctrl+letter', () => {
    const event = new KeyboardEvent('keydown', { ctrlKey: true, key: 'f' })
    expect(normalizeEvent(event)).toBe('mod+f')
  })

  it('produces bare single character for key without modifiers', () => {
    const event = new KeyboardEvent('keydown', { key: '?' })
    expect(normalizeEvent(event)).toBe('?')
  })

  it('handles named keys like Enter', () => {
    const event = new KeyboardEvent('keydown', { key: 'Enter' })
    expect(normalizeEvent(event)).toBe('enter')
  })

  it('handles Shift+named key', () => {
    const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true })
    expect(normalizeEvent(event)).toBe('shift+tab')
  })
})

describe('isBareSingleChar', () => {
  it('returns true for single character', () => {
    expect(isBareSingleChar('?')).toBe(true)
    expect(isBareSingleChar('a')).toBe(true)
  })

  it('returns false for key combos', () => {
    expect(isBareSingleChar('mod+k')).toBe(false)
    expect(isBareSingleChar('shift+tab')).toBe(false)
  })
})

describe('isEditableElement', () => {
  it('returns true for input elements', () => {
    const input = document.createElement('input')
    expect(isEditableElement(input)).toBe(true)
  })

  it('returns true for textarea elements', () => {
    const textarea = document.createElement('textarea')
    expect(isEditableElement(textarea)).toBe(true)
  })

  it('returns true for contentEditable elements', () => {
    const div = document.createElement('div')
    div.setAttribute('contenteditable', 'true')
    // jsdom does not compute isContentEditable from the attribute,
    // so override the getter to simulate the expected browser behavior.
    Object.defineProperty(div, 'isContentEditable', { value: true })
    expect(isEditableElement(div)).toBe(true)
  })

  it('returns false for plain divs', () => {
    const div = document.createElement('div')
    expect(isEditableElement(div)).toBe(false)
  })

  it('returns false for null', () => {
    expect(isEditableElement(null)).toBe(false)
  })
})
