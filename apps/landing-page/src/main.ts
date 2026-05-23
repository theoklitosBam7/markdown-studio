import { CTASection } from './components/CTASection'
import { Features } from './components/Features'
import { Footer } from './components/Footer'
import { Hero } from './components/Hero'
import { Mockup } from './components/Mockup'
import { UsageModes } from './components/UsageModes'
import './styles/components.css'
import './styles/main.css'

const npmCommand = 'npx markdown-studio@latest'
const brewCommand = 'brew install --cask theoklitosBam7/tap/markdown-studio'

async function copyToClipboard(text: string, button: HTMLElement): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
    updateCopyButtonLabel(button, 'Copied!')
  } catch (error) {
    console.error('Failed to copy command to clipboard:', error)
    updateCopyButtonLabel(button, 'Copy failed')
  }
}

function handleCopyCommandClick(event: MouseEvent): void {
  const target = event.target
  if (!(target instanceof Element)) return

  const button = target.closest<HTMLElement>('[data-action="copy-npm"]')
  if (button) {
    void copyToClipboard(npmCommand, button)
    return
  }

  const brewButton = target.closest<HTMLElement>('[data-action="copy-brew"]')
  if (brewButton) {
    void copyToClipboard(brewCommand, brewButton)
    return
  }
}

// Render the app
function renderApp(): void {
  const app = document.getElementById('landing')
  if (!app) return

  app.innerHTML = `
    ${Hero()}
    ${Mockup()}
    ${UsageModes()}
    ${Features()}
    ${CTASection()}
    ${Footer()}
  `
}

function updateCopyButtonLabel(button: HTMLElement, label: string): void {
  const commandSpan = button.querySelector<HTMLElement>('.npm-command')
  if (!commandSpan) return

  const originalText = commandSpan.textContent ?? ''
  commandSpan.textContent = label

  window.setTimeout(() => {
    commandSpan.textContent = originalText
  }, 2000)
}

// Initialize
document.addEventListener('click', handleCopyCommandClick)
document.addEventListener('DOMContentLoaded', renderApp)

// Re-render if the script loads after DOMContentLoaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  renderApp()
}
