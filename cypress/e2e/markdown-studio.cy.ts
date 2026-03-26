type BrowserWindow = {
  showOpenFilePicker?: (options?: unknown) => Promise<FileSystemFileHandle[]>
  showSaveFilePicker?: (options?: unknown) => Promise<FileSystemFileHandle>
} & typeof globalThis &
  Window

function stubBrowserDownload(
  win: BrowserWindow,
  downloads: { href: string; name: string }[],
): void {
  const originalCreateElement = win.document.createElement.bind(win.document)

  win.URL.createObjectURL = () => 'blob:markdown-studio'
  win.URL.revokeObjectURL = () => undefined
  win.showSaveFilePicker = undefined

  win.document.createElement = ((tagName: string, options?: ElementCreationOptions) => {
    const element = originalCreateElement(tagName, options)

    if (tagName.toLowerCase() === 'a') {
      const anchor = element as HTMLAnchorElement
      anchor.click = () => {
        downloads.push({
          href: anchor.href,
          name: anchor.download,
        })
      }
    }

    return element
  }) as typeof win.document.createElement
}

function stubBrowserOpen(win: BrowserWindow, fileName: string, content: string): void {
  win.showOpenFilePicker = async () =>
    [
      {
        getFile: async () => new win.File([content], fileName, { type: 'text/markdown' }),
        kind: 'file',
        name: fileName,
      } as FileSystemFileHandle,
    ] satisfies FileSystemFileHandle[]
}

function stubBrowserOpenFallbackInput(
  win: BrowserWindow,
  fileName: string,
  content: string,
  options?: { delayMs?: number; pickerError?: DOMException },
): void {
  const originalCreateElement = win.document.createElement.bind(win.document)
  const selectedFile = new win.File([content], fileName, { type: 'text/markdown' })

  if (options?.pickerError) {
    win.showOpenFilePicker = async () => {
      throw options.pickerError
    }
  } else {
    win.showOpenFilePicker = undefined
  }

  win.document.createElement = ((tagName: string, elementOptions?: ElementCreationOptions) => {
    const element = originalCreateElement(tagName, elementOptions)

    if (tagName.toLowerCase() === 'input') {
      const input = element as HTMLInputElement
      const originalClick = input.click.bind(input)

      input.click = () => {
        originalClick()
        win.dispatchEvent(new win.Event('blur'))
        win.dispatchEvent(new win.Event('focus'))

        win.setTimeout(() => {
          Object.defineProperty(input, 'files', {
            configurable: true,
            value: [selectedFile],
          })

          input.dispatchEvent(new win.Event('change'))
        }, options?.delayMs ?? 0)
      }
    }

    return element
  }) as typeof win.document.createElement
}

function stubBrowserSavePicker(win: BrowserWindow, writes: string[], fileName: string): void {
  win.showSaveFilePicker = async () =>
    ({
      createWritable: async () =>
        ({
          close: async () => undefined,
          write: async (value: string) => {
            writes.push(value)
          },
        }) as unknown as FileSystemWritableFileStream,
      kind: 'file',
      name: fileName,
    }) as FileSystemFileHandle
}

