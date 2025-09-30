import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from '@emotion/styled';
import { darkEmotionTheme } from '../styles/theme';
import AnimatedSection from './AnimatedSection';

// TrustBar container - full width section below hero
const TrustBarContainer = styled.section`
  background: ${props => props.theme.colors.background.paper};
  padding: ${darkEmotionTheme.spacing(8)} 0;
  border-top: 1px solid ${props => props.theme.colors.border.main};

  @media (max-width: 768px) {
    padding: ${darkEmotionTheme.spacing(6)} 0;
  }
`;

// Content wrapper with max-width constraint
const TrustBarContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 ${darkEmotionTheme.spacing(6)};
  text-align: center;

  @media (max-width: 768px) {
    padding: 0 ${darkEmotionTheme.spacing(4)};
  }
`;

// Heading section
const TrustBarHeading = styled.h2`
  font-family: ${darkEmotionTheme.typography.fontFamily.heading};
  font-size: ${darkEmotionTheme.typography.fontSizes.h4};
  font-weight: ${darkEmotionTheme.typography.fontWeights.medium};
  line-height: ${darkEmotionTheme.typography.lineHeights.heading};
  color: ${props => props.theme.colors.text.secondary};
  margin: 0 0 ${darkEmotionTheme.spacing(8)} 0;

  @media (max-width: 768px) {
    font-size: ${darkEmotionTheme.typography.fontSizes.body};
    margin-bottom: ${darkEmotionTheme.spacing(6)};
  }
`;

// Logo grid container
const LogoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: ${darkEmotionTheme.spacing(6)};
  align-items: center;
  justify-items: center;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: ${darkEmotionTheme.spacing(4)};
  }

  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

// Individual logo placeholder
const LogoPlaceholder = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 60px;
  background: ${props => props.theme.colors.background.default};
  border: 2px solid ${props => props.theme.colors.border.light};
  border-radius: ${darkEmotionTheme.borderRadius.medium};
  filter: grayscale(100%);
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    filter: grayscale(80%);
    border-color: ${props => props.theme.colors.border.main};
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.shadows.small};
  }

  @media (max-width: 768px) {
    height: 50px;
  }
`;

// Placeholder logo content
const LogoContent = styled.div`
  font-family: ${darkEmotionTheme.typography.fontFamily.body};
  font-size: ${darkEmotionTheme.typography.fontSizes.caption};
  font-weight: ${darkEmotionTheme.typography.fontWeights.medium};
  color: ${props => props.theme.colors.text.disabled};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

// TrustBar component props
export interface TrustBarProps {
  className?: string;
}

// Sample placeholder logos data
const placeholderLogos = [
  'TechCorp',
  'InnovateLab',
  'AgileWorks',
  'DevTeam Pro',
  'SprintMasters',
  'CodeCollab'
];

// Main TrustBar component
export const TrustBar: React.FC<TrustBarProps> = ({ className }) => {
  const { t } = useTranslation();

  return (
    <TrustBarContainer className={className}>
      <AnimatedSection animation="fade-up" delay={0.1}>
        <TrustBarContent>
          <AnimatedSection animation="fade-down" delay={0.2}>
            <TrustBarHeading>
              {t('trustBar.heading')}
            </TrustBarHeading>
          </AnimatedSection>

          <AnimatedSection animation="scale-up" delay={0.4}>
            <LogoGrid>
              {placeholderLogos.map((logo, index) => (
                <LogoPlaceholder key={index}>
                  <LogoContent>
                    {logo}
                  </LogoContent>
                </LogoPlaceholder>
              ))}
            </LogoGrid>
          </AnimatedSection>
        </TrustBarContent>
      </AnimatedSection>
    </TrustBarContainer>
  );
};

export default TrustBar;