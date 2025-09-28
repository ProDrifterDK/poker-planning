import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from '@emotion/styled';
import { emotionTheme } from '../styles/theme';
import { Button } from './Button';
import { InformationCard } from './InfoCard';

// Full-page hero container
const HeroContainer = styled.section`
  min-height: 100vh;
  background: linear-gradient(135deg, ${emotionTheme.colors.background.default} 0%, ${emotionTheme.colors.background.paper} 100%);
  display: flex;
  align-items: center;
  padding: ${emotionTheme.spacing(8)} ${emotionTheme.spacing(6)};
  position: relative;
  overflow: hidden;

  @media (max-width: 768px) {
    min-height: 100vh;
    padding: ${emotionTheme.spacing(6)} ${emotionTheme.spacing(4)};
    flex-direction: column;
    justify-content: center;
  }
`;

// Content wrapper with Z-pattern layout
const HeroContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${emotionTheme.spacing(8)};
  align-items: center;
  width: 100%;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: ${emotionTheme.spacing(6)};
    text-align: center;
  }
`;

// Left column - Text content (Z-pattern start)
const TextContent = styled.div`
  z-index: 2;
  order: 1;

  @media (max-width: 768px) {
    order: 1;
  }
`;

// Main headline
const HeroHeadline = styled.h1`
  font-family: ${emotionTheme.typography.fontFamily.heading};
  font-size: ${emotionTheme.typography.fontSizes.h1};
  font-weight: ${emotionTheme.typography.fontWeights.bold};
  line-height: ${emotionTheme.typography.lineHeights.heading};
  color: ${emotionTheme.colors.text.primary};
  margin: 0 0 ${emotionTheme.spacing(4)} 0;
  background: linear-gradient(135deg, ${emotionTheme.colors.text.primary} 0%, ${emotionTheme.colors.primary.main} 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 2px 4px rgba(18, 151, 253, 0.1);

  @media (max-width: 768px) {
    font-size: 2.5rem;
  }

  @media (max-width: 480px) {
    font-size: 2rem;
  }
`;

// Sub-headline
const HeroSubheadline = styled.p`
  font-family: ${emotionTheme.typography.fontFamily.body};
  font-size: ${emotionTheme.typography.fontSizes.body};
  line-height: ${emotionTheme.typography.lineHeights.body};
  color: ${emotionTheme.colors.text.secondary};
  margin: 0 0 ${emotionTheme.spacing(8)} 0;
  max-width: 500px;

  @media (max-width: 768px) {
    max-width: none;
  }
`;

// CTA section
const CTASection = styled.div`
  margin-top: ${emotionTheme.spacing(6)};
`;

// Right column - Visual element (Z-pattern middle)
const VisualContent = styled.div`
  z-index: 2;
  order: 2;
  display: flex;
  justify-content: center;
  align-items: center;

  @media (max-width: 768px) {
    order: 2;
    margin-top: ${emotionTheme.spacing(4)};
  }
`;

// Styled visual placeholder using InfoCard
const VisualPlaceholder = styled.div`
  max-width: 400px;
  width: 100%;

  @media (max-width: 768px) {
    max-width: 300px;
  }
`;

// Background decoration
const BackgroundGlow = styled.div`
  position: absolute;
  top: -50%;
  right: -50%;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(18, 151, 253, 0.1) 0%, transparent 70%);
  border-radius: 50%;
  z-index: 1;
`;

// HeroSection component props
export interface HeroSectionProps {
  className?: string;
}

// Main HeroSection component
export const HeroSection: React.FC<HeroSectionProps> = ({ className }) => {
  const { t } = useTranslation();

  const handleCTAClick = () => {
    // Placeholder for CTA action
    console.log('Hero CTA clicked');
  };

  return (
    <HeroContainer className={className}>
      <BackgroundGlow />
      <HeroContent>
        <TextContent>
          <HeroHeadline>
            {t('hero.headline')}
          </HeroHeadline>
          <HeroSubheadline>
            {t('hero.subheadline')}
          </HeroSubheadline>
          <CTASection>
            <Button
              variant="primary"
              onClick={handleCTAClick}
              aria-label={t('hero.cta')}
            >
              {t('hero.cta')}
            </Button>
          </CTASection>
        </TextContent>

        <VisualContent>
          <VisualPlaceholder>
            <InformationCard
              title={t('hero.visualTitle')}
              text={t('hero.visualDescription')}
              icon={
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={emotionTheme.colors.primary.main}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              }
            />
          </VisualPlaceholder>
        </VisualContent>
      </HeroContent>
    </HeroContainer>
  );
};

export default HeroSection;