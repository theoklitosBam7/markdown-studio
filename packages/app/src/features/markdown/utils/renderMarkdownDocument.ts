import DOMPurify from 'dompurify'
import mermaid from 'mermaid'

import { escapeHtml } from '@/utils/escapeHtml'

import { renderMarkdownWithSourceMap } from '../composables/renderMarkdownWithSourceMap'
import markdownDocumentCss from '../styles/markdown-document.css?raw'

export interface MarkdownDocumentRenderResult {
  bodyHtml: string
  title: string
}

interface BuildMarkdownDocumentHtmlOptions {
  bodyHtml: string
  title: string
}

interface RenderMarkdownDocumentOptions {
  content: string
  title: string
}

export function buildMarkdownDocumentHtml(options: BuildMarkdownDocumentHtmlOptions): string {
  return [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head>',
    '  <meta charset="utf-8" />',
    '  <meta name="viewport" content="width=device-width, initial-scale=1" />',
    `  <title>${escapeHtml(options.title)}</title>`,
    '  <style>',
    '    :root { color-scheme: light; }',
    '    html, body { margin: 0; padding: 0; background: #f7f5f0; }',
    '    body { padding: 40px 24px 56px; }',
    '    .markdown-export-page { min-height: 100vh; }',
    '    .markdown-export-frame {',
    '      max-width: 880px;',
    '      margin: 0 auto;',
    '      background: #ffffff;',
    '      border: 1px solid #e2ddd5;',
    '      border-radius: 18px;',
    '      box-shadow: 0 18px 40px rgba(26, 24, 20, 0.08);',
    '      padding: 48px 56px;',
    '    }',
    '    @page { margin: 14mm 12mm; }',
    '    @media print {',
    '      html, body { background: #ffffff; }',
    '      body { padding: 0; }',
    '      .markdown-export-frame {',
    '        max-width: none;',
    '        margin: 0;',
    '        border: none;',
    '        border-radius: 0;',
    '        box-shadow: none;',
    '        padding: 0;',
    '      }',
    '    }',
    markdownDocumentCss,
    '  </style>',
    '</head>',
    '<body>',
    '  <main class="markdown-export-page markdown-document-theme--light">',
    '    <article class="markdown-export-frame markdown-document">',
    options.bodyHtml,
    '    </article>',
    '  </main>',
    '</body>',
    '</html>',
  ].join('\n')
}

export function getDefaultExportTitle(input: null | string | undefined): string {
  if (!input) {
    return 'Untitled'
  }

  const fileName = input.split(/[\\/]/).pop() ?? input
  return fileName.replace(/\.[^./\\]+$/, '') || 'Untitled'
}

export function getSuggestedExportFileName(
  input: null | string | undefined,
  extension: 'html' | 'pdf',
): string {
  const title = getDefaultExportTitle(input)
  return `${title}.${extension}`
}

export async function renderMarkdownDocument(
  options: RenderMarkdownDocumentOptions,
): Promise<MarkdownDocumentRenderResult> {
  const rendered = renderMarkdownWithSourceMap(options.content)
  const sanitizedHtml = DOMPurify.sanitize(rendered.html, {
    FORBID_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling'],
    FORBID_TAGS: ['iframe'],
  })
  const parser = new DOMParser()
  const documentNode = parser.parseFromString(
    `<div class="markdown-document markdown-document-theme--light">${sanitizedHtml}</div>`,
    'text/html',
  )
  const container = documentNode.body.firstElementChild

  if (!(container instanceof HTMLElement)) {
    return {
      bodyHtml: '',
      title: options.title,
    }
  }

  stripEditorAttributes(container)
  await renderMermaidBlocks(container)

  return {
    bodyHtml: container.innerHTML,
    title: options.title,
  }
}

function createMermaidId(index: number): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `markdown-export-${index}-${crypto.randomUUID()}`
  }

  return `markdown-export-${index}-${Math.random().toString(36).slice(2, 10)}`
}

async function renderMermaidBlocks(container: HTMLElement): Promise<void> {
  mermaid.initialize({
    fontFamily: 'DM Sans, sans-serif',
    securityLevel: 'strict',
    startOnLoad: false,
    theme: 'neutral',
  })

  const diagrams = container.querySelectorAll<HTMLElement>('.mermaid')

  for (const [index, diagram] of diagrams.entries()) {
    const code = diagram.textContent?.trim() ?? ''
    const wrap = diagram.closest<HTMLElement>('.mermaid-wrap')
    if (!wrap) continue

    try {
      const { svg } = await mermaid.render(createMermaidId(index), code)
      wrap.innerHTML = svg
    } catch (error) {
      wrap.innerHTML = `<div class="mermaid-error">Mermaid error: ${escapeHtml(
        error instanceof Error ? error.message : String(error),
      )}</div>`
    }
  }
}

function stripEditorAttributes(container: HTMLElement): void {
  const elements = container.querySelectorAll<HTMLElement>('*')

  for (const element of elements) {
    element.removeAttribute('data-source-end')
    element.removeAttribute('data-source-id')
    element.removeAttribute('data-source-start')

    if (element.id.startsWith('markdown-source-')) {
      element.removeAttribute('id')
    }
  }
}
