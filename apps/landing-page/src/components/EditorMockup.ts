import { escapeHtml } from '../utils/escapeHtml'

/** Compact sample used in both editor source and live Mermaid render. */
export const mockupMermaidSource = `flowchart LR
  A[Write] --> B[Live Preview]
  B --> C[Export]`

export function EditorMockup(options: { className?: string } = {}): string {
  const wrapperClass = ['editor-mockup-wrap', 'is-dark', options.className]
    .filter(Boolean)
    .join(' ')
  const mermaidLines = mockupMermaidSource.split('\n')

  const editorLines = [
    { kind: 'heading', text: '# Project Roadmap' },
    { kind: 'text', text: '' },
    { kind: 'text', text: '## Phase 1: Foundation' },
    { kind: 'text', text: '- [x] Setup repository' },
    { kind: 'text', text: '- [x] Initial architecture' },
    { kind: 'text', text: '- [ ] Core features' },
    { kind: 'text', text: '' },
    { kind: 'code', text: '```mermaid' },
    ...mermaidLines.map((text) => ({ kind: 'code' as const, text })),
    { kind: 'code', text: '```' },
  ]
    .map((line, index) => {
      const classes = [
        'editor-line__content',
        line.kind === 'heading' ? 'heading' : '',
        line.kind === 'code' ? 'code' : '',
      ]
        .filter(Boolean)
        .join(' ')
      return `
        <div class="editor-line">
          <span class="editor-line__num">${index + 1}</span>
          <span class="${classes}">${escapeHtml(line.text)}</span>
        </div>
      `
    })
    .join('')

  return `
    <div class="${wrapperClass}" data-mermaid-theme="dark">
      <div class="editor-mockup">
        <div class="editor-mockup-chrome">
          <span class="editor-dot red"></span>
          <span class="editor-dot yellow"></span>
          <span class="editor-dot green"></span>
          <span class="editor-mockup-title">roadmap.md — Markdown Studio</span>
        </div>
        <div class="editor-mockup-toolbar">
          <span>Editor</span>
          <span>Preview</span>
          <span>Export</span>
          <span class="editor-mockup-spacer"></span>
          <span>🌙</span>
        </div>
        <div class="editor-mockup-body">
          <div class="editor-mockup-editor">
            ${editorLines}
          </div>
          <div class="editor-mockup-preview">
            <h3>Project Roadmap</h3>
            <p class="editor-preview-kicker"><strong>Phase 1: Foundation</strong></p>
            <ul class="editor-task-list">
              <li class="is-checked">Setup repository</li>
              <li class="is-checked">Initial architecture</li>
              <li>Core features</li>
            </ul>
            <div class="editor-mermaid-wrap" data-mermaid-theme="dark">
              <pre class="editor-mermaid">${escapeHtml(mockupMermaidSource)}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}
