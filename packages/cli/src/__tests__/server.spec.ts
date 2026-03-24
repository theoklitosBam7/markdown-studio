// @vitest-environment node

import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

import {
  BadRequestError,
  getPublicHost,
  getPublicUrl,
  getRequestPath,
  resolveRequestTarget,
} from '../server'

const tempDirs: string[] = []

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { force: true, recursive: true })))
})

describe('resolveRequestTarget', () => {
  it('serves the app shell and static assets', async () => {
    const assetsDir = await createFixture()
    const [html, css] = await Promise.all([
      resolveRequestTarget(assetsDir, '/'),
      resolveRequestTarget(assetsDir, '/assets/index.css'),
    ])

    expect(html.filePath).toBe(path.join(assetsDir, 'index.html'))
    expect(html.headers['Content-Type']).toBe('text/html; charset=utf-8')
    expect(css.filePath).toBe(path.join(assetsDir, 'assets/index.css'))
    expect(css.headers['Cache-Control']).toBe('public, max-age=31536000, immutable')
  })

  it('falls back to index.html for app routes and returns 404 for missing assets', async () => {
    const assetsDir = await createFixture()
    const [routeResponse, missingAsset] = await Promise.all([
      resolveRequestTarget(assetsDir, '/documents/demo'),
      resolveRequestTarget(assetsDir, '/assets/missing.js'),
    ])

    expect(routeResponse.filePath).toBe(path.join(assetsDir, 'index.html'))
    expect(missingAsset.statusCode).toBe(404)
  })

  it('maps wildcard hosts to a browser-safe URL', () => {
    expect(getPublicHost('0.0.0.0')).toBe('127.0.0.1')
    expect(getPublicHost('::')).toBe('::1')
    expect(getPublicHost('[::]')).toBe('::1')
    expect(getPublicUrl('127.0.0.1', 43219)).toBe('http://127.0.0.1:43219')
    expect(getPublicUrl('::1', 43219)).toBe('http://[::1]:43219')
    expect(getPublicUrl('fe80::1%en0', 43219)).toBe('http://[fe80::1%en0]:43219')
  })

  it('rejects malformed percent-encoding with a bad request error', () => {
    expect(() => getRequestPath('/%')).toThrow(BadRequestError)
    expect(() => getRequestPath('/%')).toThrow('Invalid percent-encoding in request URL')
  })
})

async function createFixture(): Promise<string> {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'markdown-studio-cli-'))
  tempDirs.push(tempDir)

  await mkdir(path.join(tempDir, 'assets'), { recursive: true })
  await Promise.all([
    writeFile(
      path.join(tempDir, 'index.html'),
      '<!doctype html><html><body><div id="app"></div></body></html>',
      'utf8',
    ),
    writeFile(path.join(tempDir, 'assets/index.css'), 'body { color: red; }', 'utf8'),
  ])

  return tempDir
}
