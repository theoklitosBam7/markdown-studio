interface BrowserFrameTree {
  childFrames?: BrowserFrameTree[]
  frame: { id: string; loaderId: string; url: string }
}

interface BrowserTargets {
  targetInfos: { targetId: string; type: string }[]
}

type BrowserWindow = {
  showOpenFilePicker?: (options?: unknown) => Promise<FileSystemFileHandle[]>
} & typeof globalThis &
  Window

function findHtmlPreviewFrame(tree: BrowserFrameTree): BrowserFrameTree['frame'] | undefined {
  if (tree.frame.url === 'about:srcdoc') return tree.frame

  for (const child of tree.childFrames ?? []) {
    const frame = findHtmlPreviewFrame(child)
    if (frame) return frame
  }
}

function pageTargetIds(result: BrowserTargets): string[] {
  return result.targetInfos
    .filter((target) => target.type === 'page')
    .map((target) => target.targetId)
    .sort()
}

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

  it('keeps the HTML Preview document in place when an image-map link is clicked', () => {
    const probe = { frameLoads: 0 }
    const imageMapDocument = `<!doctype html>
      <style>body { margin: 0; }</style>
      <img width="200" height="100" alt="Report navigation" usemap="#report"
        src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='100'%3E%3Crect width='200' height='100' fill='rebeccapurple'/%3E%3C/svg%3E">
      <map name="report">
        <area shape="rect" coords="0,0,200,100" alt="Leave report"
          href="about:blank#image-map-destination" target="_self">
      </map>
      <h1>Image-map report</h1>`

    cy.viewport(1280, 900)
    cy.visit('/', {
      onBeforeLoad(win) {
        stubDocumentOpen(win as BrowserWindow, imageMapDocument, 'image-map.html')
        win.document.addEventListener(
          'load',
          (event) => {
            if (
              event.target instanceof win.HTMLIFrameElement &&
              event.target.title === 'HTML preview'
            ) {
              probe.frameLoads += 1
            }
          },
          true,
        )
      },
    })
    cy.get('button[aria-label="Open document"]').click()
    cy.wrap(probe).its('frameLoads').should('equal', 1)

    cy.then(() =>
      Cypress.automation('remote:debugger:protocol', { command: 'Page.getFrameTree' }),
    ).then(({ frameTree }: { frameTree: BrowserFrameTree }) => {
      const before = findHtmlPreviewFrame(frameTree)
      if (!before) throw new Error('Loaded srcdoc document was not found.')

      cy.then(() =>
        Cypress.automation('remote:debugger:protocol', {
          command: 'DOM.getFrameOwner',
          params: { frameId: before.id },
        }),
      ).then(({ backendNodeId }: { backendNodeId: number }) => {
        cy.then(() =>
          Cypress.automation('remote:debugger:protocol', {
            command: 'DOM.getBoxModel',
            params: { backendNodeId },
          }),
        ).then(
          ({
            model,
          }: {
            model: { content: [number, number, number, ...number[]]; width: number }
          }) => {
            const [left, top, right] = model.content
            const scale = (right - left) / model.width
            const x = Math.round(left + 40 * scale)
            const y = Math.round(top + 40 * scale)

            // Chrome coordinates include Cypress's scaled app frame and reporter offset.
            cy.then(() =>
              Cypress.automation('remote:debugger:protocol', {
                command: 'DOM.getNodeForLocation',
                params: { x, y },
              }),
            ).then(({ frameId }: { frameId: string }) => {
              expect(frameId, 'pointer hits the sandboxed document').to.equal(before.id)
            })
            cy.then(() =>
              Cypress.automation('remote:debugger:protocol', {
                command: 'Input.dispatchMouseEvent',
                params: { button: 'left', clickCount: 1, type: 'mousePressed', x, y },
              }),
            )
            cy.then(() =>
              Cypress.automation('remote:debugger:protocol', {
                command: 'Input.dispatchMouseEvent',
                params: { button: 'left', clickCount: 1, type: 'mouseReleased', x, y },
              }),
            )
          },
        )
      })

      cy.then(() =>
        Cypress.automation('remote:debugger:protocol', { command: 'Page.getFrameTree' }),
      ).then(({ frameTree: afterTree }: { frameTree: BrowserFrameTree }) => {
        expect(findHtmlPreviewFrame(afterTree), 'same frame URL and document loader').to.deep.equal(
          before,
        )
      })
      cy.wrap(probe).its('frameLoads').should('equal', 1)
      cy.get('iframe[title="HTML preview"]').should('have.attr', 'sandbox', '')
      cy.screenshot('html-preview-image-map-after-click', { capture: 'viewport' })
    })
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
        expect(pageTargetIds(after), 'no popup browser target').to.deep.equal(pageTargetIds(before))
      })
    })
  })

  it('runs hostile scripts only after opt-in and keeps them inside the frame', () => {
    const messages: string[] = []
    const scriptDocument = `<!doctype html>
      <body>
        <h1 id="headline">Script-enabled hostile preview</h1>
        <img src="https://html-preview-hostile.invalid/image.png">
        <script>
          const result = {
            content: 'unchanged',
            parentAccess: 'not-checked',
            popup: 'not-checked',
            origin: window.origin
          }
          document.getElementById('headline').textContent = 'Script changed this frame'
          result.content = document.getElementById('headline').textContent
          try {
            window.parent.document.body.dataset.hostileAccess = 'reached'
            result.parentAccess = 'reached'
          } catch {
            result.parentAccess = 'blocked'
          }
          try {
            result.popup = window.open('https://html-preview-hostile.invalid/popup', '_blank')
              ? 'opened'
              : 'blocked'
          } catch {
            result.popup = 'blocked'
          }
          fetch('https://html-preview-hostile.invalid/fetch').catch(() => {})
          parent.postMessage('enabled-hostile:' + JSON.stringify(result), '*')
        </script>
      </body>`

    cy.intercept('https://html-preview-hostile.invalid/**', { statusCode: 204 }).as(
      'enabledHostileNetwork',
    )
    cy.viewport(1280, 900)
    cy.visit('/', {
      onBeforeLoad(win) {
        stubDocumentOpen(win as BrowserWindow, scriptDocument, 'enabled-hostile.html')
        win.addEventListener('message', (event) => {
          if (typeof event.data === 'string' && event.data.startsWith('enabled-hostile:')) {
            messages.push(event.data)
          }
        })
      },
    })

    cy.then(() =>
      Cypress.automation('remote:debugger:protocol', { command: 'Target.getTargets' }),
    ).then((before) => {
      cy.get('button[aria-label="Open document"]').click()
      cy.get('iframe[title="HTML preview"]')
        .should('have.attr', 'sandbox', '')
        .invoke('attr', 'srcdoc')
        .should('not.contain', '<script')

      cy.contains('button', 'Enable scripts for this preview').click()
      cy.get('[role="status"]').should('contain', 'Scripts enabled for this preview')
      cy.get('iframe[title="HTML preview"]')
        .should('have.attr', 'sandbox', 'allow-scripts')
        .invoke('attr', 'srcdoc')
        .should('contain', '<script>')
        .and('contain', "script-src 'unsafe-inline' markdown-studio-preview:")

      cy.get('iframe[title="HTML preview"]').then(($frame) => {
        const frame = $frame[0] as HTMLIFrameElement
        expect(frame.contentDocument).to.equal(null)
      })
      cy.wrap(messages)
        .should('have.length', 1)
        .then(([message]) => {
          const result = JSON.parse(message.slice('enabled-hostile:'.length)) as {
            content: string
            origin: string
            parentAccess: string
            popup: string
          }

          expect(result.content).to.equal('Script changed this frame')
          expect(result.parentAccess).to.equal('blocked')
          expect(result.popup).to.equal('blocked')
          expect(result.origin).to.equal('null')
        })
      cy.get('body').should('not.have.attr', 'data-hostile-access')
      cy.get('@enabledHostileNetwork.all').should('have.length', 0)

      cy.then(() =>
        Cypress.automation('remote:debugger:protocol', { command: 'Target.getTargets' }),
      ).then((after) => {
        expect(pageTargetIds(after), 'no popup browser target').to.deep.equal(pageTargetIds(before))
      })

      cy.screenshot('html-preview-scripts-enabled', { capture: 'viewport' })

      cy.window().then((win) => {
        stubDocumentOpen(win as BrowserWindow, '<p>Another document</p>', 'another.html')
      })
      cy.get('button[aria-label="Open document"]').click()
      cy.get('[role="status"]').should('not.exist')
      cy.get('iframe[title="HTML preview"]').should('have.attr', 'sandbox', '')
    })
  })
})
