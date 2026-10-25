import type {
  DesktopDocumentFolder,
  DesktopDocumentHandle,
  DesktopFolderEntry,
} from '@markdown-studio/desktop-contract/types'

import { computed, type ComputedRef, reactive, readonly, ref, type Ref } from 'vue'

import { useDesktop } from '@/composables/useDesktop'

import type { DocumentFolderNode } from '../types'

interface DocumentFolderView extends DesktopDocumentFolder {
  label: string
}

interface UseDocumentFoldersOptions {
  openDocument: (loadHandle: () => Promise<DesktopDocumentHandle | null>) => Promise<void>
}

interface UseDocumentFoldersReturn {
  add: () => Promise<void>
  entriesOf: (folderId: string, relativePath: string) => DesktopFolderEntry[]
  folders: ComputedRef<DocumentFolderView[]>
  isAvailable: ComputedRef<boolean>
  message: Readonly<Ref<null | string>>
  nodes: ComputedRef<DocumentFolderNode[]>
  open: (folderId: string, relativePath: string) => Promise<void>
  refresh: () => Promise<void>
  remove: (folderId: string) => Promise<void>
  restore: () => Promise<void>
  toggle: (folderId: string, relativePath: string) => Promise<void>
}

export function useDocumentFolders(options: UseDocumentFoldersOptions): UseDocumentFoldersReturn {
  const desktop = useDesktop()

  const rootFolders = ref<DesktopDocumentFolder[]>([])
  const listings = reactive(new Map<string, DesktopFolderEntry[]>())
  const expandedKeys = reactive(new Set<string>())
  const message = ref<null | string>(null)

  const foldersApi = () => desktop.value.folders
  const isAvailable = computed(() => foldersApi() !== undefined)
  const folders = computed<DocumentFolderView[]>(() => toFolderViews(rootFolders.value))
  const nodes = computed<DocumentFolderNode[]>(() => {
    const flattened: DocumentFolderNode[] = []

    for (const folder of folders.value) {
      appendFolderNode(flattened, folder, folder.label, '.', 0)
    }

    return flattened
  })

  function appendFolderNode(
    flattened: DocumentFolderNode[],
    folder: DesktopDocumentFolder,
    label: string,
    relativePath: string,
    depth: number,
  ): void {
    const key = toKey(folder.id, relativePath)
    const isExpanded = expandedKeys.has(key)

    flattened.push({
      depth,
      folderId: folder.id,
      isExpanded,
      key,
      kind: 'folder',
      label,
      path: toNodePath(folder.path, relativePath),
      relativePath,
    })

    if (!isExpanded) return

    for (const entry of listings.get(key) ?? []) {
      if (entry.kind === 'folder') {
        appendFolderNode(flattened, folder, entry.name, entry.relativePath, depth + 1)
        continue
      }

      flattened.push({
        depth: depth + 1,
        folderId: folder.id,
        isExpanded: false,
        key: toKey(folder.id, entry.relativePath),
        kind: 'file',
        label: entry.name,
        path: toNodePath(folder.path, entry.relativePath),
        relativePath: entry.relativePath,
      })
    }
  }

  async function add(): Promise<void> {
    const api = foldersApi()
    if (!api) return

    const result = await api.add()

    if (!result.ok) {
      message.value = result.reason === 'duplicate' ? 'That folder is already open.' : null
      return
    }

    rootFolders.value = [...rootFolders.value, result.folder]
    message.value = null
  }

  async function restore(): Promise<void> {
    const api = foldersApi()
    if (!api) return

    const restored = await api.restore()

    rootFolders.value = restored.folders
    message.value = restored.removedCount > 0 ? 'Removed a folder that no longer exists.' : null
  }

  async function remove(folderId: string): Promise<void> {
    const api = foldersApi()
    if (!api) return

    await api.remove(folderId)

    rootFolders.value = rootFolders.value.filter((folder) => folder.id !== folderId)
    forgetFolderListings(folderId)
  }

  async function toggle(folderId: string, relativePath: string): Promise<void> {
    const key = toKey(folderId, relativePath)

    if (expandedKeys.has(key)) {
      expandedKeys.delete(key)
      return
    }

    expandedKeys.add(key)

    if (listings.has(key)) return

    await loadListing(folderId, relativePath)
  }

  async function refresh(): Promise<void> {
    for (const key of expandedKeys) {
      const separatorIndex = key.indexOf(':')

      await loadListing(key.slice(0, separatorIndex), key.slice(separatorIndex + 1))
    }
  }

  async function open(folderId: string, relativePath: string): Promise<void> {
    if (!foldersApi()) return

    await options.openDocument(async () => {
      const handle = await desktop.value.documents.openPath?.({ folderId, relativePath })

      if (!handle) message.value = 'This file cannot be opened.'
      return handle ?? null
    })
  }

  async function loadListing(folderId: string, relativePath: string): Promise<void> {
    const api = foldersApi()
    if (!api) return

    const key = toKey(folderId, relativePath)
    const listing = await api.list({ folderId, relativePath })

    if (!listing.ok) {
      expandedKeys.delete(key)
      message.value = 'Cannot read this folder.'
      return
    }

    listings.set(key, listing.entries)
  }

  function entriesOf(folderId: string, relativePath: string): DesktopFolderEntry[] {
    return listings.get(toKey(folderId, relativePath)) ?? []
  }

  function forgetFolderListings(folderId: string): void {
    // Deleting the current key during Map iteration is safe and keeps this allocation free.
    for (const key of listings.keys()) {
      if (!key.startsWith(`${folderId}:`)) continue

      listings.delete(key)
      expandedKeys.delete(key)
    }
  }

  return {
    add,
    entriesOf,
    folders,
    isAvailable,
    message: readonly(message),
    nodes,
    open,
    refresh,
    remove,
    restore,
    toggle,
  }
}

function countNames(folders: DesktopDocumentFolder[]): Map<string, number> {
  const nameCounts = new Map<string, number>()

  for (const folder of folders) {
    nameCounts.set(folder.name, (nameCounts.get(folder.name) ?? 0) + 1)
  }

  return nameCounts
}

function joinParent(folder: DesktopDocumentFolder): string {
  const parentName = parentFolderName(folder.path)

  return parentName ? `${parentName}/${folder.name}` : folder.name
}

function parentFolderName(folderPath: string): string {
  const segments = folderPath.split(/[\\/]/).filter(Boolean)

  return segments.at(-2) ?? ''
}

function toFolderViews(folders: DesktopDocumentFolder[]): DocumentFolderView[] {
  const nameCounts = countNames(folders)

  return folders.map((folder) => ({
    ...folder,
    label: (nameCounts.get(folder.name) ?? 0) > 1 ? joinParent(folder) : folder.name,
  }))
}

function toKey(folderId: string, relativePath: string): string {
  return `${folderId}:${relativePath}`
}

// The renderer has no platform path helper, so reuse the separator the main process
// already put in the Document Folder path.
function toNodePath(folderPath: string, relativePath: string): string {
  if (relativePath === '.') return folderPath

  const separator = folderPath.includes('\\') ? '\\' : '/'
  const rootPath = folderPath.replace(/[\\/]+$/, '')

  return `${rootPath}${separator}${relativePath.split('/').join(separator)}`
}
