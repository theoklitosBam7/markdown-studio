export type AppCommand =
  | 'document:exportHtml'
  | 'document:exportPdf'
  | 'document:open'
  | 'document:save'
  | 'document:saveAs'
  | 'editor:find'
  | 'editor:replace'
  | 'update:check'

export interface DesktopApi {
  commands: DesktopCommandsApi
  documents: DesktopDocumentsApi
  editing: DesktopEditingApi
  exports: DesktopExportsApi
  isDesktop: boolean
  shell: DesktopShellApi
}

export interface DesktopCommandsApi {
  onAppCommand: (listener: (command: AppCommand) => void) => () => void
}

export interface DesktopDocumentHandle {
  content: string
  path: string
}

export interface DesktopDocumentsApi {
  clearLastOpened: () => Promise<void>
  clearWorkspaceDraft: () => Promise<void>
  open: () => Promise<DesktopDocumentHandle | null>
  restoreLastOpened: () => Promise<DesktopDocumentHandle | null>
  restoreWorkspaceDraft: () => Promise<DesktopWorkspaceDraft | null>
  save: (input: DesktopSaveInput) => Promise<{ path: string } | null>
  saveAs: (input: DesktopSaveAsInput) => Promise<{ path: string } | null>
  saveWorkspaceDraft: (input: DesktopWorkspaceDraftInput) => Promise<void>
}

export interface DesktopEditingApi {
  insertText: (text: string) => Promise<void>
}

export interface DesktopExportInput {
  documentHtml: string
  documentTitle?: null | string
  suggestedPath?: null | string
}

export interface DesktopExportsApi {
  exportHtml: (input: DesktopExportInput) => Promise<{ path: string } | null>
  exportPdf: (input: DesktopExportInput) => Promise<{ path: string } | null>
}

export interface DesktopSaveAsInput {
  content: string
  suggestedPath?: null | string
}

export interface DesktopSaveInput {
  content: string
  path: null | string
}

export interface DesktopShellApi {
  openExternal: (url: string) => Promise<void>
}

export interface DesktopWorkspaceDraft {
  activeDocument: DesktopWorkspaceDraftDocument
  updatedAt: string
  version: 1
}

export interface DesktopWorkspaceDraftDocument {
  content: string
  label: string
  path: null | string
  savedContent: string
}

export interface DesktopWorkspaceDraftInput {
  activeDocument: DesktopWorkspaceDraftDocument
}
