import { INSTALL_IS_HOMEBREW_CHANNEL } from '@markdown-studio/desktop-contract/channels'
import { ipcMain } from 'electron'
import { stat } from 'node:fs/promises'
import { join } from 'node:path'

const MARKER_FILE = '.homebrew-install'

export function registerInstallIpc(): void {
  ipcMain.removeHandler(INSTALL_IS_HOMEBREW_CHANNEL)
  ipcMain.handle(INSTALL_IS_HOMEBREW_CHANNEL, async () => isHomebrewInstall())
}

function getResourcesPath(): string {
  // In production, the app lives at /Applications/Markdown Studio.app
  // In dev, __dirname points to the out/main directory
  return join(process.resourcesPath ?? join(__dirname, '..'))
}

async function isHomebrewInstall(): Promise<boolean> {
  try {
    const markerPath = join(getResourcesPath(), MARKER_FILE)
    await stat(markerPath)
    return true
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code !== 'ENOENT') {
      console.warn('Failed to read install method marker:', error)
    }

    return false
  }
}
