export function Mockup(): string {
  const lightContent = createMockupContent(false)
  const darkContent = createMockupContent(true)

  return `
    <section class="mockup-section section">
      <div class="container">
        <div class="mockup-container">
          <!-- Light Theme Mockup -->
          <div class="mockup-wrapper">
            <div class="mockup animate-float">
              <div class="mockup-header">
                <span class="mockup-dot red"></span>
                <span class="mockup-dot yellow"></span>
                <span class="mockup-dot green"></span>
              </div>
              <div class="mockup-toolbar">
                <div class="mockup-toolbar-btn">📝</div>
                <div class="mockup-toolbar-btn">👁</div>
                <div class="mockup-toolbar-btn">⇩</div>
                <div style="flex: 1;"></div>
                <div class="mockup-toolbar-btn">☀</div>
              </div>
              ${lightContent}
            </div>
          </div>

          <!-- Dark Theme Mockup -->
          <div class="mockup-wrapper mockup-dark">
            <div class="mockup animate-float" style="animation-delay: 0.5s;">
              <div class="mockup-header">
                <span class="mockup-dot red"></span>
                <span class="mockup-dot yellow"></span>
                <span class="mockup-dot green"></span>
              </div>
              <div class="mockup-toolbar">
                <div class="mockup-toolbar-btn">📝</div>
                <div class="mockup-toolbar-btn">👁</div>
                <div class="mockup-toolbar-btn">⇩</div>
                <div style="flex: 1;"></div>
                <div class="mockup-toolbar-btn">🌙</div>
              </div>
              ${darkContent}
            </div>
          </div>
        </div>
      </div>
    </section>
  `
}

// Mockup Section Component
function createMockupContent(isDark: boolean): string {
  const lineColor = isDark ? 'color: #d4cfc7;' : ''
  const headingColor = isDark ? 'color: #7dd3c0;' : ''
  const previewTextColor = isDark ? 'color: #b8b3ab;' : ''

  return `
    <div class="mockup-content">
      <div class="mockup-editor">
        <div class="mockup-line">
          <span class="mockup-line-number">1</span>
          <span class="mockup-line-content heading" style="${headingColor}"># Project Roadmap</span>
        </div>
        <div class="mockup-line">
          <span class="mockup-line-number">2</span>
          <span class="mockup-line-content" style="${lineColor}"></span>
        </div>
        <div class="mockup-line">
          <span class="mockup-line-number">3</span>
          <span class="mockup-line-content" style="${lineColor}">## Phase 1: Foundation</span>
        </div>
        <div class="mockup-line">
          <span class="mockup-line-number">4</span>
          <span class="mockup-line-content" style="${lineColor}">- [x] Setup repository</span>
        </div>
        <div class="mockup-line">
          <span class="mockup-line-number">5</span>
          <span class="mockup-line-content" style="${lineColor}">- [x] Initial architecture</span>
        </div>
        <div class="mockup-line">
          <span class="mockup-line-number">6</span>
          <span class="mockup-line-content" style="${lineColor}">- [ ] Core features</span>
        </div>
        <div class="mockup-line">
          <span class="mockup-line-number">7</span>
          <span class="mockup-line-content" style="${lineColor}"></span>
        </div>
        <div class="mockup-line">
          <span class="mockup-line-number">8</span>
          <span class="mockup-line-content code">\`\`\`mermaid</span>
        </div>
        <div class="mockup-line">
          <span class="mockup-line-number">9</span>
          <span class="mockup-line-content code">flowchart TD</span>
        </div>
        <div class="mockup-line">
          <span class="mockup-line-number">10</span>
          <span class="mockup-line-content code">    A[Start] --> B{Decision}</span>
        </div>
      </div>
      <div class="mockup-preview">
        <h1>Project Roadmap</h1>
        <p style="${previewTextColor}"><strong>Phase 1: Foundation</strong></p>
        <p style="${previewTextColor}">☑ Setup repository<br>☑ Initial architecture<br>☐ Core features</p>
        <pre>flowchart TD
    A[Start] --> B{Decision}</pre>
      </div>
    </div>
  `
}
