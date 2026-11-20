import type { ActiveDocumentKind } from '@/types/document'

const HTML_EXTENSIONS = new Set(['.htm', '.html'])

export function resolveDocumentKind(nameOrPath: string): ActiveDocumentKind {
  const separatorIndex = nameOrPath.lastIndexOf('.')
  if (separatorIndex === -1) return 'markdown'

  const extension = nameOrPath.slice(separatorIndex).toLowerCase()
  return HTML_EXTENSIONS.has(extension) ? 'html' : 'markdown'
}
