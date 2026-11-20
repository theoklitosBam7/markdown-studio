import type { HtmlPreviewRequest, PreparedHtmlPreview } from '../types'

const BASE_CSP = [
  "default-src 'none'",
  "base-uri 'none'",
  "connect-src 'none'",
  'font-src data: blob:',
  "form-action 'none'",
  "frame-src 'none'",
  'img-src data: blob:',
  'media-src data: blob:',
  "object-src 'none'",
  "style-src 'unsafe-inline' data: blob:",
].join('; ')

export function prepareHtmlPreview(input: HtmlPreviewRequest): PreparedHtmlPreview {
  const documentNode = new DOMParser().parseFromString(input.content, 'text/html')
  const head = getOrCreateHead(documentNode)
  const csp = createCspMeta(documentNode, input.allowScripts)

  head.prepend(csp)
  removeUnsafeElements(documentNode, input.allowScripts)
  redirectLinks(documentNode)

  return {
    sandbox: input.allowScripts ? 'allow-scripts' : '',
    srcdoc: `<!doctype html>\n${documentNode.documentElement.outerHTML}`,
  }
}

function createCspMeta(documentNode: Document, allowScripts: boolean): HTMLMetaElement {
  const meta = documentNode.createElement('meta')
  const directives = allowScripts ? `${BASE_CSP}; script-src 'unsafe-inline'` : BASE_CSP

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

function redirectLinks(documentNode: Document): void {
  for (const link of documentNode.querySelectorAll<HTMLAnchorElement>('a[href]')) {
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
