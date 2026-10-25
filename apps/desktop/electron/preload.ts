import type { DesktopApi } from '@markdown-studio/desktop-contract/types'

import {
  APP_COMMAND_CHANNEL,
  DOCUMENTS_CLEAR_LAST_OPENED_CHANNEL,
  DOCUMENTS_CLEAR_WORKSPACE_DRAFT_CHANNEL,
  DOCUMENTS_OPEN_CHANNEL,
  DOCUMENTS_OPEN_PATH_CHANNEL,
  DOCUMENTS_RESTORE_LAST_OPENED_CHANNEL,
  DOCUMENTS_RESTORE_WORKSPACE_DRAFT_CHANNEL,
  DOCUMENTS_SAVE_AS_CHANNEL,
  DOCUMENTS_SAVE_CHANNEL,
  DOCUMENTS_SAVE_WORKSPACE_DRAFT_CHANNEL,
  DOCUMENTS_STAT_MODIFICATION_CHANNEL,
  EDITING_INSERT_TEXT_CHANNEL,
  EXPORTS_HTML_CHANNEL,
  EXPORTS_PDF_CHANNEL,
  FOLDERS_ADD_CHANNEL,
  FOLDERS_LIST_CHANNEL,
  FOLDERS_REMOVE_CHANNEL,
  FOLDERS_RESTORE_CHANNEL,
  IMAGES_SAVE_CHANNEL,
  INSTALL_IS_HOMEBREW_CHANNEL,
  SHELL_OPEN_EXTERNAL_CHANNEL,
} from '@markdown-studio/desktop-contract/channels'
import { contextBridge, ipcRenderer } from 'electron'

function createDesktopApi(): DesktopApi {
  return {
    commands: {
      onAppCommand(listener) {
        const wrapped = (
          _event: Electron.IpcRendererEvent,
          command: Parameters<typeof listener>[0],
        ) => {
          listener(command)
        }

        ipcRenderer.on(APP_COMMAND_CHANNEL, wrapped)

        return () => {
          ipcRenderer.removeListener(APP_COMMAND_CHANNEL, wrapped)
        }
      },
    },
    documents: {
      clearLastOpened: () => ipcRenderer.invoke(DOCUMENTS_CLEAR_LAST_OPENED_CHANNEL),
      clearWorkspaceDraft: () => ipcRenderer.invoke(DOCUMENTS_CLEAR_WORKSPACE_DRAFT_CHANNEL),
      open: () => ipcRenderer.invoke(DOCUMENTS_OPEN_CHANNEL),
      openPath: (input) => ipcRenderer.invoke(DOCUMENTS_OPEN_PATH_CHANNEL, input),
      restoreLastOpened: () => ipcRenderer.invoke(DOCUMENTS_RESTORE_LAST_OPENED_CHANNEL),
      restoreWorkspaceDraft: () => ipcRenderer.invoke(DOCUMENTS_RESTORE_WORKSPACE_DRAFT_CHANNEL),
      save: (input) => ipcRenderer.invoke(DOCUMENTS_SAVE_CHANNEL, input),
      saveAs: (input) => ipcRenderer.invoke(DOCUMENTS_SAVE_AS_CHANNEL, input),
      saveWorkspaceDraft: (input) =>
        ipcRenderer.invoke(DOCUMENTS_SAVE_WORKSPACE_DRAFT_CHANNEL, input),
      statModification: (path) => ipcRenderer.invoke(DOCUMENTS_STAT_MODIFICATION_CHANNEL, path),
    },
    editing: {
      insertText: (text) => ipcRenderer.invoke(EDITING_INSERT_TEXT_CHANNEL, text),
    },
    exports: {
      exportHtml: (input) => ipcRenderer.invoke(EXPORTS_HTML_CHANNEL, input),
      exportPdf: (input) => ipcRenderer.invoke(EXPORTS_PDF_CHANNEL, input),
    },
    folders: {
      add: () => ipcRenderer.invoke(FOLDERS_ADD_CHANNEL),
      list: (input) => ipcRenderer.invoke(FOLDERS_LIST_CHANNEL, input),
      remove: (folderId) => ipcRenderer.invoke(FOLDERS_REMOVE_CHANNEL, folderId),
      restore: () => ipcRenderer.invoke(FOLDERS_RESTORE_CHANNEL),
    },
    images: {
      save: (input) => ipcRenderer.invoke(IMAGES_SAVE_CHANNEL, input),
    },
    install: {
      isHomebrew: () => ipcRenderer.invoke(INSTALL_IS_HOMEBREW_CHANNEL),
    },
    isDesktop: true,
    shell: {
      openExternal: (url) => ipcRenderer.invoke(SHELL_OPEN_EXTERNAL_CHANNEL, url),
    },
  }
}

contextBridge.exposeInMainWorld('desktop', createDesktopApi())
