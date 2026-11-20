type BrowserWindow = {
  showOpenFilePicker?: (options?: unknown) => Promise<FileSystemFileHandle[]>
} & typeof globalThis &
  Window

const htmlDocument = `<!doctype html>
<html>
  <head>
    <title>Report</title>
    <style>.report { color: rebeccapurple; }</style>
  </head>
  <body>
    <h1 class="report">Quarterly report</h1>
    <script>window.parent.document.body.remove()</script>
  </body>
</html>`

function stubHtmlOpen(win: BrowserWindow): void {
  win.showOpenFilePicker = async () =>
    [
      {
        getFile: async () => new win.File([htmlDocument], 'report.html', { type: 'text/html' }),
        kind: 'file',
        name: 'report.html',
      } as FileSystemFileHandle,
    ] satisfies FileSystemFileHandle[]
}

describe('HTML preview', () => {
  it('opens a self-contained HTML file in a sandboxed read-only frame', () => {
    cy.viewport(1280, 900)
    cy.visit('/', {
      onBeforeLoad(win) {
        stubHtmlOpen(win as BrowserWindow)
      },
    })

    cy.get('button[aria-label="Open document"]').click()

    cy.get('.html-preview').should('be.visible')
    cy.get('iframe[title="HTML preview"]').should(($frame) => {
      expect($frame.attr('sandbox')).to.equal('')
    })
    cy.get('iframe')
      .invoke('attr', 'srcdoc')
      .should('contain', "default-src 'none'")
      .and('contain', '.report { color: rebeccapurple; }')
      .and('not.contain', '<script')

    cy.get('textarea').should('not.exist')
    cy.get('.preview-pane').should('not.exist')
    cy.get('button[aria-label="Save document"]').should('not.exist')
    cy.get('button[aria-label="Export document"]').should('not.exist')
    cy.get('.toolbar__document strong').should('contain', 'report.html')
    cy.get('.status-bar').should('contain', 'read-only')
    cy.screenshot('html-preview-default', { capture: 'viewport' })
  })
})
