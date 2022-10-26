/// <reference types="cypress" />

it('loads a list of books', () => {
  cy.visit('/')
  cy.get('[data-testid=book]').should('have.length.gt', 3)
})

it('spy on the network load', () => {
  cy.intercept('/books').as('books')
  cy.visit('/')
  cy.wait('@books')
    .its('response.body')
    .should('be.an', 'Array')
    .and('have.length.gt', 5)
    .then((books) => {
      cy.get('[data-testid=book]').should('have.length', books.length)
    })
})

it('shows loading indicator', () => {
  // slow down the response by 1 second
  // https://on.cypress.io/intercept
  cy.intercept('/books', (req) => {
    // use bundled Bluebird library
    // which has utility method .delay
    // https://on.cypress.io/promise
    return Cypress.Promise.delay(1000).then(() => req.continue())
  }).as('books')
  cy.visit('/')
  cy.get('[data-testid=loading]').should('be.visible')
  cy.get('[data-testid=loading]').should('not.exist')
  cy.wait('@books')
})

it('shows the loading indicator', () => {
  // slow down the response by 1 second
  // https://on.cypress.io/intercept
  cy.intercept('/books', (req) => {
    return req.continue((res) => res.setDelay(1000))
  }).as('books')
  cy.visit('/')
  // the loading indicator should be visible at first
  cy.get('[data-testid=loading]').should('be.visible')
  // the disappear
  cy.get('[data-testid=loading]').should('not.exist')
  cy.wait('@books')
})

it('shows mock data', () => {
  cy.intercept('/books', { fixture: 'books.json' })
  cy.visit('/')
  cy.get('[data-testid=book]').should('have.length', 8)
})

it('shows loading indicator (mock)', () => {
  cy.intercept('/books', {
    fixture: 'books.json',
    delay: 1000,
  }).as('books')
  cy.visit('/')
  cy.get('[data-testid=loading]').should('be.visible')
  cy.get('[data-testid=loading]').should('not.exist')
  cy.get('[data-testid=book]').should('have.length', 8)
})

it('handles network error after 1 second', () => {
  cy.intercept('/books', (req) => {
    return Cypress.Promise.delay(1000).then(() =>
      req.reply({ forceNetworkError: true }),
    )
  })
  // observe the application's behavior
  // in our case, the app simply logs the error
  cy.visit('/', {
    onBeforeLoad(win) {
      cy.spy(win.console, 'error').as('logError')
    },
  })
  cy.get('[data-testid=loading]').should('be.visible')
  // confirm the loading indicator goes away
  cy.get('[data-testid=loading]').should('not.exist')
  cy.get('@logError').should('have.been.called')
})

it('is accessible', () => {
  cy.intercept('/books', {
    fixture: 'books.json',
    delay: 2000,
  })
  cy.visit('/')
  cy.get('[aria-label="App is loading books"]').should('be.visible')
  cy.get('[aria-label="books"]')
    .should('be.visible')
    .get('[aria-label=book]')
    .should('have.length', 8)
})

