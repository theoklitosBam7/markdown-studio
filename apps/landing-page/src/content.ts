export const npmCommand = 'npx markdown-studio@latest'
export const brewCommand = 'brew install --cask theoklitosBam7/tap/markdown-studio'

export const urls = {
  docs: 'https://github.com/theoklitosBam7/markdown-studio/blob/main/README.md',
  github: 'https://github.com/theoklitosBam7/markdown-studio',
  issues: 'https://github.com/theoklitosBam7/markdown-studio/issues',
  pwa: 'https://pwa.markdownstudio.eu/',
  releases: 'https://github.com/theoklitosBam7/markdown-studio/releases/latest',
} as const

export const brand = {
  name: 'Markdown Studio',
  slug: 'markdown-studio',
  year: new Date().getFullYear(),
}

export interface Feature {
  description: string
  icon: string
  kicker: string
  title: string
}

export const features: Feature[] = [
  {
    description:
      'See your Markdown render instantly as you type. No need to switch views or wait for updates.',
    icon: '⚡',
    kicker: '01',
    title: 'Live Preview',
  },
  {
    description:
      'Create flowcharts, sequence diagrams, ER diagrams, and Gantt charts using simple text syntax.',
    icon: '📊',
    kicker: '02',
    title: 'Mermaid Diagrams',
  },
  {
    description:
      'Open, edit, and save .md files seamlessly. Works with the File System Access API in supported browsers.',
    icon: '📁',
    kicker: '03',
    title: 'File Management',
  },
  {
    description:
      'Export polished standalone HTML files or print-ready PDFs from both the web app and the desktop app.',
    icon: '📄',
    kicker: '04',
    title: 'HTML & PDF Export',
  },
  {
    description:
      'Toggle between light and dark modes with smooth animated transitions that match your preference.',
    icon: '🎨',
    kicker: '05',
    title: 'Theme Switching',
  },
  {
    description:
      'Install as a standalone app from your browser. Works offline, auto-saves drafts, and stays updated automatically.',
    icon: '📲',
    kicker: '06',
    title: 'PWA Support',
  },
  {
    description:
      'Install the desktop app on macOS for a dedicated editing environment with full file system integration.',
    icon: '🖥️',
    kicker: '07',
    title: 'Desktop App',
  },
  {
    description:
      'Launch instantly with npx. Runs a local server at http://127.0.0.1 and opens your browser automatically.',
    icon: '🚀',
    kicker: '08',
    title: 'Zero Install',
  },
]

export interface UsageMode {
  description: string
  fallbackHref?: string
  fallbackLabel?: string
  id: 'desktop' | 'npx' | 'pwa'
  recommended?: boolean
  title: string
}

export const usageModes: UsageMode[] = [
  {
    description:
      'Install the desktop app on macOS for a dedicated editing environment with full file system integration.',
    fallbackHref: urls.releases,
    fallbackLabel: 'or download the DMG directly',
    id: 'desktop',
    recommended: true,
    title: 'macOS Desktop',
  },
  {
    description:
      'Works offline, auto-updates, feels like a standalone app. Available on any OS with Chrome, Edge, or Safari.',
    id: 'pwa',
    title: 'Install as Web App',
  },
  {
    description:
      'Zero installation. Runs locally, opens your browser automatically. Perfect for quick sessions.',
    id: 'npx',
    title: 'Run with npx',
  },
]

export const copyIcon = `
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
`

export const externalIcon = `
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/>
    <line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
`

export const githubIcon = `
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true" focusable="false">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
`

export function brewCopyButton(extraClass = ''): string {
  return `
    <button class="btn btn-code ${extraClass}" type="button" data-action="copy-brew" aria-label="Copy Homebrew install command">
      <span class="npm-command">${brewCommand}</span>
      ${copyIcon}
    </button>
  `
}

export function footerLinks(): string {
  return `
    <a href="${urls.pwa}" class="footer-link" target="_blank" rel="noopener noreferrer">Web App</a>
    <a href="${urls.github}" class="footer-link" target="_blank" rel="noopener noreferrer">GitHub</a>
    <a href="${urls.docs}" class="footer-link" target="_blank" rel="noopener noreferrer">Documentation</a>
    <a href="${urls.issues}" class="footer-link" target="_blank" rel="noopener noreferrer">Issues</a>
  `
}

export function githubLink(extraClass = '', label = 'Star on GitHub'): string {
  return `
    <a href="${urls.github}" class="${extraClass}" target="_blank" rel="noopener noreferrer">
      ${githubIcon}
      ${label}
    </a>
  `
}

export function npmCopyButton(extraClass = ''): string {
  return `
    <button class="btn btn-code ${extraClass}" type="button" data-action="copy-npm" aria-label="Copy npx launch command">
      <span class="npm-command">${npmCommand}</span>
      ${copyIcon}
    </button>
  `
}

export function pwaLink(extraClass = '', label = 'Open PWA'): string {
  return `
    <a href="${urls.pwa}" class="btn btn-primary ${extraClass}" target="_blank" rel="noopener noreferrer">
      ${externalIcon}
      ${label}
    </a>
  `
}
