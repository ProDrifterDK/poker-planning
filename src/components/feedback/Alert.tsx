import React from 'react';
import styled from '@emotion/styled';
import { emotionTheme } from '../../styles/theme';

// Alert wrapper with consistent styling
const AlertWrapper = styled.div<{ variant: 'success' | 'error' | 'warning' | 'info' }>`
  display: flex;
  align-items: flex-start;
  gap: ${emotionTheme.spacing(3)};
  padding: ${emotionTheme.spacing(4)};
  border-radius: ${emotionTheme.borderRadius.medium};
  border: 1px solid;
  font-family: ${emotionTheme.typography.fontFamily.body};
  font-size: ${emotionTheme.typography.fontSizes.body};
  line-height: 1.5;
  transition: all 0.2s ease-in-out;

  ${({ variant }) => {
    switch (variant) {
      case 'success':
        return `
          background-color: rgba(0, 200, 81, 0.1);
          border-color: ${emotionTheme.colors.success.main};
          color: ${emotionTheme.colors.success.dark};
        `;
      case 'error':
        return `
          background-color: rgba(255, 68, 68, 0.1);
          border-color: ${emotionTheme.colors.error.main};
          color: ${emotionTheme.colors.error.dark};
        `;
      case 'warning':
        return `
          background-color: rgba(255, 187, 51, 0.1);
          border-color: ${emotionTheme.colors.warning.main};
          color: ${emotionTheme.colors.warning.dark};
        `;
      case 'info':
      default:
        return `
          background-color: rgba(18, 151, 253, 0.1);
          border-color: ${emotionTheme.colors.info.main};
          color: ${emotionTheme.colors.info.dark};
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
  gap: ${emotionTheme.spacing(1)};
`;

// Title styled component
const AlertTitle = styled.div`
  font-weight: ${emotionTheme.typography.fontWeights.medium};
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