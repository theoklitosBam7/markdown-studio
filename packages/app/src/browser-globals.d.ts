/// <reference types="vite/client" />

import type { DesktopApi } from '@markdown-studio/desktop-contract/types'

declare global {
  const __APP_VERSION__: string | undefined

  interface Window {
    desktop?: DesktopApi
    showOpenFilePicker?: (options?: unknown) => Promise<FileSystemFileHandle[]>
    showSaveFilePicker?: (options?: unknown) => Promise<FileSystemFileHandle>
  }
}
