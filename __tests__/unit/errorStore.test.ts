import { useErrorStore, ErrorType, createError, handleFirebaseError, AppError } from '@/store/errorStore';

// Reset the store before each test
beforeEach(() => {
  const { clearError } = useErrorStore.getState();
  clearError();
  // Clear error history
  useErrorStore.setState({ errorHistory: [] });
});

describe('Error Store', () => {
  describe('setError', () => {
    it('should set the current error', () => {
      // Arrange
      const { setError } = useErrorStore.getState();
      const testError = createError(ErrorType.NETWORK_ERROR);
      
      // Act
      setError(testError);
      
      // Assert
      const { currentError } = useErrorStore.getState();
      expect(currentError).toEqual(testError);
    });

    it('should add the error to history', () => {
      // Arrange
      const { setError } = useErrorStore.getState();
      const testError = createError(ErrorType.VALIDATION_ERROR);
      
      // Act
      setError(testError);
      
      // Assert
      const { errorHistory } = useErrorStore.getState();
      expect(errorHistory).toHaveLength(1);
      expect(errorHistory[0]).toEqual(testError);
    });

    it('should add timestamp if not provided', () => {
      // Arrange
      const { setError } = useErrorStore.getState();
      const now = Date.now();
      jest.spyOn(Date, 'now').mockImplementation(() => now);
      
      // Create error without timestamp
      const testError = {
        type: ErrorType.SERVER_ERROR,
        message: 'Test error',
      } as AppError; // Using type assertion for test
      
      // Act
      setError(testError);
      
      // Assert
      const { currentError } = useErrorStore.getState();
      expect(currentError?.timestamp).toBe(now);
      
      // Cleanup
      jest.restoreAllMocks();
    });

    it('should use predefined message if not provided', () => {
      // Arrange
      const { setError } = useErrorStore.getState();
      
      // Create error without message
      const testError = {
        type: ErrorType.ROOM_NOT_FOUND,
        timestamp: Date.now(),
      } as AppError; // Using type assertion for test
      
      // Act
      setError(testError);
      
      // Assert
      const { currentError } = useErrorStore.getState();
      expect(currentError?.message).toBe('La sala no existe o ha sido eliminada.');
    });
  });

  describe('clearError', () => {
    it('should clear the current error', () => {
      // Arrange
      const { setError, clearError } = useErrorStore.getState();
      const testError = createError(ErrorType.TIMEOUT_ERROR);
      setError(testError);
      
      // Act
      clearError();
      
      // Assert
      const { currentError } = useErrorStore.getState();
      expect(currentError).toBeNull();
    });

    it('should not clear error history', () => {
      // Arrange
      const { setError, clearError } = useErrorStore.getState();
      const testError = createError(ErrorType.AUTH_ERROR);
      setError(testError);
      
      // Act
      clearError();
      
      // Assert
      const { errorHistory } = useErrorStore.getState();
      expect(errorHistory).toHaveLength(1);
    });
  });

  describe('addRecoveryAction', () => {
    it('should add recovery action to current error', () => {
      // Arrange
      const { setError, addRecoveryAction } = useErrorStore.getState();
      const testError = createError(ErrorType.VOTE_FAILED);
      setError(testError);
      const recoveryAction = jest.fn();
      
      // Act
      addRecoveryAction(recoveryAction);
      
      // Assert
      const { currentError } = useErrorStore.getState();
      expect(currentError?.recoveryAction).toBe(recoveryAction);
    });

    it('should do nothing if no current error', () => {
      // Arrange
      const { clearError, addRecoveryAction } = useErrorStore.getState();
      clearError(); // Ensure no current error
      const recoveryAction = jest.fn();
      
      // Act
      addRecoveryAction(recoveryAction);
      
      // Assert
      const { currentError } = useErrorStore.getState();
      expect(currentError).toBeNull();
    });
  });

  describe('createError', () => {
    it('should create error with all properties', () => {
      // Arrange
      const type = ErrorType.INVALID_DATA;
      const message = 'Custom error message';
      const details = { field: 'username' };
      const recoveryAction = jest.fn();
      const now = Date.now();
      jest.spyOn(Date, 'now').mockImplementation(() => now);
      
      // Act
      const error = createError(type, message, details, recoveryAction);
      
      // Assert
      expect(error).toEqual({
        type,
        message,
        timestamp: now,
        details,
        recoveryAction,
      });
      
      // Cleanup
      jest.restoreAllMocks();
    });

    it('should use predefined message if not provided', () => {
      // Act
      const error = createError(ErrorType.ROOM_CREATION_FAILED);
      
      // Assert
      expect(error.message).toBe('No se pudo crear la sala. Intenta nuevamente.');
    });
  });

  describe('handleFirebaseError', () => {
    it('should map Firebase network error correctly', () => {
      // Arrange
      const firebaseError = {
        code: 'network-error',
        message: 'A network error has occurred',
      };
      
      // Act
      const error = handleFirebaseError(firebaseError);
      
      // Assert
      expect(error.type).toBe(ErrorType.NETWORK_ERROR);
      expect(error.details).toEqual({ originalError: firebaseError, code: 'network-error' });
    });

    it('should handle non-Firebase errors', () => {
      // Arrange
      const randomError = new Error('Random error');
      
      // Act
      const error = handleFirebaseError(randomError);
      
      // Assert
      expect(error.type).toBe(ErrorType.UNKNOWN_ERROR);
      expect(error.details).toEqual({ originalError: randomError, code: 'unknown' });
    });
  });
});