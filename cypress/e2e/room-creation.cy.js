describe('Room Creation', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should create a new room with default settings', () => {
    // Arrange
    const userName = 'Test User';
    
    // Act
    cy.get('input[placeholder*="nombre"]').first().type(userName);
    cy.get('button').contains('Crear Sala').click();
    
    // Assert
    cy.url().should('include', '/room/');
    cy.contains('Planning Poker').should('be.visible');
    cy.contains(userName).should('be.visible');
  });

  it('should create a room with T-Shirt sizing', () => {
    // Arrange
    const userName = 'Test User';
    
    // Act
    cy.get('input[placeholder*="nombre"]').first().type(userName);
    
    // Select T-Shirt sizing from dropdown
    cy.get('div[role="button"]').click();
    cy.get('li[data-value="tshirt"]').click();
    
    cy.get('button').contains('Crear Sala').click();
    
    // Assert
    cy.url().should('include', '/room/');
    cy.contains('S').should('be.visible');
    cy.contains('M').should('be.visible');
    cy.contains('L').should('be.visible');
  });

  it('should show error when creating room without name', () => {
    // Act
    cy.get('button').contains('Crear Sala').click();
    
    // Assert
    cy.contains('Debes ingresar tu nombre').should('be.visible');
    cy.url().should('not.include', '/room/');
  });
});