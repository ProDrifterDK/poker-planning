import React from 'react';
import styled from '@emotion/styled';
import { useTranslation } from 'react-i18next';
import { InformationCard } from './InfoCard';
import { emotionTheme } from '../styles/theme';
import AnimatedSection from './AnimatedSection';
import {
  User,
  Flash,
  Activity,
  Github,
  Cloud,
  FloppyDiskArrowIn
} from 'iconoir-react';

// Styled container for the entire feature showcase section
const ShowcaseContainer = styled.section`
  padding: ${emotionTheme.spacing(16)} ${emotionTheme.spacing(6)};
  background-color: ${emotionTheme.colors.background.default};
  max-width: 1200px;
  margin: 0 auto;

  @media (max-width: 900px) {
    padding: ${emotionTheme.spacing(12)} ${emotionTheme.spacing(4)};
  }
`;

// Styled section title
const SectionTitle = styled.h2`
  font-family: ${emotionTheme.typography.fontFamily.heading};
  font-size: ${emotionTheme.typography.fontSizes.h2};
  font-weight: ${emotionTheme.typography.fontWeights.bold};
  line-height: ${emotionTheme.typography.lineHeights.heading};
  color: ${emotionTheme.colors.text.primary};
  text-align: center;
  margin: 0 0 ${emotionTheme.spacing(12)} 0;

  @media (max-width: 600px) {
    font-size: ${emotionTheme.typography.fontSizes.h3};
    margin-bottom: ${emotionTheme.spacing(8)};
  }
`;

// Styled Bento Grid container
const BentoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  grid-auto-rows: 200px;
  gap: ${emotionTheme.spacing(4)};
  margin-bottom: ${emotionTheme.spacing(8)};

  @media (max-width: 1200px) {
    grid-template-columns: repeat(4, 1fr);
  }

  @media (max-width: 900px) {
    grid-template-columns: repeat(3, 1fr);
    grid-auto-rows: 180px;
  }

  @media (max-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
    grid-auto-rows: 160px;
    gap: ${emotionTheme.spacing(3)};
  }

  @media (max-width: 400px) {
    grid-template-columns: 1fr;
    grid-auto-rows: 140px;
  }
`;

// Styled grid items with different sizes for Bento layout
const GridItem = styled.div<{ size: 'small' | 'medium' | 'large' | 'hero' }>`
  grid-column: ${({ size }) => {
    switch (size) {
      case 'hero':
        return 'span 3';
      case 'large':
        return 'span 2';
      case 'medium':
        return 'span 2';
      case 'small':
      default:
        return 'span 1';
    }
  }};

  grid-row: ${({ size }) => {
    switch (size) {
      case 'hero':
        return 'span 2';
      case 'large':
        return 'span 1';
      case 'medium':
        return 'span 1';
      case 'small':
      default:
        return 'span 1';
    }
  }};

  @media (max-width: 1200px) {
    grid-column: ${({ size }) => {
      switch (size) {
        case 'hero':
          return 'span 2';
        case 'large':
          return 'span 2';
        case 'medium':
          return 'span 1';
        case 'small':
        default:
          return 'span 1';
      }
    }};
  }

  @media (max-width: 900px) {
    grid-column: ${({ size }) => {
      switch (size) {
        case 'hero':
          return 'span 3';
        case 'large':
          return 'span 2';
        case 'medium':
          return 'span 1';
        case 'small':
        default:
          return 'span 1';
      }
    }};
  }

  @media (max-width: 600px) {
    grid-column: span 1;
    grid-row: span 1;
  }

  @media (max-width: 400px) {
    grid-column: span 1;
    grid-row: span 1;
  }
`;

// Feature interface
interface Feature {
  key: string;
  icon: React.ReactNode;
  titleKey: string;
  descriptionKey: string;
}

// Styled icon wrapper for consistent sizing
const FeatureIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: ${emotionTheme.borderRadius.large};
  background-color: ${emotionTheme.colors.primary.main};
  color: ${emotionTheme.colors.primary.contrastText};
  margin-bottom: ${emotionTheme.spacing(4)};
  transition: all 0.3s ease-in-out;
  cursor: pointer;

  svg {
    font-size: 32px;
    transition: transform 0.3s ease-in-out;
  }

  &:hover {
    background-color: ${emotionTheme.colors.primary.dark};
    transform: translateY(-2px) scale(1.1);
    box-shadow: 0 8px 25px rgba(18, 151, 253, 0.4), 0 4px 12px rgba(18, 151, 253, 0.2);
  }

  &:hover svg {
    transform: scale(1.1);
  }

  @media (max-width: 600px) {
    width: 48px;
    height: 48px;
    margin-bottom: ${emotionTheme.spacing(3)};

    svg {
      font-size: 24px;
    }
  }
`;

// Main FeatureShowcase component
export const FeatureShowcase: React.FC = () => {
  const { t } = useTranslation();

  // Define features with their properties
  const features: Feature[] = [
    {
      key: 'realtime',
      icon: <User />,
      titleKey: 'featureShowcase.features.realtime.title',
      descriptionKey: 'featureShowcase.features.realtime.description'
    },
    {
      key: 'flexible',
      icon: <Flash />,
      titleKey: 'featureShowcase.features.flexible.title',
      descriptionKey: 'featureShowcase.features.flexible.description'
    },
    {
      key: 'analytics',
      icon: <Activity />,
      titleKey: 'featureShowcase.features.analytics.title',
      descriptionKey: 'featureShowcase.features.analytics.description'
    },
    {
      key: 'integrations',
      icon: <Github />,
      titleKey: 'featureShowcase.features.integrations.title',
      descriptionKey: 'featureShowcase.features.integrations.description'
    },
    {
      key: 'remote',
      icon: <Cloud />,
      titleKey: 'featureShowcase.features.remote.title',
      descriptionKey: 'featureShowcase.features.remote.description'
    },
    {
      key: 'history',
      icon: <FloppyDiskArrowIn />,
      titleKey: 'featureShowcase.features.history.title',
      descriptionKey: 'featureShowcase.features.history.description'
    }
  ];

  // Define grid item configurations with different sizes
  const gridConfigs = [
    { size: 'hero' as const, featureIndex: 0 }, // Real-time collaboration (hero)
    { size: 'large' as const, featureIndex: 1 }, // Flexible estimation
    { size: 'medium' as const, featureIndex: 2 }, // Analytics
    { size: 'large' as const, featureIndex: 3 }, // Integrations
    { size: 'small' as const, featureIndex: 4 }, // Remote-first
    { size: 'medium' as const, featureIndex: 5 }, // History
  ];

  return (
    <ShowcaseContainer>
      <AnimatedSection animation="fade-up" delay={0.1}>
        <SectionTitle>{t('featureShowcase.title')}</SectionTitle>
      </AnimatedSection>

      <AnimatedSection animation="fade-up" delay={0.2}>
        <BentoGrid>
          {gridConfigs.map((config, index) => {
            const feature = features[config.featureIndex];
            if (!feature) return null;

            return (
              <AnimatedSection
                key={feature.key}
                animation="scale-up"
                delay={0.3 + (index * 0.1)}
              >
                <GridItem size={config.size}>
                  <InformationCard
                    icon={<FeatureIcon>{feature.icon}</FeatureIcon>}
                    title={t(feature.titleKey)}
                    text={t(feature.descriptionKey)}
                  />
                </GridItem>
              </AnimatedSection>
            );
          })}
        </BentoGrid>
      </AnimatedSection>
    </ShowcaseContainer>
  );
};

export default FeatureShowcase;
