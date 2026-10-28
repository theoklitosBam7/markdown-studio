// @vitest-environment node

import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'

import {
  DOCUMENTS_CHECK_MODIFICATION_CHANNEL,
  DOCUMENTS_OPEN_CHANNEL,
  DOCUMENTS_RESTORE_LAST_OPENED_CHANNEL,
  DOCUMENTS_RESTORE_WORKSPACE_DRAFT_CHANNEL,
  DOCUMENTS_SAVE_AS_CHANNEL,
  DOCUMENTS_SAVE_WORKSPACE_DRAFT_CHANNEL,
} from '@markdown-studio/desktop-contract/channels'

const { handlers, setUserDataPath, showOpenDialog, showSaveDialog } = vi.hoisted(() => ({
  handlers: new Map<string, (...args: unknown[]) => unknown>(),
  setUserDataPath: vi.fn(),
  showOpenDialog: vi.fn(),
  showSaveDialog: vi.fn(),
}))

vi.mock('electron', () => ({
  app: { getPath: () => setUserDataPath() },
  BrowserWindow: class {},
  dialog: { showOpenDialog, showSaveDialog },
  ipcMain: {
    handle: (channel: string, handler: (...args: unknown[]) => unknown) => {
      handlers.set(channel, handler)
    },
    removeHandler: (channel: string) => {
      handlers.delete(channel)
    },
  },
  shell: { openExternal: vi.fn() },
}))

import { registerDesktopIpc } from './documents'

let temporaryDirectory: string

beforeEach(async () => {
  temporaryDirectory = await mkdtemp(join(tmpdir(), 'markdown-studio-ipc-'))
  setUserDataPath.mockReturnValue(temporaryDirectory)
  handlers.clear()
  showOpenDialog.mockReset()
  showSaveDialog.mockReset()
  registerDesktopIpc({ webContents: { insertText: vi.fn() } } as never)
})

afterEach(async () => {
  await rm(temporaryDirectory, { force: true, recursive: true })
})

