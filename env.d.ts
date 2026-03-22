/// <reference types="vite/client" />

import type { DesktopApi } from './electron/shared/types'

declare global {
  interface Window {
    desktop?: DesktopApi
  }
}

export {}
