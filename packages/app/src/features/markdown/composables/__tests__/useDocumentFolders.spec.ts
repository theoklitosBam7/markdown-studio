import type {
  DesktopDocumentFolder,
  DesktopDocumentHandle,
  DesktopDocumentsApi,
  DesktopFolderEntry,
  DesktopFoldersApi,
} from '@markdown-studio/desktop-contract/types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { shallowRef } from 'vue'

import type { AppWindow } from '../../../../browser-window'

import { resetBrowserDocumentSessionForTests } from '../useDocumentActions'
import { useDocumentFolders } from '../useDocumentFolders'
import { useDocumentSession } from '../useDocumentSession'

const appWindow = window as AppWindow
const originalDesktop = appWindow.desktop

beforeEach(() => {
  resetBrowserDocumentSessionForTests()
  appWindow.desktop = undefined
  vi.clearAllMocks()
})

afterEach(() => {
  resetBrowserDocumentSessionForTests()
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

  it('expands only the ancestors of the restored active Markdown Document', async () => {
    const { desktop, folders: foldersApi } = createDesktopMock({
      list: async ({ relativePath }) => {
        let entries: DesktopFolderEntry[]

        switch (relativePath) {
          case '.':
            entries = [
              { kind: 'folder', name: 'projects', relativePath: 'projects' },
              { kind: 'folder', name: 'archive', relativePath: 'archive' },
            ]
            break
          case 'projects':
            entries = [{ kind: 'folder', name: 'drafts', relativePath: 'projects/drafts' }]
            break
          default:
            entries = [
              { kind: 'file', name: 'current.md', relativePath: 'projects/drafts/current.md' },
            ]
        }

        return { entries, ok: true }
      },
      restore: async () => ({
        folders: [
          createFolder('folder-1', 'notes', '/tmp/notes'),
          createFolder('folder-2', 'other', '/tmp/other'),
        ],
        removedCount: 0,
      }),
    })
    appWindow.desktop = desktop

    const folders = useDocumentFolders({
      currentPath: shallowRef('/tmp/notes/projects/drafts/current.md'),
      openDocument: vi.fn(),
    })
    await folders.restore()

    expect(folders.nodes.value.map((node) => node.path)).toEqual([
      '/tmp/notes',
      '/tmp/notes/projects',
      '/tmp/notes/projects/drafts',
      '/tmp/notes/projects/drafts/current.md',
      '/tmp/notes/archive',
      '/tmp/other',
    ])
    expect(foldersApi.list).toHaveBeenCalledTimes(3)
    expect(foldersApi.list).toHaveBeenNthCalledWith(1, {
      folderId: 'folder-1',
      relativePath: '.',
    })
    expect(foldersApi.list).toHaveBeenNthCalledWith(2, {
      folderId: 'folder-1',
      relativePath: 'projects',
    })
    expect(foldersApi.list).toHaveBeenNthCalledWith(3, {
      folderId: 'folder-1',
      relativePath: 'projects/drafts',
    })
  })

  it('restores a Windows active document through listed directory names when path casing differs', async () => {
    const { desktop, folders: foldersApi } = createDesktopMock({
      list: async ({ relativePath }) => {
        switch (relativePath) {
          case '.':
            return {
              entries: [
                { kind: 'folder', name: 'Projects', relativePath: 'Projects' },
                { kind: 'folder', name: 'Archive', relativePath: 'Archive' },
              ],
              ok: true,
            }
          case 'Projects':
            return {
              entries: [{ kind: 'folder', name: 'Drafts', relativePath: 'Projects/Drafts' }],
              ok: true,
            }
          default:
            return {
              entries: [
                {
                  kind: 'file',
                  name: 'Current.md',
                  relativePath: 'Projects/Drafts/Current.md',
                },
              ],
              ok: true,
            }
        }
      },
      restore: async () => ({
        folders: [createFolder('folder-1', 'Notes', 'C:\\Users\\Theo\\Notes')],
        removedCount: 0,
      }),
    })
    appWindow.desktop = desktop

    const folders = useDocumentFolders({
      currentPath: shallowRef('c:\\users\\THEO\\notes\\projects\\DRAFTS\\current.md'),
      openDocument: vi.fn(),
    })
    await folders.restore()

    expect(folders.nodes.value.map((node) => node.path)).toEqual([
      'C:\\Users\\Theo\\Notes',
      'C:\\Users\\Theo\\Notes\\Projects',
      'C:\\Users\\Theo\\Notes\\Projects\\Drafts',
      'C:\\Users\\Theo\\Notes\\Projects\\Drafts\\Current.md',
      'C:\\Users\\Theo\\Notes\\Archive',
    ])
    expect(foldersApi.list).toHaveBeenNthCalledWith(1, {
      folderId: 'folder-1',
      relativePath: '.',
    })
    expect(foldersApi.list).toHaveBeenNthCalledWith(2, {
      folderId: 'folder-1',
      relativePath: 'Projects',
    })
    expect(foldersApi.list).toHaveBeenNthCalledWith(3, {
      folderId: 'folder-1',
      relativePath: 'Projects/Drafts',
    })
  })

  it('keeps restored Document Folders lazy when no active document is inside them', async () => {
    const { desktop, folders: foldersApi } = createDesktopMock({
      restore: async () => ({
        folders: [createFolder('folder-1', 'notes', '/tmp/notes')],
        removedCount: 0,
      }),
    })
    appWindow.desktop = desktop

    const folders = useDocumentFolders({
      currentPath: shallowRef('/elsewhere/current.md'),
      openDocument: vi.fn(),
    })
    await folders.restore()

    expect(folders.nodes.value.map((node) => node.path)).toEqual(['/tmp/notes'])
    expect(foldersApi.list).not.toHaveBeenCalled()
  })

  it('keeps restored Document Folders lazy when there is no active document', async () => {
    const { desktop, folders: foldersApi } = createDesktopMock({
      restore: async () => ({
        folders: [createFolder('folder-1', 'notes', '/tmp/notes')],
        removedCount: 0,
      }),
    })
    appWindow.desktop = desktop

    const folders = useDocumentFolders({
      currentPath: shallowRef(null),
      openDocument: vi.fn(),
    })
    await folders.restore()

    expect(folders.nodes.value.map((node) => node.path)).toEqual(['/tmp/notes'])
    expect(foldersApi.list).not.toHaveBeenCalled()
  })

  it('does not reopen ancestors after the user collapses them', async () => {
    const currentPath = shallowRef<null | string>('/tmp/notes/current.md')
    const { desktop, folders: foldersApi } = createDesktopMock({
      list: async () => ({
        entries: [{ kind: 'file', name: 'current.md', relativePath: 'current.md' }],
        ok: true,
      }),
      restore: async () => ({
        folders: [createFolder('folder-1', 'notes', '/tmp/notes')],
        removedCount: 0,
      }),
    })
    appWindow.desktop = desktop

    const folders = useDocumentFolders({ currentPath, openDocument: vi.fn() })
    await folders.restore()
    await folders.toggle('folder-1', '.')
    currentPath.value = '/tmp/notes/another.md'

    expect(folders.nodes.value.map((node) => node.path)).toEqual(['/tmp/notes'])
    expect(foldersApi.list).toHaveBeenCalledTimes(1)
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

  it('refreshes the folders the user has open', async () => {
    let entries: DesktopFolderEntry[] = [
      { kind: 'file', name: 'notes.md', relativePath: 'notes.md' },
    ]
    const { desktop } = createDesktopMock({
      list: async () => ({ entries, ok: true }),
      restore: async () => ({
        folders: [createFolder('folder-1', 'root', '/tmp/root')],
        removedCount: 0,
      }),
    })
    appWindow.desktop = desktop

    const folders = useDocumentFolders({ openDocument: vi.fn() })
    await folders.restore()
    await folders.toggle('folder-1', '.')
    entries = [...entries, { kind: 'file', name: 'later.md', relativePath: 'later.md' }]

    await folders.refresh()

    expect(folders.entriesOf('folder-1', '.').map((entry) => entry.name)).toEqual([
      'notes.md',
      'later.md',
    ])
  })

  it('does not load or replace a Markdown Document from a Document Folder when discard is cancelled', async () => {
    const opened: DesktopDocumentHandle = {
      content: '# Notes',
      modifiedAt: 1,
      path: '/tmp/root/notes.md',
    }
    const openPath = vi.fn(async () => opened)
    const { desktop } = createDesktopMock(
      {
        restore: async () => ({
          folders: [createFolder('folder-1', 'root', '/tmp/root')],
          removedCount: 0,
        }),
      },
      { openPath },
    )
    appWindow.desktop = desktop
    window.confirm = vi.fn(() => false)

    const content = shallowRef('# Existing')
    const session = useDocumentSession({
      content,
      replaceContent: (value) => {
        content.value = value
      },
    })
    content.value = '# Unsaved edits'
    const folders = useDocumentFolders({
      openDocument: (loadHandle) => session.openDocumentHandle(loadHandle),
    })
    await folders.restore()
    await folders.open('folder-1', 'notes.md')

    expect(window.confirm).toHaveBeenCalledTimes(1)
    expect(openPath).not.toHaveBeenCalled()
    expect(content.value).toBe('# Unsaved edits')
    expect(session.currentPath.value).toBe(null)
    expect(session.isDirty.value).toBe(true)
  })

  it('loads and opens a Markdown Document from a Document Folder after discard is accepted', async () => {
    const opened: DesktopDocumentHandle = {
      content: '# Notes',
      modifiedAt: 1,
      path: '/tmp/root/notes.md',
    }
    const openPath = vi.fn(async () => opened)
    const { desktop } = createDesktopMock(
      {
        restore: async () => ({
          folders: [createFolder('folder-1', 'root', '/tmp/root')],
          removedCount: 0,
        }),
      },
      { openPath },
    )
    appWindow.desktop = desktop
    window.confirm = vi.fn(() => true)

    const content = shallowRef('# Existing')
    const session = useDocumentSession({
      content,
      replaceContent: (value) => {
        content.value = value
      },
    })
    content.value = '# Unsaved edits'
    const folders = useDocumentFolders({
      openDocument: (loadHandle) => session.openDocumentHandle(loadHandle),
    })
    await folders.restore()
    await folders.open('folder-1', 'notes.md')

    expect(openPath).toHaveBeenCalledWith({ folderId: 'folder-1', relativePath: 'notes.md' })
    expect(content.value).toBe('# Notes')
    expect(session.currentPath.value).toBe('/tmp/root/notes.md')
    expect(session.isDirty.value).toBe(false)
  })

  it('opens a Markdown Document through the supplied callback', async () => {
    const opened: DesktopDocumentHandle = {
      content: '# Notes',
      modifiedAt: 1,
      path: '/tmp/root/notes.md',
    }
    const openDocument = vi.fn(async (loadHandle: () => Promise<DesktopDocumentHandle | null>) => {
      await loadHandle()
    })
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

    expect(openDocument).toHaveBeenCalledTimes(1)
    await expect(openDocument.mock.calls[0]?.[0]()).resolves.toEqual(opened)
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
