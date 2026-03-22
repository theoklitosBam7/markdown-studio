describe('Markdown Studio responsive shell', () => {
  it('keeps the primary mobile controls visible and usable', () => {
    cy.viewport('iphone-6')
    cy.visit('/')

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
    cy.get('.toolbar__desktop-controls').contains('button', 'Split').should('be.visible')
    cy.get('.editor-pane').should('be.visible')
    cy.get('.preview-pane').should('be.visible')

    cy.viewport('iphone-6')
    cy.visit('/')
    cy.contains('button', 'Split').should('not.exist')
    cy.get('.toolbar__mobile-controls').contains('button', 'Editor').should('be.visible')
    cy.get('.toolbar__mobile-controls').contains('button', 'Preview').should('be.visible')
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
