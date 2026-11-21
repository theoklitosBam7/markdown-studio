import { HTML_PREVIEW_ASSET_PROTOCOL } from '@markdown-studio/desktop-contract/constants'

import type { HtmlPreviewRequest, PreparedHtmlPreview } from '../types'

const PREVIEW_ASSET_SCHEME = `${HTML_PREVIEW_ASSET_PROTOCOL}:`
const BASE_CSP = [
  "default-src 'none'",
  "base-uri 'none'",
  "connect-src 'none'",
  `font-src data: blob: ${PREVIEW_ASSET_SCHEME}`,
  "form-action 'none'",
  "frame-src 'none'",
  `img-src data: blob: ${PREVIEW_ASSET_SCHEME}`,
  `media-src data: blob: ${PREVIEW_ASSET_SCHEME}`,
  "object-src 'none'",
  `style-src 'unsafe-inline' data: blob: ${PREVIEW_ASSET_SCHEME}`,
].join('; ')
const CSS_URL_PATTERN = /url\(\s*(?:(['"])(.*?)\1|([^'")]+))\s*\)/gi

export function prepareHtmlPreview(input: HtmlPreviewRequest): PreparedHtmlPreview {
  const documentNode = new DOMParser().parseFromString(input.content, 'text/html')
  const head = getOrCreateHead(documentNode)
  const csp = createCspMeta(documentNode, input.allowScripts)

  head.prepend(csp)
  removeUnsafeElements(documentNode, input.allowScripts)
  redirectLinks(documentNode)

  if (input.assetBaseUrl) {
    rewriteAssetUrls(documentNode, input.assetBaseUrl)
  }

  return {
    sandbox: input.allowScripts ? 'allow-scripts' : '',
    srcdoc: `<!doctype html>\n${documentNode.documentElement.outerHTML}`,
  }
}

function createCspMeta(documentNode: Document, allowScripts: boolean): HTMLMetaElement {
  const meta = documentNode.createElement('meta')
  const directives = allowScripts
    ? `${BASE_CSP}; script-src 'unsafe-inline' ${PREVIEW_ASSET_SCHEME}`
    : BASE_CSP

  meta.setAttribute('http-equiv', 'Content-Security-Policy')
  meta.setAttribute('content', directives)

  return meta
}

function getOrCreateHead(documentNode: Document): HTMLElement {
  if (documentNode.head) return documentNode.head

  const head = documentNode.createElement('head')
  documentNode.documentElement.prepend(head)
  return head
}

function isRewritableUrl(value: string): boolean {
  if (!value || value.startsWith('#') || value.startsWith('//')) return false

  return !/^[a-z][a-z\d+.-]*:/i.test(value)
}

function redirectLinks(documentNode: Document): void {
  for (const link of documentNode.querySelectorAll('a[href], area[href]')) {
    link.setAttribute('target', '_blank')
  }
}

function removeUnsafeElements(documentNode: Document, allowScripts: boolean): void {
  const unsafeSelector = 'base, iframe, object, embed, form'

  for (const element of documentNode.querySelectorAll(unsafeSelector)) {
    element.remove()
  }

  for (const meta of documentNode.querySelectorAll('meta[http-equiv]')) {
    if (meta.getAttribute('http-equiv')?.toLowerCase() === 'refresh') {
      meta.remove()
    }
  }

  if (allowScripts) return

  for (const script of documentNode.querySelectorAll('script')) {
    script.remove()
  }

  for (const element of documentNode.querySelectorAll('*')) {
    for (const name of element.getAttributeNames()) {
      if (name.toLowerCase().startsWith('on')) {
        element.removeAttribute(name)
      }
    }
  }
}

function rewriteAssetUrl(value: string, assetBaseUrl: string): string {
  const trimmed = value.trim()
  if (!isRewritableUrl(trimmed)) return value

  const relativeUrl = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed

  try {
    return new URL(relativeUrl, assetBaseUrl).toString()
  } catch {
    return value
  }
}

function rewriteAssetUrls(documentNode: Document, assetBaseUrl: string): void {
  for (const element of documentNode.querySelectorAll('[href], [src], [srcset], [style]')) {
    for (const attribute of ['href', 'src']) {
      const value = element.getAttribute(attribute)
      if (value !== null) {
        element.setAttribute(attribute, rewriteAssetUrl(value, assetBaseUrl))
      }
    }

    const srcset = element.getAttribute('srcset')
    if (srcset !== null) {
      element.setAttribute('srcset', rewriteSrcSet(srcset, assetBaseUrl))
    }

    const inlineStyle = element.getAttribute('style')
    if (inlineStyle !== null) {
      element.setAttribute('style', rewriteCssUrls(inlineStyle, assetBaseUrl))
    }
  }

  for (const style of documentNode.querySelectorAll('style')) {
    style.textContent = rewriteCssUrls(style.textContent ?? '', assetBaseUrl)
  }
}

function rewriteCssUrls(css: string, assetBaseUrl: string): string {
  return css.replace(
    CSS_URL_PATTERN,
    (
      match: string,
      quote: string | undefined,
      quotedUrl: string | undefined,
      unquotedUrl: string | undefined,
    ) => {
      const original = quotedUrl ?? unquotedUrl ?? ''
      const rewritten = rewriteAssetUrl(original, assetBaseUrl)

      if (rewritten === original) return match

      return `url(${quote ?? ''}${rewritten}${quote ?? ''})`
    },
  )
}

function rewriteSrcSet(value: string, assetBaseUrl: string): string {
  let result = ''
  let index = 0

  while (index < value.length) {
    while (index < value.length && /\s/.test(value.charAt(index))) {
      result += value.charAt(index)
      index += 1
    }

    const urlStart = index
    while (index < value.length && !/\s/.test(value.charAt(index))) {
      const character = value.charAt(index)
      const token = value.slice(urlStart, index + 1)

      if (character === ',' && !/^data:/i.test(token)) break
      index += 1
    }

    result += rewriteAssetUrl(value.slice(urlStart, index), assetBaseUrl)

    while (index < value.length && value.charAt(index) !== ',') {
      result += value.charAt(index)
      index += 1
    }

    if (index < value.length) {
      result += ','
      index += 1
    }
  }

  return result
}
