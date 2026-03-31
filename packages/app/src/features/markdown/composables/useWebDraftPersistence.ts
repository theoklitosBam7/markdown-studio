import { type ComputedRef, readonly, shallowRef, watch } from 'vue'

interface StoredDraftPayload {
  content: string
  label: string
}

interface UseWebDraftPersistenceOptions {
  content: { value: string } | ComputedRef<string>
  displayName: { value: string } | ComputedRef<string>
  isDesktop: { value: boolean } | ComputedRef<boolean>
  isDirty: { value: boolean } | ComputedRef<boolean>
  restoreDraft: (payload: StoredDraftPayload) => Promise<void>
}

interface UseWebDraftPersistenceReturn {
  clearDraft: () => void
  persistFailed: Readonly<ReturnType<typeof shallowRef<boolean>>>
  restored: Readonly<ReturnType<typeof shallowRef<boolean>>>
  restoreStoredDraft: () => Promise<void>
}

const STORAGE_KEY = 'markdown-studio:web-draft'
const WRITE_DELAY_MS = 250
const MAX_DRAFT_SIZE_BYTES = 1024 * 1024 // 1MB limit to stay well under typical 5-10MB localStorage quotas

export function clearStoredWebDraft(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY)
  }
}

export function readStoredWebDraft(): null | StoredDraftPayload {
  if (typeof localStorage === 'undefined') {
    return null
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as Partial<StoredDraftPayload>
    if (typeof parsed.content !== 'string' || typeof parsed.label !== 'string') {
      return null
    }

    return {
      content: parsed.content,
      label: parsed.label,
    }
  } catch {
    return null
  }
}

export function useWebDraftPersistence(
  options: UseWebDraftPersistenceOptions,
): UseWebDraftPersistenceReturn {
  const restored = shallowRef(false)
  const persistFailed = shallowRef(false)
  let writeTimeoutId: ReturnType<typeof setTimeout> | undefined

  function persistDraft(payload: StoredDraftPayload): void {
    if (typeof localStorage === 'undefined') {
      return
    }

    try {
      const serialized = JSON.stringify(payload)

      if (serialized.length > MAX_DRAFT_SIZE_BYTES) {
        console.warn('Draft too large to persist to localStorage')
        persistFailed.value = true
        return
      }

      localStorage.setItem(STORAGE_KEY, serialized)
      persistFailed.value = false
    } catch {
      console.warn('Failed to persist draft to localStorage')
      persistFailed.value = true
    }
  }

  async function restoreStoredDraft(): Promise<void> {
    if (options.isDesktop.value || restored.value) {
      return
    }

    const storedDraft = readStoredWebDraft()

    if (!storedDraft) {
      restored.value = true
      return
    }

    await options.restoreDraft(storedDraft)
    restored.value = true
  }

  function clearDraft(): void {
    if (writeTimeoutId !== undefined) {
      clearTimeout(writeTimeoutId)
      writeTimeoutId = undefined
    }

    clearStoredWebDraft()
  }

  watch(
    () =>
      [
        options.content.value,
        options.displayName.value,
        options.isDesktop.value,
        options.isDirty.value,
      ] as const,
    ([content, displayName, isDesktop, isDirty]) => {
      if (isDesktop || !restored.value) {
        return
      }

      if (!isDirty) {
        clearDraft()
        return
      }

      if (writeTimeoutId !== undefined) {
        clearTimeout(writeTimeoutId)
      }

      writeTimeoutId = setTimeout(() => {
        persistDraft({
          content,
          label: displayName,
        })
        writeTimeoutId = undefined
      }, WRITE_DELAY_MS)
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
