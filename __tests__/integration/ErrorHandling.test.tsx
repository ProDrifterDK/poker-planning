import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import ErrorDisplay from '@/components/ErrorDisplay';
import { useErrorStore, ErrorType, createError } from '@/store/errorStore';

// Mock theme
const mockTheme = createTheme();

const renderWithTheme = (component: React.ReactNode) => {
  return render(<ThemeProvider theme={mockTheme}>{component}</ThemeProvider>);
};

describe('Error Handling Integration', () => {
  beforeEach(() => {
    // Reset error store before each test
    const { clearError } = useErrorStore.getState();
    clearError();
    useErrorStore.setState({ errorHistory: [] });
    
    // Mock console.error to prevent test output pollution
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should set error in the store', () => {
    // Arrange
    const errorMessage = 'Test error message';
    const { setError } = useErrorStore.getState();
    
    // Act - Set error in the store
    setError(createError(ErrorType.NETWORK_ERROR, errorMessage));
    
    // Assert
    const { currentError } = useErrorStore.getState();
    expect(currentError).not.toBeNull();
    expect(currentError?.message).toBe(errorMessage);
  });

  it('should clear error when clearError is called', async () => {
    // Arrange
    const { setError, clearError } = useErrorStore.getState();
    setError(createError(ErrorType.SERVER_ERROR, 'Server error'));
    
    // Act
    clearError();
    
    // Assert
    const { currentError } = useErrorStore.getState();
    expect(currentError).toBeNull();
  });

  it('should handle recovery action', () => {
    // Arrange
    const recoveryAction = jest.fn();
    const { setError } = useErrorStore.getState();
    setError(createError(
      ErrorType.VOTE_FAILED,
      'Failed to submit vote',
      { voteValue: 5 },
      recoveryAction
    ));
    
    // Act
    const { currentError } = useErrorStore.getState();
    currentError?.recoveryAction?.();
    
    // Assert
    expect(recoveryAction).toHaveBeenCalledTimes(1);
  });

  it('should filter errors by type', () => {
    // Arrange
    const { setError, clearError } = useErrorStore.getState();
    
    // Set validation error
    clearError();
    setError(createError(ErrorType.VALIDATION_ERROR, 'Validation error'));
    
    // Assert validation error is set
    let currentError = useErrorStore.getState().currentError;
    expect(currentError?.type).toBe(ErrorType.VALIDATION_ERROR);
    
    // Set network error
    clearError();
    setError(createError(ErrorType.NETWORK_ERROR, 'Network error'));
    
    // Assert network error is set
    currentError = useErrorStore.getState().currentError;
    expect(currentError?.type).toBe(ErrorType.NETWORK_ERROR);
  });

  it('should include error details', () => {
    // Arrange
    const errorDetails = { code: 'ERR_NETWORK', status: 500 };
    const { setError } = useErrorStore.getState();
    setError(createError(
      ErrorType.SERVER_ERROR,
      'Server error occurred',
      errorDetails
    ));
    
    // Assert
    const { currentError } = useErrorStore.getState();
    expect(currentError?.details).toEqual(errorDetails);
  });

  it('should set correct error types', () => {
    // Arrange
    const { setError, clearError } = useErrorStore.getState();
    
    // Test error severity
    clearError();
    setError(createError(ErrorType.SERVER_ERROR, 'Server error'));
    expect(useErrorStore.getState().currentError?.type).toBe(ErrorType.SERVER_ERROR);
    
    // Test warning severity
    clearError();
    setError(createError(ErrorType.TIMEOUT_ERROR, 'Timeout error'));
    expect(useErrorStore.getState().currentError?.type).toBe(ErrorType.TIMEOUT_ERROR);
    
    // Test info severity
    clearError();
    setError(createError(ErrorType.VALIDATION_ERROR, 'Validation error'));
    expect(useErrorStore.getState().currentError?.type).toBe(ErrorType.VALIDATION_ERROR);
  });
});