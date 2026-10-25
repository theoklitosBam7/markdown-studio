import type {
  DesktopDocumentFolder,
  DesktopDocumentHandle,
  DesktopDocumentsApi,
  DesktopFolderEntry,
  DesktopFoldersApi,
} from '@markdown-studio/desktop-contract/types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'

import type { AppWindow } from '../../../../browser-window'

import { useDocumentFolders } from '../useDocumentFolders'

const appWindow = window as AppWindow
const originalDesktop = appWindow.desktop

beforeEach(() => {
  appWindow.desktop = undefined
  vi.clearAllMocks()
})

afterEach(() => {
  appWindow.desktop = originalDesktop
  vi.restoreAllMocks()
})

describe('useDocumentFolders', () => {
  it('reports that Document Folders are unavailable in the web Runtime', () => {
    const folders = useDocumentFolders({ openDocument: vi.fn() })

    expect(folders.isAvailable.value).toBe(false)
  })

  it('restores remembered Document Folders', async () => {
    const { desktop } = createDesktopMock({
      restore: async () => ({
        folders: [createFolder('folder-1', 'notes', '/tmp/notes')],
        removedCount: 0,
      }),
    })
    appWindow.desktop = desktop

    const folders = useDocumentFolders({ openDocument: vi.fn() })
    await folders.restore()

    expect(folders.isAvailable.value).toBe(true)
    expect(folders.folders.value.map((folder) => folder.label)).toEqual(['notes'])
  })

  it('reports a Document Folder that disappeared at startup', async () => {
    const { desktop } = createDesktopMock({
      restore: async () => ({ folders: [], removedCount: 1 }),
    })
    appWindow.desktop = desktop

    const folders = useDocumentFolders({ openDocument: vi.fn() })
    await folders.restore()

    expect(folders.message.value).toBe('Removed a folder that no longer exists.')
  })

  it('adds a Document Folder and shows it in the tree', async () => {
    const added = createFolder('folder-1', 'notes', '/tmp/notes')
    const { desktop } = createDesktopMock({ add: async () => ({ folder: added, ok: true }) })
    appWindow.desktop = desktop

    const folders = useDocumentFolders({ openDocument: vi.fn() })
    await folders.add()

    expect(folders.folders.value.map((folder) => folder.label)).toEqual(['notes'])
    expect(folders.message.value).toBeNull()
  })

  it('reports a duplicate Document Folder instead of adding it twice', async () => {
    const added = createFolder('folder-1', 'notes', '/tmp/notes')
    let calls = 0
    const { desktop } = createDesktopMock({
      add: async () => {
        calls += 1
        return calls === 1 ? { folder: added, ok: true } : { ok: false, reason: 'duplicate' }
      },
    })
    appWindow.desktop = desktop

    const folders = useDocumentFolders({ openDocument: vi.fn() })
    await folders.add()
    await folders.add()

    expect(folders.folders.value).toHaveLength(1)
    expect(folders.message.value).toBe('That folder is already open.')
  })

  it('labels two Document Folders with the same name by their parent folder', async () => {
    const { desktop } = createDesktopMock({
      restore: async () => ({
        folders: [
          createFolder('folder-1', 'notes', '/work/notes'),
          createFolder('folder-2', 'notes', '/personal/notes'),
        ],
        removedCount: 0,
      }),
    })
    appWindow.desktop = desktop

    const folders = useDocumentFolders({ openDocument: vi.fn() })
    await folders.restore()

    expect(folders.folders.value.map((folder) => folder.label)).toEqual([
      'work/notes',
      'personal/notes',
    ])
  })

  it('keeps the open document when its Document Folder is removed', async () => {
    const { desktop, folders: foldersApi } = createDesktopMock({
      restore: async () => ({
        folders: [createFolder('folder-1', 'notes', '/tmp/notes')],
        removedCount: 0,
      }),
    })
    appWindow.desktop = desktop

    const folders = useDocumentFolders({ openDocument: vi.fn() })
    await folders.restore()
    await folders.remove('folder-1')

    expect(folders.folders.value).toEqual([])
    expect(foldersApi.remove).toHaveBeenCalledWith('folder-1')
    expect(desktop.documents.clearLastOpened).not.toHaveBeenCalled()
    expect(desktop.documents.clearWorkspaceDraft).not.toHaveBeenCalled()
  })

  it('expands a Document Folder only when the user opens it', async () => {
    const entries: DesktopFolderEntry[] = [
      { kind: 'file', name: 'notes.md', relativePath: 'notes.md' },
    ]
    const { desktop, folders: foldersApi } = createDesktopMock({
      list: async () => ({ entries, ok: true }),
      restore: async () => ({
        folders: [createFolder('folder-1', 'root', '/tmp/root')],
        removedCount: 0,
      }),
    })
    appWindow.desktop = desktop

    const folders = useDocumentFolders({ openDocument: vi.fn() })
    await folders.restore()

    expect(foldersApi.list).not.toHaveBeenCalled()

    await folders.toggle('folder-1', '.')

    expect(foldersApi.list).toHaveBeenCalledWith({ folderId: 'folder-1', relativePath: '.' })
    expect(folders.entriesOf('folder-1', '.')).toEqual(entries)
  })

  it('flattens the tree to the folders the user expanded', async () => {
    const { desktop } = createDesktopMock({
      list: async () => ({
        entries: [{ kind: 'file', name: 'notes.md', relativePath: 'notes.md' }],
        ok: true,
      }),
      restore: async () => ({
        folders: [createFolder('folder-1', 'notes', '/tmp/notes')],
        removedCount: 0,
      }),
    })
    appWindow.desktop = desktop

    const folders = useDocumentFolders({ openDocument: vi.fn() })
    await folders.restore()

    expect(folders.nodes.value.map((node) => node.label)).toEqual(['notes'])

    await folders.toggle('folder-1', '.')

    expect(folders.nodes.value.map((node) => [node.label, node.depth])).toEqual([
      ['notes', 0],
      ['notes.md', 1],
    ])
    expect(folders.nodes.value[1]?.path).toBe('/tmp/notes/notes.md')
  })

  it('opens a Markdown Document through the supplied callback', async () => {
    const opened: DesktopDocumentHandle = {
      content: '# Notes',
      modifiedAt: 1,
      path: '/tmp/root/notes.md',
    }
    const openDocument = vi.fn(async () => undefined)
    const { desktop } = createDesktopMock(
      {
        list: async () => ({
          entries: [{ kind: 'file', name: 'notes.md', relativePath: 'notes.md' }],
          ok: true,
        }),
        restore: async () => ({
          folders: [createFolder('folder-1', 'root', '/tmp/root')],
          removedCount: 0,
        }),
      },
      { openPath: async () => opened },
    )
    appWindow.desktop = desktop

    const folders = useDocumentFolders({ openDocument })
    await folders.restore()
    await folders.open('folder-1', 'notes.md')

    expect(openDocument).toHaveBeenCalledWith(opened)
  })
})

