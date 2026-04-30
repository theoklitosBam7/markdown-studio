import { app, BrowserWindow, Menu, shell } from 'electron'
import { fileURLToPath } from 'node:url'

import { registerDesktopIpc } from './ipc/documents'
import { buildAppMenu } from './menu/appMenu'

const preloadPath = fileURLToPath(new URL('../preload/preload.cjs', import.meta.url))
const rendererHtmlPath = fileURLToPath(new URL('../renderer/index.html', import.meta.url))

async function createMainWindow(): Promise<BrowserWindow> {
  const window = new BrowserWindow({
    backgroundColor: '#f7f5f0',
    height: 960,
    minHeight: 720,
    minWidth: 980,
    show: false,
    title: 'Markdown Studio',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: preloadPath,
      sandbox: true,
    },
    width: 1440,
  })

  window.once('ready-to-show', () => {
    window.show()
  })

  window.webContents.setWindowOpenHandler(({ url }) => {
    void openExternal(url)
    return { action: 'deny' }
  })

  window.webContents.on('will-navigate', (event, url) => {
    if (isSafeNavigation(url, window.webContents.getURL())) {
      return
    }

    event.preventDefault()
    void openExternal(url)
  })

  registerDesktopIpc(window)
  Menu.setApplicationMenu(buildAppMenu(window))

  if (!app.isPackaged && process.env.ELECTRON_RENDERER_URL) {
    await window.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    await window.loadFile(rendererHtmlPath)
  }

  if (!app.isPackaged) {
    window.webContents.openDevTools({ mode: 'detach' })
  }

  return window
}

function isSafeNavigation(nextUrl: string, currentUrl: string): boolean {
  try {
    const next = new URL(nextUrl)
    const current = new URL(currentUrl || nextUrl)

    if (next.protocol === 'file:' && current.protocol === 'file:') {
      return next.pathname === current.pathname
    }

    return next.origin === current.origin && next.pathname === current.pathname
  } catch (err) {
    console.warn('Failed to parse navigation URL', err)
    return false
  }
}

async function openExternal(url: string): Promise<void> {
  try {
    const parsed = new URL(url)

    if (!['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
      return
    }

    await shell.openExternal(parsed.toString())
  } catch (err) {
    console.error('Failed to open external URL', err)
  }
}

app.whenReady().then(async () => {
  await createMainWindow()

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createMainWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
