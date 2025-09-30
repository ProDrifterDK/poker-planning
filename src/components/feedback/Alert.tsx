import React from 'react';
import styled from '@emotion/styled';
import { alpha } from '@mui/material/styles';

// Alert wrapper with consistent styling
const AlertWrapper = styled.div<{ variant: 'success' | 'error' | 'warning' | 'info' }>`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing(3)};
  padding: ${({ theme }) => theme.spacing(4)};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  border: 1px solid;
  font-family: ${({ theme }) => theme.typography.fontFamily.body};
  font-size: ${({ theme }) => theme.typography.fontSizes.body};
  line-height: 1.5;
  transition: all 0.2s ease-in-out;

  ${({ variant, theme }) => {
    switch (variant) {
      case 'success':
        return `
          background-color: ${alpha(theme.colors.success.main, 0.1)};
          border-color: ${theme.colors.success.main};
          color: ${theme.colors.success.dark};
        `;
      case 'error':
        return `
          background-color: ${alpha(theme.colors.error.main, 0.1)};
          border-color: ${theme.colors.error.main};
          color: ${theme.colors.error.dark};
        `;
      case 'warning':
        return `
          background-color: ${alpha(theme.colors.warning.main, 0.1)};
          border-color: ${theme.colors.warning.main};
          color: ${theme.colors.warning.dark};
        `;
      case 'info':
      default:
        return `
          background-color: ${alpha(theme.colors.info.main, 0.1)};
          border-color: ${theme.colors.info.main};
          color: ${theme.colors.info.dark};
        `;
    }
  }}
`;

// Icon container for consistent icon spacing
const IconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
`;

// Content container for proper text layout
const ContentContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
`;

// Title styled component
const AlertTitle = styled.div`
  font-weight: ${({ theme }) => theme.typography.fontWeights.medium};
  margin: 0;
`;

// Message styled component
const AlertMessage = styled.div`
  margin: 0;
  opacity: 0.9;
`;

// Alert component props interface
export interface AlertProps {
  variant?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  className?: string;
  onClose?: () => void;
}

// Main Alert component
export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  message,
  className,
  onClose,
}) => {
  // Simple icons using SVG
  const renderIcon = () => {
    const iconProps = {
      width: 20,
      height: 20,
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 2,
      strokeLinecap: 'round' as const,
      strokeLinejoin: 'round' as const,
    };

    switch (variant) {
      case 'success':
        return (
          <svg {...iconProps} viewBox="0 0 24 24">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        );
      case 'error':
        return (
          <svg {...iconProps} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <path d="m15 9-6 6" />
            <path d="m9 9 6 6" />
          </svg>
        );
      case 'warning':
        return (
          <svg {...iconProps} viewBox="0 0 24 24">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg {...iconProps} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
        );
    }
  };

  return (
    <AlertWrapper variant={variant} className={className}>
      <IconContainer>
        {renderIcon()}
      </IconContainer>
      <ContentContainer>
        {title && <AlertTitle>{title}</AlertTitle>}
        <AlertMessage>{message}</AlertMessage>
      </ContentContainer>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            marginLeft: 'auto',
            color: 'currentColor',
            opacity: 0.7,
            transition: 'opacity 0.2s ease-in-out',
          }}
          onMouseOver={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseOut={(e) => (e.currentTarget.style.opacity = '0.7')}
          onFocus={(e) => (e.currentTarget.style.opacity = '1')}
          onBlur={(e) => (e.currentTarget.style.opacity = '0.7')}
          aria-label="Close alert"
        >
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
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      )}
    </AlertWrapper>
  );
};

export default Alert;