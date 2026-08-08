import { escapeHtml } from './utils/escapeHtml'

// Load Mermaid on demand so the landing shell stays light.
//
// The core app renders Mermaid eagerly via renderMermaidBlocks
// (packages/app/src/features/markdown/rendered-document/index.ts). That module
// imports mermaid — plus dompurify and marked — at load time and is coupled to
// markdown-document markup/source maps, so reusing it here would pull those
// dependencies into the landing shell and regress the lazy load. This
// standalone implementation is kept and aligned on behaviour.

type MermaidTheme = 'dark' | 'neutral'

let activeTheme: MermaidTheme | undefined
let renderCount = 0

export async function hydrateMermaidMockups(root: HTMLElement): Promise<void> {
  const targets = Array.from(root.querySelectorAll<HTMLElement>('.editor-mermaid-wrap'))
  if (targets.length === 0) return

  const mermaid = (await import('mermaid')).default

  const configure = (theme: MermaidTheme): void => {
    if (theme === activeTheme) return
    mermaid.initialize({
      fontFamily: 'DM Mono, ui-monospace, monospace',
      securityLevel: 'strict',
      startOnLoad: false,
      theme,
    })
    activeTheme = theme
  }

  configure('dark')

  for (const wrap of targets) {
    const sourceNode = wrap.querySelector('.editor-mermaid')
    const code = sourceNode?.textContent?.trim() ?? ''
    if (!code) continue

    configure(wrap.dataset.mermaidTheme === 'neutral' ? 'neutral' : 'dark')

    try {
      const { svg } = await mermaid.render(createRenderId(), code)
      wrap.innerHTML = svg
      wrap.dataset.hydrated = 'true'
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      wrap.innerHTML = `<div class="editor-mermaid-error">Mermaid error: ${escapeHtml(message)}</div>`
      wrap.dataset.hydrated = 'error'
      console.error('Mermaid render failed:', error)
    }
  }
}

function createRenderId(): string {
  renderCount += 1
  return `landing-mermaid-${renderCount}-${Math.random().toString(36).slice(2, 8)}`
}
