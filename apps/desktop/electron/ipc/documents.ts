import type { DesktopDocumentHandle } from '@markdown-studio/desktop-contract/types'

import {
  DOCUMENTS_CLEAR_LAST_OPENED_CHANNEL,
  DOCUMENTS_OPEN_CHANNEL,
  DOCUMENTS_RESTORE_LAST_OPENED_CHANNEL,
  DOCUMENTS_SAVE_AS_CHANNEL,
  DOCUMENTS_SAVE_CHANNEL,
  EDITING_INSERT_TEXT_CHANNEL,
  EXPORTS_HTML_CHANNEL,
  EXPORTS_PDF_CHANNEL,
  SHELL_OPEN_EXTERNAL_CHANNEL,
} from '@markdown-studio/desktop-contract/channels'
import {
  assertExportInput,
  assertExternalUrl,
  assertSaveAsInput,
  assertSaveInput,
  getDefaultExportPath,
  getDefaultMarkdownPath,
} from '@markdown-studio/desktop-contract/validation'
import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

const HTML_FILTERS = [
  { extensions: ['html'], name: 'HTML Files' },
  { extensions: ['*'], name: 'All Files' },
]
const MARKDOWN_FILTERS = [
  { extensions: ['md', 'markdown', 'mdown'], name: 'Markdown Files' },
  { extensions: ['*'], name: 'All Files' },
]
const PDF_FILTERS = [
  { extensions: ['pdf'], name: 'PDF Files' },
  { extensions: ['*'], name: 'All Files' },
]
const DOCUMENT_STATE_FILE = 'document-state.json'

interface DocumentState {
  lastOpenedPath?: string
}

export async function exportHtml(
  mainWindow: BrowserWindow,
  payload: unknown,
): Promise<{ path: string } | null> {
  const input = assertExportInput(payload)
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: getDefaultExportPath('html', input.suggestedPath),
    filters: HTML_FILTERS,
  })

  if (result.canceled || !result.filePath) {
    return null
  }

  try {
    await writeFile(result.filePath, input.documentHtml, 'utf8')
    return { path: result.filePath }
  } catch {
    throw new Error(`Failed to export HTML: ${result.filePath}`)
  }
}

export async function exportPdf(
  mainWindow: BrowserWindow,
  payload: unknown,
): Promise<{ path: string } | null> {
  const input = assertExportInput(payload)
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: getDefaultExportPath('pdf', input.suggestedPath),
    filters: PDF_FILTERS,
  })

  if (result.canceled || !result.filePath) {
    return null
  }

  const exportWindow = new BrowserWindow({
    backgroundColor: '#ffffff',
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  }) as BrowserWindow

  try {
    await exportWindow.loadURL(toDataUrl(input.documentHtml))
    const pdf = await exportWindow.webContents.printToPDF({
      preferCSSPageSize: true,
      printBackground: true,
    })
    await writeFile(result.filePath, pdf)

    return { path: result.filePath }
  } catch {
    throw new Error(`Failed to export PDF: ${result.filePath}`)
  } finally {
    if (!exportWindow.isDestroyed()) {
      exportWindow.destroy()
    }
  }
}

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

  let content: string
  try {
    content = await readFile(selectedPath, 'utf8')
  } catch {
    throw new Error(`Failed to read file: ${selectedPath}`)
  }

  await rememberLastOpenedPathSafe(selectedPath)
  return { content, path: selectedPath }
}

