import { marked, type Token, type Tokens } from 'marked'

import { escapeHtml } from '@/utils/escapeHtml'

import type { MarkdownSourceMapEntry } from '../types'

type AnnotatedToken = {
  sourceEnd?: number
  sourceId?: string
  sourceStart?: number
} & Token

interface RenderedMarkdown {
  html: string
  sourceMap: MarkdownSourceMapEntry[]
}

const renderOptions = {
  breaks: false,
  gfm: true,
}

export function renderMarkdownWithSourceMap(content: string): RenderedMarkdown {
  const tokens = marked.lexer(content, renderOptions)
  const sourceMap: MarkdownSourceMapEntry[] = []
  annotateTokens(tokens, 0, sourceMap)

  return {
    html: marked.parser(tokens, {
      ...renderOptions,
      renderer: createRenderer(),
    }),
    sourceMap,
  }
}

function annotateTokens(
  tokens: Token[],
  offset = 0,
  sourceMap: MarkdownSourceMapEntry[] = [],
): number {
  let cursor = offset

  for (const token of tokens) {
    const annotatedToken = token as AnnotatedToken
    const start = cursor
    const end = start + token.raw.length
    cursor = end

    if (shouldAnchorBlock(token)) {
      const id = `block-${sourceMap.length}`
      annotatedToken.sourceId = id
      annotatedToken.sourceStart = start
      annotatedToken.sourceEnd = end
      sourceMap.push({ end, id, start, type: token.type })
    }

    if (token.type === 'list') {
      let itemCursor = start
      for (const item of token.items) {
        const itemStart = itemCursor
        const itemEnd = itemStart + item.raw.length
        itemCursor = itemEnd

        const annotatedItem = item as AnnotatedToken
        const id = `block-${sourceMap.length}`
        annotatedItem.sourceId = id
        annotatedItem.sourceStart = itemStart
        annotatedItem.sourceEnd = itemEnd
        sourceMap.push({ end: itemEnd, id, start: itemStart, type: item.type })
      }
    }
  }

  return cursor
}

function buildAttrs(token: AnnotatedToken): string {
  if (
    token.sourceId === undefined ||
    token.sourceStart === undefined ||
    token.sourceEnd === undefined
  ) {
    return ''
  }

  return ` id="markdown-source-${token.sourceId}" data-source-id="${token.sourceId}" data-source-start="${token.sourceStart}" data-source-end="${token.sourceEnd}"`
}

function createRenderer() {
  const baseRenderer = new marked.Renderer()
  const renderer = new marked.Renderer()

  renderer.blockquote = function (token: Tokens.Blockquote): string {
    return injectAttrs(
      baseRenderer.blockquote.call(this, token),
      'blockquote',
      buildAttrs(token as AnnotatedToken),
    )
  }

  renderer.code = function (token: Tokens.Code): string {
    const attrs = buildAttrs(token as AnnotatedToken)
    if (token.lang === 'mermaid') {
      const source = escapeHtml(token.text)
      return `<div class="mermaid-wrap"${attrs}><div class="mermaid">${source}</div></div>`
    }

    return `<pre${attrs}><code class="${escapeHtml(token.lang || '')}">${escapeHtml(token.text)}</code></pre>`
  }

  renderer.heading = function (token: Tokens.Heading): string {
    return injectAttrs(
      baseRenderer.heading.call(this, token),
      `h${token.depth}`,
      buildAttrs(token as AnnotatedToken),
    )
  }

  renderer.hr = function (token: Tokens.Hr): string {
    return injectAttrs(baseRenderer.hr.call(this, token), 'hr', buildAttrs(token as AnnotatedToken))
  }

  renderer.html = function (token: Tokens.HTML | Tokens.Tag): string {
    const attrs = buildAttrs(token as AnnotatedToken)
    if (!attrs || token.block === false) {
      return baseRenderer.html.call(this, token)
    }

    return `<div class="html-block"${attrs}>${token.text}</div>`
  }

  renderer.listitem = function (token: Tokens.ListItem): string {
    return injectAttrs(
      baseRenderer.listitem.call(this, token),
      'li',
      buildAttrs(token as AnnotatedToken),
    )
  }

  renderer.paragraph = function (token: Tokens.Paragraph): string {
    return injectAttrs(
      baseRenderer.paragraph.call(this, token),
      'p',
      buildAttrs(token as AnnotatedToken),
    )
  }

  renderer.table = function (token: Tokens.Table): string {
    return injectAttrs(
      baseRenderer.table.call(this, token),
      'table',
      buildAttrs(token as AnnotatedToken),
    )
  }

  return renderer
}

function injectAttrs(markup: string, tagName: string, attrs: string): string {
  if (!attrs) return markup

  return markup.replace(new RegExp(`<${tagName}(?=[\\s>])`), `<${tagName}${attrs}`)
}

function shouldAnchorBlock(token: Token): boolean {
  return ['blockquote', 'code', 'heading', 'hr', 'html', 'paragraph', 'table'].includes(token.type)
}
