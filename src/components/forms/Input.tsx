import React from 'react';
import styled from '@emotion/styled';
import { Theme } from '@emotion/react';

// Input wrapper for consistent spacing and positioning
const InputWrapper = styled.div`
  position: relative;
  width: 100%;
`;

// Styled input using theme tokens
const StyledInput = styled.input<{ hasError?: boolean; }>`
  width: 100%;
  font-family: ${({ theme }) => theme.typography.fontFamily.body};
  font-size: ${({ theme }) => theme.typography.fontSizes.body};
  font-weight: ${({ theme }) => theme.typography.fontWeights.regular};
  line-height: 1.5;
  padding: ${({ theme }) => `${theme.spacing(3)} ${theme.spacing(4)}`};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  border: 2px solid ${({ theme }) => theme.colors.border.main};
  background-color: ${({ theme }) => theme.colors.background.paper};
  color: ${({ theme }) => theme.colors.text.primary};
  transition: all 0.2s ease-in-out;
  box-sizing: border-box;

  &::placeholder {
    color: ${({ theme }) => theme.colors.text.secondary};
    opacity: 0.7;
  }

  &:hover {
    border-color: ${({ theme }) => theme.colors.border.light};
  }

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary.main};
    box-shadow: ${({ theme }) => theme.shadows.small};
  }

  &:disabled {
    background-color: ${({ theme }) => theme.colors.background.alt};
    color: ${({ theme }) => theme.colors.text.disabled};
    border-color: ${({ theme }) => theme.colors.border.dark};
    cursor: not-allowed;
    opacity: 0.6;
  }

  ${({ hasError, theme }: { hasError?: boolean; theme: Theme }) =>
        hasError &&
        `
    border-color: ${theme.colors.error.main};

    &:focus {
      border-color: ${theme.colors.error.main};
      box-shadow: ${theme.shadows.small};
    }
  `}
`;

// Input component props interface
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: boolean;
    className?: string;
}

// Main Input component
export const Input: React.FC<InputProps> = ({
    error = false,
    className,
    disabled,
    ...props
}) => {
    return (
        <InputWrapper className={className}>
            <StyledInput
                hasError={error}
                disabled={disabled}
                {...props}
            />
        </InputWrapper>
    );
};

export default Input;