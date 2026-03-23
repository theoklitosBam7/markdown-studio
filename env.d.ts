/// <reference types="vite/client" />

import type { DesktopApi } from '@electron/shared/types'

declare global {
  interface FilePickerAcceptType {
    accept?: Record<string, string[]>
    description?: string
  }

  interface FilePickerOptions {
    excludeAcceptAllOption?: boolean
    id?: string
    startIn?: string
    suggestedName?: string
    types?: FilePickerAcceptType[]
  }

  interface FileSystemFileHandle {
    createWritable: () => Promise<FileSystemWritableFileStream>
    getFile: () => Promise<File>
    kind: 'file'
    name: string
  }

  interface FileSystemWritableFileStream extends WritableStream {
    close(): Promise<void>
    write(
      data:
        | {
            data: ArrayBuffer | ArrayBufferView | Blob | DataView | string
            position?: number
            type: 'write'
          }
        | {
            position: number
            type: 'seek'
          }
        | {
            size: number
            type: 'truncate'
          }
        | ArrayBuffer
        | ArrayBufferView
        | Blob
        | DataView
        | string,
    ): Promise<void>
  }

  interface Window {
    desktop?: DesktopApi
    showSaveFilePicker?: (options?: FilePickerOptions) => Promise<FileSystemFileHandle>
  }
}

export {}
