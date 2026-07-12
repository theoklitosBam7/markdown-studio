import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

import { saveImage } from './images'

const temporaryDirectories: string[] = []

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  )
})

describe('saveImage', () => {
  it('saves an image in the Markdown Document assets folder', async () => {
    const documentDirectory = await mkdtemp(join(tmpdir(), 'markdown-studio-images-'))
    temporaryDirectories.push(documentDirectory)
    const imageData = new Uint8Array([137, 80, 78, 71])

    const result = await saveImage({
      data: imageData,
      documentPath: join(documentDirectory, 'notes.md'),
      filename: 'Diagram.png',
    })

    expect(result).toEqual({
      filename: 'diagram.png',
      relativePath: './.markdown-studio/assets/diagram.png',
    })
    await expect(
      readFile(join(documentDirectory, '.markdown-studio', 'assets', 'diagram.png')),
    ).resolves.toEqual(Buffer.from(imageData))
  })

  it('chooses a unique filename without replacing an existing image', async () => {
    const documentDirectory = await mkdtemp(join(tmpdir(), 'markdown-studio-images-'))
    temporaryDirectories.push(documentDirectory)
    const input = {
      data: new Uint8Array([1]),
      documentPath: join(documentDirectory, 'notes.md'),
      filename: 'Diagram.png',
    }

    await saveImage(input)
    const result = await saveImage({ ...input, data: new Uint8Array([2]) })

    expect(result).toEqual({
      filename: 'diagram-1.png',
      relativePath: './.markdown-studio/assets/diagram-1.png',
    })
    await expect(
      readFile(join(documentDirectory, '.markdown-studio', 'assets', 'diagram.png')),
    ).resolves.toEqual(Buffer.from([1]))
    await expect(
      readFile(join(documentDirectory, '.markdown-studio', 'assets', 'diagram-1.png')),
    ).resolves.toEqual(Buffer.from([2]))
  })
})
