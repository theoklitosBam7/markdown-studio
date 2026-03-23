import type { DesktopApi } from '@electron/shared/types'

import {
  APP_COMMAND_CHANNEL,
  DOCUMENTS_OPEN_CHANNEL,
  DOCUMENTS_SAVE_AS_CHANNEL,
  DOCUMENTS_SAVE_CHANNEL,
  SHELL_OPEN_EXTERNAL_CHANNEL,
} from '@electron/shared/channels'
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
      open: () => ipcRenderer.invoke(DOCUMENTS_OPEN_CHANNEL),
      save: (input) => ipcRenderer.invoke(DOCUMENTS_SAVE_CHANNEL, input),
      saveAs: (input) => ipcRenderer.invoke(DOCUMENTS_SAVE_AS_CHANNEL, input),
    },
    isDesktop: true,
    shell: {
      openExternal: (url) => ipcRenderer.invoke(SHELL_OPEN_EXTERNAL_CHANNEL, url),
    },
  }
}

contextBridge.exposeInMainWorld('desktop', createDesktopApi())
