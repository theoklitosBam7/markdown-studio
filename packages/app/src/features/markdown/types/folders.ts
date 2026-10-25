export interface DocumentFolderNode {
  depth: number
  folderId: string
  isExpanded: boolean
  key: string
  kind: 'file' | 'folder'
  label: string
  path: string
  relativePath: string
}

export type SidebarTab = 'folders' | 'outline'
