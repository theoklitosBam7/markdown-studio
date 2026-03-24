import { createReadStream } from 'node:fs'
import { access, stat } from 'node:fs/promises'
import http from 'node:http'
import path from 'node:path'

/**
 * Represents a running HTTP server with metadata.
 */
export interface RunningServer {
  /** Function to close the server */
  close: () => Promise<void>
  /** Host address the server is bound to */
  host: string
  /** Port number the server is listening on */
  port: number
  /** The underlying Node.js HTTP server */
  server: http.Server
  /** Full URL to access the server */
  url: string
}

/**
 * Options for starting the static file server.
 */
export interface StartServerOptions {
  /** Directory containing static assets to serve */
  assetsDir: string
  /** Host to bind the server to */
  host: string
  /** Optional port to listen on (defaults to random available port) */
  port?: number
}

/**
 * MIME content types mapped by file extension.
 */
const CONTENT_TYPES = new Map<string, string>([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.map', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml; charset=utf-8'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.webmanifest', 'application/manifest+json; charset=utf-8'],
])

/**
 * Error thrown when a client sends an invalid request URL.
 */
export class BadRequestError extends Error {
  /** HTTP status code associated with the error. */
  statusCode = 400

  constructor(message: string) {
    super(message)
    this.name = 'BadRequestError'
  }
}

/**
 * Returns a public-facing host address.
 *
 * Converts 0.0.0.0 to 127.0.0.1 for display purposes.
 *
 * @param host - The bound host address
 * @returns A public-accessible host address
 */
export function getPublicHost(host: string): string {
  if (host === '0.0.0.0') {
    return '127.0.0.1'
  }

  if (host === '::' || host === '[::]') {
    return '::1'
  }

  return host
}

/**
 * Constructs a public URL from host and port.
 *
 * @param host - Host address
 * @param port - Port number
 * @returns Full HTTP URL
 */
export function getPublicUrl(host: string, port: number): string {
  const publicHost =
    host.includes(':') && !(host.startsWith('[') && host.endsWith(']')) ? `[${host}]` : host

  return `http://${publicHost}:${port}`
}

/**
 * Extracts and decodes the pathname from a request URL.
 *
 * @param requestUrl - The request URL string
 * @returns Decoded pathname
 */
export function getRequestPath(requestUrl: string | undefined): string {
  const url = new URL(requestUrl ?? '/', 'http://localhost')

  try {
    return decodeURIComponent(url.pathname)
  } catch {
    throw new BadRequestError('Invalid percent-encoding in request URL')
  }
}

/**
 * Resolves a request path to a filesystem path within the assets directory.
 *
 * Prevents directory traversal attacks by ensuring the resolved path
 * is within the assets directory. Falls back to index.html for paths
 * without extensions.
 *
 * @param assetsDir - Root directory for static assets
 * @param requestPath - Request pathname
 * @returns Resolved filesystem path
 */
export function resolveAssetPath(assetsDir: string, requestPath: string): string {
  const normalizedPath = path.posix.normalize(requestPath)
  const relativePath = normalizedPath.replace(/^\/+/, '')
  const candidate = path.resolve(assetsDir, relativePath)
  const relativeToAssets = path.relative(assetsDir, candidate)

  if (relativeToAssets.startsWith('..') || path.isAbsolute(relativeToAssets)) {
    return path.join(assetsDir, 'index.html')
  }

  return relativePath === '' ? path.join(assetsDir, 'index.html') : candidate
}

/**
 * Resolves a request to a file target with appropriate headers and status.
 *
 * Handles 404s, sets proper cache headers based on file type, and determines
 * the appropriate content type.
 *
 * @param assetsDir - Root directory for static assets
 * @param requestUrl - The request URL string
 * @returns Resolution result with file path, headers, and status code
 */
export async function resolveRequestTarget(
  assetsDir: string,
  requestUrl: string | undefined,
): Promise<{
  filePath: null | string
  headers: Record<string, string>
  statusCode: 200 | 404
}> {
  const requestPath = getRequestPath(requestUrl)
  const resolvedPath = resolveAssetPath(assetsDir, requestPath)
  const fallbackPath = path.join(assetsDir, 'index.html')

  const filePath = (await fileExists(resolvedPath))
    ? resolvedPath
    : shouldServeAppShell(requestPath)
      ? fallbackPath
      : null

  if (!filePath) {
    return {
      filePath: null,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      statusCode: 404,
    }
  }

  return {
    filePath,
    headers: {
      'Cache-Control': filePath.endsWith('.html')
        ? 'no-cache'
        : requestPath.startsWith('/assets/')
          ? 'public, max-age=31536000, immutable'
          : 'public, max-age=3600',
      'Content-Type': CONTENT_TYPES.get(path.extname(filePath)) ?? 'application/octet-stream',
    },
    statusCode: 200,
  }
}

/**
 * Determines if a request should serve the app shell (index.html).
 *
 * Requests without file extensions are considered app shell requests.
 *
 * @param requestPath - Request pathname
 * @returns true if the request should serve index.html
 */
export function shouldServeAppShell(requestPath: string): boolean {
  return path.posix.extname(requestPath) === ''
}

/**
 * Starts a static file server for the Markdown Studio app.
 *
 * Serves files from the assets directory with appropriate caching headers.
 * Automatically finds an available port if none is specified.
 *
 * @param options - Server configuration options
 * @returns Running server instance with close method and metadata
 */
export async function startStaticServer(options: StartServerOptions): Promise<RunningServer> {
  const server = http.createServer(async (request, response) => {
    try {
      await handleRequest(options.assetsDir, request, response)
    } catch (error) {
      if (error instanceof BadRequestError) {
        response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' })
        response.end('Bad Request')
        return
      }

      response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
      response.end('Internal Server Error')
    }
  })

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(options.port ?? 0, options.host, () => {
      server.off('error', reject)
      resolve()
    })
  })

  const address = server.address()
  if (!address || typeof address === 'string') {
    throw new Error('Failed to determine the listening address.')
  }

  const externalHost = getPublicHost(options.host)

  return {
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error)
            return
          }

          resolve()
        })
      }),
    host: address.address,
    port: address.port,
    server,
    url: getPublicUrl(externalHost, address.port),
  }
}

/**
 * Checks if a file exists on the filesystem.
 *
 * @param filePath - Path to check
 * @returns true if file exists, false otherwise
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

/**
 * Handles an incoming HTTP request.
 *
 * Resolves the requested file, streams it to the response, or returns
 * a 404 if not found.
 *
 * @param assetsDir - Root directory for static assets
 * @param request - Incoming HTTP request
 * @param response - HTTP server response
 */
async function handleRequest(
  assetsDir: string,
  request: http.IncomingMessage,
  response: http.ServerResponse,
): Promise<void> {
  const resolution = await resolveRequestTarget(assetsDir, request.url)

  if (resolution.statusCode === 404 || !resolution.filePath) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    response.end('Not Found')
    return
  }

  const assetPath = resolution.filePath
  const assetStat = await stat(assetPath)
  if (!assetStat.isFile()) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    response.end('Not Found')
    return
  }

  response.writeHead(resolution.statusCode, resolution.headers)

  await new Promise<void>((resolve, reject) => {
    const stream = createReadStream(assetPath)
    stream.on('error', reject)
    stream.on('end', resolve)
    stream.pipe(response)
  })
}
