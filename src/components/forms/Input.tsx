import React from 'react';
import styled from '@emotion/styled';
import { darkEmotionTheme } from '../../styles/theme';

// Input wrapper for consistent spacing and positioning
const InputWrapper = styled.div`
  position: relative;
  width: 100%;
`;

// Styled input using theme tokens
const StyledInput = styled.input<{ hasError?: boolean }>`
  width: 100%;
  font-family: ${darkEmotionTheme.typography.fontFamily.body};
  font-size: ${darkEmotionTheme.typography.fontSizes.body};
  font-weight: ${darkEmotionTheme.typography.fontWeights.regular};
  line-height: 1.5;
  padding: ${darkEmotionTheme.spacing(3)} ${darkEmotionTheme.spacing(4)};
  border-radius: ${darkEmotionTheme.borderRadius.medium};
  border: 2px solid ${darkEmotionTheme.colors.border.main};
  background-color: ${darkEmotionTheme.colors.background.paper};
  color: ${darkEmotionTheme.colors.text.primary};
  transition: all 0.2s ease-in-out;
  box-sizing: border-box;

  &::placeholder {
    color: ${darkEmotionTheme.colors.text.secondary};
    opacity: 0.7;
  }

  &:hover {
    border-color: ${darkEmotionTheme.colors.border.light};
  }

  &:focus {
    outline: none;
    border-color: ${darkEmotionTheme.colors.primary.main};
    box-shadow: 0 0 0 3px rgba(18, 151, 253, 0.1);
  }

  &:disabled {
    background-color: ${darkEmotionTheme.colors.background.alt};
    color: ${darkEmotionTheme.colors.text.disabled};
    border-color: ${darkEmotionTheme.colors.border.dark};
    cursor: not-allowed;
    opacity: 0.6;
  }

  ${({ hasError }) =>
        hasError &&
        `
    border-color: ${darkEmotionTheme.colors.error.main};

    &:focus {
      border-color: ${darkEmotionTheme.colors.error.main};
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