function createDesktopMock(
  folderOverrides: Partial<DesktopFoldersApi> = {},
  documentOverrides: Partial<DesktopDocumentsApi> = {},
) {
  const folders: DesktopFoldersApi = {
    add: vi.fn(
      folderOverrides.add ?? (async () => ({ ok: false as const, reason: 'cancelled' as const })),
    ),
    list: vi.fn(folderOverrides.list ?? (async () => ({ entries: [], ok: true as const }))),
    remove: vi.fn(folderOverrides.remove ?? (async () => undefined)),
    restore: vi.fn(folderOverrides.restore ?? (async () => ({ folders: [], removedCount: 0 }))),
  }

  return {
    desktop: {
      commands: { onAppCommand: () => () => undefined },
      documents: {
        clearLastOpened: vi.fn(async () => undefined),
        clearWorkspaceDraft: vi.fn(async () => undefined),
        open: async () => null,
        openPath: vi.fn(documentOverrides.openPath ?? (async () => null)),
        restoreLastOpened: async () => null,
        restoreWorkspaceDraft: async () => null,
        save: async () => null,
        saveAs: async () => null,
        saveWorkspaceDraft: async () => undefined,
      },
      editing: { insertText: async () => undefined },
      exports: { exportHtml: async () => null, exportPdf: async () => null },
      folders,
      install: { isHomebrew: async () => false },
      isDesktop: true,
      shell: { openExternal: async () => undefined },
    },
    folders,
  }
}

function createFolder(id: string, name: string, path: string): DesktopDocumentFolder {
  return { id, name, path }
}
