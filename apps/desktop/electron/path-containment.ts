import { isAbsolute, relative } from 'node:path'

export function isPathInside(root: string, requestedPath: string): boolean {
  const pathFromRoot = relative(root, requestedPath)

  return Boolean(pathFromRoot) && !pathFromRoot.startsWith('..') && !isAbsolute(pathFromRoot)
}
