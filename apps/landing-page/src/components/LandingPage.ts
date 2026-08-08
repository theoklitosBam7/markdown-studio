import {
  brand,
  brewCopyButton,
  features,
  footerLinks,
  githubLink,
  npmCopyButton,
  pwaLink,
  urls,
  usageModes,
} from '../content'
import { EditorMockup } from './EditorMockup'

export function LandingPage(): string {
  const navLinks = `
    <a href="#boot">boot</a>
    <a href="#preview">preview</a>
    <a href="#flags">flags</a>
    <a href="#install">install</a>
    <a href="${urls.github}" target="_blank" rel="noopener noreferrer">github ↗</a>
  `

  const featureRecords = features
    .map(
      (feature) => `
        <li class="landing-feature">
          <div class="landing-feature-meta">
            <span class="landing-flag">${feature.kicker}</span>
            <span class="landing-name">
              <span class="landing-feature-icon" aria-hidden="true">${feature.icon}</span>
              ${feature.title}
            </span>
          </div>
          <p class="landing-desc">${feature.description}</p>
        </li>
      `,
    )
    .join('')

  const modeBlocks = usageModes
    .map((mode, index) => {
      const action =
        mode.id === 'desktop'
          ? brewCopyButton('landing-copy')
          : mode.id === 'npx'
            ? npmCopyButton('landing-copy')
            : pwaLink('landing-open', 'open pwa')

      return `
        <article class="landing-mode ${mode.recommended ? 'is-active' : ''}" data-mode="${mode.id}">
          <header>
            <span>session/${String(index + 1).padStart(2, '0')}</span>
            <strong>${mode.title}</strong>
            ${mode.recommended ? '<em>default</em>' : ''}
          </header>
          <p>${mode.description}</p>
          <div class="landing-mode-action">${action}</div>
          ${
            mode.fallbackHref
              ? `<a class="landing-inline" href="${mode.fallbackHref}" target="_blank" rel="noopener noreferrer">// ${mode.fallbackLabel}</a>`
              : ''
          }
        </article>
      `
    })
    .join('')

  return `
    <div class="landing">
      <div class="landing-shell">
        <aside class="landing-sidebar">
          <div class="landing-brand">
            <span class="landing-prompt">~/apps</span>
            <strong>${brand.slug}</strong>
          </div>
          <nav class="landing-side-nav" aria-label="Sections">
            ${navLinks}
          </nav>
          <div class="landing-side-meta">
            <div><span>status</span><code>ready</code></div>
            <div><span>license</span><code>mit</code></div>
            <div><span>cost</span><code>0.00</code></div>
          </div>
        </aside>

        <main class="landing-main">
          <header class="landing-topbar">
            <div class="landing-topbar-row">
              <div class="landing-window-dots" aria-hidden="true">
                <span></span><span></span><span></span>
              </div>
              <div class="landing-top-title">${brand.slug} — home</div>
              <div class="landing-top-actions">
                ${pwaLink('landing-top-cta', 'run app')}
              </div>
            </div>
            <nav class="landing-mobile-nav" aria-label="Sections">
              ${navLinks}
            </nav>
          </header>

          <section class="landing-boot" id="boot">
            <pre class="landing-log" aria-label="Boot log"><code><span class="landing-dim">$</span> markdown-studio --help
<span class="landing-ok">ok</span>  live preview enabled
<span class="landing-ok">ok</span>  mermaid renderer loaded
<span class="landing-ok">ok</span>  export targets: html, pdf
<span class="landing-dim">#</span>  write markdown. see it live.</code></pre>

            <div class="landing-hero-block">
              <p class="landing-kicker">developer entrypoint</p>
              <h1>ship notes from a single command</h1>
              <p class="landing-lede">
                Markdown Studio is a local-first editor with Live Preview, Mermaid diagrams,
                and clean export paths. Start in the terminal, keep going in the browser,
                or pin the desktop build on macOS.
              </p>
              <div class="landing-hero-mobile-cta">
                ${pwaLink('landing-open landing-open-block', 'run app')}
              </div>
            </div>

            <div class="landing-command-board">
              <div class="landing-command">
                <div class="landing-command-label">
                  <span>primary</span>
                  <code>npx</code>
                </div>
                ${npmCopyButton('landing-copy landing-copy-lg')}
                <p>Runs locally, opens your browser automatically.</p>
              </div>
              <div class="landing-command">
                <div class="landing-command-label">
                  <span>desktop</span>
                  <code>brew</code>
                </div>
                ${brewCopyButton('landing-copy landing-copy-lg')}
                <p>macOS cask install with full file system integration.</p>
              </div>
            </div>
          </section>

          <section class="landing-preview" id="preview">
            <div class="landing-section-label"><span>01</span> preview.dump</div>
            ${EditorMockup({ className: 'landing-mockup' })}
          </section>

          <section class="landing-flags" id="flags">
            <div class="landing-section-label"><span>02</span> feature.table</div>
            <div class="landing-feature-board">
              <div class="landing-feature-head" aria-hidden="true">
                <span>id</span>
                <span>feature</span>
                <span>notes</span>
              </div>
              <ul class="landing-feature-list">
                ${featureRecords}
              </ul>
            </div>
          </section>

          <section class="landing-install" id="install">
            <div class="landing-section-label"><span>03</span> install.paths</div>
            <div class="landing-mode-grid">${modeBlocks}</div>
          </section>

          <section class="landing-end">
            <div class="landing-end-card">
              <pre><code>$ open ${urls.pwa.replace('https://', '')}
<span class="landing-ok">ready</span>  editor workspace online</code></pre>
              <div class="landing-end-actions">
                ${pwaLink('landing-open landing-open-block', 'launch web app')}
                ${githubLink('landing-gh landing-open-block', 'star repo')}
              </div>
            </div>
          </section>

          <footer class="landing-footer">
            <div>
              <strong>${brand.slug}</strong>
              <p>© ${brand.year} theoklitos bampouris · mit</p>
            </div>
            <div class="landing-footer-links">${footerLinks()}</div>
          </footer>
        </main>
      </div>
    </div>
  `
}
