describe('Theme switching', () => {
  it('switches themes without a gradual window transition', () => {
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem('markdown-studio-theme', 'light')
      },
    })

    cy.get('button[aria-label="Switch to dark mode"]').click()
    cy.get('html').should('have.attr', 'data-theme', 'dark')
    cy.window().then((win) => {
      const animations = win.document.documentElement.getAnimations({ subtree: true })
      const windowReveal = animations.some(
        (animation) =>
          animation.effect instanceof win.KeyframeEffect &&
          animation.effect.pseudoElement === '::view-transition-new(root)',
      )
      const backgroundTransition = win.document.body
        .getAnimations()
        .some(
          (animation) =>
            animation instanceof win.CSSTransition &&
            animation.transitionProperty === 'background-color',
        )

      expect(windowReveal).to.equal(false)
      expect(backgroundTransition).to.equal(false)
    })
  })
})
