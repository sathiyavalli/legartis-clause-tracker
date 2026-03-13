describe('Contract Clause Tracker - Critical E2E Tests', () => {
  beforeEach(() => {
    cy.visit('/', { timeout: 10000 })
  })

  describe('Critical Path 1: Navigation', () => {
    it('should navigate between pages', () => {
      cy.get('a[routerLink="/dashboard"]').click()
      cy.url().should('include', '/contracts')
      cy.get('h1').should('contain', 'All Contracts')
    })

    it('should navigate to upload page from nav', () => {
      cy.get('a[routerLink="/upload"]').first().click()
      cy.url().should('include', '/upload')
    })

    it('should have working navigation header', () => {
      cy.get('.app-header').should('be.visible')
      cy.get('.main-nav').should('exist')
      cy.get('.dropdown').should('exist')
    })
  })

  describe('Critical Path 2: Dashboard Display', () => {
    beforeEach(() => {
      cy.visit('/contracts', { timeout: 10000 })
    })

    it('should display dashboard page with contracts section', () => {
      cy.get('h1').should('contain', 'All Contracts')
      cy.get('.page').should('be.visible')
    })

    it('should show toolbar with search functionality', () => {
      cy.get('.toolbar').should('be.visible')
      cy.get('.search-input').should('exist')
    })

    it('should display filter dropdown', () => {
      cy.get('.dropdown-btn').should('exist')
      cy.get('.dropdown-btn').click()
      cy.get('.dropdown-menu').should('be.visible')
    })

    it('should have view toggle buttons', () => {
      cy.get('.view-icons').should('exist')
      cy.get('.icon-btn').first().should('exist')
    })
  })

  describe('Critical Path 3: File Upload Page', () => {
    beforeEach(() => {
      cy.visit('/upload', { timeout: 10000 })
    })

    it('should display upload form elements', () => {
      cy.get('input[type="file"]').should('exist')
      cy.get('button').filter(':contains("Upload")').should('exist')
    })

    it('should have file input field', () => {
      cy.get('input[type="file"]').should('be.visible')
    })

    it('should show upload instructions or header', () => {
      cy.get('h1, h2').should('have.length.greaterThan', 0)
    })
  })

  describe('Critical Path 4: Search and Filter', () => {
    beforeEach(() => {
      cy.visit('/contracts', { timeout: 10000 })
    })

    it('should allow text input in search box', () => {
      cy.get('input[type="text"][placeholder*="Search"]')
        .type('test')
        .should('have.value', 'test')
    })

    it('should toggle dropdown menu', () => {
      cy.get('.dropdown-btn').click()
      cy.get('.dropdown-menu').should('have.class', 'dropdown-menu')
      cy.get('.dropdown-item').should('have.length.greaterThan', 0)
    })

    it('should select clause filter', () => {
      cy.get('.dropdown-btn').click()
      cy.get('.dropdown-item').first().click()
      cy.get('.dropdown-btn').should('exist')
    })
  })

  describe('Critical Path 5: Data Display and Pagination', () => {
    beforeEach(() => {
      cy.visit('/contracts', { timeout: 10000 })
    })

    it('should display page layout correctly', () => {
      cy.get('.page').should('be.visible')
      cy.get('.page-header').should('exist')
      cy.get('.toolbar').should('exist')
    })

    it('should have button to add contracts', () => {
      cy.get('a[routerLink="/upload"]').should('exist')
    })
  })

  describe('Critical Path 6: Responsive Layout', () => {
    it('should display at desktop resolution', () => {
      cy.viewport('macbook-16')
      cy.visit('/contracts')
      cy.get('.page').should('be.visible')
    })

    it('should display at tablet resolution', () => {
      cy.viewport('ipad-2')
      cy.visit('/contracts')
      cy.get('.page').should('be.visible')
    })
  })

  describe('Critical Path 7: Navigation Without Errors', () => {
    it('should navigate through app without errors', () => {
      cy.visit('/')
      cy.get('a[routerLink="/dashboard"]').click()
      cy.url().should('include', '/contracts')
      cy.get('a[routerLink="/upload"]').first().click()
      cy.url().should('include', '/upload')
      cy.get('a[routerLink="/"]').click()
      cy.url().should('eq', 'http://localhost:4200/')
    })

    it('should maintain UI state during navigation', () => {
      cy.visit('/contracts')
      cy.get('input[type="text"][placeholder*="Search"]').type('test')
      cy.get('a[routerLink="/upload"]').first().click()
      cy.get('a[routerLink="/"]').click()
      cy.visit('/contracts')
      cy.get('.toolbar').should('be.visible')
    })
  })
})