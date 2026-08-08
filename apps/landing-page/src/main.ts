import { LandingPage } from './components/LandingPage'
import { brewCommand, npmCommand } from './content'
import { hydrateMermaidMockups } from './hydrateMermaid'
import './styles/base.css'
import './styles/landing.css'
import './styles/mockup.css'

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

  const npmButton = target.closest<HTMLElement>('[data-action="copy-npm"]')
  if (npmButton) {
    void copyToClipboard(npmCommand, npmButton)
    return
  }

  const brewButton = target.closest<HTMLElement>('[data-action="copy-brew"]')
  if (brewButton) {
    void copyToClipboard(brewCommand, brewButton)
  }
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

let didRender = false

function renderApp(): void {
  if (didRender) return
  const app = document.getElementById('landing')
  if (!app) return

  didRender = true
  app.innerHTML = LandingPage()
  void hydrateMermaidMockups(app)
}

document.addEventListener('click', handleCopyCommandClick)
document.addEventListener('DOMContentLoaded', renderApp)

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  renderApp()
}