describe('document modification IPC', () => {
  it('refuses to check an arbitrary renderer-supplied path', async () => {
    const unauthorizedPath = join(temporaryDirectory, 'private.md')
    await writeFile(unauthorizedPath, '# Private')
    const checkModification = handlers.get(DOCUMENTS_CHECK_MODIFICATION_CHANNEL)

    await expect(
      checkModification?.({}, { modifiedAt: 0, path: unauthorizedPath }),
    ).rejects.toThrow('not authorized')
  })

  it('checks a document saved through Save As', async () => {
    const savedPath = join(temporaryDirectory, 'saved-as.md')
    showSaveDialog.mockResolvedValue({ canceled: false, filePath: savedPath })
    await handlers.get(DOCUMENTS_SAVE_AS_CHANNEL)?.(
      {},
      {
        content: '# Saved',
        suggestedPath: 'saved-as.md',
      },
    )
    const checkModification = handlers.get(DOCUMENTS_CHECK_MODIFICATION_CHANNEL)

    const check = await checkModification?.({}, { modifiedAt: 0, path: savedPath })

    expect(check).toMatchObject({
      document: { content: '# Saved', path: savedPath },
      status: 'changed',
    })
  })

  it('does not authorize a path from a saved Workspace Draft', async () => {
    const draftPath = join(temporaryDirectory, 'draft-path.md')
    await writeFile(draftPath, '# Draft path')
    await handlers.get(DOCUMENTS_SAVE_WORKSPACE_DRAFT_CHANNEL)?.(
      {},
      {
        activeDocument: {
          content: '# Draft path',
          label: 'draft-path.md',
          path: draftPath,
          savedContent: '# Draft path',
        },
      },
    )
    const checkModification = handlers.get(DOCUMENTS_CHECK_MODIFICATION_CHANNEL)

    await expect(checkModification?.({}, { modifiedAt: 0, path: draftPath })).rejects.toThrow(
      'not authorized',
    )
  })

  it('checks a restored Workspace Draft when its path matches trusted last-opened state', async () => {
    const selectedPath = join(temporaryDirectory, 'draft-restored.md')
    await writeFile(selectedPath, '# Draft restored')
    showOpenDialog.mockResolvedValue({ canceled: false, filePaths: [selectedPath] })
    await handlers.get(DOCUMENTS_OPEN_CHANNEL)?.({})
    await handlers.get(DOCUMENTS_SAVE_WORKSPACE_DRAFT_CHANNEL)?.(
      {},
      {
        activeDocument: {
          content: '# Draft restored with edits',
          label: 'draft-restored.md',
          path: selectedPath,
          savedContent: '# Draft restored',
        },
      },
    )

    handlers.clear()
    registerDesktopIpc({ webContents: { insertText: vi.fn() } } as never)
    const restoreDraft = handlers.get(DOCUMENTS_RESTORE_WORKSPACE_DRAFT_CHANNEL)
    const checkModification = handlers.get(DOCUMENTS_CHECK_MODIFICATION_CHANNEL)

    const draft = await restoreDraft?.({})
    const check = await checkModification?.({}, { modifiedAt: 0, path: selectedPath })

    expect(draft).toMatchObject({ activeDocument: { path: selectedPath } })
    expect(check).toMatchObject({ document: { path: selectedPath }, status: 'changed' })
  })

  it('does not authorize a restored Workspace Draft with a path different from last-opened state', async () => {
    const selectedPath = join(temporaryDirectory, 'last-opened.md')
    const draftPath = join(temporaryDirectory, 'mismatched-draft.md')
    await writeFile(selectedPath, '# Last opened')
    await writeFile(draftPath, '# Mismatched draft')
    showOpenDialog.mockResolvedValue({ canceled: false, filePaths: [selectedPath] })
    await handlers.get(DOCUMENTS_OPEN_CHANNEL)?.({})
    await handlers.get(DOCUMENTS_SAVE_WORKSPACE_DRAFT_CHANNEL)?.(
      {},
      {
        activeDocument: {
          content: '# Mismatched draft',
          label: 'mismatched-draft.md',
          path: draftPath,
          savedContent: '# Mismatched draft',
        },
      },
    )

    handlers.clear()
    registerDesktopIpc({ webContents: { insertText: vi.fn() } } as never)
    await handlers.get(DOCUMENTS_RESTORE_WORKSPACE_DRAFT_CHANNEL)?.({})
    const checkModification = handlers.get(DOCUMENTS_CHECK_MODIFICATION_CHANNEL)

    await expect(checkModification?.({}, { modifiedAt: 0, path: draftPath })).rejects.toThrow(
      'not authorized',
    )
  })

  it('checks a restored document previously opened outside Document Folders', async () => {
    const selectedPath = join(temporaryDirectory, 'restored.md')
    await writeFile(selectedPath, '# Restored')
    showOpenDialog.mockResolvedValue({ canceled: false, filePaths: [selectedPath] })
    await handlers.get(DOCUMENTS_OPEN_CHANNEL)?.({})

    handlers.clear()
    registerDesktopIpc({ webContents: { insertText: vi.fn() } } as never)
    const restoreDocument = handlers.get(DOCUMENTS_RESTORE_LAST_OPENED_CHANNEL)
    const checkModification = handlers.get(DOCUMENTS_CHECK_MODIFICATION_CHANNEL)

    const restored = await restoreDocument?.({})
    const check = await checkModification?.({}, { modifiedAt: 0, path: selectedPath })

    expect(restored).toMatchObject({ content: '# Restored', path: selectedPath })
    expect(check).toMatchObject({ document: { path: selectedPath }, status: 'changed' })
  })

  it('checks a document selected through Open outside Document Folders', async () => {
    const selectedPath = join(temporaryDirectory, 'outside-roots.md')
    await writeFile(selectedPath, '# Opened')
    showOpenDialog.mockResolvedValue({ canceled: false, filePaths: [selectedPath] })
    const openDocument = handlers.get(DOCUMENTS_OPEN_CHANNEL)
    const checkModification = handlers.get(DOCUMENTS_CHECK_MODIFICATION_CHANNEL)

    const opened = await openDocument?.({})
    const check = await checkModification?.({}, { modifiedAt: 0, path: selectedPath })

    expect(opened).toMatchObject({ content: '# Opened', path: selectedPath })
    expect(check).toMatchObject({
      document: { content: '# Opened', path: selectedPath },
      status: 'changed',
    })
  })
})
