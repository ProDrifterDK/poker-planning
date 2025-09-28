import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from '@emotion/styled';
import { emotionTheme } from '../styles/theme';

// Spacious section container that commands attention
const DemoSection = styled.section`
  min-height: 80vh;
  background: linear-gradient(135deg, ${emotionTheme.colors.background.paper} 0%, ${emotionTheme.colors.background.default} 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${emotionTheme.spacing(16)} ${emotionTheme.spacing(6)};
  position: relative;
  overflow: hidden;

  @media (max-width: 768px) {
    min-height: 70vh;
    padding: ${emotionTheme.spacing(12)} ${emotionTheme.spacing(4)};
  }

  @media (max-width: 480px) {
    min-height: 60vh;
    padding: ${emotionTheme.spacing(8)} ${emotionTheme.spacing(3)};
  }
`;

// Content wrapper to center and constrain width
const DemoContent = styled.div`
  max-width: 1400px;
  width: 100%;
  text-align: center;
  position: relative;
  z-index: 2;
`;

// Section heading
const DemoHeading = styled.h2`
  font-family: ${emotionTheme.typography.fontFamily.heading};
  font-size: ${emotionTheme.typography.fontSizes.h2};
  font-weight: ${emotionTheme.typography.fontWeights.bold};
  line-height: ${emotionTheme.typography.lineHeights.heading};
  color: ${emotionTheme.colors.text.primary};
  margin: 0 0 ${emotionTheme.spacing(4)} 0;
  background: linear-gradient(135deg, ${emotionTheme.colors.text.primary} 0%, ${emotionTheme.colors.primary.main} 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;

  @media (max-width: 768px) {
    font-size: 2.5rem;
    margin-bottom: ${emotionTheme.spacing(3)};
  }

  @media (max-width: 480px) {
    font-size: 2rem;
  }
`;

// Descriptive paragraph
const DemoDescription = styled.p`
  font-family: ${emotionTheme.typography.fontFamily.body};
  font-size: ${emotionTheme.typography.fontSizes.body};
  line-height: ${emotionTheme.typography.lineHeights.body};
  color: ${emotionTheme.colors.text.secondary};
  margin: 0 0 ${emotionTheme.spacing(12)} 0;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;

  @media (max-width: 768px) {
    font-size: 1rem;
    margin-bottom: ${emotionTheme.spacing(8)};
    max-width: none;
  }
`;

// Large demo container - the main focal point
const DemoContainer = styled.div`
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  position: relative;

  @media (max-width: 768px) {
    max-width: 600px;
  }

  @media (max-width: 480px) {
    max-width: none;
  }
`;

// Interactive demo placeholder with distinct styling
const DemoPlaceholder = styled.div`
  width: 100%;
  height: 500px;
  background: linear-gradient(145deg, ${emotionTheme.colors.background.default} 0%, ${emotionTheme.colors.border.main} 100%);
  border: 2px dashed ${emotionTheme.colors.border.light};
  border-radius: ${emotionTheme.borderRadius.large};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    border-color: ${emotionTheme.colors.primary.main};
    background: linear-gradient(145deg, ${emotionTheme.colors.background.paper} 0%, ${emotionTheme.colors.border.light} 100%);
    transform: translateY(-2px);
    box-shadow: ${emotionTheme.shadows.primaryGlow};
  }

  &:focus-within {
    border-color: ${emotionTheme.colors.primary.main};
    box-shadow: ${emotionTheme.shadows.primaryGlow};
  }

  @media (max-width: 768px) {
    height: 400px;
  }

  @media (max-width: 480px) {
    height: 300px;
  }
`;

// Placeholder icon
const PlaceholderIcon = styled.div`
  width: 80px;
  height: 80px;
  margin-bottom: ${emotionTheme.spacing(4)};
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(18, 151, 253, 0.1);
  border-radius: 50%;

  svg {
    width: 40px;
    height: 40px;
    stroke: ${emotionTheme.colors.primary.main};
    stroke-width: 2;
  }

  @media (max-width: 480px) {
    width: 60px;
    height: 60px;
    margin-bottom: ${emotionTheme.spacing(3)};

    svg {
      width: 30px;
      height: 30px;
    }
  }
`;

// Placeholder text
const PlaceholderText = styled.p`
  font-family: ${emotionTheme.typography.fontFamily.body};
  font-size: 1.125rem;
  color: ${emotionTheme.colors.text.secondary};
  margin: 0;
  text-align: center;
  max-width: 400px;

  @media (max-width: 768px) {
    font-size: 1rem;
  }

  @media (max-width: 480px) {
    font-size: 0.875rem;
    max-width: 250px;
  }
`;

// Background decoration elements
const BackgroundElement = styled.div`
  position: absolute;
  top: 10%;
  left: 10%;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(18, 151, 253, 0.05) 0%, transparent 70%);
  border-radius: 50%;
  z-index: 1;

  @media (max-width: 768px) {
    width: 150px;
    height: 150px;
    top: 5%;
    left: 5%;
  }
`;

// InteractiveDemo component props
export interface InteractiveDemoProps {
  className?: string;
}

// Main InteractiveDemo component
export const InteractiveDemo: React.FC<InteractiveDemoProps> = ({ className }) => {
  const { t } = useTranslation();

  const handleDemoClick = () => {
    // Placeholder for demo interaction
    console.log('Interactive demo clicked');
  };

  return (
    <DemoSection className={className}>
      <BackgroundElement />
      <DemoContent>
        <DemoHeading>
          {t('interactiveDemo.title')}
        </DemoHeading>

        <DemoDescription>
          {t('interactiveDemo.description')}
        </DemoDescription>

        <DemoContainer>
          <DemoPlaceholder
            onClick={handleDemoClick}
            role="button"
            tabIndex={0}
            aria-label="Interactive demo placeholder - click to interact"
            onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleDemoClick();
              }
            }}
          >
            <PlaceholderIcon>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-10 5L2 7" />
              </svg>
            </PlaceholderIcon>

            <PlaceholderText>
              Interactive Demo Placeholder
              <br />
              <small>Click to launch demo experience</small>
            </PlaceholderText>
          </DemoPlaceholder>
        </DemoContainer>
      </DemoContent>
    </DemoSection>
  );
};

export default InteractiveDemo;