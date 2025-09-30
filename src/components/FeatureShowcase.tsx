import React from 'react';
import styled from '@emotion/styled';
import { useTranslation } from 'react-i18next';
import { InformationCard } from './InfoCard';
import AnimatedSection from './AnimatedSection';
import {
  User,
  Flash,
  Activity,
  Github,
  Cloud,
  FloppyDiskArrowIn,
} from 'iconoir-react';
import { Grid } from '@mui/material';

const ShowcaseContainer = styled.section`
  padding: ${({ theme }) => theme.spacing(20)} 0;
  background-color: ${({ theme }) => theme.colors.background.default};
  width: 100%;

  @media (max-width: 900px) {
    padding: ${({ theme }) => theme.spacing(16)} 0;
  }
`;

const ShowcaseContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing(4)};
`;

const SectionTitle = styled.h2`
  font-family: ${({ theme }) => theme.typography.fontFamily.heading};
  font-size: ${({ theme }) => theme.typography.fontSizes.h2};
  font-weight: ${({ theme }) => theme.typography.fontWeights.bold};
  line-height: ${({ theme }) => theme.typography.lineHeights.heading};
  color: ${({ theme }) => theme.colors.text.primary};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing(12)};

  @media (max-width: 600px) {
    font-size: ${({ theme }) => theme.typography.fontSizes.h3};
    margin-bottom: ${({ theme }) => theme.spacing(8)};
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
  border-radius: ${({ theme }) => theme.borderRadius.large};
  background-color: ${({ theme }) => theme.colors.primary.main};
  color: ${({ theme }) => theme.colors.primary.contrastText};
  margin-bottom: ${({ theme }) => theme.spacing(4)};
  transition: all 0.3s ease-in-out;
  cursor: pointer;

  svg {
    font-size: 32px;
    transition: transform 0.3s ease-in-out;
  }

  &:hover {
    background-color: ${({ theme }) => theme.colors.primary.dark};
    transform: translateY(-2px) scale(1.1);
    box-shadow: 0 8px 25px rgba(18, 151, 253, 0.4), 0 4px 12px rgba(18, 151, 253, 0.2);
  }

  &:hover svg {
    transform: scale(1.1);
  }

  @media (max-width: 600px) {
    width: 48px;
    height: 48px;
    margin-bottom: ${({ theme }) => theme.spacing(3)};

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
    { xs: 12, md: 8, featureIndex: 0, isHero: true },
    { xs: 12, md: 4, featureIndex: 1 },
    { xs: 12, md: 4, featureIndex: 2 },
    { xs: 12, md: 8, featureIndex: 3 },
    { xs: 12, md: 6, featureIndex: 4 },
    { xs: 12, md: 6, featureIndex: 5 },
  ];

  return (
    <ShowcaseContainer id="features">
      <ShowcaseContent>
        <AnimatedSection animation="fade-up" delay={0.1}>
          <SectionTitle>{t('featureShowcase.title')}</SectionTitle>
        </AnimatedSection>

        <Grid container spacing={4}>
          {gridConfigs.map((config, index) => {
            const feature = features[config.featureIndex];
            if (!feature) return null;

            return (
              <Grid item xs={config.xs} md={config.md} key={feature.key}>
                <AnimatedSection
                  animation="scale-up"
                  delay={0.2 + index * 0.1}
                  style={{ height: '100%' }}
                >
                  <InformationCard
                    icon={<FeatureIcon>{feature.icon}</FeatureIcon>}
                    title={t(feature.titleKey)}
                    text={t(feature.descriptionKey)}
                    sx={{
                      height: '100%',
                      bgcolor: config.isHero ? 'primary.main' : 'background.paper',
                      color: config.isHero ? 'primary.contrastText' : 'text.primary',
                      '& .MuiTypography-root': {
                        color: config.isHero ? 'primary.contrastText' : 'text.primary',
                      },
                      '& .MuiSvgIcon-root': {
                        color: config.isHero ? 'primary.contrastText' : 'primary.main',
                      }
                    }}
                  />
                </AnimatedSection>
              </Grid>
            );
          })}
        </Grid>
      </ShowcaseContent>
    </ShowcaseContainer>
  );
};

export default FeatureShowcase;
