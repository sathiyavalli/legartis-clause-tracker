// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>
      drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
      dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
      visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>

      // Custom commands for Contract Clause Tracker
      uploadDocument(filePath: string): Chainable<void>
      selectTextInDocument(text: string): Chainable<void>
      assignClauseType(clauseType: string): Chainable<void>
      navigateToDashboard(): Chainable<void>
      searchDashboard(searchTerm: string): Chainable<void>
      filterByClauseType(clauseType: string): Chainable<void>
      sortDashboardBy(field: 'name' | 'date'): Chainable<void>
      confirmNavigation(): Chainable<void>
      cancelNavigation(): Chainable<void>
    }
  }
}

// Custom command to upload a document
Cypress.Commands.add('uploadDocument', (filePath: string) => {
  cy.get('input[type="file"]').selectFile(filePath, { force: true })
  cy.get('.btn-primary:has-text("Upload")').click()
  cy.url({ timeout: 10000 }).should('match', /\/contracts\/\d+/)
})

// Custom command to select text in document
Cypress.Commands.add('selectTextInDocument', (text: string) => {
  cy.contains(text).first().then($el => {
    const el = $el[0]
    const range = document.createRange()
    const selection = window.getSelection()

    range.selectNodeContents(el)
    selection?.removeAllRanges()
    selection?.addRange(range)

    // Trigger mouseup event to simulate text selection
    cy.get('.document-content').trigger('mouseup')
  })
})

// Custom command to assign clause type
Cypress.Commands.add('assignClauseType', (clauseType: string) => {
  cy.get('.modal-overlay').should('be.visible')
  cy.get('.clause-option').contains(clauseType).click()
  cy.get('.notification.success').should('be.visible')
})

// Custom command to navigate to dashboard
Cypress.Commands.add('navigateToDashboard', () => {
  cy.get('a').contains('Back to dashboard').click()
  cy.url().should('include', '/dashboard')
})

// Custom command to search dashboard
Cypress.Commands.add('searchDashboard', (searchTerm: string) => {
  cy.get('.search-input').clear().type(searchTerm)
  cy.wait(600) // Wait for debounce
})

// Custom command to filter by clause type
Cypress.Commands.add('filterByClauseType', (clauseType: string) => {
  cy.get('.dropdown-btn').click()
  cy.get('.dropdown-menu').should('be.visible')
  cy.get('.dropdown-item').contains(clauseType).click()
  cy.get('.dropdown-menu').should('not.be.visible')
})

// Custom command to sort dashboard
Cypress.Commands.add('sortDashboardBy', (field: 'name' | 'date') => {
  const headerText = field === 'name' ? 'Contract name' : 'Date added'
  cy.get('th').contains(headerText).click()
})

// Custom command to confirm navigation
Cypress.Commands.add('confirmNavigation', () => {
  cy.get('.confirmation-overlay').should('be.visible')
  cy.get('.btn-confirm').contains('Yes, Upload New').click()
  cy.get('.confirmation-overlay').should('not.be.visible')
})

// Custom command to cancel navigation
Cypress.Commands.add('cancelNavigation', () => {
  cy.get('.confirmation-overlay').should('be.visible')
  cy.get('.btn-cancel').contains('No, Stay Here').click()
  cy.get('.confirmation-overlay').should('not.be.visible')
})