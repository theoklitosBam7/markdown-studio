import type {
  DesktopSaveImageInput,
  DesktopSaveImageResult,
} from '@markdown-studio/desktop-contract/types'

import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, extname, join } from 'node:path'

const SUPPORTED_IMAGE_EXTENSIONS = new Set(['.gif', '.jpeg', '.jpg', '.png', '.svg', '.webp'])

export async function saveImage(input: DesktopSaveImageInput): Promise<DesktopSaveImageResult> {
  const extension = extname(input.filename).toLowerCase()
  if (!SUPPORTED_IMAGE_EXTENSIONS.has(extension)) {
    throw new Error('Unsupported image format.')
  }

  const basename = sanitizeFilename(input.filename.slice(0, -extension.length))
  const assetsDirectory = join(dirname(input.documentPath), '.markdown-studio', 'assets')

  await mkdir(assetsDirectory, { recursive: true })

  for (let suffix = 0; ; suffix += 1) {
    const filename = `${basename}${suffix === 0 ? '' : `-${suffix}`}${extension}`

    try {
      await writeFile(join(assetsDirectory, filename), input.data, { flag: 'wx' })
      return {
        filename,
        relativePath: `./.markdown-studio/assets/${filename}`,
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
    }
  }
}

function sanitizeFilename(filename: string): string {
  return (
    filename
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'image'
  )
}
