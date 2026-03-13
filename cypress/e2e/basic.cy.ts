describe('Contract Clause Tracker - Basic Functionality', () => {
  beforeEach(() => {
    // Visit the application dashboard (default landing page)
    cy.visit('/', { timeout: 10000 })
  })

  it('should load the home page with header', () => {
    // Check that the app header is visible with logo
    cy.get('.app-header').should('be.visible')
    cy.get('.logo').should('contain', 'SampleLogo')
  })

  it('should have navigation links', () => {
    // Check navigation exists
    cy.get('.main-nav').should('be.visible')
    cy.get('a[routerLink="/upload"]').should('be.visible')
    cy.get('a[routerLink="/dashboard"]').should('be.visible')
  })

  it('should navigate to upload page via nav', () => {
    cy.get('a[routerLink="/upload"]').first().click()
    cy.url().should('include', '/upload', { timeout: 5000 })
  })

  it('should navigate to dashboard', () => {
    cy.get('a[routerLink="/dashboard"]').click()
    cy.url().should('include', '/contracts', { timeout: 5000 })
    cy.get('h1').should('contain', 'All Contracts')
  })

  it('should show dashboard page with contracts section', () => {
    cy.visit('/contracts', { timeout: 10000 })
    cy.get('h1').should('contain', 'All Contracts')
    cy.get('.page').should('be.visible')
  })
})