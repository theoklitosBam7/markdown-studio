import { type ComputedRef, readonly, shallowRef, watch } from 'vue'

import { useDesktop } from '@/composables/useDesktop'

interface DesktopDraftPayload {
  content: string
  label: string
  path: null | string
  savedContent: string
}

interface UseDesktopDraftPersistenceOptions {
  content: { value: string } | ComputedRef<string>
  currentPath: { value: null | string } | ComputedRef<null | string>
  displayName: { value: string } | ComputedRef<string>
  isDesktop: { value: boolean } | ComputedRef<boolean>
  isDirty: { value: boolean } | ComputedRef<boolean>
  restoreDraft: (payload: DesktopDraftPayload) => Promise<void>
  savedContent: { value: string } | ComputedRef<string>
}

interface UseDesktopDraftPersistenceReturn {
  clearDraft: () => Promise<void>
  persistFailed: Readonly<ReturnType<typeof shallowRef<boolean>>>
  restored: Readonly<ReturnType<typeof shallowRef<boolean>>>
  restoreStoredDraft: () => Promise<boolean>
}

const WRITE_DELAY_MS = 250
const MAX_DRAFT_SIZE_BYTES = 5 * 1024 * 1024

export function useDesktopDraftPersistence(
  options: UseDesktopDraftPersistenceOptions,
): UseDesktopDraftPersistenceReturn {
  const desktop = useDesktop()
  const restored = shallowRef(false)
  const persistFailed = shallowRef(false)
  let writeTimeoutId: ReturnType<typeof setTimeout> | undefined
  let writeGeneration = 0

  async function persistDraft(payload: DesktopDraftPayload, generation: number): Promise<void> {
    try {
      const draft = {
        activeDocument: payload,
      }
      const serialized = JSON.stringify(draft)

      if (serialized.length > MAX_DRAFT_SIZE_BYTES) {
        console.warn('Desktop draft too large to persist')
        persistFailed.value = true
        return
      }

      await desktop.value.documents.saveWorkspaceDraft(draft)

      if (generation !== writeGeneration) {
        return
      }

      persistFailed.value = false
    } catch {
      console.warn('Failed to persist desktop draft')
      persistFailed.value = true
    }
  }

  async function restoreStoredDraft(): Promise<boolean> {
    if (!options.isDesktop.value || restored.value) {
      return false
    }

    const storedDraft = await desktop.value.documents.restoreWorkspaceDraft()
    restored.value = true

    if (!storedDraft) {
      return false
    }

    await options.restoreDraft(storedDraft.activeDocument)
    return true
  }

  async function clearDraft(): Promise<void> {
    if (writeTimeoutId !== undefined) {
      clearTimeout(writeTimeoutId)
      writeTimeoutId = undefined
    }

    writeGeneration++

    if (!options.isDesktop.value) {
      return
    }

    try {
      await desktop.value.documents.clearWorkspaceDraft()
      persistFailed.value = false
    } catch {
      console.warn('Failed to clear desktop draft')
      persistFailed.value = true
    }
  }

  watch(
    () =>
      [
        options.content.value,
        options.currentPath.value,
        options.displayName.value,
        options.isDesktop.value,
        options.isDirty.value,
        options.savedContent.value,
      ] as const,
    ([content, currentPath, displayName, isDesktop, isDirty, savedContent]) => {
      if (!isDesktop || !restored.value) {
        return
      }

      if (!isDirty) {
        void clearDraft()
        return
      }

      if (writeTimeoutId !== undefined) {
        clearTimeout(writeTimeoutId)
      }

      writeTimeoutId = setTimeout(() => {
        const generation = ++writeGeneration
        void persistDraft(
          {
            content,
            label: displayName,
            path: currentPath,
            savedContent,
          },
          generation,
        )
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
