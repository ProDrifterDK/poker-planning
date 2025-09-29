import React from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { Refresh } from 'iconoir-react';

// Loading spinner animation
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

// Spinner wrapper with animation
const SpinnerWrapper = styled.div<{ size?: number }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${({ size = 40 }) => size}px;
  height: ${({ size = 40 }) => size}px;
  animation: ${spin} 1s linear infinite;
`;

// Container to center the spinner
const SpinnerContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  width: 100%;
`;

// LoadingSpinner component props interface
export interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

// Main LoadingSpinner component
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 40,
  className
}) => {
  return (
    <SpinnerContainer className={className}>
      <SpinnerWrapper size={size}>
        <Refresh
          width={size}
          height={size}
          strokeWidth={2}
        />
      </SpinnerWrapper>
    </SpinnerContainer>
  );
};

export default LoadingSpinner;