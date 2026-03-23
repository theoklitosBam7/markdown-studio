import type {
  DesktopDocumentHandle,
  DesktopSaveAsInput,
  DesktopSaveInput,
} from '@electron/shared/types'

import {
  DOCUMENTS_OPEN_CHANNEL,
  DOCUMENTS_SAVE_AS_CHANNEL,
  DOCUMENTS_SAVE_CHANNEL,
  SHELL_OPEN_EXTERNAL_CHANNEL,
} from '@electron/shared/channels'
import {
  assertExternalUrl,
  assertSaveAsInput,
  assertSaveInput,
  getDefaultMarkdownPath,
} from '@electron/shared/validation'
import { type BrowserWindow, dialog, ipcMain } from 'electron'
import { readFile, writeFile } from 'node:fs/promises'

const MARKDOWN_FILTERS = [
  { extensions: ['md', 'markdown', 'mdown'], name: 'Markdown Files' },
  { extensions: ['*'], name: 'All Files' },
]

export async function openDocument(
  mainWindow: BrowserWindow,
): Promise<DesktopDocumentHandle | null> {
  const result = await dialog.showOpenDialog(mainWindow, {
    filters: MARKDOWN_FILTERS,
    properties: ['openFile'],
  })

  const selectedPath = result.filePaths[0]
  if (result.canceled || !selectedPath) {
    return null
  }

  try {
    const content = await readFile(selectedPath, 'utf8')
    return { content, path: selectedPath }
  } catch {
    throw new Error(`Failed to read file: ${selectedPath}`)
  }
}

export function registerDesktopIpc(mainWindow: BrowserWindow): void {
  ipcMain.removeHandler(DOCUMENTS_OPEN_CHANNEL)
  ipcMain.removeHandler(DOCUMENTS_SAVE_CHANNEL)
  ipcMain.removeHandler(DOCUMENTS_SAVE_AS_CHANNEL)
  ipcMain.removeHandler(SHELL_OPEN_EXTERNAL_CHANNEL)

  ipcMain.handle(DOCUMENTS_OPEN_CHANNEL, async () => openDocument(mainWindow))
  ipcMain.handle(DOCUMENTS_SAVE_CHANNEL, async (_, payload) => saveDocument(mainWindow, payload))
  ipcMain.handle(DOCUMENTS_SAVE_AS_CHANNEL, async (_, payload) =>
    saveDocumentAs(mainWindow, payload),
  )
  ipcMain.handle(SHELL_OPEN_EXTERNAL_CHANNEL, async (_, url) => {
    const { shell } = await import('electron')

    await shell.openExternal(assertExternalUrl(url))
  })
}

export async function saveDocument(
  mainWindow: BrowserWindow,
  payload: unknown,
): Promise<{ path: string } | null> {
  const input = assertSaveInput(payload as DesktopSaveInput)

  if (input.path === null) {
    return saveDocumentAs(mainWindow, input)
  }

  try {
    await writeFile(input.path, input.content, 'utf8')
    return { path: input.path }
  } catch {
    throw new Error(`Failed to save file: ${input.path}`)
  }
}

export async function saveDocumentAs(
  mainWindow: BrowserWindow,
  payload: unknown,
): Promise<{ path: string } | null> {
  const input = assertSaveAsInput(payload as DesktopSaveAsInput)

  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: getDefaultMarkdownPath(input.suggestedPath),
    filters: MARKDOWN_FILTERS,
  })

  if (result.canceled || !result.filePath) {
    return null
  }

  try {
    await writeFile(result.filePath, input.content, 'utf8')
    return { path: result.filePath }
  } catch {
    throw new Error(`Failed to save file: ${result.filePath}`)
  }
}