describe('Markdown Studio responsive shell', () => {
  it('keeps the primary mobile controls visible and usable', () => {
    cy.viewport('iphone-6')
    cy.visit('/')

    cy.get('.toolbar__actions').contains('button', 'Open').should('be.visible')
    cy.get('.toolbar__actions').contains('button', 'Save').should('be.visible')
    cy.get('.toolbar__mobile-controls').contains('button', 'Preview').click()
    cy.get('.preview-pane').should('be.visible')
    cy.get('.editor-pane').should('not.be.visible')

    cy.get('.toolbar__mobile-controls button[aria-label="Switch to dark mode"]')
      .should('be.visible')
      .click()
    cy.get('html').should('have.attr', 'data-theme', 'dark')

    cy.get('.toolbar__actions').contains('button', 'Examples').click()
    cy.contains('[role="dialog"] h2', 'Load an example').should('be.visible')
    cy.get('[role="dialog"]').should(($dialog) => {
      const dialogRect = $dialog[0].getBoundingClientRect()
      expect(dialogRect.right).to.be.lessThan(Cypress.config('viewportWidth') + 1)
      expect(dialogRect.left).to.be.greaterThan(-1)
    })
    cy.get('button[aria-label="Close dialog"]').click()

    cy.window().then((win) => {
      cy.stub(win, 'confirm').returns(true)
    })
    cy.get('.toolbar__actions').contains('button', 'Clear').click()
    cy.get('textarea').should('have.value', '')
  })

  it('keeps split view on desktop and hides it on mobile', () => {
    cy.viewport(1280, 900)
    cy.visit('/')
    cy.get('.toolbar__actions').contains('button', 'Open').should('be.visible')
    cy.get('.toolbar__actions').contains('button', 'Save').should('be.visible')
    cy.get('.toolbar__desktop-controls').contains('button', 'Split').should('be.visible')
    cy.get('.editor-pane').should('be.visible')
    cy.get('.preview-pane').should('be.visible')

    cy.viewport('iphone-6')
    cy.visit('/')
    cy.contains('button', 'Split').should('not.exist')
    cy.get('.toolbar__mobile-controls').contains('button', 'Editor').should('be.visible')
    cy.get('.toolbar__mobile-controls').contains('button', 'Preview').should('be.visible')
  })

  it('opens a markdown file from the web toolbar', () => {
    cy.viewport(1280, 900)
    cy.visit('/', {
      onBeforeLoad(win) {
        stubBrowserOpen(win, 'web-notes.md', '# Imported from Cypress')
      },
    })

    cy.get('.toolbar__actions').contains('button', 'Open').click()

    cy.get('textarea').should('have.value', '# Imported from Cypress')
    cy.get('.status-item--document').should('contain', 'web-notes.md')
    cy.get('.status-bar').should('contain', 'Opened web-notes.md')
  })

  it('opens a markdown file when the browser file input change arrives after focus returns', () => {
    cy.viewport(1280, 900)
    cy.visit('/', {
      onBeforeLoad(win) {
        stubBrowserOpenFallbackInput(win, 'brave-delayed.md', '# Loaded via fallback', {
          delayMs: 50,
        })
      },
    })

    cy.get('.toolbar__actions').contains('button', 'Open').click()

    cy.get('textarea').should('have.value', '# Loaded via fallback')
    cy.get('.status-item--document').should('contain', 'brave-delayed.md')
    cy.get('.status-bar').should('contain', 'Opened brave-delayed.md')
  })

  it('falls back to the browser file input when showOpenFilePicker fails', () => {
    cy.viewport(1280, 900)
    cy.visit('/', {
      onBeforeLoad(win) {
        stubBrowserOpenFallbackInput(win, 'picker-fallback.md', '# Recovered from picker error', {
          pickerError: new win.DOMException('Denied', 'SecurityError'),
        })
      },
    })

    cy.get('.toolbar__actions').contains('button', 'Open').click()

    cy.get('textarea').should('have.value', '# Recovered from picker error')
    cy.get('.status-item--document').should('contain', 'picker-fallback.md')
    cy.get('.status-bar').should('contain', 'Opened picker-fallback.md')
  })

  it('downloads markdown from the web toolbar when no persistent file handle exists', () => {
    cy.viewport(1280, 900)
    const downloads: { href: string; name: string }[] = []

    cy.visit('/', {
      onBeforeLoad(win) {
        stubBrowserDownload(win, downloads)
      },
    })

    cy.get('textarea').clear()
    cy.get('textarea').type('# Downloaded from web')
    cy.get('.toolbar__actions').contains('button', 'Save').click()

    cy.wrap(null).then(() => {
      expect(downloads).to.have.length(1)
      expect(downloads[0]).to.deep.equal({
        href: 'blob:markdown-studio',
        name: 'Untitled.md',
      })
    })
    cy.get('.status-item--document').should('contain', 'Untitled.md')
    cy.get('.status-bar').should('contain', 'Saved Untitled.md')
  })

  it('reuses the browser save handle after the first save', () => {
    cy.viewport(1280, 900)
    const writes: string[] = []

    cy.visit('/', {
      onBeforeLoad(win) {
        stubBrowserSavePicker(win, writes, 'picked-from-browser.md')
      },
    })

    cy.get('textarea').clear()
    cy.get('textarea').type('# First save')
    cy.get('.toolbar__actions').contains('button', 'Save').click()
    cy.get('.status-item--document').should('contain', 'picked-from-browser.md')

    cy.get('textarea').clear()
    cy.get('textarea').type('# Second save')
    cy.get('.toolbar__actions').contains('button', 'Save').click()

    cy.wrap(null).then(() => {
      expect(writes).to.deep.equal(['# First save', '# Second save'])
    })
    cy.get('.status-bar').should('contain', 'Saved picked-from-browser.md')
  })

  it('syncs preview scrolling with the editor in split mode', () => {
    cy.viewport(1280, 900)
    cy.visit('/')

    cy.get('textarea').then(($textarea) => {
      const textarea = $textarea[0] as HTMLTextAreaElement
      textarea.scrollTop = 240
      textarea.dispatchEvent(new Event('scroll'))
    })

    cy.get('.preview-scroll').should(($preview) => {
      expect(($preview[0] as HTMLDivElement).scrollTop).to.be.greaterThan(0)
    })
  })

  it('focuses the editor at the clicked preview block in split mode', () => {
    cy.viewport(1280, 900)
    cy.visit('/')

    cy.contains('.rendered-md h3[data-source-start]', 'Lists').dblclick()

    cy.get('textarea').then(($textarea) => {
      const textarea = $textarea[0] as HTMLTextAreaElement
      const targetOffset = textarea.value.indexOf('### Lists')

      expect(textarea.selectionStart).to.equal(targetOffset)
      expect(textarea.selectionEnd).to.equal(targetOffset)
      expect(textarea).to.equal(textarea.ownerDocument.activeElement)
    })
  })

  it('does not jump back to the editor when preview is the only visible pane', () => {
    cy.viewport('iphone-6')
    cy.visit('/')
    cy.get('.toolbar__mobile-controls').contains('button', 'Preview').click()

    cy.get('.rendered-md [data-source-start]').first().dblclick()

    cy.get('.preview-pane').should('be.visible')
    cy.get('.editor-pane').should('not.be.visible')
  })
})
