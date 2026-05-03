import { readonly, shallowRef, watch } from 'vue'

export interface DebouncedDraftPersistenceOptions<TPayload> {
  /**
   * Whether persistence is currently active.
   * Web persistence is active when NOT on desktop; desktop persistence is
   * active when ON desktop. The composable treats `false` as "do nothing."
   */
  active: () => boolean

  adapter: DraftPersistenceAdapter<TPayload>

  /** Build the payload from the current component state. */
  buildPayload: () => TPayload

  /** Debounce delay in milliseconds (default 250). */
  delay?: number

  /** Whether the document has unsaved changes. When false, the draft is cleared. */
  isDirty: () => boolean

  /** Called when `restoreStoredDraft` finds a stored draft. */
  onRestore: (payload: TPayload) => Promise<void>

  /** Reactive sources to watch. When any change, a debounced persist is scheduled. */
  watchSources: () => unknown[]
}

export interface DebouncedDraftPersistenceReturn {
  /** Cancel pending writes and remove the stored draft. */
  clearDraft: () => Promise<void>
  /** Whether the last persist attempt failed (e.g., quota exceeded). */
  persistFailed: Readonly<ReturnType<typeof shallowRef<boolean>>>
  /** Whether `restoreStoredDraft` has already been called. */
  restored: Readonly<ReturnType<typeof shallowRef<boolean>>>
  /**
   * Read a stored draft and call `onRestore` if one exists.
   * Returns `true` when a draft was restored.
   */
  restoreStoredDraft: () => Promise<boolean>
}

/**
 * Storage adapter for a single draft backend (localStorage, desktop IPC, etc.).
 *
 * Each adapter is a thin module that knows *where* to store a draft but not
 * *when* — the debounce and dirty-tracking live in the shared composable.
 */
export interface DraftPersistenceAdapter<TPayload> {
  /** Remove the stored draft. */
  clear(): Promise<void>
  /** Maximum serialized payload size in bytes before the draft is skipped. */
  readonly maxSizeBytes: number
  /** Read a previously stored draft, or null if none exists. */
  read(): Promise<null | TPayload>
  /** Persist the payload. Called after the debounce delay. */
  write(payload: TPayload): Promise<void>
}

/**
 * Shared debounce-and-flag logic for draft persistence.
 *
 * Both the web (localStorage) and desktop (IPC) draft modules use this
 * composable so that the debounce watcher, `restored` flag, and
 * `persistFailed` flag live in one place.
 */
export function useDebouncedDraftPersistence<TPayload>(
  options: DebouncedDraftPersistenceOptions<TPayload>,
): DebouncedDraftPersistenceReturn {
  const restored = shallowRef(false)
  const persistFailed = shallowRef(false)
  const delay = options.delay ?? 250
  let writeTimeoutId: ReturnType<typeof setTimeout> | undefined
  let writeGeneration = 0

  async function persist(payload: TPayload, generation: number): Promise<void> {
    try {
      const serialized = JSON.stringify(payload)

      if (serialized.length > options.adapter.maxSizeBytes) {
        console.warn('Draft too large to persist')
        persistFailed.value = true
        return
      }

      await options.adapter.write(payload)

      if (generation !== writeGeneration) {
        return
      }

      persistFailed.value = false
    } catch {
      console.warn('Failed to persist draft')
      persistFailed.value = true
    }
  }

  async function restoreStoredDraft(): Promise<boolean> {
    if (!options.active() || restored.value) {
      return false
    }

    const stored = await options.adapter.read()
    restored.value = true

    if (!stored) {
      return false
    }

    await options.onRestore(stored)
    return true
  }

  async function clearDraft(): Promise<void> {
    if (writeTimeoutId !== undefined) {
      clearTimeout(writeTimeoutId)
      writeTimeoutId = undefined
    }

    writeGeneration++

    if (!options.active()) {
      return
    }

    try {
      await options.adapter.clear()
      persistFailed.value = false
    } catch {
      console.warn('Failed to clear draft')
      persistFailed.value = true
    }
  }

  watch(
    options.watchSources,
    () => {
      if (!options.active() || !restored.value) {
        return
      }

      if (!options.isDirty()) {
        void clearDraft()
        return
      }

      if (writeTimeoutId !== undefined) {
        clearTimeout(writeTimeoutId)
      }

      writeTimeoutId = setTimeout(() => {
        const generation = ++writeGeneration
        void persist(options.buildPayload(), generation)
        writeTimeoutId = undefined
      }, delay)
    },
    { immediate: true },
  )

  return {
    clearDraft,
    persistFailed: readonly(persistFailed),
    restored: readonly(restored),
    restoreStoredDraft,
  }
}
