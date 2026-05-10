import type { ComputedRef } from 'vue'

import { useDesktop } from '@/composables/useDesktop'

import type { DraftPersistenceAdapter } from './useDebouncedDraftPersistence'

import { useDebouncedDraftPersistence } from './useDebouncedDraftPersistence'

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

const MAX_DRAFT_SIZE_BYTES = 5 * 1024 * 1024

export function useDesktopDraftPersistence(options: UseDesktopDraftPersistenceOptions) {
  const desktop = useDesktop()

  const adapter: DraftPersistenceAdapter<DesktopDraftPayload> = {
    async clear() {
      await desktop.value.documents.clearWorkspaceDraft()
    },

    maxSizeBytes: MAX_DRAFT_SIZE_BYTES,

    async read() {
      const stored = await desktop.value.documents.restoreWorkspaceDraft()
      return stored?.activeDocument ?? null
    },

    async write(_payload, _serialized) {
      await desktop.value.documents.saveWorkspaceDraft({ activeDocument: _payload })
    },
  }

  return useDebouncedDraftPersistence({
    active: () => options.isDesktop.value,
    adapter,
    buildPayload: () => ({
      content: options.content.value,
      label: options.displayName.value,
      path: options.currentPath.value,
      savedContent: options.savedContent.value,
    }),
    isDirty: () => options.isDirty.value,
    onRestore: options.restoreDraft,
    watchSources: () =>
      [
        options.content.value,
        options.currentPath.value,
        options.displayName.value,
        options.isDesktop.value,
        options.isDirty.value,
        options.savedContent.value,
      ] as const,
  })
}
