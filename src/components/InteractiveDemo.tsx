import React from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import styled from '@emotion/styled';
import AnimatedSection from './AnimatedSection';

// Spacious section container that commands attention
const DemoSection = styled.section`
  min-height: 80vh;
  background: linear-gradient(135deg, ${props => props.theme.colors.background.paper} 0%, ${props => props.theme.colors.background.default} 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing(16)} ${({ theme }) => theme.spacing(6)};
  position: relative;
  overflow: hidden;

  @media (max-width: ${({ theme }) => theme.breakpoints.values.md}px) {
    min-height: 70vh;
    padding: ${({ theme }) => theme.spacing(12)} ${({ theme }) => theme.spacing(4)};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.values.sm}px) {
    min-height: 60vh;
    padding: ${({ theme }) => theme.spacing(8)} ${({ theme }) => theme.spacing(3)};
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
  font-family: ${({ theme }) => theme.typography.fontFamily.heading};
  font-size: ${({ theme }) => theme.typography.fontSizes.h2};
  font-weight: ${({ theme }) => theme.typography.fontWeights.bold};
  line-height: ${({ theme }) => theme.typography.lineHeights.heading};
  color: ${props => props.theme.colors.text.primary};
  margin: 0 0 ${({ theme }) => theme.spacing(4)} 0;
  background: linear-gradient(135deg, ${props => props.theme.colors.text.primary} 0%, ${props => props.theme.colors.primary.main} 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;

  @media (max-width: ${({ theme }) => theme.breakpoints.values.md}px) {
    font-size: 2.5rem;
    margin-bottom: ${({ theme }) => theme.spacing(3)};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.values.sm}px) {
    font-size: 2rem;
  }
`;

// Descriptive paragraph
const DemoDescription = styled.p`
  font-family: ${({ theme }) => theme.typography.fontFamily.body};
  font-size: ${({ theme }) => theme.typography.fontSizes.body};
  line-height: ${({ theme }) => theme.typography.lineHeights.body};
  color: ${props => props.theme.colors.text.secondary};
  margin: 0 0 ${({ theme }) => theme.spacing(12)} 0;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;

  @media (max-width: ${({ theme }) => theme.breakpoints.values.md}px) {
    font-size: 1rem;
    margin-bottom: ${({ theme }) => theme.spacing(8)};
    max-width: none;
  }
`;

// Large demo container - the main focal point
const DemoContainer = styled.div`
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  position: relative;

  @media (max-width: ${({ theme }) => theme.breakpoints.values.md}px) {
    max-width: 600px;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.values.sm}px) {
    max-width: none;
  }
`;

// Interactive demo placeholder with distinct styling
const DemoPlaceholder = styled.div`
  width: 100%;
  height: 500px;
  background: linear-gradient(145deg, ${props => props.theme.colors.background.default} 0%, ${props => props.theme.colors.border.main} 100%);
  border: 2px dashed ${props => props.theme.colors.border.light};
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    border-color: ${props => props.theme.colors.primary.main};
    background: linear-gradient(145deg, ${props => props.theme.colors.background.paper} 0%, ${props => props.theme.colors.border.light} 100%);
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.shadows.primaryGlow};
  }

  &:focus-within {
    border-color: ${props => props.theme.colors.primary.main};
    box-shadow: ${props => props.theme.shadows.primaryGlow};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.values.md}px) {
    height: 400px;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.values.sm}px) {
    height: 300px;
  }
`;

// Placeholder icon
const PlaceholderIcon = styled.div`
  width: 80px;
  height: 80px;
  margin-bottom: ${({ theme }) => theme.spacing(4)};
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(18, 151, 253, 0.1);
  border-radius: 50%;

  svg {
    width: 40px;
    height: 40px;
    stroke: ${props => props.theme.colors.primary.main};
    stroke-width: 2;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.values.sm}px) {
    width: 60px;
    height: 60px;
    margin-bottom: ${({ theme }) => theme.spacing(3)};

    svg {
      width: 30px;
      height: 30px;
    }
  }
`;

// Placeholder text
const PlaceholderText = styled.p`
  font-family: ${({ theme }) => theme.typography.fontFamily.body};
  font-size: 1.125rem;
  color: ${props => props.theme.colors.text.secondary};
  margin: 0;
  text-align: center;
  max-width: 400px;

  @media (max-width: ${({ theme }) => theme.breakpoints.values.md}px) {
    font-size: 1rem;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.values.sm}px) {
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
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const handleDemoClick = () => {
    // Navigate to signup page with current language
    const currentLang = i18n.language || 'en';
    router.push(`/${currentLang}/auth/signup`);
  };

  return (
    <DemoSection className={className}>
      <BackgroundElement />
      <AnimatedSection animation="fade-up" delay={0.1}>
        <DemoContent>
          <AnimatedSection animation="fade-down" delay={0.2}>
            <DemoHeading>
              {t('interactiveDemo.title')}
            </DemoHeading>
          </AnimatedSection>

          <AnimatedSection animation="fade-up" delay={0.3}>
            <DemoDescription>
              {t('interactiveDemo.description')}
            </DemoDescription>
          </AnimatedSection>

          <AnimatedSection animation="scale-up" delay={0.4}>
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
          </AnimatedSection>
        </DemoContent>
      </AnimatedSection>
    </DemoSection>
  );
};

export default InteractiveDemo;