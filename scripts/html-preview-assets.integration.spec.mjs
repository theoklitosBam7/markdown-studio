import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vite-plus/test'

const require = createRequire(import.meta.url)
const { JSDOM } = require('../packages/app/node_modules/jsdom')

globalThis.DOMParser ??= new JSDOM().window.DOMParser

const { prepareHtmlPreview } =
  await import('../packages/app/src/features/html-preview/utils/prepareHtmlPreview.ts')
const { createHtmlPreviewAssetGrants } =
  await import('../apps/desktop/electron/html-asset-protocol.ts')

const temporaryDirectories = []

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  )
})

describe('desktop HTML preview sibling assets', () => {
  it('renders a generated page with sibling assets through a single grant', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'markdown-studio-preview-integration-'))
    temporaryDirectories.push(directory)

    const htmlPath = join(directory, 'report.html')
    await writeFile(
      htmlPath,
      `<!doctype html>
<html>
  <head><link rel="stylesheet" href="./site.css"></head>
  <body><img src="logo.png" alt="Logo"></body>
</html>`,
    )
    await writeFile(join(directory, 'site.css'), 'body { color: rebeccapurple; }')
    await writeFile(join(directory, 'logo.png'), 'png-bytes')

    const grants = createHtmlPreviewAssetGrants()
    const grant = await grants.create(htmlPath)
    const preview = prepareHtmlPreview({
      allowScripts: false,
      assetBaseUrl: grant.assetBaseUrl,
      content: await readFile(htmlPath, 'utf8'),
    })
    const documentNode = new DOMParser().parseFromString(preview.srcdoc, 'text/html')
    const stylesheetUrl = documentNode.querySelector('link[rel="stylesheet"]')?.getAttribute('href')
    const imageUrl = documentNode.querySelector('img')?.getAttribute('src')

    expect(preview.sandbox).toBe('')
    expect(stylesheetUrl).toContain(grant.grantId)
    expect(imageUrl).toContain(grant.grantId)

    const stylesheet = await grants.handleRequest(new Request(stylesheetUrl))
    const image = await grants.handleRequest(new Request(imageUrl))

    expect(await stylesheet.text()).toBe('body { color: rebeccapurple; }')
    expect(await image.text()).toBe('png-bytes')
  })
})
