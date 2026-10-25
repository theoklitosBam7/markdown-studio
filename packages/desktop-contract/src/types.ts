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
  folders?: DesktopFoldersApi
  images?: DesktopImagesApi
  install: DesktopInstallApi
  isDesktop: boolean
  shell: DesktopShellApi
}

export interface DesktopCommandsApi {
  onAppCommand: (listener: (command: AppCommand) => void) => () => void
}

export interface DesktopDocumentFolder {
  id: string
  name: string
  path: string
}

export type DesktopDocumentFolderAddResult =
  | { folder: DesktopDocumentFolder; ok: true }
  | { ok: false; reason: 'cancelled' | 'duplicate' }

export interface DesktopDocumentFolderRestore {
  folders: DesktopDocumentFolder[]
  removedCount: number
}

export interface DesktopDocumentHandle {
  content: string
  modifiedAt: number
  path: string
}

export interface DesktopDocumentsApi {
  clearLastOpened: () => Promise<void>
  clearWorkspaceDraft: () => Promise<void>
  open: () => Promise<DesktopDocumentHandle | null>
  openPath?: (input: DesktopFolderListInput) => Promise<DesktopDocumentHandle | null>
  restoreLastOpened: () => Promise<DesktopDocumentHandle | null>
  restoreWorkspaceDraft: () => Promise<DesktopWorkspaceDraft | null>
  save: (input: DesktopSaveInput) => Promise<{ path: string } | null>
  saveAs: (input: DesktopSaveAsInput) => Promise<{ path: string } | null>
  saveWorkspaceDraft: (input: DesktopWorkspaceDraftInput) => Promise<void>
  statModification?: (path: string) => Promise<null | number>
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

export interface DesktopFolderEntry {
  kind: 'file' | 'folder'
  name: string
  relativePath: string
}

export type DesktopFolderListing = { entries: DesktopFolderEntry[]; ok: true } | { ok: false }

export interface DesktopFolderListInput {
  folderId: string
  relativePath: string
}

export interface DesktopFoldersApi {
  add: () => Promise<DesktopDocumentFolderAddResult>
  list: (input: DesktopFolderListInput) => Promise<DesktopFolderListing>
  remove: (folderId: string) => Promise<void>
  restore: () => Promise<DesktopDocumentFolderRestore>
}

export interface DesktopImagesApi {
  save: (input: DesktopSaveImageInput) => Promise<DesktopSaveImageResult>
}

export interface DesktopInstallApi {
  isHomebrew: () => Promise<boolean>
}

export interface DesktopSaveAsInput {
  content: string
  suggestedPath?: null | string
}

export interface DesktopSaveImageInput {
  data: Uint8Array
  documentPath: string
  filename: string
}

export interface DesktopSaveImageResult {
  filename: string
  relativePath: string
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
