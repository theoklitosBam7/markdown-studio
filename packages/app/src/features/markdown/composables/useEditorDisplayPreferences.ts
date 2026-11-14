import { readonly, shallowRef } from 'vue'
import type { ShallowRef } from 'vue'

import {
  DEFAULT_EDITOR_DISPLAY_PREFERENCES,
  type EditorDisplayPreferences,
  type EditorDisplayPreferencesUpdate,
  isValidEditorDisplayNumber,
  type WritingColumnPreference,
} from '../types/editorDisplayPreferences'

const STORAGE_KEY = 'markdown-studio:editor-display-preferences'
const READ_ERROR_MESSAGE = 'Could not restore editor display settings.'
const WRITE_ERROR_MESSAGE = 'Could not save editor display settings.'
export interface EditorDisplayPreferenceState {
  persistenceError: Readonly<ShallowRef<null | string>>
  preferences: Readonly<ShallowRef<EditorDisplayPreferences>>
  reset(): void
  retryPersistence(): void
  update(patch: EditorDisplayPreferencesUpdate): boolean
}

type MutableEditorDisplayPreferences = {
  -readonly [Key in keyof EditorDisplayPreferences]: EditorDisplayPreferences[Key]
}

export function useEditorDisplayPreferences(): EditorDisplayPreferenceState {
  const preferences = shallowRef<EditorDisplayPreferences>(createDefaultPreferences())
  const persistenceError = shallowRef<null | string>(null)

  try {
    preferences.value = restorePreferences()
  } catch (error) {
    if (!isExpectedStorageError(error)) throw error
    persistenceError.value = READ_ERROR_MESSAGE
  }

  function update(patch: EditorDisplayPreferencesUpdate): boolean {
    if (!isValidUpdate(patch)) return false

    const nextPreferences: MutableEditorDisplayPreferences = {
      ...preferences.value,
      ...patch,
      writingColumn:
        patch.writingColumn === undefined
          ? preferences.value.writingColumn
          : (parseWritingColumn(patch.writingColumn) ?? preferences.value.writingColumn),
    }
    if (samePreferences(preferences.value, nextPreferences)) return false

    preferences.value = nextPreferences
    persistenceError.value = writePreferences(nextPreferences)
    return true
  }

  function reset(): void {
    const defaults = createDefaultPreferences()
    preferences.value = defaults
    persistenceError.value = writePreferences(defaults)
  }

  function retryPersistence(): void {
    persistenceError.value = writePreferences(preferences.value)
  }

  return {
    persistenceError: readonly(persistenceError),
    preferences: readonly(preferences),
    reset,
    retryPersistence,
    update,
  }
}

function createDefaultPreferences(): MutableEditorDisplayPreferences {
  return {
    ...DEFAULT_EDITOR_DISPLAY_PREFERENCES,
    writingColumn: { ...DEFAULT_EDITOR_DISPLAY_PREFERENCES.writingColumn },
  }
}

function isExpectedStorageError(error: unknown): error is DOMException {
  return (
    error instanceof DOMException &&
    (error.name === 'SecurityError' || error.name === 'QuotaExceededError')
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isValidUpdate(patch: EditorDisplayPreferencesUpdate): boolean {
  for (const preference of ['fontSizePx', 'lineHeight', 'tabWidth'] as const) {
    const value = patch[preference]
    if (value !== undefined && !isValidEditorDisplayNumber(preference, value)) {
      return false
    }
  }

  if (patch.wordWrap !== undefined && typeof patch.wordWrap !== 'boolean') return false
  if (patch.writingColumn !== undefined && parseWritingColumn(patch.writingColumn) === null) {
    return false
  }

  return true
}

function parseWritingColumn(value: unknown): null | WritingColumnPreference {
  if (!isRecord(value)) return null
  if (value.kind === 'full-width') return { kind: 'full-width' }
  if (
    value.kind === 'characters' &&
    isValidEditorDisplayNumber('writingColumnCharacters', value.characters)
  ) {
    return { characters: value.characters, kind: 'characters' }
  }

  return null
}

function restorePreferences(): MutableEditorDisplayPreferences {
  const rawRecord = window.localStorage.getItem(STORAGE_KEY)
  if (rawRecord === null) return createDefaultPreferences()

  let storedValue: unknown
  try {
    storedValue = JSON.parse(rawRecord)
  } catch (error) {
    if (error instanceof SyntaxError) return createDefaultPreferences()
    throw error
  }

  if (!isRecord(storedValue) || storedValue.version !== 1) {
    return createDefaultPreferences()
  }

  const restored = createDefaultPreferences()
  if (isValidEditorDisplayNumber('fontSizePx', storedValue.fontSizePx)) {
    restored.fontSizePx = storedValue.fontSizePx
  }
  if (isValidEditorDisplayNumber('lineHeight', storedValue.lineHeight)) {
    restored.lineHeight = storedValue.lineHeight
  }
  if (isValidEditorDisplayNumber('tabWidth', storedValue.tabWidth)) {
    restored.tabWidth = storedValue.tabWidth
  }
  if (typeof storedValue.wordWrap === 'boolean') {
    restored.wordWrap = storedValue.wordWrap
  }
  const writingColumn = parseWritingColumn(storedValue.writingColumn)
  if (writingColumn !== null) restored.writingColumn = writingColumn

  return restored
}

function samePreferences(
  first: EditorDisplayPreferences,
  second: EditorDisplayPreferences,
): boolean {
  return (
    first.fontSizePx === second.fontSizePx &&
    first.lineHeight === second.lineHeight &&
    first.wordWrap === second.wordWrap &&
    first.tabWidth === second.tabWidth &&
    first.writingColumn.kind === second.writingColumn.kind &&
    (first.writingColumn.kind === 'full-width' ||
      (second.writingColumn.kind === 'characters' &&
        first.writingColumn.characters === second.writingColumn.characters))
  )
}

function writePreferences(value: EditorDisplayPreferences): null | string {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, ...value }))
    return null
  } catch (error) {
    if (!isExpectedStorageError(error)) throw error
    return WRITE_ERROR_MESSAGE
  }
}
