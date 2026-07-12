import { readFile, realpath } from 'node:fs/promises'
import { dirname, extname, isAbsolute, relative, resolve } from 'node:path'

const CONTENT_TYPES: Record<string, string> = {
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
}

export async function handleAssetRequest(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url)
    const documentPath = url.searchParams.get('documentPath')
    const relativePath = url.searchParams.get('relativePath')

    if (
      url.protocol !== 'markdown-studio-asset:' ||
      !documentPath ||
      !relativePath?.startsWith('./.markdown-studio/assets/')
    ) {
      return new Response('Invalid asset request.', { status: 400 })
    }

    const assetsDirectory = resolve(dirname(documentPath), '.markdown-studio', 'assets')
    const requestedPath = resolve(dirname(documentPath), relativePath)
    const pathFromAssets = relative(assetsDirectory, requestedPath)

    if (!pathFromAssets || pathFromAssets.startsWith('..') || isAbsolute(pathFromAssets)) {
      return new Response('Asset path is outside the managed assets folder.', { status: 403 })
    }

    const extension = extname(requestedPath).toLowerCase()
    const contentType = CONTENT_TYPES[extension]
    if (!contentType) return new Response('Unsupported image format.', { status: 415 })

    const [realAssetsDirectory, realRequestedPath] = await Promise.all([
      realpath(assetsDirectory),
      realpath(requestedPath),
    ])
    const realPathFromAssets = relative(realAssetsDirectory, realRequestedPath)

    if (realPathFromAssets.startsWith('..') || isAbsolute(realPathFromAssets)) {
      return new Response('Asset path is outside the managed assets folder.', { status: 403 })
    }

    return new Response(await readFile(realRequestedPath), {
      headers: { 'content-type': contentType },
    })
  } catch {
    return new Response('Asset not found.', { status: 404 })
  }
}
