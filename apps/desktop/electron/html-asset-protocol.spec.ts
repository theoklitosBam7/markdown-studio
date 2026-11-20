import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vite-plus/test'

import { createHtmlPreviewAssetGrants } from './html-asset-protocol'

const temporaryDirectories: string[] = []

function assetRequest(assetBaseUrl: string, relativePath: string): Request {
  const url = new URL(assetBaseUrl)
  url.pathname = `${url.pathname}${relativePath}`
  return new Request(url)
}

async function createTemporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'markdown-studio-preview-'))
  temporaryDirectories.push(directory)
  return directory
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  )
})

describe('HTML preview asset protocol', () => {
  it('serves a sibling CSS file with the granted content type and no-store', async () => {
    const directory = await createTemporaryDirectory()
    await writeFile(join(directory, 'index.html'), '<html></html>')
    await writeFile(join(directory, 'site.css'), 'body { color: rebeccapurple; }')
    const grants = createHtmlPreviewAssetGrants()
    const grant = await grants.create(join(directory, 'index.html'))

    const response = await grants.handleRequest(assetRequest(grant.assetBaseUrl, 'site.css'))

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('text/css')
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(await response.text()).toBe('body { color: rebeccapurple; }')
  })

  it('serves sibling images, scripts, fonts, media, and JSON', async () => {
    const directory = await createTemporaryDirectory()
    await writeFile(join(directory, 'index.html'), '<html></html>')
    const cases = [
      { extension: 'png', name: 'icon.png', type: 'image/png' },
      { extension: 'js', name: 'app.js', type: 'text/javascript' },
      { extension: 'woff2', name: 'font.woff2', type: 'font/woff2' },
      { extension: 'mp4', name: 'clip.mp4', type: 'video/mp4' },
      { extension: 'json', name: 'data.json', type: 'application/json' },
    ]

    for (const asset of cases) {
      await writeFile(join(directory, asset.name), `asset:${asset.extension}`)
    }

    const grants = createHtmlPreviewAssetGrants()
    const grant = await grants.create(join(directory, 'index.html'))
    const contentTypes: string[] = []

    for (const asset of cases) {
      const response = await grants.handleRequest(assetRequest(grant.assetBaseUrl, asset.name))
      contentTypes.push(response.headers.get('content-type') ?? '')
    }

    expect(contentTypes).toEqual(cases.map((asset) => asset.type))
  })

  it('rejects a path that climbs out of the grant root', async () => {
    const parent = await createTemporaryDirectory()
    const root = join(parent, 'report')
    await mkdir(root)
    await writeFile(join(root, 'index.html'), '<html></html>')
    await writeFile(join(parent, 'outside.css'), 'body { color: red; }')
    const grants = createHtmlPreviewAssetGrants()
    const grant = await grants.create(join(root, 'index.html'))

    const response = await grants.handleRequest(
      assetRequest(grant.assetBaseUrl, '..%2Foutside.css'),
    )

    expect(response.status).toBe(403)
  })

  it('rejects a symlink that escapes the grant root', async () => {
    const parent = await createTemporaryDirectory()
    const root = join(parent, 'report')
    await mkdir(root)
    await writeFile(join(root, 'index.html'), '<html></html>')
    await writeFile(join(parent, 'outside.css'), 'body { color: red; }')
    await symlink(join(parent, 'outside.css'), join(root, 'linked.css'))
    const grants = createHtmlPreviewAssetGrants()
    const grant = await grants.create(join(root, 'index.html'))

    const response = await grants.handleRequest(assetRequest(grant.assetBaseUrl, 'linked.css'))

    expect(response.status).toBe(403)
  })

  it('rejects an unsupported file type', async () => {
    const directory = await createTemporaryDirectory()
    await writeFile(join(directory, 'index.html'), '<html></html>')
    await writeFile(join(directory, 'notes.txt'), 'private')
    const grants = createHtmlPreviewAssetGrants()
    const grant = await grants.create(join(directory, 'index.html'))

    const response = await grants.handleRequest(assetRequest(grant.assetBaseUrl, 'notes.txt'))

    expect(response.status).toBe(415)
  })

  it('rejects a request with no active grant', async () => {
    const grants = createHtmlPreviewAssetGrants()
    const url = new URL('markdown-studio-preview://local/0123456789abcdef0123456789abcdef/site.css')

    const response = await grants.handleRequest(new Request(url))

    expect(response.status).toBe(404)
  })

  it('treats a released grant as expired', async () => {
    const directory = await createTemporaryDirectory()
    await writeFile(join(directory, 'index.html'), '<html></html>')
    await writeFile(join(directory, 'site.css'), 'body {}')
    const grants = createHtmlPreviewAssetGrants()
    const grant = await grants.create(join(directory, 'index.html'))
    grants.release(grant.grantId)

    const response = await grants.handleRequest(assetRequest(grant.assetBaseUrl, 'site.css'))

    expect(response.status).toBe(404)
  })
})
