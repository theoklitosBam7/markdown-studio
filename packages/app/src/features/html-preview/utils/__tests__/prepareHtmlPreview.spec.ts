import { describe, expect, it } from 'vite-plus/test'

import { prepareHtmlPreview } from '../prepareHtmlPreview'

const CSP_EQUIV = 'http-equiv="content-security-policy"'
const ASSET_BASE_URL = 'markdown-studio-preview://local/0123456789abcdef0123456789abcdef/'

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

  it('redirects image-map links and rewrites only relative destinations through the asset grant', () => {
    const preview = prepareHtmlPreview({
      allowScripts: false,
      assetBaseUrl: ASSET_BASE_URL,
      content: `<map name="report">
        <area href="https://example.test/" target="_self">
        <area href="reports/detail.html" target="_top">
        <area href="#section">
      </map>`,
    })
    const parsed = new DOMParser().parseFromString(preview.srcdoc, 'text/html')
    const links = [...parsed.querySelectorAll('area')]

    expect(links.map((link) => link.getAttribute('target'))).toEqual(['_blank', '_blank', '_blank'])
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      'https://example.test/',
      'markdown-studio-preview://local/0123456789abcdef0123456789abcdef/reports/detail.html',
      '#section',
    ])
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

  it('keeps the grant id when rewriting root-relative asset URLs', () => {
    const assetBaseUrl = 'markdown-studio-preview://local/abcdef0123456789abcdef0123456789/'
    const preview = prepareHtmlPreview({
      allowScripts: false,
      assetBaseUrl,
      content: `
        <link rel="stylesheet" href="/styles/site.css">
        <img srcset="/images/logo.png 1x">
        <style>body { background: url('/images/paper.png'); }</style>
      `,
    })

    expect(preview.srcdoc).toContain(`${assetBaseUrl}styles/site.css`)
    expect(preview.srcdoc).toContain(`${assetBaseUrl}images/logo.png`)
    expect(preview.srcdoc).toContain(`${assetBaseUrl}images/paper.png`)
    expect(preview.srcdoc).not.toContain('markdown-studio-preview://local/styles')
  })

  it('uses an empty sandbox value when scripts are blocked', () => {
    const preview = prepareHtmlPreview({
      allowScripts: false,
      content: '<p>Static</p>',
    })

    expect(preview.sandbox).toBe('')
  })

  it('allows inline scripts and keeps the other policy restrictions when scripts are enabled', () => {
    const preview = prepareHtmlPreview({
      allowScripts: true,
      content: `
        <div onclick="this.dataset.handlerRan = 'yes'">Card</div>
        <script>document.body.dataset.scriptRan = 'yes'</script>
      `,
    })
    const parsed = new DOMParser().parseFromString(preview.srcdoc, 'text/html')
    const policy = getCsp(preview.srcdoc)

    expect(policy).toContain("script-src 'unsafe-inline' markdown-studio-preview:")
    expect(policy).toContain("default-src 'none'")
    expect(policy).toContain("connect-src 'none'")
    expect(policy).not.toContain('script-src *')
    expect(parsed.querySelector('script')?.textContent).toContain("dataset.scriptRan = 'yes'")
    expect(parsed.querySelector('[onclick]')?.getAttribute('onclick')).toBe(
      "this.dataset.handlerRan = 'yes'",
    )
  })

  it('uses the allow-scripts sandbox when scripts are enabled', () => {
    const preview = prepareHtmlPreview({
      allowScripts: true,
      content: '<p>Interactive</p>',
    })

    expect(preview.sandbox).toBe('allow-scripts')
  })

  it('rewrites relative src and href values through the asset base', () => {
    const preview = prepareHtmlPreview({
      allowScripts: false,
      assetBaseUrl: ASSET_BASE_URL,
      content: `
        <link rel="stylesheet" href="styles/site.css">
        <img src="images/logo.png">
        <video src="media/clip.mp4"></video>
        <a href="other.html">Other page</a>
      `,
    })

    const parsed = new DOMParser().parseFromString(preview.srcdoc, 'text/html')

    expect(parsed.querySelector('link')?.getAttribute('href')).toBe(
      'markdown-studio-preview://local/0123456789abcdef0123456789abcdef/styles/site.css',
    )
    expect(parsed.querySelector('img')?.getAttribute('src')).toBe(
      'markdown-studio-preview://local/0123456789abcdef0123456789abcdef/images/logo.png',
    )
    expect(parsed.querySelector('video')?.getAttribute('src')).toBe(
      'markdown-studio-preview://local/0123456789abcdef0123456789abcdef/media/clip.mp4',
    )
    expect(parsed.querySelector('a')?.getAttribute('href')).toBe(
      'markdown-studio-preview://local/0123456789abcdef0123456789abcdef/other.html',
    )
    expect(preview.srcdoc).not.toContain('file://')
  })

  it('leaves absolute, protocol-relative, data, and fragment URLs unchanged', () => {
    const preview = prepareHtmlPreview({
      allowScripts: false,
      assetBaseUrl: ASSET_BASE_URL,
      content: `
        <img src="data:image/png;base64,AAAA">
        <link rel="stylesheet" href="https://example.test/site.css">
        <script src="//cdn.example.test/app.js"></script>
        <a href="mailto:hello@example.test">Email</a>
        <a href="#section">Section</a>
      `,
    })

    const parsed = new DOMParser().parseFromString(preview.srcdoc, 'text/html')
    const scripts = [...parsed.querySelectorAll('script')].map((script) =>
      script.getAttribute('src'),
    )
    const hrefs = [...parsed.querySelectorAll('a')].map((link) => link.getAttribute('href'))

    expect(parsed.querySelector('img')?.getAttribute('src')).toBe('data:image/png;base64,AAAA')
    expect(parsed.querySelector('link')?.getAttribute('href')).toBe('https://example.test/site.css')
    expect(scripts).toEqual([])
    expect(hrefs).toEqual(['mailto:hello@example.test', '#section'])
  })

  it('rewrites each candidate in a srcset value', () => {
    const preview = prepareHtmlPreview({
      allowScripts: false,
      assetBaseUrl: ASSET_BASE_URL,
      content: `
        <img
          srcset="data:image/png;base64,AAAA 1x, images/large.png 2x"
          src="images/logo.png"
        >
      `,
    })

    const parsed = new DOMParser().parseFromString(preview.srcdoc, 'text/html')

    expect(parsed.querySelector('img')?.getAttribute('srcset')).toBe(
      'data:image/png;base64,AAAA 1x, markdown-studio-preview://local/0123456789abcdef0123456789abcdef/images/large.png 2x',
    )
  })

  it('rewrites CSS url() declarations without changing the rest of inline CSS', () => {
    const preview = prepareHtmlPreview({
      allowScripts: false,
      assetBaseUrl: ASSET_BASE_URL,
      content: `
        <style>.hero { background: url('./img/hero.png'); color: rebeccapurple; }</style>
        <p style="background-image: url(images/bg.webp)">Card</p>
      `,
    })

    const parsed = new DOMParser().parseFromString(preview.srcdoc, 'text/html')
    const css = parsed.querySelector('style')?.textContent ?? ''

    expect(css).toContain(
      "url('markdown-studio-preview://local/0123456789abcdef0123456789abcdef/img/hero.png')",
    )
    expect(css).toContain('color: rebeccapurple;')
    expect(parsed.querySelector('p')?.getAttribute('style')).toBe(
      'background-image: url(markdown-studio-preview://local/0123456789abcdef0123456789abcdef/images/bg.webp)',
    )
  })

  it('allows only local preview assets while keeping remote network access blocked', () => {
    const preview = prepareHtmlPreview({
      allowScripts: false,
      assetBaseUrl: ASSET_BASE_URL,
      content: '<p>Static</p>',
    })

    const policy = getCsp(preview.srcdoc)

    expect(policy).toContain("default-src 'none'")
    expect(policy).toContain("connect-src 'none'")
    expect(policy).toContain('img-src data: blob: markdown-studio-preview:')
    expect(policy).toContain('media-src data: blob: markdown-studio-preview:')
    expect(policy).toContain('font-src data: blob: markdown-studio-preview:')
    expect(policy).toContain("style-src 'unsafe-inline' data: blob: markdown-studio-preview:")
    expect(policy).not.toContain('script-src')
  })
})

function getCsp(srcdoc: string): string {
  const parsed = new DOMParser().parseFromString(srcdoc, 'text/html')
  return (
    parsed.querySelector('meta[http-equiv="content-security-policy"]')?.getAttribute('content') ??
    ''
  )
}
