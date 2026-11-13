import { readonly, shallowRef } from 'vue'
import type { ShallowRef } from 'vue'

export interface WorkspaceLayoutPreference {
  commit(value: number): void
  preferredValue: Readonly<ShallowRef<number>>
  storageError: Readonly<ShallowRef<null | string>>
}

interface NumericPreferenceOptions {
  defaultValue: number
  isValid(value: unknown): value is number
  key: string
  readErrorMessage: string
  writeErrorMessage: string
}

export function useWorkspaceSidebarPreference(): WorkspaceLayoutPreference {
  return useNumericPreference({
    defaultValue: 248,
    isValid: isValidSidebarWidth,
    key: 'markdown-studio:workspace-sidebar-width',
    readErrorMessage: 'Could not restore the sidebar width.',
    writeErrorMessage: 'Could not save the sidebar width.',
  })
}

export function useWorkspaceSplitPreference(): WorkspaceLayoutPreference {
  return useNumericPreference({
    defaultValue: 0.5,
    isValid: isValidSplitRatio,
    key: 'markdown-studio:workspace-split-ratio',
    readErrorMessage: 'Could not restore the editor and Live Preview widths.',
    writeErrorMessage: 'Could not save the editor and Live Preview widths.',
  })
}

function isExpectedStorageError(error: unknown): error is DOMException {
  return (
    error instanceof DOMException &&
    (error.name === 'SecurityError' || error.name === 'QuotaExceededError')
  )
}

function isValidSidebarWidth(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

function isValidSplitRatio(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 && value < 1
}

function readStoredValue(key: string): unknown {
  const rawValue = window.localStorage.getItem(key)
  if (rawValue === null) return null

  try {
    const parsedValue: unknown = JSON.parse(rawValue)
    return parsedValue
  } catch (error) {
    if (error instanceof SyntaxError) return null
    throw error
  }
}

function useNumericPreference(options: NumericPreferenceOptions): WorkspaceLayoutPreference {
  const preferredValue = shallowRef(options.defaultValue)
  const storageError = shallowRef<null | string>(null)

  try {
    const storedValue = readStoredValue(options.key)
    if (options.isValid(storedValue)) preferredValue.value = storedValue
  } catch (error) {
    if (!isExpectedStorageError(error)) throw error
    storageError.value = options.readErrorMessage
  }

  function commit(value: number): void {
    preferredValue.value = value
    storageError.value = null

    try {
      window.localStorage.setItem(options.key, JSON.stringify(value))
    } catch (error) {
      if (!isExpectedStorageError(error)) throw error
      storageError.value = options.writeErrorMessage
    }
  }

  return {
    commit,
    preferredValue: readonly(preferredValue),
    storageError: readonly(storageError),
  }
}
