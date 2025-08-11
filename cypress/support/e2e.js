// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Suppress uncaught exceptions
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from failing the test
  return false;
});

// Add custom error handling
Cypress.on('fail', (error, runnable) => {
  // Log the error
  console.error('Test failed:', error.message);
  console.error('Stack:', error.stack);
  
  // You can add custom error handling here
  throw error;
});

// Before each test
beforeEach(() => {
  // Clear localStorage and sessionStorage
  cy.clearLocalStorage();
  cy.clearCookies();
  
  // Log test information
  cy.log(`Running: ${Cypress.currentTest.title}`);
});

// After each test
afterEach(() => {
  // Take screenshot on failure
  if (Cypress.currentTest.state === 'failed') {
    cy.screenshot(`${Cypress.currentTest.parent}-${Cypress.currentTest.title}-failed`);
  }
});