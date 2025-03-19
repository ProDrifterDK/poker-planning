describe('Room Joining', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should join an existing room', () => {
    // This test assumes there's a way to create a room first
    // In a real test, we might use the API or a custom command to set up the room
    
    // For demonstration purposes, we'll create a room first
    const hostName = 'Host User';
    const guestName = 'Guest User';
    
    // Create a room
    cy.get('input[placeholder*="nombre"]').first().type(hostName);
    cy.get('button').contains('Crear Sala').click();
    
    // Get the room code from the URL
    cy.url().then((url) => {
      const roomCode = url.split('/').pop();
      
      // Now navigate back to home and join the room
      cy.visit('/');
      cy.get('input[placeholder*="Código"]').type(roomCode);
      cy.get('input[placeholder*="nombre"]').last().type(guestName);
      cy.get('button').contains('Unirse').click();
      
      // Assert
      cy.url().should('include', `/room/${roomCode}`);
      cy.contains(guestName).should('be.visible');
    });
  });

  it('should show error when joining with invalid room code', () => {
    // Arrange
    const invalidRoomCode = 'invalid123';
    const userName = 'Test User';
    
    // Act
    cy.get('input[placeholder*="Código"]').type(invalidRoomCode);
    cy.get('input[placeholder*="nombre"]').last().type(userName);
    cy.get('button').contains('Unirse').click();
    
    // Assert
    cy.contains('La sala no existe').should('be.visible');
    cy.url().should('not.include', `/room/${invalidRoomCode}`);
  });

  it('should show error when joining without name', () => {
    // Arrange
    const roomCode = 'testroom';
    
    // Act
    cy.get('input[placeholder*="Código"]').type(roomCode);
    cy.get('button').contains('Unirse').click();
    
    // Assert
    cy.contains('Debes ingresar tu nombre').should('be.visible');
    cy.url().should('not.include', `/room/${roomCode}`);
  });
});