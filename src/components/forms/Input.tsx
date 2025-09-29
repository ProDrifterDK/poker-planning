import React from 'react';
import styled from '@emotion/styled';
import { emotionTheme } from '../../styles/theme';

// Input wrapper for consistent spacing and positioning
const InputWrapper = styled.div`
  position: relative;
  width: 100%;
`;

// Styled input using theme tokens
const StyledInput = styled.input<{ hasError?: boolean }>`
  width: 100%;
  font-family: ${emotionTheme.typography.fontFamily.body};
  font-size: ${emotionTheme.typography.fontSizes.body};
  font-weight: ${emotionTheme.typography.fontWeights.regular};
  line-height: 1.5;
  padding: ${emotionTheme.spacing(3)} ${emotionTheme.spacing(4)};
  border-radius: ${emotionTheme.borderRadius.medium};
  border: 2px solid ${emotionTheme.colors.border.main};
  background-color: ${emotionTheme.colors.background.paper};
  color: ${emotionTheme.colors.text.primary};
  transition: all 0.2s ease-in-out;
  box-sizing: border-box;

  &::placeholder {
    color: ${emotionTheme.colors.text.secondary};
    opacity: 0.7;
  }

  &:hover {
    border-color: ${emotionTheme.colors.border.light};
  }

  &:focus {
    outline: none;
    border-color: ${emotionTheme.colors.primary.main};
    box-shadow: 0 0 0 3px rgba(18, 151, 253, 0.1);
  }

  &:disabled {
    background-color: ${emotionTheme.colors.background.alt};
    color: ${emotionTheme.colors.text.disabled};
    border-color: ${emotionTheme.colors.border.dark};
    cursor: not-allowed;
    opacity: 0.6;
  }

  ${({ hasError }) =>
        hasError &&
        `
    border-color: ${emotionTheme.colors.error.main};

    &:focus {
      border-color: ${emotionTheme.colors.error.main};
      box-shadow: 0 0 0 3px rgba(255, 68, 68, 0.1);
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