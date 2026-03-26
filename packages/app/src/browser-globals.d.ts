/// <reference types="vite/client" />

import type { DesktopApi } from '@markdown-studio/desktop-contract/types'

declare global {
  interface Window {
    desktop?: DesktopApi
    showOpenFilePicker?: (options?: unknown) => Promise<FileSystemFileHandle[]>
    showSaveFilePicker?: (options?: unknown) => Promise<FileSystemFileHandle>
  }
}
