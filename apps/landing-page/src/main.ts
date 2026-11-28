import { LandingPage } from './components/LandingPage'
import { brewCommand, npmCommand } from './content'
import { hydrateMermaidMockups } from './hydrateMermaid'
import './styles/base.css'
import './styles/landing.css'
import './styles/mockup.css'

async function copyToClipboard(text: string, button: HTMLElement): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
    showCopyResult(button, 'copied', `Copied to clipboard: ${text}`)
  } catch (error) {
    console.error('Failed to copy command to clipboard:', error)
    showCopyResult(button, 'failed', 'Copy failed. Select the command and copy it manually.')
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

// The button keeps its command text so its width stays stable; the icon shows
// the result and the status region announces it to screen readers.
function showCopyResult(button: HTMLElement, state: 'copied' | 'failed', message: string): void {
  button.dataset.copyState = state
  const status = document.querySelector('[role="status"]')
  if (status) status.textContent = message

  // Clear the message too, so copying the same command again is announced.
  window.setTimeout(() => {
    delete button.dataset.copyState
    if (status) status.textContent = ''
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
