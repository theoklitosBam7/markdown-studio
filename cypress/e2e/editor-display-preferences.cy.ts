describe('Editor display preferences', () => {
  beforeEach(() => {
    cy.viewport(1280, 900)
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.clear()
      },
    })
  })

  it('applies a source font choice immediately and restores it after reload', () => {
    cy.get('button[aria-label="Editor display"]').click()
    cy.get('dialog[open]').should('contain.text', 'Editor display')
    cy.numericSetting('Font size').clear()
    cy.numericSetting('Font size').type('20')
    cy.get('.editor-pane textarea').should('have.css', 'font-size', '20px')
    cy.get('.toolbar__document-status').should('contain.text', 'Saved')
    cy.get('button[aria-label="Close settings"]').click()
    cy.get('button[aria-label="Editor display"]').should('be.focused')
    cy.reload()
    cy.get('.editor-pane textarea').should('have.css', 'font-size', '20px')
  })

  it('keeps source, selection, and unrelated preferences through combined display edits and reset', () => {
    let textarea: HTMLTextAreaElement
    let source: string
    let previewFont: string
    cy.get<HTMLTextAreaElement>('.editor-pane textarea').then(($editor) => {
      textarea = $editor[0]!
      source = textarea.value
      textarea.setSelectionRange(10, 20, 'backward')
    })
    cy.get('.rendered-md').then(($preview) => {
      previewFont = getComputedStyle($preview[0]!).fontSize
    })
    cy.window().then((win) => {
      win.localStorage.setItem('markdown-studio-theme', 'dark')
      win.localStorage.setItem('markdown-studio:workspace-split-ratio', '0.6')
    })
    cy.get('button[aria-label="Editor display"]').click()
    for (const [label, value] of [
      ['Font size', '32'],
      ['Line height', '2.4'],
      ['Tab width', '8'],
      ['Column width', '40'],
    ]) {
      cy.numericSetting(label!).clear()
      cy.numericSetting(label!).type(value!)
    }
    cy.get('input[aria-label="Word wrap"]').uncheck()
    cy.get<HTMLTextAreaElement>('.editor-pane textarea').should(($editor) => {
      expect($editor[0]).to.equal(textarea)
      expect(textarea.value).to.equal(source)
      expect([
        textarea.selectionStart,
        textarea.selectionEnd,
        textarea.selectionDirection,
      ]).to.deep.equal([10, 20, 'backward'])
      expect(textarea.wrap).to.equal('off')
    })
    cy.get('.editor-pane textarea')
      .should('have.css', 'font-size', '32px')
      .and('have.css', 'line-height', '76.8px')
      .and('have.css', 'tab-size', '8')
    cy.get('.rendered-md').should(($preview) =>
      expect(getComputedStyle($preview[0]!).fontSize).to.equal(previewFont),
    )
    cy.get('.toolbar__document-status').should('contain.text', 'Saved')
    cy.reload()
    cy.get('button[aria-label="Editor display"]').click()
    cy.numericSetting('Column width').should('have.value', '40')
    cy.numericSetting('Font size').clear()
    cy.numericSetting('Font size').type('16.2')
    cy.numericSetting('Font size').should('have.attr', 'aria-invalid', 'true')
    cy.get('.editor-pane textarea').should('have.css', 'font-size', '16px')
    // Cypress sees the field's frame as the focused element, so leave the field by focusing the next control.
    cy.get('select[aria-label="Writing column"]').focus()
    cy.numericSetting('Font size').should('have.value', '16')
    cy.contains('button', 'Reset editor display').click()
    cy.numericSetting('Line height').should('have.value', '1.7')
    cy.numericSetting('Tab width').should('have.value', '2')
    cy.numericSetting('Column width').should('have.value', '80')
    cy.get('input[aria-label="Word wrap"]').should('be.checked')
    cy.window().should((win) => {
      expect(win.localStorage.getItem('markdown-studio-theme')).to.equal('dark')
      expect(win.localStorage.getItem('markdown-studio:workspace-split-ratio')).to.equal('0.6')
    })
  })

  it('keeps a desktop font request while applying the mobile font floor', () => {
    cy.get('button[aria-label="Editor display"]').click()
    cy.numericSetting('Font size').clear()
    cy.numericSetting('Font size').type('14')
    cy.get('.editor-pane textarea').should('have.css', 'font-size', '14px')
    cy.viewport(390, 844)
    cy.get('.editor-pane textarea').should('have.css', 'font-size', '16px')
    cy.get('.editor-display-settings__note').should('contain.text', 'at least 16 px')
    cy.window().should((win) => {
      expect(
        JSON.parse(win.localStorage.getItem('markdown-studio:editor-display-preferences')!)
          .fontSizePx,
      ).to.equal(14)
    })
    cy.viewport(1280, 900)
    cy.get('.editor-pane textarea').should('have.css', 'font-size', '14px')
    cy.get('.editor-display-settings__note').should('not.exist')
  })

  it('keeps session settings and an accessible warning until a failed save is retried', () => {
    cy.window().then((win) => {
      const setItem = win.Storage.prototype.setItem
      cy.stub(win.Storage.prototype, 'setItem')
        .callsFake(function (this: Storage, key: string, value: string) {
          if (key === 'markdown-studio:editor-display-preferences') {
            throw new win.DOMException('Storage is full', 'QuotaExceededError')
          }
          setItem.call(this, key, value)
        })
        .as('savePreferences')
    })
    cy.get('button[aria-label="Editor display"]').click()
    cy.numericSetting('Font size').clear()
    cy.numericSetting('Font size').type('22')
    cy.get('.editor-pane textarea').should('have.css', 'font-size', '22px')
    cy.get('.editor-display-settings__warning[role="alert"]').should(
      'contain.text',
      'active for this session',
    )
    cy.get('button[aria-label="Close settings"]').click()
    cy.get('.editor-display-settings__external-warning[role="alert"]').should('be.visible')
    cy.get('@savePreferences').invoke('restore')
    cy.get('.editor-display-settings__external-warning button').click()
    cy.get('.editor-display-settings__external-warning').should('not.exist')
    cy.reload()
    cy.get('.editor-pane textarea').should('have.css', 'font-size', '22px')
  })

  it('closes desktop settings with Escape and returns focus to its toolbar control', () => {
    cy.get('button[aria-label="Editor display"]').click()
    cy.numericSetting('Font size').trigger('keydown', { key: 'Escape' })
    cy.get('dialog.editor-display-settings').should('not.be.visible')
    cy.get('button[aria-label="Editor display"]').should('be.focused')
  })

  it('hands off the mobile menu to a modal bottom sheet in landscape', () => {
    cy.viewport(900, 390)
    cy.get('button[aria-label="Menu"]').click()
    cy.contains('.mobile-action-sheet__action', 'Editor display').click()
    cy.get('dialog.editor-display-settings[open]').should(($dialog) => {
      const dialog = $dialog[0]
      expect(dialog?.matches(':modal')).to.equal(true)
      expect(dialog?.getBoundingClientRect().bottom).to.be.closeTo(390, 1)
    })
    cy.get('.mobile-action-sheet[role="dialog"]').should('not.exist')
    cy.numericSetting('Font size').clear()
    cy.numericSetting('Font size').type('18')
    cy.viewport(1280, 900)
    cy.numericSetting('Font size').should('have.value', '18')
    cy.get('dialog.editor-display-settings[open]').should(($dialog) => {
      expect($dialog[0]?.matches(':modal')).to.equal(false)
    })
  })

  it('finds the editor display Command through its column width search terms', () => {
    cy.get('.editor-pane textarea').focus()
    cy.get('.editor-pane textarea').type('{ctrl}k')
    cy.get('.command-palette__input').type('column width')
    cy.contains('.command-palette__results', 'Editor display settings...').should('be.visible')
    cy.get('.command-palette__input').type('{enter}')
    cy.get('.command-palette').should('not.exist')
    cy.get('dialog.editor-display-settings[open]').should('be.visible')
    cy.numericSetting('Font size').type('{ctrl}k')
    cy.get('.command-palette').should('not.exist')
    cy.get('button[aria-label="Close settings"]').click()
    cy.get('.editor-pane textarea').should('be.focused')
  })

  it(
    'keeps pending source Redo after ordinary key entry in a numeric setting',
    { browser: '!firefox' },
    () => {
      leavePendingSourceRedo()
      cy.get('button[aria-label="Editor display"]').click()
      selectNumericSetting('Font size')
      for (const key of ['2', '4']) {
        sendBrowserInput('Input.dispatchKeyEvent', { key, text: key, type: 'keyDown' })
        sendBrowserInput('Input.dispatchKeyEvent', { key, type: 'keyUp' })
      }
      cy.get('.editor-pane textarea').should('have.css', 'font-size', '24px')
      cy.get('button[aria-label="Close settings"]').click()
      cy.get('button[aria-label="Redo"]').click()
      cy.get('.editor-pane textarea').should('have.value', 'composition historyx')
    },
  )

  it(
    'keeps pending source Redo after trusted composition in a numeric setting',
    { browser: '!firefox' },
    () => {
      leavePendingSourceRedo()
      cy.get('button[aria-label="Editor display"]').click()
      selectNumericSetting('Font size')
      sendBrowserInput('Input.imeSetComposition', {
        selectionEnd: 2,
        selectionStart: 2,
        text: '24',
      })
      sendBrowserInput('Input.insertText', { text: '24' })
      cy.get('.editor-pane textarea').should('have.css', 'font-size', '24px')
      cy.get('button[aria-label="Close settings"]').click()
      cy.get('button[aria-label="Redo"]').click()
      cy.get('.editor-pane textarea').should('have.value', 'composition historyx')
    },
  )
})

