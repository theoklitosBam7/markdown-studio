import '@fontsource/dm-mono/400.css'
import '@fontsource/dm-mono/500.css'
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

// A section counts as current while it crosses a thin band near the top of
// the viewport, which matches where anchor links scroll it to. The last
// section is too short to reach that band, so it becomes current once the
// whole footer shows, which happens only at the end of the page.
function highlightCurrentSection(app: HTMLElement): void {
  const sections = Array.from(app.querySelectorAll('section[id]'))
  const footer = app.querySelector('.landing-footer')
  if (sections.length === 0 || !footer) return

  const sectionsInBand = new Set<Element>()
  let isFooterFullyVisible = false

  const update = (): void => {
    const current = isFooterFullyVisible
      ? sections.at(-1)
      : sections.filter((section) => sectionsInBand.has(section)).at(-1)
    if (current) markCurrentSection(app, current.id)
  }

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) sectionsInBand.add(entry.target)
        else sectionsInBand.delete(entry.target)
      }
      update()
    },
    { rootMargin: '-20% 0px -70% 0px' },
  )
  for (const section of sections) sectionObserver.observe(section)

  const footerObserver = new IntersectionObserver(
    (entries) => {
      isFooterFullyVisible = entries.some((entry) => entry.intersectionRatio >= 1)
      update()
    },
    { threshold: 1 },
  )
  footerObserver.observe(footer)
}

function markCurrentSection(app: HTMLElement, sectionId: string): void {
  for (const link of app.querySelectorAll('nav a[href^="#"]')) {
    if (link.getAttribute('href') === `#${sectionId}`) {
      link.setAttribute('aria-current', 'true')
    } else {
      link.removeAttribute('aria-current')
    }
  }
}

function renderApp(): void {
  if (didRender) return
  const app = document.getElementById('landing')
  if (!app) return

  didRender = true
  app.innerHTML = LandingPage()
  void hydrateMermaidMockups(app)
  highlightCurrentSection(app)
}

document.addEventListener('click', handleCopyCommandClick)
document.addEventListener('DOMContentLoaded', renderApp)

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  renderApp()
}
