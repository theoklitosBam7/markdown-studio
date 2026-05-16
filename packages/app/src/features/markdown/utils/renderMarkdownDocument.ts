import {
  buildExportHtml,
  getDefaultTitle,
  getSuggestedFileName,
  renderExport,
} from '../rendered-document'

export interface BuildMarkdownDocumentHtmlOptions {
  bodyHtml: string
  title: string
}

export interface MarkdownDocumentRenderResult {
  bodyHtml: string
  title: string
}

interface RenderMarkdownDocumentOptions {
  content: string
  title: string
}

export function buildMarkdownDocumentHtml(options: BuildMarkdownDocumentHtmlOptions): string {
  return buildExportHtml(options)
}

export function getDefaultExportTitle(input: null | string | undefined): string {
  return getDefaultTitle(input)
}

export function getSuggestedExportFileName(
  input: null | string | undefined,
  extension: 'html' | 'pdf',
): string {
  return getSuggestedFileName(input, extension)
}

export async function renderMarkdownDocument(
  options: RenderMarkdownDocumentOptions,
): Promise<MarkdownDocumentRenderResult> {
  return renderExport(options)
}
