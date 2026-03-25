// Features Section Component
interface Feature {
  description: string
  icon: string
  title: string
}

const features: Feature[] = [
  {
    description:
      'See your Markdown render instantly as you type. No need to switch views or wait for updates.',
    icon: '⚡',
    title: 'Live Preview',
  },
  {
    description:
      'Create flowcharts, sequence diagrams, ER diagrams, and Gantt charts using simple text syntax.',
    icon: '📊',
    title: 'Mermaid Diagrams',
  },
  {
    description:
      'Open, edit, and save .md files seamlessly. Works with the File System Access API in supported browsers.',
    icon: '📁',
    title: 'File Management',
  },
  {
    description:
      'Toggle between light and dark modes with smooth animated transitions that match your preference.',
    icon: '🎨',
    title: 'Theme Switching',
  },
  {
    description: 'Download the desktop app for macOS and enjoy a native editing experience.',
    icon: '📱',
    title: 'Native Desktop App',
  },
  {
    description:
      'Launch instantly with npx markdown-studio@latest. Runs a local server at http://127.0.0.1 and opens your browser automatically.',
    icon: '🚀',
    title: 'Zero Install',
  },
]

export function Features(): string {
  const featuresHtml = features
    .map(
      (feature) => `
        <div class="feature-card">
          <div class="feature-icon">${feature.icon}</div>
          <h3 class="feature-title">${feature.title}</h3>
          <p class="feature-description">${feature.description}</p>
        </div>
      `,
    )
    .join('')

  return `
    <section class="features-section section">
      <div class="container">
        <div class="features-header">
          <h2 class="features-title">Everything you need to write</h2>
          <p class="features-subtitle">
            A focused, distraction-free environment with powerful features for modern Markdown editing.
          </p>
        </div>

        <div class="features-grid">
          ${featuresHtml}
        </div>
      </div>
    </section>
  `
}
