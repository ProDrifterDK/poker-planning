// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })

// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })

// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })

// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

// Custom command to create a room
Cypress.Commands.add('createRoom', (name, seriesKey = 'fibonacci') => {
  cy.visit('/');
  cy.get('input[placeholder*="nombre"]').first().type(name);
  cy.get('[data-testid="series-select"]').click();
  cy.get(`[data-value="${seriesKey}"]`).click();
  cy.get('button').contains('Crear Sala').click();
  cy.url().should('include', '/room/');
});

// Custom command to join a room
Cypress.Commands.add('joinRoom', (roomCode, name) => {
  cy.visit('/');
  cy.get('input[placeholder*="Código"]').type(roomCode);
  cy.get('input[placeholder*="nombre"]').last().type(name);
  cy.get('button').contains('Unirse').click();
  cy.url().should('include', `/room/${roomCode}`);
});