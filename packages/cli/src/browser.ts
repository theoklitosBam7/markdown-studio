import { spawn } from 'node:child_process'

/**
 * Opens the default web browser to the specified URL.
 *
 * Detects the platform and uses the appropriate command:
 * - macOS: `open`
 * - Windows: `cmd /c start`
 * - Linux/other: `xdg-open`
 *
 * @param url - The URL to open
 */
export async function openBrowser(url: string): Promise<void> {
  const command = getOpenCommand(url)

  await new Promise<void>((resolve, reject) => {
    const child = spawn(command.file, command.args, {
      detached: process.platform !== 'win32',
      stdio: 'ignore',
    })

    child.on('error', reject)
    child.on('spawn', () => {
      child.unref()
      resolve()
    })
  })
}

function escapeCmdUrl(value: string): string {
  return value
    .replaceAll('^', '^^')
    .replaceAll('&', '^&')
    .replaceAll('|', '^|')
    .replaceAll('>', '^>')
    .replaceAll('<', '^<')
    .replaceAll('%', '%%')
    .replaceAll('"', '""')
}

/**
 * Returns the platform-specific command to open a URL.
 *
 * @param url - The URL to open
 * @returns Object with file (command) and args (arguments)
 */
function getOpenCommand(url: string): { args: string[]; file: string } {
  const normalizedUrl = validateBrowserUrl(url)

  if (process.platform === 'darwin') {
    return { args: [normalizedUrl], file: 'open' }
  }

  if (process.platform === 'win32') {
    return {
      args: ['/c', 'start', '', escapeCmdUrl(normalizedUrl)],
      file: 'cmd',
    }
  }

  return { args: [normalizedUrl], file: 'xdg-open' }
}

function validateBrowserUrl(value: string): string {
  let parsed: URL

  try {
    parsed = new URL(value)
  } catch {
    throw new Error(`Invalid browser URL: ${value}`)
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error(`Unsupported browser URL protocol: ${parsed.protocol}`)
  }

  return parsed.toString()
}
