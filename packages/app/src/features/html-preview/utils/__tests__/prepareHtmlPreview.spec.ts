import { describe, expect, it } from 'vite-plus/test'

import { prepareHtmlPreview } from '../prepareHtmlPreview'

const CSP_EQUIV = 'http-equiv="content-security-policy"'

describe('prepareHtmlPreview', () => {
  it('injects the policy as the first head element when the source has no head', () => {
    const preview = prepareHtmlPreview({
      allowScripts: false,
      content: '<p>Hello</p>',
    })

    const parsed = new DOMParser().parseFromString(preview.srcdoc, 'text/html')
    const head = parsed.head
    const firstMeta = head.firstElementChild

    expect(firstMeta?.tagName).toBe('META')
    expect(firstMeta?.outerHTML.toLowerCase()).toContain(CSP_EQUIV)
    expect(head.querySelector('meta')?.getAttribute('content')).toContain("default-src 'none'")
  })

  it('blocks network access and framing in the policy', () => {
    const preview = prepareHtmlPreview({
      allowScripts: false,
      content: '<html><head></head><body>Hello</body></html>',
    })

    const policy = getCsp(preview.srcdoc)

    expect(policy).toContain("connect-src 'none'")
    expect(policy).toContain("base-uri 'none'")
    expect(policy).toContain("frame-src 'none'")
    expect(policy).not.toContain('allow-scripts')
  })

  it('removes document elements that can redirect or embed content', () => {
    const preview = prepareHtmlPreview({
      allowScripts: false,
      content: `
        <html>
          <head>
            <base href="https://example.test/">
            <meta http-equiv="refresh" content="0;url=https://example.test/">
          </head>
          <body>
            <iframe src="https://example.test/"></iframe>
            <object data="file.x"></object>
            <embed src="file.x">
            <form action="https://example.test/"><button>Send</button></form>
          </body>
        </html>
      `,
    })

    const parsed = new DOMParser().parseFromString(preview.srcdoc, 'text/html')

    expect(parsed.querySelector('base')).toBeNull()
    expect(parsed.querySelector('meta[http-equiv="refresh"]')).toBeNull()
    expect(parsed.querySelector('iframe')).toBeNull()
    expect(parsed.querySelector('object')).toBeNull()
    expect(parsed.querySelector('embed')).toBeNull()
    expect(parsed.querySelector('form')).toBeNull()
  })

  it('redirects links away from the preview frame', () => {
    const preview = prepareHtmlPreview({
      allowScripts: false,
      content: `
        <a href="https://example.test/" target="_self">Self</a>
        <a href="https://example.test/" target="_top">Top</a>
        <a href="https://example.test/">Default</a>
      `,
    })

    const parsed = new DOMParser().parseFromString(preview.srcdoc, 'text/html')
    const targets = [...parsed.querySelectorAll('a')].map((link) => link.getAttribute('target'))

    expect(targets).toEqual(['_blank', '_blank', '_blank'])
  })

  it('keeps inline styles but removes scripts and event handlers when scripts are blocked', () => {
    const preview = prepareHtmlPreview({
      allowScripts: false,
      content: `
        <style>.card { color: rebeccapurple; }</style>
        <div class="card" onclick="alert(1)" style="padding: 4px">Card</div>
        <script>window.parent.document.body.remove()</script>
      `,
    })

    const parsed = new DOMParser().parseFromString(preview.srcdoc, 'text/html')
    const card = parsed.querySelector('.card')

    expect(parsed.querySelector('style')?.textContent).toContain('rebeccapurple')
    expect(card?.getAttribute('style')).toBe('padding: 4px')
    expect(card?.hasAttribute('onclick')).toBe(false)
    expect(parsed.querySelector('script')).toBeNull()
  })

  it('uses an empty sandbox value when scripts are blocked', () => {
    const preview = prepareHtmlPreview({
      allowScripts: false,
      content: '<p>Static</p>',
    })

    expect(preview.sandbox).toBe('')
  })
})

function getCsp(srcdoc: string): string {
  const parsed = new DOMParser().parseFromString(srcdoc, 'text/html')
  return (
    parsed.querySelector('meta[http-equiv="content-security-policy"]')?.getAttribute('content') ??
    ''
  )
}
