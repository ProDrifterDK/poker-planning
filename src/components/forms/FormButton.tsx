import React from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { Button, ButtonProps } from '../Button';

// Loading spinner animation
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

// Spinner icon wrapper
const SpinnerWrapper = styled.div`
  display: inline-block;
  width: 16px;
  height: 16px;
  margin-right: ${({ theme }) => theme.spacing(2)};
  animation: ${spin} 1s linear infinite;
`;

// Simple spinner SVG
const SpinnerIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12a9 9 0 11-6.219-8.56"/>
  </svg>
);

// Button content wrapper for loading state
const ButtonContent = styled.span<{ isLoading?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: ${({ isLoading }) => (isLoading ? 0.7 : 1)};
  transition: opacity 0.2s ease-in-out;
`;

// FormButton component props interface
export interface FormButtonProps extends Omit<ButtonProps, 'children'> {
  isSubmitting?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

// Main FormButton component
export const FormButton: React.FC<FormButtonProps> = ({
  isSubmitting = false,
  loadingText,
  disabled,
  children,
  ...buttonProps
}) => {
  const isDisabled = disabled || isSubmitting;

  return (
    <Button
      {...buttonProps}
      disabled={isDisabled}
    >
      <ButtonContent isLoading={isSubmitting}>
        {isSubmitting && (
          <>
            <SpinnerWrapper>
              <SpinnerIcon />
            </SpinnerWrapper>
            {loadingText || 'Loading...'}
          </>
        )}
        {!isSubmitting && children}
      </ButtonContent>
    </Button>
  );
};

export default FormButton;