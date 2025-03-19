describe('Voting Process', () => {
  beforeEach(() => {
    // Create a room and add an issue before each test
    cy.visit('/');
    const userName = 'Test Moderator';
    
    // Create room
    cy.get('input[placeholder*="nombre"]').first().type(userName);
    cy.get('button').contains('Crear Sala').click();
    
    // Wait for room to load
    cy.url().should('include', '/room/');
    
    // Add an issue
    cy.get('button').contains('Añadir Issue').click();
    cy.get('input[placeholder*="Clave"]').type('TEST-1');
    cy.get('input[placeholder*="Resumen"]').type('Test issue for voting');
    cy.get('button').contains('Guardar').click();
    
    // Select the issue
    cy.contains('TEST-1').click();
  });

  it('should allow selecting a card for voting', () => {
    // Act - Select a card
    cy.get('[data-testid="card-5"]').click();
    
    // Assert - Card should be selected
    cy.get('[data-testid="card-5"]').should('have.class', 'selected');
  });

  it('should reveal all votes when revealing cards', () => {
    // Arrange - Select a card
    cy.get('[data-testid="card-8"]').click();
    
    // Act - Reveal cards
    cy.get('button').contains('Revelar').click();
    
    // Assert - Votes should be visible
    cy.contains('Promedio').should('be.visible');
    cy.contains('8').should('be.visible');
  });

  it('should start a new voting round', () => {
    // Arrange - Select a card and reveal
    cy.get('[data-testid="card-3"]').click();
    cy.get('button').contains('Revelar').click();
    
    // Act - Start new voting round
    cy.get('button').contains('Nueva Votación').click();
    
    // Assert - Cards should be reset
    cy.get('[data-testid="card-3"]').should('not.have.class', 'selected');
    cy.contains('Promedio').should('not.exist');
  });

  it('should not allow changing vote after reveal', () => {
    // Arrange - Select a card and reveal
    cy.get('[data-testid="card-2"]').click();
    cy.get('button').contains('Revelar').click();
    
    // Act - Try to select another card
    cy.get('[data-testid="card-5"]').click();
    
    // Assert - Original card should still be selected
    cy.get('[data-testid="card-2"]').should('have.class', 'selected');
    cy.get('[data-testid="card-5"]').should('not.have.class', 'selected');
    
    // Should show error message
    cy.contains('No puedes cambiar tu estimación').should('be.visible');
  });
});