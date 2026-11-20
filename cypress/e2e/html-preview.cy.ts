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

function stubDocumentOpen(win: BrowserWindow, content: string, name: string): void {
  win.showOpenFilePicker = async () =>
    [
      {
        getFile: async () => new win.File([content], name),
        kind: 'file',
        name,
      } as FileSystemFileHandle,
    ] satisfies FileSystemFileHandle[]
}

describe('HTML preview', () => {
  it('opens a self-contained HTML file in a sandboxed read-only frame', () => {
    cy.viewport(1280, 900)
    cy.visit('/', {
      onBeforeLoad(win) {
        stubDocumentOpen(win as BrowserWindow, htmlDocument, 'report.html')
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

    cy.window().then((win) => {
      stubDocumentOpen(win as BrowserWindow, '# Markdown again\n\nEditable notes.', 'notes.md')
    })
    cy.get('button[aria-label="Open document"]').click()

    cy.get('.html-preview').should('not.exist')
    cy.get('.editor-pane textarea').should('be.visible').and('contain.value', '# Markdown again')
    cy.get('.preview-pane').should('be.visible').and('contain', 'Markdown again')
    cy.get('button[data-mode="split"]').should('have.attr', 'aria-pressed', 'true')
    cy.get('button[aria-label="Save document"]').should('be.visible')
    cy.get('button[aria-label="Export document"]').should('be.visible')
    cy.get('button[aria-label="Find in document"]').should('be.visible').click()
    cy.get('.find-replace-bar__input').should('be.visible')
    cy.screenshot('markdown-after-html', { capture: 'viewport' })
  })

  it('blocks hostile scripts, remote fetches, popups, and parent DOM access', () => {
    const probe = { frameLoaded: false, messages: [] as unknown[] }
    const hostileDocument = `<!doctype html>
      <body onload="parent.postMessage('hostile-handler-ran', '*')">
        <h1>Hostile HTML preview</h1>
        <img src="https://html-preview-hostile.invalid/image.png">
        <script>
          parent.postMessage('hostile-script-ran', '*');
          try { parent.document.body.dataset.hostileAccess = 'reached'; } catch {}
          fetch('https://html-preview-hostile.invalid/fetch').catch(() => {});
          window.open('https://html-preview-hostile.invalid/popup', '_blank');
        </script>
      </body>`

    cy.intercept('https://html-preview-hostile.invalid/**', { statusCode: 204 }).as(
      'hostileNetwork',
    )
    cy.viewport(1280, 900)
    cy.visit('/', {
      onBeforeLoad(win) {
        stubDocumentOpen(win as BrowserWindow, hostileDocument, 'hostile.html')
        win.addEventListener('message', (event) => {
          if (typeof event.data === 'string' && event.data.startsWith('hostile-')) {
            probe.messages.push(event.data)
          }
        })
        win.document.addEventListener(
          'load',
          (event) => {
            if (
              event.target instanceof win.HTMLIFrameElement &&
              event.target.title === 'HTML preview'
            ) {
              probe.frameLoaded = true
            }
          },
          true,
        )
      },
    })

    cy.then(() =>
      Cypress.automation('remote:debugger:protocol', { command: 'Target.getTargets' }),
    ).then((before) => {
      cy.get('button[aria-label="Open document"]').click()
      cy.wrap(probe).its('frameLoaded').should('equal', true)
      cy.get('iframe[title="HTML preview"]').should(($frame) => {
        expect($frame.attr('sandbox')).to.equal('')
        expect($frame.attr('srcdoc')).not.to.match(/<script|onload=/i)
        expect($frame[0]).to.have.property('contentDocument', null)
      })
      cy.get('body').should('not.have.attr', 'data-hostile-access')
      cy.get('.toolbar__document strong').should('contain', 'hostile.html')
      cy.wrap(probe).its('messages').should('deep.equal', [])
      cy.get('@hostileNetwork.all').should('have.length', 0)
      cy.then(() =>
        Cypress.automation('remote:debugger:protocol', { command: 'Target.getTargets' }),
      ).then((after) => {
        const pageIds = (result: { targetInfos: { targetId: string; type: string }[] }) =>
          result.targetInfos
            .filter((target) => target.type === 'page')
            .map((target) => target.targetId)
            .sort()
        expect(pageIds(after), 'no popup browser target').to.deep.equal(pageIds(before))
      })
    })
  })
})
