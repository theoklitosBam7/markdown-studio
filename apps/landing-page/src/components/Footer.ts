// Footer Component
export function Footer(): string {
  return `
    <footer class="footer">
      <div class="container">
        <div class="footer-content">
          <div class="footer-left">
            <div class="logo">
              <div class="logo-icon">📝</div>
              <span>Markdown Studio</span>
            </div>
            <p class="footer-copyright">
              © ${new Date().getFullYear()} Theoklitos Bampouris. Released under the MIT License.
            </p>
          </div>

          <div class="footer-links">
            <a href="https://github.com/theoklitosBam7/markdown-studio"
               class="footer-link"
               target="_blank"
               rel="noopener noreferrer">
              GitHub
            </a>
            <a href="https://github.com/theoklitosBam7/markdown-studio/blob/main/README.md"
               class="footer-link"
               target="_blank"
               rel="noopener noreferrer">
              Documentation
            </a>
            <a href="https://github.com/theoklitosBam7/markdown-studio/issues"
               class="footer-link"
               target="_blank"
               rel="noopener noreferrer">
              Issues
            </a>
          </div>
        </div>
      </div>
    </footer>
  `
}
