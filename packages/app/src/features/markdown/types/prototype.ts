import type { Theme, ViewMode } from '@/types/editor'

import type { EditorStats } from './common'

export interface PrototypeWorkspaceEmits {
  clear: []
  copy: []
  exportHtml: []
  exportPdf: []
  insertTable: []
  install: []
  openCommandPalette: []
  openDocument: []
  openExamples: []
  openFind: []
  openShortcuts: []
  saveDocument: []
  toggleOutline: []
  'update:theme': [payload: { origin: { x: number; y: number }; theme: Theme }]
  'update:viewMode': [mode: ViewMode]
}

export interface PrototypeWorkspaceProps {
  availableModes: ViewMode[]
  canExportPdf: boolean
  canInstall: boolean
  canOpenDocuments: boolean
  canSaveDocuments: boolean
  displayName: string
  isCopied: boolean
  isDirty: boolean
  isOutlineOpen: boolean
  pdfExportUnavailableReason: string
  stats: EditorStats
  statusText: string
  theme: Theme
  viewMode: ViewMode
}
