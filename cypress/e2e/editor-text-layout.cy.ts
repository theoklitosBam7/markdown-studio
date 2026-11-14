function replaceSource(source: string): void {
  cy.get<HTMLTextAreaElement>('.editor-pane textarea').then(($editor) => {
    const editor = $editor[0]
    if (!editor) throw new Error('Source editor is missing')
    editor.value = source
    editor.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

describe('Editor source text layout', () => {
  beforeEach(() => {
    cy.viewport(1280, 900)
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.clear()
      },
    })
  })

  it('restores text layout before rendering and reveals an unwrapped Find match horizontally', () => {
    cy.window().then((win) => {
      win.localStorage.setItem(
        'markdown-studio:editor-display-preferences',
        JSON.stringify({
          fontSizePx: 20,
          lineHeight: 2,
          tabWidth: 4,
          version: 1,
          wordWrap: false,
          writingColumn: { characters: 40, kind: 'characters' },
        }),
      )
    })
    cy.reload()
    cy.get('.editor-pane textarea').should('have.css', 'font-size', '20px')
    cy.get('.editor-pane textarea').should('have.attr', 'wrap', 'off')
    cy.get('.editor-pane textarea').clear()
    cy.get('.editor-pane textarea').type(`${'before '.repeat(60)}TARGET after`, { delay: 0 })
    cy.get('button[aria-label="Find in document"]').click()
    cy.get('.find-replace-bar__input').type('TARGET')
    cy.get('.editor-pane textarea').then(($editor) => {
      const viewport = $editor[0]?.getBoundingClientRect()
      if (!viewport) throw new Error('Source editor is missing')
      cy.get('.match-overlay mark').should(($match) => {
        const match = $match[0]?.getBoundingClientRect()
        expect(match?.left).to.be.greaterThan(viewport.left + 48)
        expect(match?.right).to.be.lessThan(viewport.right)
      })
    })
  })

  it('places logical line numbers and the active line around wrapped source text', () => {
    const paragraph = 'Wrapped words with a literal\ttab and Unicode Ελληνικά 漢字. '.repeat(8)
    const source = `${paragraph}\n## Following heading\n\nLast line\n`
    cy.get('.editor-pane textarea').clear()
    cy.get('.editor-pane textarea').type(source, {
      delay: 0,
      parseSpecialCharSequences: false,
    })
    cy.get<HTMLTextAreaElement>('.editor-pane textarea').then(($editor) => {
      $editor[0]?.setSelectionRange(0, 0)
    })
    cy.get('.editor-pane textarea').trigger('select')
    cy.get('.editor-pane textarea').scrollTo('top', { ensureScrollable: false })

    cy.get('.editor-line-numbers li').should(($numbers) => {
      expect($numbers).to.have.length(5)
      const first = $numbers[0]?.getBoundingClientRect()
      const second = $numbers[1]?.getBoundingClientRect()
      if (!first || !second) throw new Error('Logical line numbers are missing')
      expect(second.top - first.top).to.be.greaterThan(100)
    })
    cy.get('.active-line-highlight').should(($highlight) => {
      expect($highlight[0]?.getBoundingClientRect().height).to.be.greaterThan(100)
    })
  })

  it('keeps Live Preview at the same source block while scrolling within a wrapped line', () => {
    const source = `${'A long source paragraph wraps without adding logical lines. '.repeat(100)}\n\n## Following block\n\n${'More content.\n\n'.repeat(50)}`
    replaceSource(source)
    cy.contains('.rendered-md h2', 'Following block').should('exist')
    // Firefox's native textarea scroll frame reports overflow: visible.
    cy.get('.editor-pane textarea').scrollTo(0, 400, { ensureScrollable: false })
    cy.get('.editor-pane textarea').should('have.prop', 'scrollTop', 400)
    cy.get('.preview-scroll').should(($preview) => {
      expect($preview[0]?.scrollTop).to.be.lessThan(50)
    })
  })

  it('keeps the same Live Preview source block after remeasuring a scrolled document', () => {
    const source = Array.from(
      { length: 40 },
      (_, index) =>
        `## Section ${index + 1}\n\n${'A paragraph with wrapped source text. '.repeat(20)}\n\n`,
    ).join('')
    replaceSource(source)
    cy.contains('.rendered-md h2', 'Section 40').should('exist')
    let scrollFinished = false
    cy.get<HTMLTextAreaElement>('.editor-pane textarea').then(($editor) => {
      $editor[0]!.addEventListener(
        'scroll',
        () => {
          scrollFinished = true
        },
        { once: true },
      )
    })
    cy.get('.editor-pane textarea').scrollTo(0, 1000, { ensureScrollable: false })
    // Firefox can deliver the native scroll event after scrollTo finishes.
    cy.get<HTMLTextAreaElement>('.editor-pane textarea').should(($editor) => {
      expect(scrollFinished).to.equal(true)
      expect($editor[0]!.scrollTop).to.be.greaterThan(0)
    })
    cy.get('.preview-scroll').should(($preview) => {
      expect($preview[0]?.scrollTop).to.be.greaterThan(0)
    })
    function firstVisibleBlock(container: HTMLElement): null | string {
      const top = container.getBoundingClientRect().top
      const block = Array.from(container.querySelectorAll('[data-source-start]')).find(
        (element) => element.getBoundingClientRect().bottom > top,
      )
      return block?.getAttribute('data-source-start') ?? null
    }
    let sourceBlock: null | string
    cy.get<HTMLElement>('.preview-scroll').then(($preview) => {
      sourceBlock = firstVisibleBlock($preview[0]!)
      expect(sourceBlock).not.to.equal(null)
    })
    cy.get('button[aria-label="Editor display"]').click()
    cy.get('input[aria-label="Font size"]').clear()
    cy.get('input[aria-label="Font size"]').type('22')
    cy.get('button[aria-label="Close settings"]').click()
    cy.get('.editor-pane textarea').should('have.css', 'font-size', '22px')
    cy.get<HTMLElement>('.preview-scroll').should(($preview) => {
      // Scroll synchronization preserves the source block, not exact Preview pixels.
      expect(firstVisibleBlock($preview[0]!)).to.equal(sourceBlock)
    })
    cy.contains('.rendered-md h2', 'Section 40').dblclick()
    cy.get<HTMLTextAreaElement>('.editor-pane textarea').should(($editor) => {
      expect($editor[0]?.selectionStart).to.equal(source.indexOf('## Section 40'))
    })
  })

  it('reveals a Find match inside a long wrapped logical line', () => {
    const source = `${'Wrapping text before the match. '.repeat(80)}TARGET${' Following text.'.repeat(80)}`
    replaceSource(source)
    cy.get('button[aria-label="Find in document"]').click()
    cy.get('.find-replace-bar__input').type('TARGET')
    cy.get('.editor-pane textarea').then(($editor) => {
      const viewport = $editor[0]?.getBoundingClientRect()
      if (!viewport) throw new Error('Source editor is missing')
      cy.get('.match-overlay mark').should(($match) => {
        const match = $match[0]?.getBoundingClientRect()
        expect(match?.top).to.be.greaterThan(viewport.top)
        expect(match?.bottom).to.be.lessThan(viewport.bottom)
      })
    })
  })

  it('reveals a heading after a long wrapped paragraph through Source Navigation', () => {
    const paragraph =
      'A wrapped paragraph needs several visual rows before the next heading. '.repeat(40)
    const source = `${paragraph}\n\n## Destination\n\nFollowing text.\n`
    replaceSource(source)
    cy.get('.editor-pane textarea').scrollTo('top', { ensureScrollable: false })
    cy.get('.editor-pane textarea').should('have.prop', 'scrollTop', 0)
    cy.contains('.rendered-md h2', 'Destination').dblclick()
    cy.get<HTMLTextAreaElement>('.editor-pane textarea').should(($editor) => {
      expect($editor[0]?.selectionStart).to.equal(source.indexOf('## Destination'))
      expect($editor[0]?.scrollTop).to.be.greaterThan(200)
    })
  })
})
