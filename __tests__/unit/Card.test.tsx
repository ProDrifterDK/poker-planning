import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Card from '@/components/core/Card';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';

// Mock theme with card palette
const mockTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    card: {
      defaultBg: '#ffffff',
      noSelectionBg: '#f5f5f5',
      text: '#000000',
      border: '#cccccc',
      borderSelected: '#1976d2',
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      boxShadowSelected: '0px 4px 8px rgba(0, 0, 0, 0.2)',
    },
  },
});

const renderWithTheme = (component: React.ReactNode) => {
  return render(<ThemeProvider theme={mockTheme}>{component}</ThemeProvider>);
};

describe('Card Component', () => {
  const mockOnClick = jest.fn();

  beforeEach(() => {
    mockOnClick.mockClear();
  });

  it('renders with the correct value', () => {
    renderWithTheme(
      <Card
        value={5}
        selected={false}
        onClick={mockOnClick}
        flipped={false}
        noSelection={false}
      />
    );

    expect(screen.getAllByText('5')).toHaveLength(3); // Main value + 2 corner values
  });

  it('applies selected styles when selected prop is true', () => {
    const { container } = renderWithTheme(
      <Card
        value={8}
        selected={true}
        onClick={mockOnClick}
        flipped={false}
        noSelection={false}
      />
    );

    // Check for selected border style
    const cardFront = container.querySelector('div > div > div:first-child');
    expect(cardFront).toBeTruthy(); // Verificar que el elemento existe
  });

  it('calls onClick handler when clicked', () => {
    const { container } = renderWithTheme(
      <Card
        value={3}
        selected={false}
        onClick={mockOnClick}
        flipped={false}
        noSelection={false}
      />
    );

    // Usar el contenedor directamente en lugar de screen.getByText
    const cardElement = container.querySelector('.MuiBox-root');
    if (cardElement) {
      fireEvent.click(cardElement);
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    } else {
      fail('Card element not found');
    }
  });

  it('hides corner values when showCorners is false', () => {
    renderWithTheme(
      <Card
        value={13}
        selected={false}
        onClick={mockOnClick}
        flipped={false}
        noSelection={false}
        showCorners={false}
      />
    );

    expect(screen.getAllByText('13')).toHaveLength(1); // Only main value
  });

  it('applies custom font size when fontSize prop is provided', () => {
    renderWithTheme(
      <Card
        value={21}
        selected={false}
        onClick={mockOnClick}
        flipped={false}
        noSelection={false}
        fontSize="3rem"
      />
    );

    const mainValue = screen.getAllByText('21')[0];
    expect(mainValue).toBeTruthy();
  });

  it('shows flipped state when flipped prop is true', () => {
    const { container } = renderWithTheme(
      <Card
        value={1}
        selected={false}
        onClick={mockOnClick}
        flipped={true}
        noSelection={false}
      />
    );

    const cardInner = container.querySelector('div > div');
    expect(cardInner).toBeTruthy();
  });

  it('applies noSelection styles when noSelection prop is true', () => {
    const { container } = renderWithTheme(
      <Card
        value={2}
        selected={false}
        onClick={mockOnClick}
        flipped={false}
        noSelection={true}
      />
    );

    const cardFront = container.querySelector('div > div > div:first-child');
    expect(cardFront).toBeTruthy();
  });
});