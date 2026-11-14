import { afterEach, describe, expect, it, vi } from 'vite-plus/test'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'

import { useEditorDisplayPreferences } from '../useEditorDisplayPreferences'
import { isValidEditorDisplayNumber } from '../../types/editorDisplayPreferences'

function mountOwner() {
  let preferences: ReturnType<typeof useEditorDisplayPreferences> | undefined
  const wrapper = mount(
    defineComponent({
      setup() {
        preferences = useEditorDisplayPreferences()
        return () => h('div')
      },
    }),
  )

  return {
    get preferences() {
      if (!preferences) throw new Error('Preference owner did not mount')
      return preferences
    },
    unmount: () => wrapper.unmount(),
  }
}

describe('useEditorDisplayPreferences', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    window.localStorage.clear()
  })

  it('restores a valid version-one record before returning', () => {
    window.localStorage.setItem(
      'markdown-studio:editor-display-preferences',
      JSON.stringify({
        fontSizePx: 20,
        lineHeight: 1.85,
        tabWidth: 4,
        version: 1,
        wordWrap: false,
        writingColumn: { kind: 'full-width' },
      }),
    )

    const owner = mountOwner()

    expect(owner.preferences.preferences.value).toEqual({
      fontSizePx: 20,
      lineHeight: 1.85,
      tabWidth: 4,
      wordWrap: false,
      writingColumn: { kind: 'full-width' },
    })

    owner.unmount()
  })

  it('persists changed values once and skips an unchanged update', () => {
    const setItem = vi.spyOn(window.Storage.prototype, 'setItem')
    const owner = mountOwner()

    expect(owner.preferences.update({ fontSizePx: 18, wordWrap: false })).toBe(true)
    expect(owner.preferences.update({ fontSizePx: 18 })).toBe(false)
    expect(owner.preferences.preferences.value.fontSizePx).toBe(18)
    expect(
      JSON.parse(
        window.localStorage.getItem('markdown-studio:editor-display-preferences') ?? 'null',
      ),
    ).toEqual({
      fontSizePx: 18,
      lineHeight: 1.7,
      tabWidth: 2,
      version: 1,
      wordWrap: false,
      writingColumn: { characters: 80, kind: 'characters' },
    })
    expect(setItem).toHaveBeenCalledTimes(1)

    owner.unmount()
  })

  it('resets only editor display values and preserves unrelated storage', () => {
    window.localStorage.setItem('markdown-studio:theme', 'dark')
    const owner = mountOwner()
    owner.preferences.update({
      fontSizePx: 24,
      lineHeight: 2.1,
      tabWidth: 6,
      wordWrap: false,
      writingColumn: { kind: 'full-width' },
    })

    owner.preferences.reset()

    expect(owner.preferences.preferences.value).toEqual({
      fontSizePx: 16,
      lineHeight: 1.7,
      tabWidth: 2,
      wordWrap: true,
      writingColumn: { characters: 80, kind: 'characters' },
    })
    expect(window.localStorage.getItem('markdown-studio:theme')).toBe('dark')
    expect(
      JSON.parse(
        window.localStorage.getItem('markdown-studio:editor-display-preferences') ?? 'null',
      ),
    ).toEqual({
      fontSizePx: 16,
      lineHeight: 1.7,
      tabWidth: 2,
      version: 1,
      wordWrap: true,
      writingColumn: { characters: 80, kind: 'characters' },
    })

    owner.unmount()
  })

  it('restores valid fields independently and defaults invalid fields in a supported record', () => {
    window.localStorage.setItem(
      'markdown-studio:editor-display-preferences',
      JSON.stringify({
        fontSizePx: '20',
        ignored: 'unknown field',
        lineHeight: 1.85,
        tabWidth: 4,
        version: 1,
        wordWrap: 'false',
        writingColumn: { characters: 121, kind: 'characters' },
      }),
    )

    const owner = mountOwner()

    expect(owner.preferences.preferences.value).toEqual({
      fontSizePx: 16,
      lineHeight: 1.85,
      tabWidth: 4,
      wordWrap: true,
      writingColumn: { characters: 80, kind: 'characters' },
    })
    expect(owner.preferences.persistenceError.value).toBeNull()

    owner.unmount()
  })

  it.each([
    ['malformed JSON', '{'],
    ['null', 'null'],
    ['an array', '[]'],
  ])('uses defaults for %s without writing during setup', (_description, storedRecord) => {
    window.localStorage.setItem('markdown-studio:editor-display-preferences', storedRecord)
    const setItem = vi.spyOn(window.Storage.prototype, 'setItem')

    const owner = mountOwner()

    expect(owner.preferences.preferences.value.fontSizePx).toBe(16)
    expect(owner.preferences.persistenceError.value).toBeNull()
    expect(setItem).not.toHaveBeenCalled()

    owner.unmount()
  })

  it('replaces an unsupported record when the user explicitly resets preferences', () => {
    window.localStorage.setItem(
      'markdown-studio:editor-display-preferences',
      JSON.stringify({ fontSizePx: 24, version: 2 }),
    )
    const owner = mountOwner()

    owner.preferences.reset()

    expect(
      JSON.parse(
        window.localStorage.getItem('markdown-studio:editor-display-preferences') ?? 'null',
      ),
    ).toEqual({
      fontSizePx: 16,
      lineHeight: 1.7,
      tabWidth: 2,
      version: 1,
      wordWrap: true,
      writingColumn: { characters: 80, kind: 'characters' },
    })

    owner.unmount()
  })

  it('drops unknown fields from a valid writing column record', () => {
    window.localStorage.setItem(
      'markdown-studio:editor-display-preferences',
      JSON.stringify({
        version: 1,
        writingColumn: { characters: 96, extra: 'untrusted', kind: 'characters' },
      }),
    )

    const owner = mountOwner()

    expect(owner.preferences.preferences.value.writingColumn).toEqual({
      characters: 96,
      kind: 'characters',
    })

    owner.unmount()
  })

  it('does not overwrite an unsupported stored version during setup', () => {
    const storedRecord = JSON.stringify({ fontSizePx: 24, version: 2 })
    window.localStorage.setItem('markdown-studio:editor-display-preferences', storedRecord)
    const setItem = vi.spyOn(window.Storage.prototype, 'setItem')

    const owner = mountOwner()

    expect(owner.preferences.preferences.value.fontSizePx).toBe(16)
    expect(window.localStorage.getItem('markdown-studio:editor-display-preferences')).toBe(
      storedRecord,
    )
    expect(setItem).not.toHaveBeenCalled()

    owner.unmount()
  })

  it('validates each numeric control value against its shared range and step', () => {
    expect(isValidEditorDisplayNumber('fontSizePx', 12.5)).toBe(true)
    expect(isValidEditorDisplayNumber('fontSizePx', 12.25)).toBe(false)
    expect(isValidEditorDisplayNumber('lineHeight', 1.85)).toBe(true)
    expect(isValidEditorDisplayNumber('lineHeight', 1.83)).toBe(false)
    expect(isValidEditorDisplayNumber('tabWidth', 8)).toBe(true)
    expect(isValidEditorDisplayNumber('writingColumnCharacters', 120)).toBe(true)
    expect(isValidEditorDisplayNumber('writingColumnCharacters', 121)).toBe(false)
  })

  it('keeps a valid update for the session and reports an expected write failure', () => {
    const setItem = vi.spyOn(window.Storage.prototype, 'setItem').mockImplementation(() => {
      throw new window.DOMException('Storage is full', 'QuotaExceededError')
    })
    const owner = mountOwner()

    expect(owner.preferences.update({ tabWidth: 5 })).toBe(true)
    expect(owner.preferences.preferences.value.tabWidth).toBe(5)
    expect(owner.preferences.persistenceError.value).toBe('Could not save editor display settings.')

    setItem.mockRestore()
    owner.preferences.retryPersistence()

    expect(owner.preferences.persistenceError.value).toBeNull()
    expect(
      JSON.parse(
        window.localStorage.getItem('markdown-studio:editor-display-preferences') ?? 'null',
      ),
    ).toEqual({
      fontSizePx: 16,
      lineHeight: 1.7,
      tabWidth: 5,
      version: 1,
      wordWrap: true,
      writingColumn: { characters: 80, kind: 'characters' },
    })

    owner.unmount()
  })

  it('uses defaults and reports an expected storage read failure', () => {
    vi.spyOn(window.Storage.prototype, 'getItem').mockImplementation(() => {
      throw new window.DOMException('Storage is blocked', 'SecurityError')
    })

    const owner = mountOwner()

    expect(owner.preferences.preferences.value.fontSizePx).toBe(16)
    expect(owner.preferences.persistenceError.value).toBe(
      'Could not restore editor display settings.',
    )

    owner.unmount()
  })

  it('propagates an unexpected storage read failure', () => {
    const failure = new Error('Unexpected storage failure')
    vi.spyOn(window.Storage.prototype, 'getItem').mockImplementation(() => {
      throw failure
    })

    expect(() => mountOwner()).toThrow(failure)
  })

  it('propagates an unexpected storage write failure after updating the session value', () => {
    const failure = new Error('Unexpected storage failure')
    vi.spyOn(window.Storage.prototype, 'setItem').mockImplementation(() => {
      throw failure
    })
    const owner = mountOwner()

    expect(() => owner.preferences.update({ tabWidth: 7 })).toThrow(failure)
    expect(owner.preferences.preferences.value.tabWidth).toBe(7)

    owner.unmount()
  })

  it('rejects invalid updates without changing state or writing', () => {
    const setItem = vi.spyOn(window.Storage.prototype, 'setItem')
    const owner = mountOwner()

    expect(owner.preferences.update({ fontSizePx: 13.25 })).toBe(false)
    expect(
      owner.preferences.update({ writingColumn: { characters: 39, kind: 'characters' } }),
    ).toBe(false)
    expect(owner.preferences.preferences.value.fontSizePx).toBe(16)
    expect(setItem).not.toHaveBeenCalled()

    owner.unmount()
  })

  it('starts with writing-focused defaults without writing during setup', () => {
    const setItem = vi.spyOn(window.Storage.prototype, 'setItem')
    const owner = mountOwner()

    expect(owner.preferences.preferences.value).toEqual({
      fontSizePx: 16,
      lineHeight: 1.7,
      tabWidth: 2,
      wordWrap: true,
      writingColumn: { characters: 80, kind: 'characters' },
    })
    expect(owner.preferences.persistenceError.value).toBeNull()
    expect(setItem).not.toHaveBeenCalled()

    owner.unmount()
  })
})
