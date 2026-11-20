import type { DesktopHtmlPreviewAssetGrantResult } from '@markdown-studio/desktop-contract/types'

import { assertHtmlPreviewGrantId } from '@markdown-studio/desktop-contract/validation'
import { randomBytes } from 'node:crypto'
import { readFile, realpath, stat } from 'node:fs/promises'
import { dirname, extname, isAbsolute, relative, resolve } from 'node:path'

const PREVIEW_PROTOCOL = 'markdown-studio-preview:'
const CONTENT_TYPES: Record<string, string> = {
  '.avif': 'image/avif',
  '.bmp': 'image/bmp',
  '.css': 'text/css',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.m4a': 'audio/mp4',
  '.map': 'application/json',
  '.mjs': 'text/javascript',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.oga': 'audio/ogg',
  '.ogg': 'audio/ogg',
  '.ogv': 'video/ogg',
  '.otf': 'font/otf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.wav': 'audio/wav',
  '.webm': 'video/webm',
  '.webmanifest': 'application/manifest+json',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

export interface HtmlPreviewAssetGrants {
  create: (documentPath: string) => Promise<DesktopHtmlPreviewAssetGrantResult>
  handleRequest: (request: Request) => Promise<Response>
  release: (grantId: string) => void
}

export function createHtmlPreviewAssetGrants(): HtmlPreviewAssetGrants {
  const grantRoots = new Map<string, string>()

  return {
    async create(documentPath) {
      const realDocumentPath = await realpath(documentPath)
      const root = await realpath(dirname(realDocumentPath))
      const grantId = randomBytes(16).toString('hex')

      grantRoots.set(grantId, root)

      return {
        assetBaseUrl: `${PREVIEW_PROTOCOL}//local/${grantId}/`,
        grantId,
      }
    },

    async handleRequest(request) {
      let url: URL
      try {
        url = new URL(request.url)
      } catch {
        return new Response('Invalid asset request.', { status: 400 })
      }

      if (url.protocol !== PREVIEW_PROTOCOL || url.hostname !== 'local') {
        return new Response('Invalid asset request.', { status: 400 })
      }

      const segments = url.pathname.split('/').filter(Boolean)
      let grantId: string
      try {
        grantId = assertHtmlPreviewGrantId(segments[0])
      } catch {
        return new Response('Invalid asset request.', { status: 400 })
      }

      const root = grantRoots.get(grantId)
      if (!root) return new Response('Asset grant is not active.', { status: 404 })

      let relativeAssetPath: string
      try {
        relativeAssetPath = decodeURIComponent(segments.slice(1).join('/'))
      } catch {
        return new Response('Invalid asset request.', { status: 400 })
      }

      if (!relativeAssetPath || isUnsafeRelativePath(relativeAssetPath)) {
        return new Response('Asset path is outside the grant root.', { status: 403 })
      }

      const requestedRoot = resolve(root)
      const requestedPath = resolve(requestedRoot, relativeAssetPath)
      if (!isInside(requestedRoot, requestedPath)) {
        return new Response('Asset path is outside the grant root.', { status: 403 })
      }

      try {
        const realRoot = await realpath(requestedRoot)
        const realRequestedPath = await realpath(requestedPath)
        if (!isInside(realRoot, realRequestedPath)) {
          return new Response('Asset path is outside the grant root.', { status: 403 })
        }

        const stats = await stat(realRequestedPath)
        if (!stats.isFile()) {
          return new Response('Asset not found.', { status: 404 })
        }

        const contentType = CONTENT_TYPES[extname(realRequestedPath).toLowerCase()]
        if (!contentType) {
          return new Response('Unsupported asset type.', { status: 415 })
        }

        return new Response(await readFile(realRequestedPath), {
          headers: {
            'cache-control': 'no-store',
            'content-type': contentType,
          },
        })
      } catch {
        return new Response('Asset not found.', { status: 404 })
      }
    },

    release(grantId) {
      grantRoots.delete(assertHtmlPreviewGrantId(grantId))
    },
  }
}

function isInside(root: string, requestedPath: string): boolean {
  const pathFromRoot = relative(root, requestedPath)

  return Boolean(pathFromRoot) && !pathFromRoot.startsWith('..') && !isAbsolute(pathFromRoot)
}

function isUnsafeRelativePath(value: string): boolean {
  return isAbsolute(value) || value.split(/[\\/]/).includes('..')
}
