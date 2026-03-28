import type { AppCommand } from '@markdown-studio/desktop-contract/types'

import { APP_COMMAND_CHANNEL } from '@markdown-studio/desktop-contract/channels'
import { type BrowserWindow, Menu, type MenuItemConstructorOptions } from 'electron'

export function buildAppMenu(mainWindow: BrowserWindow): Menu {
  const template: MenuItemConstructorOptions[] = [
    {
      label: 'Markdown Studio',
      submenu: [
        { role: 'about' },
        createCommandMenuItem(mainWindow, 'Check for Updates…', '', 'update:check'),
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'File',
      submenu: [
        createCommandMenuItem(mainWindow, 'Open…', 'CmdOrCtrl+O', 'document:open'),
        createCommandMenuItem(mainWindow, 'Save', 'CmdOrCtrl+S', 'document:save'),
        createCommandMenuItem(mainWindow, 'Save As…', 'CmdOrCtrl+Shift+S', 'document:saveAs'),
        { type: 'separator' },
        { role: 'close' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [{ role: 'minimize' }, { role: 'zoom' }, { type: 'separator' }, { role: 'front' }],
    },
  ]

  return Menu.buildFromTemplate(template)
}

function createCommandMenuItem(
  mainWindow: BrowserWindow,
  label: string,
  accelerator: string,
  command: AppCommand,
): MenuItemConstructorOptions {
  return {
    accelerator,
    click: () => {
      mainWindow.webContents.send(APP_COMMAND_CHANNEL, command)
    },
    label,
  }
}
