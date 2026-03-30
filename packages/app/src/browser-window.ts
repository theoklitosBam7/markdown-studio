import type { DesktopApi } from '@markdown-studio/desktop-contract/types'
import type { ShallowRef } from 'vue'

export interface AppWindow extends Window {
  __MARKDOWN_STUDIO_PWA_STATE__?: MarkdownStudioPwaState
  desktop?: DesktopApi
  showOpenFilePicker?: (options?: unknown) => Promise<FileSystemFileHandle[]>
  showSaveFilePicker?: (options?: unknown) => Promise<FileSystemFileHandle>
}

export interface MarkdownStudioPwaState {
  canInstall: ShallowRef<boolean>
  isInstalled: ShallowRef<boolean>
  listenersAttached: boolean
  needRefresh: ShallowRef<boolean>
  offlineReady: ShallowRef<boolean>
  promptEvent: ShallowRef<Event | null>
  updateServiceWorker: ShallowRef<((reloadPage?: boolean) => Promise<void>) | null>
}
