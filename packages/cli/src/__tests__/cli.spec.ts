// @vitest-environment node

import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'

import { assertFreshPackagedAssets, getVersion, parseArgs } from '../cli'

describe('parseArgs', () => {
  it('uses localhost defaults', async () => {
    expect(await parseArgs([])).toEqual({
      host: '127.0.0.1',
      openBrowser: true,
    })
  })

  it('parses host, port, and no-open flags', async () => {
    expect(await parseArgs(['--host', '0.0.0.0', '--port', '4173', '--no-open'])).toEqual({
      host: '0.0.0.0',
      openBrowser: false,
      port: 4173,
    })
  })

  it('rejects invalid ports', async () => {
    await expect(() => parseArgs(['--port', '70000'])).rejects.toThrow('Invalid port: 70000')
  })

  it('exits with version when --version flag is provided', async () => {
    const versionSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit')
    })

    try {
      await expect(() => parseArgs(['--version'])).rejects.toThrow('process.exit')

      const version = await getVersion()
      expect(versionSpy).toHaveBeenCalledWith(version)
    } finally {
      versionSpy.mockRestore()
      exitSpy.mockRestore()
    }
  })

  it('exits with version when -v flag is provided', async () => {
    const versionSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit')
    })

    try {
      await expect(() => parseArgs(['-v'])).rejects.toThrow('process.exit')

      const version = await getVersion()
      expect(versionSpy).toHaveBeenCalledWith(version)
    } finally {
      versionSpy.mockRestore()
      exitSpy.mockRestore()
    }
  })

  it('returns the package version from getVersion', async () => {
    const version = await getVersion()
    expect(version).toBeDefined()
    expect(typeof version).toBe('string')
    // Version should follow semver format (e.g., "0.1.3")
    expect(version).toMatch(/^\d+\.\d+\.\d+/)
  })
})

describe('assertFreshPackagedAssets', () => {
  it('passes for the current staged build', async () => {
    await expect(assertFreshPackagedAssets()).resolves.toBeUndefined()
  })

  it('detects stale packaged assets relative to the source build', async () => {
    const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'markdown-studio-cli-'))
    const sourceDir = path.join(tempRoot, 'dist')
    const packagedDir = path.join(tempRoot, 'packages/cli/public')

    try {
      await mkdir(sourceDir, { recursive: true })
      await mkdir(packagedDir, { recursive: true })

      await Promise.all([
        writeFile(path.join(sourceDir, 'index.html'), '<html>source</html>', 'utf8'),
        writeFile(path.join(packagedDir, 'index.html'), '<html>packaged</html>', 'utf8'),
      ])

      await expect(
        assertFreshPackagedAssets({
          assetsDir: packagedDir,
          sourceBuildDir: sourceDir,
        }),
      ).rejects.toThrow('Packaged web assets are stale')
    } finally {
      await rm(tempRoot, { force: true, recursive: true })
    }
  })
})
