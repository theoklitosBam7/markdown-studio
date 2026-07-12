import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

import { handleAssetRequest } from './asset-protocol'

const temporaryDirectories: string[] = []

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  )
})

describe('desktop asset protocol', () => {
  it('serves an image from the Markdown Document assets folder', async () => {
    const documentDirectory = await mkdtemp(join(tmpdir(), 'markdown-studio-assets-'))
    temporaryDirectories.push(documentDirectory)
    const assetsDirectory = join(documentDirectory, '.markdown-studio', 'assets')
    await mkdir(assetsDirectory, { recursive: true })
    await writeFile(join(assetsDirectory, 'diagram.png'), new Uint8Array([137, 80, 78, 71]))
    const url = new URL('markdown-studio-asset://local/')
    url.searchParams.set('documentPath', join(documentDirectory, 'notes.md'))
    url.searchParams.set('relativePath', './.markdown-studio/assets/diagram.png')

    const response = await handleAssetRequest(new Request(url))

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('image/png')
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([137, 80, 78, 71]))
  })
})
