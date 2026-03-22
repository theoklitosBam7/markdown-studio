import type { DesktopSaveAsInput, DesktopSaveInput } from './types'

export function assertExternalUrl(value: string): string {
  const url = new URL(value)

  if (!['http:', 'https:', 'mailto:'].includes(url.protocol)) {
    throw new Error(`Unsupported external URL protocol: ${url.protocol}`)
  }

  return url.toString()
}

export function assertSaveAsInput(value: DesktopSaveAsInput): DesktopSaveAsInput {
  return {
    content: assertTextContent(value.content),
    suggestedPath:
      value.suggestedPath === undefined || value.suggestedPath === null
        ? null
        : assertNonEmptyPath(value.suggestedPath),
  }
}

export function assertSaveInput(value: DesktopSaveInput): DesktopSaveInput {
  return {
    content: assertTextContent(value.content),
    path: value.path === null ? null : assertNonEmptyPath(value.path),
  }
}

export function getDefaultMarkdownPath(inputPath?: null | string): string {
  if (!inputPath) {
    return 'Untitled.md'
  }

  return inputPath.toLowerCase().endsWith('.md') ? inputPath : `${inputPath}.md`
}

function assertNonEmptyPath(value: string): string {
  const normalized = value.trim()

  if (!normalized) {
    throw new Error('A non-empty file path is required.')
  }

  return normalized
}

function assertTextContent(value: string): string {
  if (typeof value !== 'string') {
    throw new TypeError('Markdown content must be a string.')
  }

  return value
}
