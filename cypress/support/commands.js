// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Authentication commands
Cypress.Commands.add('login', (email, password) => {
  cy.request('POST', `${Cypress.env('apiUrl')}/api/auth/login`, {
    email,
    password
  }).then((response) => {
    window.localStorage.setItem('accessToken', response.body.accessToken);
    window.localStorage.setItem('refreshToken', response.body.refreshToken);
    window.localStorage.setItem('user', JSON.stringify(response.body.user));
  });
});

Cypress.Commands.add('logout', () => {
  window.localStorage.removeItem('accessToken');
  window.localStorage.removeItem('refreshToken');
  window.localStorage.removeItem('user');
});

// Database seeding commands
Cypress.Commands.add('seedDatabase', () => {
  cy.task('seedDatabase');
});

Cypress.Commands.add('clearDatabase', () => {
  cy.task('clearDatabase');
});

// API testing commands
Cypress.Commands.add('apiRequest', (method, url, body) => {
  const token = window.localStorage.getItem('accessToken');
  
  return cy.request({
    method,
    url: `${Cypress.env('apiUrl')}${url}`,
    body,
    headers: {
      Authorization: token ? `Bearer ${token}` : undefined
    },
    failOnStatusCode: false
  });
});

// UI interaction commands
Cypress.Commands.add('fillForm', (formData) => {
  for (const [field, value] of Object.entries(formData)) {
    cy.get(`[name="${field}"]`).clear().type(value);
  }
});

Cypress.Commands.add('submitForm', () => {
  cy.get('button[type="submit"]').click();
});

// Assertion commands
Cypress.Commands.add('shouldShowSuccessMessage', (message) => {
  cy.get('[data-testid="success-message"]').should('be.visible').and('contain', message);
});

Cypress.Commands.add('shouldShowErrorMessage', (message) => {
  cy.get('[data-testid="error-message"]').should('be.visible').and('contain', message);
});

// Navigation commands
Cypress.Commands.add('navigateTo', (section) => {
  cy.get(`[data-testid="nav-${section}"]`).click();
  cy.url().should('include', `#${section}`);
});

// Wait commands
Cypress.Commands.add('waitForAnimation', () => {
  cy.wait(500); // Wait for animations to complete
});

// Component visibility commands
Cypress.Commands.add('shouldBeVisibleInViewport', (selector) => {
  cy.get(selector).should('be.visible').and(($el) => {
    const rect = $el[0].getBoundingClientRect();
    expect(rect.top).to.be.lessThan(window.innerHeight);
    expect(rect.bottom).to.be.greaterThan(0);
  });
});

// Mock data commands
Cypress.Commands.add('mockApiResponse', (method, url, response, statusCode = 200) => {
  cy.intercept(method, `**/api/${url}`, {
    statusCode,
    body: response
  }).as(`mock${method}${url.replaceAll('/', '')}`);
});

// Accessibility commands
Cypress.Commands.add('checkA11y', (selector = null, options = null) => {
  // This would integrate with cypress-axe for accessibility testing
  // For now, we'll do basic checks
  const target = selector || 'body';
  
  // Check for alt text on images
  cy.get(`${target} img`).each(($img) => {
    cy.wrap($img).should('have.attr', 'alt');
  });
  
  // Check for button text
  cy.get(`${target} button`).each(($button) => {
    cy.wrap($button).should('not.be.empty');
  });
  
  // Check for form labels
  cy.get(`${target} input:not([type="hidden"])`).each(($input) => {
    const id = $input.attr('id');
    if (id) {
      cy.get(`label[for="${id}"]`).should('exist');
    }
  });
});

// File upload command
Cypress.Commands.add('uploadFile', (selector, fileName, fileType = 'text/plain') => {
  cy.get(selector).then(($input) => {
    const blob = Cypress.Blob.base64StringToBlob('', fileType);
    const file = new File([blob], fileName, { type: fileType });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    $input[0].files = dataTransfer.files;
    $input[0].dispatchEvent(new Event('change', { bubbles: true }));
  });
});

// Responsive testing commands
Cypress.Commands.add('testResponsive', (sizes = ['mobile', 'tablet', 'desktop']) => {
  const viewports = {
    mobile: [375, 667],
    tablet: [768, 1024],
    desktop: [1280, 720]
  };
  
  for (const size of sizes) {
    cy.viewport(viewports[size][0], viewports[size][1]);
    cy.wait(300); // Wait for resize
  }
});

// Performance testing command
Cypress.Commands.add('measurePerformance', (label) => {
  cy.window().then((win) => {
    const {performance} = win;
    const navigationTiming = performance.getEntriesByType('navigation')[0];
    
    cy.task('log', `Performance metrics for ${label}:`);
    cy.task('table', {
      'DOM Content Loaded': `${navigationTiming.domContentLoadedEventEnd - navigationTiming.domContentLoadedEventStart}ms`,
      'Load Complete': `${navigationTiming.loadEventEnd - navigationTiming.loadEventStart}ms`,
      'Total Time': `${navigationTiming.loadEventEnd - navigationTiming.fetchStart}ms`
    });
  });
});