function expectPaneWidths(editorWidth: number, previewWidth: number): void {
  cy.get('.editor-pane').should(($pane) => {
    expect($pane[0]?.getBoundingClientRect().width).to.be.closeTo(editorWidth, 0.5)
  })
  cy.get('.preview-pane').should(($pane) => {
    expect($pane[0]?.getBoundingClientRect().width).to.be.closeTo(previewWidth, 0.5)
  })
}

function setEditorPercentage(percentage: string): void {
  cy.get('button[aria-label="Pane widths"]').click()
  cy.get('input[aria-label="Editor percentage"]').clear()
  cy.get('input[aria-label="Editor percentage"]').type(percentage)
  cy.get('.workspace-split form').submit()
  cy.get('input[aria-label="Editor percentage"]').type('{esc}')
}

describe('Editor Workspace resizing', () => {
  beforeEach(() => {
    cy.viewport(1280, 900)
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.clear()
      },
    })
  })

  it('opens the sidebar width controls without clipping or shifting the outline', () => {
    cy.get('button[aria-label="Show document outline"]').click()
    cy.get('.outline-sidebar').should('have.css', 'width', '248px')
    cy.get('button[aria-label="Sidebar width"]').click()
    cy.get('.outline-sidebar').should(($sidebar) => {
      expect($sidebar[0]?.getBoundingClientRect().left).to.be.closeTo(56, 1)
    })
    cy.contains('button', 'Reset sidebar width').should('be.visible')
    cy.get('input[aria-label="Sidebar width in pixels"]').clear()
    cy.get('input[aria-label="Sidebar width in pixels"]').type('360')
    cy.get('.workspace-sidebar__area form').submit()
    cy.get('.outline-sidebar').should('have.css', 'width', '360px')
    cy.window()
      .its('localStorage')
      .invoke('getItem', 'markdown-studio:workspace-sidebar-width')
      .should('eq', '360')
  })

  it('dismisses width panels without saving drafts or blocking the next interaction', () => {
    cy.get('button[aria-label="Show document outline"]').click()
    cy.get('.outline-sidebar').should('have.css', 'width', '248px')
    cy.get('button[aria-label="Sidebar width"]').click()
    cy.get('input[aria-label="Sidebar width in pixels"]').clear()
    cy.get('input[aria-label="Sidebar width in pixels"]').type('360')

    cy.get('button[aria-label="Pane widths"]').click()
    cy.get('button[aria-label="Sidebar width"]').should('have.attr', 'aria-expanded', 'false')
    cy.get('input[aria-label="Sidebar width in pixels"]').should('not.exist')
    cy.get('input[aria-label="Editor percentage"]').should('be.focused').clear()
    cy.get('input[aria-label="Editor percentage"]').type('65')
    cy.get('.editor-pane textarea').click()
    cy.get('.editor-pane textarea').should('be.focused')
    cy.get('.workspace-width-control__panel').should('not.exist')
    cy.window().should((win) => {
      expect(win.localStorage.getItem('markdown-studio:workspace-split-ratio')).to.eq(null)
      expect(win.localStorage.getItem('markdown-studio:workspace-sidebar-width')).to.eq(null)
    })

    cy.get('button[aria-label="Pane widths"]').click()
    cy.get('input[aria-label="Editor percentage"]').should('have.value', '50')
    cy.get('button[aria-label="Close width controls"]').click()
    cy.get('button[aria-label="Pane widths"]').should('be.focused')

    cy.get('button[aria-label="Sidebar width"]').click()
    cy.get('input[aria-label="Sidebar width in pixels"]').should('have.value', '248')
    cy.get('.rendered-md h1').click()
    cy.get('.workspace-width-control__panel').should('not.exist')
  })

  it('keeps both width panels inside the Editor Workspace at a narrow desktop width', () => {
    cy.viewport(710, 900)
    cy.get('button[aria-label="Show document outline"]').click()
    cy.get('.outline-sidebar').should('have.css', 'width', '200px')

    for (const label of ['Pane widths', 'Sidebar width']) {
      cy.get(`button[aria-label="${label}"]`).click()
      cy.get('.workspace-width-control__panel').should(($panel) => {
        const panel = $panel[0]?.getBoundingClientRect()
        expect(panel?.left).to.be.at.least(56)
        expect(panel?.right).to.be.at.most(710)
      })
      cy.get('button[aria-label="Close width controls"]').click()
      cy.get(`button[aria-label="${label}"]`).should('be.focused')
    }
  })

  it('preserves independent preferences through constraints, local resets, and reload', () => {
    cy.viewport(1352, 900)
    cy.get('button[aria-label="Show document outline"]').click()
    cy.get('.outline-sidebar').should('have.css', 'width', '248px')
    setEditorPercentage('60')
    expectPaneWidths(600, 400)
    cy.get('button[aria-label="Sidebar width"]').click()
    cy.contains('button', 'Reset sidebar width').click()
    cy.get('input[aria-label="Sidebar width in pixels"]').type('{esc}')

    cy.viewport(856, 900)
    cy.get('.outline-sidebar').should('have.css', 'width', '200px')
    expectPaneWidths(276, 276)
    cy.window().should((win) => {
      expect(win.localStorage.getItem('markdown-studio:workspace-split-ratio')).to.eq('0.6')
      expect(win.localStorage.getItem('markdown-studio:workspace-sidebar-width')).to.eq('248')
    })

    cy.viewport(1352, 900)
    expectPaneWidths(600, 400)
    cy.reload()
    cy.get('button[aria-label="Show document outline"]').click()
    cy.get('.outline-sidebar').should('have.css', 'width', '248px')
    expectPaneWidths(600, 400)

    cy.get('[role="separator"][aria-label="Markdown editor width"]').dblclick()
    expectPaneWidths(500, 500)
    cy.window().should((win) => {
      expect(win.localStorage.getItem('markdown-studio:workspace-split-ratio')).to.eq('0.5')
      expect(win.localStorage.getItem('markdown-studio:workspace-sidebar-width')).to.eq('248')
    })
  })

  it('preserves typing, Find, Source Navigation, and diagrams after resizing', () => {
    const source =
      '# Writing check\n\nWrapped words remain editable.\n\n## Second\n\nFind this sentence.\n\n```mermaid\ngraph TD; A-->B;\n```'
    cy.get('.editor-pane textarea').clear()
    cy.get('.editor-pane textarea').type(source, { delay: 0, parseSpecialCharSequences: false })
    cy.get('.mermaid-wrap svg').should('exist')
    setEditorPercentage('40')
    cy.get('.editor-pane textarea').should('have.value', source)

    cy.get('button[aria-label="Find in document"]').click()
    cy.get('.find-replace-bar__input').type('sentence')
    cy.get('.match-overlay mark').should('have.length', 1)
    cy.get('.find-replace-bar__input').type('{esc}')
    cy.contains('.rendered-md h2', 'Second').dblclick()
    cy.get<HTMLTextAreaElement>('.editor-pane textarea').should(($textarea) => {
      expect($textarea[0]?.selectionStart).to.eq(source.indexOf('## Second'))
    })
    cy.get('.mermaid-wrap svg').should('exist')
  })

  it('keeps the existing mobile outline and single-pane modes without changing desktop widths', () => {
    setEditorPercentage('60')
    cy.viewport(390, 844)
    cy.get('[role="separator"]').should('not.exist')
    cy.get('.editor-pane textarea').should('be.visible')
    cy.get('button[aria-label="Show document outline"]').click()
    cy.get('.outline-sidebar').should('have.css', 'width', '390px')
    cy.get('.editor-pane').should('not.be.visible')
    cy.get('button[aria-label="Hide document outline"]').click()
    cy.get('.editor-pane textarea').should('be.visible')

    cy.viewport(900, 390)
    cy.get('[role="separator"]').should('not.exist')
    cy.get('.editor-pane textarea').should('be.visible')
    cy.viewport(1280, 900)
    cy.get('.editor-pane textarea').should('be.visible')
    cy.get('[role="separator"]').should('not.exist')
    cy.contains('button', 'Split').click()
    cy.get('[role="separator"][aria-label="Markdown editor width"]').should(
      'have.attr',
      'aria-valuenow',
      '60',
    )
    cy.window()
      .its('localStorage')
      .invoke('getItem', 'markdown-studio:workspace-split-ratio')
      .should('eq', '0.6')
  })
})
