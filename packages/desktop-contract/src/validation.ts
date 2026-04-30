import type {
  DesktopExportInput,
  DesktopSaveAsInput,
  DesktopSaveInput,
  DesktopWorkspaceDraft,
  DesktopWorkspaceDraftInput,
} from './types'

export function assertExportInput(value: unknown): DesktopExportInput {
  assertObject(value, 'Export payload must be an object.')
  const input = value as Record<string, unknown>

  return {
    documentHtml: assertTextContent(input.documentHtml),
    documentTitle:
      input.documentTitle === undefined || input.documentTitle === null
        ? null
        : assertTextContent(input.documentTitle).trim() || null,
    suggestedPath:
      input.suggestedPath === undefined || input.suggestedPath === null
        ? null
        : assertNonEmptyPath(input.suggestedPath),
  }
}

export function assertExternalUrl(value: string): string {
  const url = new URL(value)

  if (!['http:', 'https:', 'mailto:'].includes(url.protocol)) {
    throw new Error(`Unsupported external URL protocol: ${url.protocol}`)
  }

  return url.toString()
}

export function assertSaveAsInput(value: unknown): DesktopSaveAsInput {
  assertObject(value, 'Save-as payload must be an object.')
  const input = value as Record<string, unknown>

  return {
    content: assertTextContent(input.content),
    suggestedPath:
      input.suggestedPath === undefined || input.suggestedPath === null
        ? null
        : assertNonEmptyPath(input.suggestedPath),
  }
}

export function assertSaveInput(value: unknown): DesktopSaveInput {
  assertObject(value, 'Save payload must be an object.')
  const input = value as Record<string, unknown>

  return {
    content: assertTextContent(input.content),
    path: input.path === null ? null : assertNonEmptyPath(input.path),
  }
}

export function assertWorkspaceDraft(value: unknown): DesktopWorkspaceDraft {
  assertObject(value, 'Workspace draft must be an object.')
  const draft = value as Record<string, unknown>

  if (draft.version !== 1) {
    throw new Error('Unsupported workspace draft version.')
  }

  return {
    activeDocument: assertWorkspaceDraftDocument(draft.activeDocument),
    updatedAt: assertIsoDateString(draft.updatedAt),
    version: 1,
  }
}

export function assertWorkspaceDraftInput(value: unknown): DesktopWorkspaceDraftInput {
  assertObject(value, 'Workspace draft payload must be an object.')
  const input = value as Record<string, unknown>

  return {
    activeDocument: assertWorkspaceDraftDocument(input.activeDocument),
  }
}

export function getDefaultExportPath(extension: 'html' | 'pdf', inputPath?: null | string): string {
  const normalizedExtension = `.${extension}`

  if (!inputPath) {
    return `Untitled${normalizedExtension}`
  }

  const withoutExtension = inputPath.replace(/\.[^./\\]+$/, '')
  return `${withoutExtension}${normalizedExtension}`
}

export function getDefaultMarkdownPath(inputPath?: null | string): string {
  if (!inputPath) {
    return 'Untitled.md'
  }

  return inputPath.toLowerCase().endsWith('.md') ? inputPath : `${inputPath}.md`
}

function assertIsoDateString(value: unknown): string {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    throw new TypeError('Workspace draft timestamp must be an ISO date string.')
  }

  return value
}

function assertNonEmptyPath(value: unknown): string {
  if (typeof value !== 'string') {
    throw new TypeError('A non-empty file path is required.')
  }

  const normalized = value.trim()

  if (!normalized) {
    throw new Error('A non-empty file path is required.')
  }

  return normalized
}

function assertObject(value: unknown, message: string): asserts value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    throw new TypeError(message)
  }
}

function assertTextContent(value: unknown): string {
  if (typeof value !== 'string') {
    throw new TypeError('Markdown content must be a string.')
  }

  return value
}

function assertWorkspaceDraftDocument(value: unknown): DesktopWorkspaceDraft['activeDocument'] {
  assertObject(value, 'Workspace draft document must be an object.')
  const document = value as Record<string, unknown>

  return {
    content: assertTextContent(document.content),
    label: assertTextContent(document.label).trim() || 'Untitled.md',
    path: document.path === null ? null : assertNonEmptyPath(document.path),
    savedContent: assertTextContent(document.savedContent),
  }
}
