import type { ComputedRef } from 'vue'

import type { DraftPersistenceAdapter } from './useDebouncedDraftPersistence'

import { useDebouncedDraftPersistence } from './useDebouncedDraftPersistence'

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

const STORAGE_KEY = 'markdown-studio:web-draft'
const MAX_DRAFT_SIZE_BYTES = 1024 * 1024

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

export function useWebDraftPersistence(options: UseWebDraftPersistenceOptions) {
  const adapter: DraftPersistenceAdapter<StoredDraftPayload> = {
    async clear() {
      clearStoredWebDraft()
    },

    maxSizeBytes: MAX_DRAFT_SIZE_BYTES,

    async read() {
      return readStoredWebDraft()
    },

    async write(payload) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    },
  }

  return useDebouncedDraftPersistence({
    active: () => !options.isDesktop.value,
    adapter,
    buildPayload: () => ({
      content: options.content.value,
      label: options.displayName.value,
    }),
    isDirty: () => options.isDirty.value,
    onRestore: options.restoreDraft,
    watchSources: () =>
      [
        options.content.value,
        options.displayName.value,
        options.isDesktop.value,
        options.isDirty.value,
      ] as const,
  })
}
