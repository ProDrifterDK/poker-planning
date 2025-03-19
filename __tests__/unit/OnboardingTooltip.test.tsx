import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { OnboardingTooltip } from '@/components/Onboarding';
import { useOnboardingStore, OnboardingStep } from '@/store/onboardingStore';

// Mock del store de onboarding
jest.mock('@/store/onboardingStore', () => {
  const originalModule = jest.requireActual('@/store/onboardingStore');
  
  return {
    __esModule: true,
    ...originalModule,
    useOnboardingStore: jest.fn(),
    OnboardingStep: originalModule.OnboardingStep,
  };
});

// Tipo para el mock
const mockUseOnboardingStore = useOnboardingStore as unknown as jest.Mock;

describe('OnboardingTooltip', () => {
  // Configuración básica del mock para cada test
  const mockStore = {
    isActive: true,
    currentStep: OnboardingStep.WELCOME,
    steps: {
      [OnboardingStep.WELCOME]: {
        title: 'Título de prueba',
        description: 'Descripción de prueba',
        position: 'bottom',
      },
    },
    nextStep: jest.fn(),
    previousStep: jest.fn(),
    skipOnboarding: jest.fn(),
    completeOnboarding: jest.fn(),
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseOnboardingStore.mockReturnValue(mockStore);
  });
  
  it('renderiza correctamente cuando está activo', () => {
    render(<OnboardingTooltip />);
    
    expect(screen.getByText('Título de prueba')).toBeInTheDocument();
    expect(screen.getByText('Descripción de prueba')).toBeInTheDocument();
  });
  
  it('no renderiza nada cuando no está activo', () => {
    mockUseOnboardingStore.mockReturnValue({
      ...mockStore,
      isActive: false,
    });
    
    const { container } = render(<OnboardingTooltip />);
    expect(container).toBeEmptyDOMElement();
  });
  
  it('no renderiza nada cuando no hay paso actual', () => {
    mockUseOnboardingStore.mockReturnValue({
      ...mockStore,
      currentStep: null,
    });
    
    const { container } = render(<OnboardingTooltip />);
    expect(container).toBeEmptyDOMElement();
  });
  
  it('llama a nextStep cuando se hace clic en el botón Siguiente', () => {
    render(<OnboardingTooltip />);
    
    const nextButton = screen.getByText('Comenzar');
    fireEvent.click(nextButton);
    
    expect(mockStore.nextStep).toHaveBeenCalledTimes(1);
  });
  
  it('llama a skipOnboarding cuando se hace clic en el botón de cerrar', () => {
    render(<OnboardingTooltip />);
    
    const closeButton = screen.getByLabelText('Cerrar tutorial');
    fireEvent.click(closeButton);
    
    expect(mockStore.skipOnboarding).toHaveBeenCalledTimes(1);
  });
  
  it('muestra el botón Finalizar en el último paso', () => {
    mockUseOnboardingStore.mockReturnValue({
      ...mockStore,
      currentStep: OnboardingStep.COMPLETED,
      steps: {
        ...mockStore.steps,
        [OnboardingStep.COMPLETED]: {
          title: 'Tutorial completado',
          description: 'Has completado el tutorial',
          position: 'bottom',
        },
      },
    });
    
    render(<OnboardingTooltip />);
    
    const finishButton = screen.getByText('Finalizar');
    fireEvent.click(finishButton);
    
    expect(mockStore.completeOnboarding).toHaveBeenCalledTimes(1);
  });
  
  it('deshabilita el botón Anterior en el primer paso', () => {
    render(<OnboardingTooltip />);
    
    const prevButton = screen.getByText('Anterior');
    expect(prevButton).toBeDisabled();
  });
  
  it('habilita el botón Anterior en pasos posteriores', () => {
    mockUseOnboardingStore.mockReturnValue({
      ...mockStore,
      currentStep: OnboardingStep.CREATE_ROOM,
      steps: {
        ...mockStore.steps,
        [OnboardingStep.CREATE_ROOM]: {
          title: 'Crear sala',
          description: 'Descripción para crear sala',
          position: 'bottom',
        },
      },
    });
    
    render(<OnboardingTooltip />);
    
    const prevButton = screen.getByText('Anterior');
    expect(prevButton).not.toBeDisabled();
    
    fireEvent.click(prevButton);
    expect(mockStore.previousStep).toHaveBeenCalledTimes(1);
  });
});