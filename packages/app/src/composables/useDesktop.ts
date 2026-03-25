import type { DesktopApi } from '@markdown-studio/desktop-contract/types'

import { computed } from 'vue'

import type { AppWindow } from '@/browser-window'

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
  return computed(() => {
    if (typeof window === 'undefined') {
      return fallbackDesktopApi
    }

    const browserWindow = window as AppWindow
    return browserWindow.desktop ?? fallbackDesktopApi
  })
}
