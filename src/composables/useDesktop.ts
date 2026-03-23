import type { DesktopApi } from '@electron/shared/types'

import { computed } from 'vue'

const fallbackDesktopApi: DesktopApi = {
  commands: {
    onAppCommand: () => () => undefined,
  },
  documents: {
    open: async () => null,
    save: async () => null,
    saveAs: async () => null,
  },
  isDesktop: false,
  shell: {
    openExternal: async () => undefined,
  },
}

export function useDesktop() {
  return computed(() =>
    typeof window === 'undefined' ? fallbackDesktopApi : (window.desktop ?? fallbackDesktopApi),
  )
}
