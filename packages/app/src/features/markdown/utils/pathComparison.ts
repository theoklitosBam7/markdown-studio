export function pathsEqual(firstPath: string, secondPath: string): boolean {
  return normalizePath(firstPath) === normalizePath(secondPath)
}

export function toRelativePath(rootPath: string, candidatePath: string): null | string {
  const normalizedRoot = normalizePath(rootPath).replace(/\/+$/, '')
  const normalizedCandidate = normalizePath(candidatePath)
  const rootPrefix = `${normalizedRoot}/`

  if (!normalizedCandidate.startsWith(rootPrefix)) return null

  return normalizedCandidate.slice(rootPrefix.length)
}

function isWindowsPath(path: string): boolean {
  return /^[a-z]:[\\/]/i.test(path) || path.startsWith('\\\\') || path.startsWith('//')
}

function normalizePath(path: string): string {
  const normalizedPath = path.replaceAll('\\', '/')
  if (!isWindowsPath(path)) return normalizedPath

  return normalizedPath.toLowerCase()
}
