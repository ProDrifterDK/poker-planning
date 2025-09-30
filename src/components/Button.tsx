import React from 'react';
import styled from '@emotion/styled';

const hexToRgb = (hex: string): string => {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '';
  
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);

  return `${r}, ${g}, ${b}`;
};

// Base button styles using theme tokens
const BaseButton = styled.button<{ disabled?: boolean }>`
  font-family: ${props => props.theme.typography.fontFamily.body};
  font-weight: ${props => props.theme.typography.fontWeights.medium};
  font-size: ${props => props.theme.typography.fontSizes.button};
  border-radius: ${props => `${props.theme.shape.borderRadius}px`};
  padding: ${props => `${props.theme.spacing(2)} ${props.theme.spacing(4)}`};
  border: 2px solid transparent;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  transition: all 0.2s ease-in-out;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  position: relative;
  overflow: hidden;

  &:focus {
    outline: none;
  }

  &:focus-visible {
    outline: 2px solid ${props => props.theme.colors.primary.main};
    outline-offset: 2px;
  }
`;

// Primary Button Variant
export const PrimaryButton = styled(BaseButton)`
  background: linear-gradient(45deg, ${props => props.theme.colors.primary.main} 30%, ${props => props.theme.colors.primary.dark} 90%);
  color: ${props => props.theme.colors.text.primary};
  box-shadow: ${props => props.theme.shadows.small};

  &:hover:not(:disabled) {
    background: linear-gradient(45deg, ${props => props.theme.colors.primary.dark} 30%, ${props => props.theme.colors.primary.main} 90%);
    transform: translateY(-1px) scale(1.01);
    box-shadow: 0 4px 15px ${props => `rgba(${hexToRgb(props.theme.colors.primary.main)}, 0.25)`}, 0 2px 8px ${props => `rgba(${hexToRgb(props.theme.colors.primary.main)}, 0.15)`};
  }

  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0px 2px 4px ${props => `rgba(${hexToRgb(props.theme.colors.primary.main)}, 0.2)`};
  }

  &:disabled {
    background: ${props => props.theme.colors.text.secondary};
    color: ${props => props.theme.colors.text.disabled};
    box-shadow: none;
  }
`;

// Secondary Button Variant
export const SecondaryButton = styled(BaseButton)`
  background: transparent;
  color: ${props => props.theme.colors.primary.main};
  border-color: ${props => props.theme.colors.primary.main};
  box-shadow: 0px 2px 4px ${props => `rgba(${hexToRgb(props.theme.colors.primary.main)}, 0.1)`};

  &:hover:not(:disabled) {
    background: ${props => props.theme.colors.primary.main};
    color: ${props => props.theme.colors.text.primary};
    transform: translateY(-1px) scale(1.01);
    box-shadow: 0 4px 15px ${props => `rgba(${hexToRgb(props.theme.colors.primary.main)}, 0.25)`}, 0 2px 8px ${props => `rgba(${hexToRgb(props.theme.colors.primary.main)}, 0.15)`};
  }

  &:active:not(:disabled) {
    transform: translateY(0);
    background: ${props => props.theme.colors.primary.dark};
    border-color: ${props => props.theme.colors.primary.dark};
    box-shadow: 0px 2px 4px ${props => `rgba(${hexToRgb(props.theme.colors.primary.main)}, 0.15)`};
  }

  &:disabled {
    color: ${props => props.theme.colors.text.secondary};
    border-color: ${props => props.theme.colors.text.secondary};
    box-shadow: none;
  }
`;

// Tertiary Button Variant
export const TertiaryButton = styled(BaseButton)`
  background: transparent;
  color: ${props => props.theme.colors.primary.main};
  border: none;
  padding: ${props => `${props.theme.spacing(2)} ${props.theme.spacing(3)}`};
  box-shadow: none;

  &:hover:not(:disabled) {
    color: ${props => props.theme.colors.primary.dark};
    text-decoration: underline;
    text-underline-offset: 4px;
    text-decoration-thickness: 2px;
    box-shadow: 0 2px 8px ${props => `rgba(${hexToRgb(props.theme.colors.primary.main)}, 0.15)`}, 0 1px 4px ${props => `rgba(${hexToRgb(props.theme.colors.primary.main)}, 0.1)`};
  }

  &:active:not(:disabled) {
    color: ${props => props.theme.colors.primary.dark};
    text-decoration: underline;
    text-underline-offset: 4px;
    text-decoration-thickness: 2px;
  }

  &:disabled {
    color: ${props => props.theme.colors.text.secondary};
    text-decoration: none;
  }
`;

// Button component props interface
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'tertiary';
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  'aria-label'?: string;
  className?: string;
}

// Main Button component
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  disabled = false,
  children,
  onClick,
  type = 'button',
  'aria-label': ariaLabel,
  className,
}) => {
  const getButtonComponent = () => {
    switch (variant) {
      case 'secondary':
        return SecondaryButton;
      case 'tertiary':
        return TertiaryButton;
      default:
        return PrimaryButton;
    }
  };

  const ButtonComponent = getButtonComponent();

  return (
    <ButtonComponent
      disabled={disabled}
      onClick={onClick}
      type={type}
      aria-label={ariaLabel}
      className={className}
    >
      {children}
    </ButtonComponent>
  );
};

export default Button;