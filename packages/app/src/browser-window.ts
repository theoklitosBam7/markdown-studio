import type { DesktopApi } from '@markdown-studio/desktop-contract/types'

export interface AppWindow extends Window {
  desktop?: DesktopApi
  showOpenFilePicker?: (options?: unknown) => Promise<FileSystemFileHandle[]>
  showSaveFilePicker?: (options?: unknown) => Promise<FileSystemFileHandle>
}
