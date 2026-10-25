import type {
  DesktopDocumentCheck,
  DesktopDocumentFolder,
  DesktopDocumentFolderAddResult,
  DesktopDocumentFolderRestore,
  DesktopDocumentHandle,
  DesktopFolderEntry,
  DesktopFolderListing,
  DesktopFolderListInput,
} from '@markdown-studio/desktop-contract/types'

import { createHash } from 'node:crypto'
import type { Dirent, Stats } from 'node:fs'
import { readdir, readFile, realpath, stat } from 'node:fs/promises'
import { basename, extname, isAbsolute, join, relative, resolve } from 'node:path'

const LISTED_EXTENSIONS = new Set(['.markdown', '.md', '.mdown', '.txt'])
const IGNORED_DIRECTORIES = new Set(['node_modules'])

export interface DocumentFolderRegistry {
  add: (selectedPath: string) => Promise<DesktopDocumentFolderAddResult>
  list: (input: DesktopFolderListInput) => Promise<DesktopFolderListing>
  open: (input: DesktopFolderListInput) => Promise<DesktopDocumentHandle | null>
  remove: (folderId: string) => Promise<void>
  restore: () => Promise<DesktopDocumentFolderRestore>
}

export interface DocumentFolderStore {
  readDocumentFolderPaths: () => Promise<string[]>
  writeDocumentFolderPaths: (paths: string[]) => Promise<void>
}

export async function checkDocumentModification(
  documentPath: string,
  modifiedAt: number,
): Promise<DesktopDocumentCheck> {
  const currentModifiedAt = await readDocumentModificationTime(documentPath)

  if (currentModifiedAt === null) return { status: 'missing' }
  if (currentModifiedAt === modifiedAt) return { status: 'unchanged' }

  const document = await readDocumentByPath(documentPath)

  return document ? { document, status: 'changed' } : { status: 'missing' }
}

export function createDocumentFolderRegistry(store: DocumentFolderStore): DocumentFolderRegistry {
  const folders = new Map<string, DesktopDocumentFolder>()

  const persist = (): Promise<void> =>
    store.writeDocumentFolderPaths([...folders.values()].map((folder) => folder.path))

  return {
    async add(selectedPath) {
      const folderPath = await realpath(selectedPath)

      if (isOpen(folders, folderPath)) {
        return { ok: false, reason: 'duplicate' }
      }

      const folder = createFolder(folderPath)
      folders.set(folder.id, folder)
      await persist()

      return { folder, ok: true }
    },

    async list(input) {
      const folder = folders.get(input.folderId)
      if (!folder) return { ok: false }

      return listDocumentFolder(folder.path, input.relativePath)
    },

    async open(input) {
      const folder = folders.get(input.folderId)
      if (!folder) return null

      return readDocumentFolderFile(folder.path, input.relativePath)
    },

    async remove(folderId) {
      if (!folders.delete(folderId)) return

      await persist()
    },

    async restore() {
      const storedPaths = await store.readDocumentFolderPaths()
      const restored: DesktopDocumentFolder[] = []

      for (const storedPath of storedPaths) {
        const folderPath = await realpath(storedPath).catch(() => null)
        if (!folderPath) continue

        const folder = createFolder(folderPath)
        folders.set(folder.id, folder)
        restored.push(folder)
      }

      return { folders: restored, removedCount: storedPaths.length - restored.length }
    },
  }
}

export async function listDocumentFolder(
  documentFolder: string,
  relativePath: string,
): Promise<DesktopFolderListing> {
  try {
    const directory = await resolveInsideDocumentFolder(documentFolder, relativePath)
    const dirents = await readdir(directory, { withFileTypes: true })

    const entries = (
      await Promise.all(dirents.map((dirent) => toListedEntry(directory, dirent, relativePath)))
    ).filter((entry): entry is DesktopFolderEntry => entry !== null)

    return { entries: sortEntries(entries), ok: true }
  } catch (error) {
    console.warn(`Failed to list the Document Folder path: ${relativePath}`, error)
    return { ok: false }
  }
}

export async function readDocumentFolderFile(
  documentFolder: string,
  relativePath: string,
): Promise<DesktopDocumentHandle | null> {
  try {
    return await readDocumentByPath(await resolveInsideDocumentFolder(documentFolder, relativePath))
  } catch {
    return null
  }
}

export async function readDocumentModificationTime(documentPath: string): Promise<null | number> {
  try {
    return (await stat(documentPath)).mtimeMs
  } catch {
    return null
  }
}

function createFolder(folderPath: string): DesktopDocumentFolder {
  return {
    // Derive the id from the path so the renderer never holds a path it can reuse to
    // read outside the Document Folders the main process knows about.
    id: createHash('sha1').update(folderPath).digest('hex').slice(0, 16),
    name: basename(folderPath),
    path: folderPath,
  }
}

function isOpen(folders: Map<string, DesktopDocumentFolder>, folderPath: string): boolean {
  for (const folder of folders.values()) {
    if (folder.path === folderPath) return true
  }

  return false
}

function joinRelativePath(parentRelativePath: string, name: string): string {
  return parentRelativePath === '.' ? name : `${parentRelativePath}/${name}`
}

async function readDocumentByPath(documentPath: string): Promise<DesktopDocumentHandle | null> {
  try {
    const [content, stats] = await Promise.all([readFile(documentPath, 'utf8'), stat(documentPath)])

    return { content, modifiedAt: stats.mtimeMs, path: documentPath }
  } catch {
    return null
  }
}

async function resolveEntryKind(
  directory: string,
  dirent: Dirent,
): Promise<'file' | 'folder' | null> {
  if (dirent.name.startsWith('.')) return null

  if (dirent.isSymbolicLink()) {
    try {
      return toEntryKind(dirent.name, await stat(join(directory, dirent.name)))
    } catch {
      return null
    }
  }

  return toEntryKind(dirent.name, dirent)
}

async function resolveInsideDocumentFolder(
  documentFolder: string,
  relativePath: string,
): Promise<string> {
  const [documentFolderRealPath, requestedPath] = await Promise.all([
    realpath(documentFolder),
    realpath(resolve(documentFolder, relativePath)),
  ])
  const pathFromDocumentFolder = relative(documentFolderRealPath, requestedPath)

  if (pathFromDocumentFolder.startsWith('..') || isAbsolute(pathFromDocumentFolder)) {
    throw new Error('The path is outside its Document Folder.')
  }

  return requestedPath
}

function sortEntries(entries: DesktopFolderEntry[]): DesktopFolderEntry[] {
  return entries.sort((left, right) => {
    if (left.kind !== right.kind) return left.kind === 'folder' ? -1 : 1

    return left.name.localeCompare(right.name, undefined, { sensitivity: 'base' })
  })
}

function toEntryKind(name: string, entry: Dirent | Stats): 'file' | 'folder' | null {
  if (entry.isDirectory()) return IGNORED_DIRECTORIES.has(name) ? null : 'folder'

  if (!entry.isFile()) return null

  return LISTED_EXTENSIONS.has(extname(name).toLowerCase()) ? 'file' : null
}

// A symbolic link reports neither isFile nor isDirectory, so its target decides how the
// entry is listed. The confinement check still runs when the panel opens it by path.
async function toListedEntry(
  directory: string,
  dirent: Dirent,
  parentRelativePath: string,
): Promise<DesktopFolderEntry | null> {
  const kind = await resolveEntryKind(directory, dirent)
  if (!kind) return null

  return {
    kind,
    name: dirent.name,
    relativePath: joinRelativePath(parentRelativePath, dirent.name),
  }
}