function leavePendingSourceRedo() {
  cy.get('button[aria-label="Document actions"]').click()
  cy.get('button[aria-label="Clear document"]').click()
  cy.get('button[aria-label="Confirm clear"]').click()
  cy.get('.editor-pane textarea').should('have.value', '').focus()
  sendBrowserInput('Input.insertText', { text: 'composition history' })
  cy.get('.editor-pane textarea').should('have.value', 'composition history').blur()
  // A focus change ends the native typing group, so Undo removes only the next edit.
  cy.get('.editor-pane textarea').focus()
  cy.get<HTMLTextAreaElement>('.editor-pane textarea').then(($editor) =>
    $editor[0]!.setSelectionRange(19, 19),
  )
  sendBrowserInput('Input.insertText', { text: 'x' })
  cy.get('.editor-pane textarea').should('have.value', 'composition historyx')
  cy.get('button[aria-label="Undo"]').click()
  cy.get('.editor-pane textarea').should('have.value', 'composition history')
}

function selectNumericSetting(label: string) {
  cy.numericSetting(label).focus()
  cy.numericSetting(label).then(($input) => $input[0]!.select())
}

// Cypress typing is synthetic and never reaches native edit history, so history tests use trusted browser input.
// The debugger protocol works only in Chromium, so callers exclude Firefox.
function sendBrowserInput(command: string, params: Record<string, unknown>) {
  cy.then(() => Cypress.automation('remote:debugger:protocol', { command, params }))
}