export function registerDesktopIpc(mainWindow: BrowserWindow): void {
  ipcMain.removeHandler(DOCUMENTS_CLEAR_LAST_OPENED_CHANNEL)
  ipcMain.removeHandler(DOCUMENTS_OPEN_CHANNEL)
  ipcMain.removeHandler(DOCUMENTS_RESTORE_LAST_OPENED_CHANNEL)
  ipcMain.removeHandler(DOCUMENTS_SAVE_CHANNEL)
  ipcMain.removeHandler(DOCUMENTS_SAVE_AS_CHANNEL)
  ipcMain.removeHandler(EDITING_INSERT_TEXT_CHANNEL)
  ipcMain.removeHandler(EXPORTS_HTML_CHANNEL)
  ipcMain.removeHandler(EXPORTS_PDF_CHANNEL)
  ipcMain.removeHandler(SHELL_OPEN_EXTERNAL_CHANNEL)

  ipcMain.handle(DOCUMENTS_CLEAR_LAST_OPENED_CHANNEL, async () => clearLastOpenedPath())
  ipcMain.handle(DOCUMENTS_OPEN_CHANNEL, async () => openDocument(mainWindow))
  ipcMain.handle(DOCUMENTS_RESTORE_LAST_OPENED_CHANNEL, async () => restoreLastOpenedDocument())
  ipcMain.handle(DOCUMENTS_SAVE_CHANNEL, async (_, payload) => saveDocument(mainWindow, payload))
  ipcMain.handle(DOCUMENTS_SAVE_AS_CHANNEL, async (_, payload) =>
    saveDocumentAs(mainWindow, payload),
  )
  ipcMain.handle(EDITING_INSERT_TEXT_CHANNEL, async (_, text) => {
    await mainWindow.webContents.insertText(String(text))
  })
  ipcMain.handle(EXPORTS_HTML_CHANNEL, async (_, payload) => exportHtml(mainWindow, payload))
  ipcMain.handle(EXPORTS_PDF_CHANNEL, async (_, payload) => exportPdf(mainWindow, payload))
  ipcMain.handle(SHELL_OPEN_EXTERNAL_CHANNEL, (_, url) =>
    shell.openExternal(assertExternalUrl(url)),
  )
}

export async function restoreLastOpenedDocument(): Promise<DesktopDocumentHandle | null> {
  const state = await readDocumentState()
  if (!state.lastOpenedPath) {
    return null
  }

  try {
    const content = await readFile(state.lastOpenedPath, 'utf8')
    return { content, path: state.lastOpenedPath }
  } catch {
    await clearLastOpenedPath()
    return null
  }
}

export async function saveDocument(
  mainWindow: BrowserWindow,
  payload: unknown,
): Promise<{ path: string } | null> {
  const input = assertSaveInput(payload)

  if (input.path === null) {
    return saveDocumentAs(mainWindow, input)
  }

  try {
    await writeFile(input.path, input.content, 'utf8')
  } catch {
    throw new Error(`Failed to save file: ${input.path}`)
  }

  await rememberLastOpenedPathSafe(input.path)
  return { path: input.path }
}

export async function saveDocumentAs(
  mainWindow: BrowserWindow,
  payload: unknown,
): Promise<{ path: string } | null> {
  const input = assertSaveAsInput(payload)

  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: getDefaultMarkdownPath(input.suggestedPath),
    filters: MARKDOWN_FILTERS,
  })

  if (result.canceled || !result.filePath) {
    return null
  }

  try {
    await writeFile(result.filePath, input.content, 'utf8')
  } catch {
    throw new Error(`Failed to save file: ${result.filePath}`)
  }

  await rememberLastOpenedPathSafe(result.filePath)
  return { path: result.filePath }
}

async function clearLastOpenedPath(): Promise<void> {
  try {
    await unlink(getDocumentStatePath())
  } catch (error) {
    if (!isMissingFileError(error)) {
      console.warn('Failed to clear last opened document state:', error)
    }
  }
}

function getDocumentStatePath(): string {
  return join(app.getPath('userData'), DOCUMENT_STATE_FILE)
}

function isMissingFileError(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT'
}

async function readDocumentState(): Promise<DocumentState> {
  try {
    const raw = await readFile(getDocumentStatePath(), 'utf8')
    const parsed = JSON.parse(raw) as unknown

    if (typeof parsed !== 'object' || parsed === null || !('lastOpenedPath' in parsed)) {
      return {}
    }

    return typeof parsed.lastOpenedPath === 'string'
      ? { lastOpenedPath: parsed.lastOpenedPath }
      : {}
  } catch {
    return {}
  }
}

async function rememberLastOpenedPath(filePath: string): Promise<void> {
  const statePath = getDocumentStatePath()
  await mkdir(dirname(statePath), { recursive: true })
  await writeFile(statePath, JSON.stringify({ lastOpenedPath: filePath }), 'utf8')
}

async function rememberLastOpenedPathSafe(filePath: string): Promise<void> {
  try {
    await rememberLastOpenedPath(filePath)
  } catch (error) {
    console.warn('Failed to remember last opened document:', error)
  }
}

function toDataUrl(documentHtml: string): string {
  return `data:text/html;charset=utf-8,${encodeURIComponent(documentHtml)}`
}
