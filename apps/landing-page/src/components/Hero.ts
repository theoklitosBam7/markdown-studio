// Hero Section Component
export function Hero(): string {
  return `
    <section class="hero">
      <div class="container">
        <div class="hero-content text-center">
          <div class="hero-logo">
            <div class="logo">
              <div class="logo-icon">📝</div>
              <span>Markdown Studio</span>
            </div>
          </div>

          <h1 class="hero-title">
            Write Markdown.<br />
            <span class="text-gradient">See It Live.</span>
          </h1>

          <p class="hero-subtitle">
            A beautiful, distraction-free editor with live preview, Mermaid diagram support,
            and built-in export to standalone HTML and print-ready PDF. Use it in your browser,
            install as a PWA, or install the desktop app on macOS with Homebrew.
          </p>

          <div class="hero-ctas">
            <div class="hero-cta-wrapper">
              <button class="btn btn-code btn-lg" type="button" data-action="copy-brew">
                <span class="npm-command">brew install --cask theoklitosBam7/tap/markdown-studio</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
              </button>
            </div>

            <div class="hero-cta-wrapper">
              <button class="btn btn-code btn-lg" type="button" data-action="copy-npm">
                <span class="npm-command">npx markdown-studio@latest</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
              </button>
              <p class="hero-cta-hint">Runs locally, opens your browser automatically</p>
            </div>
          </div>
        </div>
      </div>

      <div class="scroll-indicator">
        <span>Scroll to explore</span>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
    </section>
  `
}
