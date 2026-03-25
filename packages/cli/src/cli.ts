#!/usr/bin/env node

import { realpathSync } from 'node:fs'
import { access, readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import { openBrowser } from './browser.js'
import { startStaticServer } from './server.js'

/**
 * CLI options for running Markdown Studio.
 */
interface CliOptions {
  /** Host to bind the server to */
  host: string
  /** Whether to automatically open the browser */
  openBrowser: boolean
  /** Optional port to listen on (defaults to random available port) */
  port?: number
}

/**
 * Help text displayed when --help or -h flag is used.
 */
const HELP_TEXT = `Markdown Studio

Usage:
  markdown-studio [--host <host>] [--port <number>] [--no-open] [--version]

Options:
  --host <host>     Host to bind to (default: 127.0.0.1)
  --port <number>   Port to listen on (default: random available port)
  --no-open         Do not open browser automatically
  --version, -v     Show version number
  --help, -h        Show this help message
`

/**
 * Path to the public assets directory.
 */
const assetsDir = fileURLToPath(new URL('../public', import.meta.url))

/**
 * Path to the source build directory.
 */
const sourceBuildDir = fileURLToPath(new URL('../../../apps/web/dist', import.meta.url))

/**
 * Cached version string to avoid repeated file reads.
 */
let cachedVersion: string | undefined

/**
 * Asserts that the packaged web assets are up-to-date with the source build.
 *
 * Throws an error if:
 * - Packaged assets are missing
 * - Packaged assets are stale compared to source build
 *
 * @param paths - Optional paths to check. Defaults to constants.
 * @throws Error if packaged assets are missing or stale
 */
export async function assertFreshPackagedAssets(
  paths: {
    assetsDir: string
    sourceBuildDir: string
  } = {
    assetsDir,
    sourceBuildDir,
  },
): Promise<void> {
  const [hasSourceBuild, hasPackagedBuild] = await Promise.all([
    pathExists(paths.sourceBuildDir),
    pathExists(paths.assetsDir),
  ])

  if (!hasPackagedBuild) {
    throw new Error('Missing packaged web assets. Run "pnpm build:npm" before starting the CLI.')
  }

  if (!hasSourceBuild) {
    return
  }

  const [sourceIndex, packagedIndex] = await Promise.all([
    readFile(path.join(paths.sourceBuildDir, 'index.html'), 'utf8'),
    readFile(path.join(paths.assetsDir, 'index.html'), 'utf8'),
  ])

  if (sourceIndex !== packagedIndex) {
    throw new Error(
      'Packaged web assets are stale. Run "pnpm build:npm" so packages/cli/public matches the current web build.',
    )
  }
}

/**
 * Reads the version from the package.json file.
 * Uses readFile to directly parse package.json, which works in both development and production.
 */
export async function getVersion(): Promise<string> {
  if (cachedVersion) {
    return cachedVersion
  }
  const packageJsonPath = fileURLToPath(new URL('../package.json', import.meta.url))
  const packageJsonContent = await readFile(packageJsonPath, 'utf8')
  const packageJson = JSON.parse(packageJsonContent) as { version: string }
  cachedVersion = packageJson.version
  return cachedVersion
}

/**
 * Parses command-line arguments into CLI options.
 *
 * Supports: --host, --port, --no-open, --version, --help
 *
 * @param args - Command-line arguments (typically process.argv.slice(2))
 * @returns Parsed CLI options
 * @throws Error for unknown arguments or missing values
 */
export async function parseArgs(args: string[]): Promise<CliOptions> {
  const options: CliOptions = {
    host: '127.0.0.1',
    openBrowser: true,
  }

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]

    if (arg === '--help' || arg === '-h') {
      console.log(HELP_TEXT)
      process.exit(0)
    }

    if (arg === '--version' || arg === '-v') {
      const version = await getVersion()
      console.log(version)
      process.exit(0)
    }

    if (arg === '--no-open') {
      options.openBrowser = false
      continue
    }

    if (arg === '--host') {
      const nextValue = args[index + 1]
      if (!nextValue) {
        throw new Error('Missing value for --host')
      }

      options.host = nextValue
      index += 1
      continue
    }

    if (arg === '--port') {
      const nextValue = args[index + 1]
      if (!nextValue) {
        throw new Error('Missing value for --port')
      }

      const parsed = Number.parseInt(nextValue, 10)
      if (Number.isNaN(parsed) || parsed < 0 || parsed > 65535) {
        throw new Error(`Invalid port: ${nextValue}`)
      }

      options.port = parsed
      index += 1
      continue
    }

    throw new Error(`Unknown argument: ${arg}`)
  }

  return options
}

/**
 * Main entry point for the CLI.
 *
 * Parses arguments, validates assets, starts the server, opens the browser,
 * and sets up shutdown handlers.
 */
async function main(): Promise<void> {
  const options = await parseArgs(process.argv.slice(2))
  await assertFreshPackagedAssets()
  const server = await startStaticServer({
    assetsDir,
    host: options.host,
    port: options.port,
  })

  console.log(`Markdown Studio is running at ${server.url}`)

  if (options.openBrowser) {
    try {
      await openBrowser(server.url)
    } catch (error) {
      console.warn(`Failed to open the browser automatically. Open ${server.url} manually.`, error)
    }
  }

  const shutdown = async () => {
    process.off('SIGINT', shutdown)
    process.off('SIGTERM', shutdown)
    await server.close()
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

/**
 * Checks if a path exists on the filesystem.
 *
 * @param targetPath - Path to check
 * @returns true if path exists, false otherwise
 */
async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await access(targetPath)
    return true
  } catch {
    return false
  }
}

if (import.meta.url === new URL(realpathSync.native(process.argv[1]), 'file://').href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
