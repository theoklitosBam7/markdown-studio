// Usage Modes Section Component - Desktop, PWA, CLI options
export function UsageModes(): string {
  return `
    <section class="usage-section section">
      <div class="container">
        <div class="usage-header">
          <h2 class="usage-section-title">Use it your way</h2>
          <p class="usage-section-subtitle">Three ways to write. Pick what works for you.</p>
        </div>

        <div class="usage-grid">
          <!-- Desktop App -->
          <div class="usage-card">
            <div class="usage-icon">💻</div>
            <h3 class="usage-title">Download for macOS</h3>
            <p class="usage-description">Native app with full file system integration. Best for daily use on Apple Silicon Macs.</p>
            <a href="https://github.com/theoklitosBam7/markdown-studio/releases/latest"
               class="btn btn-primary usage-cta"
               target="_blank"
               rel="noopener noreferrer">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download
            </a>
          </div>

          <!-- PWA -->
          <div class="usage-card recommended">
            <div class="usage-icon">📲</div>
            <h3 class="usage-title">Install as Web App</h3>
            <p class="usage-description">Works offline, auto-updates, feels like a native app. Available on any OS with Chrome, Edge, or Safari.</p>
            <a href="https://pwa.markdownstudio.eu/"
               class="btn btn-primary usage-cta"
               target="_blank"
               rel="noopener noreferrer">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              Open PWA
            </a>
          </div>

          <!-- CLI -->
          <div class="usage-card">
            <div class="usage-icon">⚡</div>
            <h3 class="usage-title">Run with npx</h3>
            <p class="usage-description">Zero installation. Runs locally, opens your browser automatically. Perfect for quick sessions.</p>
            <button class="btn btn-code usage-cta" type="button" data-action="copy-npm">
              <span class="npm-command">npx markdown-studio@latest</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  `
}
