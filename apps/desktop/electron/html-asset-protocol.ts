import type { DesktopHtmlPreviewAssetGrantResult } from '@markdown-studio/desktop-contract/types'

import { HTML_PREVIEW_ASSET_PROTOCOL } from '@markdown-studio/desktop-contract/constants'
import { assertHtmlPreviewGrantId } from '@markdown-studio/desktop-contract/validation'
import { randomBytes } from 'node:crypto'
import { readFile, realpath, stat } from 'node:fs/promises'
import { dirname, extname, resolve } from 'node:path'

import { isPathInside } from './path-containment'

const PREVIEW_PROTOCOL = `${HTML_PREVIEW_ASSET_PROTOCOL}:`
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

interface ParsedAssetRequest {
  grantId: string
  relativeAssetPath: string
}

type ResolvedAssetPath = { ok: false; reason: 'missing' | 'outside' } | { ok: true; path: string }

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

      const parsed = parseAssetRequest(url)
      if (!parsed) return new Response('Invalid asset request.', { status: 400 })

      const root = grantRoots.get(parsed.grantId)
      if (!root) return new Response('Asset grant is not active.', { status: 404 })

      const resolved = await resolveAssetPath(root, parsed.relativeAssetPath)
      if (!resolved.ok) {
        return new Response(
          resolved.reason === 'outside'
            ? 'Asset path is outside the grant root.'
            : 'Asset not found.',
          { status: resolved.reason === 'outside' ? 403 : 404 },
        )
      }

      const contentType = getContentType(resolved.path)
      if (!contentType) return new Response('Unsupported asset type.', { status: 415 })

      try {
        return new Response(await readFile(resolved.path), {
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

function getContentType(filePath: string): string | undefined {
  return CONTENT_TYPES[extname(filePath).toLowerCase()]
}

function parseAssetRequest(url: URL): null | ParsedAssetRequest {
  if (url.protocol !== PREVIEW_PROTOCOL || url.hostname !== 'local') return null

  const segments = url.pathname.split('/').filter(Boolean)
  let grantId: string
  let relativeAssetPath: string

  try {
    grantId = assertHtmlPreviewGrantId(segments[0])
    relativeAssetPath = decodeURIComponent(segments.slice(1).join('/'))
  } catch {
    return null
  }

  if (!relativeAssetPath) return null

  return { grantId, relativeAssetPath }
}

async function resolveAssetPath(
  root: string,
  relativeAssetPath: string,
): Promise<ResolvedAssetPath> {
  const requestedRoot = resolve(root)
  const requestedPath = resolve(requestedRoot, relativeAssetPath)

  if (!isPathInside(requestedRoot, requestedPath)) return { ok: false, reason: 'outside' }

  try {
    const realRoot = await realpath(requestedRoot)
    const realRequestedPath = await realpath(requestedPath)

    if (!isPathInside(realRoot, realRequestedPath)) return { ok: false, reason: 'outside' }

    const stats = await stat(realRequestedPath)
    return stats.isFile() ? { ok: true, path: realRequestedPath } : { ok: false, reason: 'missing' }
  } catch {
    return { ok: false, reason: 'missing' }
  }
}
