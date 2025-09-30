import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from '@emotion/styled';
import AnimatedSection from './AnimatedSection';

// TrustBar container - full width section below hero
const TrustBarContainer = styled.section`
  background: ${props => props.theme.colors.background.paper};
  padding: ${props => `${props.theme.spacing(8)} 0`};
  border-top: 1px solid ${props => props.theme.colors.border.main};

  @media (max-width: ${props => props.theme.breakpoints.values.md}px) {
    padding: ${props => `${props.theme.spacing(6)} 0`};
  }
`;

// Content wrapper with max-width constraint
const TrustBarContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: ${props => `0 ${props.theme.spacing(6)}`};
  text-align: center;

  @media (max-width: ${props => props.theme.breakpoints.values.md}px) {
    padding: ${props => `0 ${props.theme.spacing(4)}`};
  }
`;

// Heading section
const TrustBarHeading = styled.h2`
  font-family: ${props => props.theme.typography.fontFamily.heading};
  font-size: ${props => props.theme.typography.fontSizes.h4};
  font-weight: ${props => props.theme.typography.fontWeights.bold};
  line-height: ${props => props.theme.typography.lineHeights.heading};
  color: ${props => props.theme.colors.text.secondary};
  margin: ${props => `0 0 ${props.theme.spacing(8)}`};

  @media (max-width: ${props => props.theme.breakpoints.values.md}px) {
    font-size: ${props => props.theme.typography.fontSizes.body};
    margin-bottom: ${props => props.theme.spacing(6)};
  }
`;

// Logo grid container
const LogoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: ${props => props.theme.spacing(6)};
  align-items: center;
  justify-items: center;

  @media (max-width: ${props => props.theme.breakpoints.values.md}px) {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: ${props => props.theme.spacing(4)};
  }

  @media (max-width: ${props => props.theme.breakpoints.values.sm}px) {
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
  border: 2px solid ${props => props.theme.colors.border.main};
  border-radius: ${props => props.theme.borderRadius.medium};
  filter: grayscale(100%);
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    filter: grayscale(80%);
    border-color: ${props => props.theme.colors.primary.main};
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.shadows.small};
  }

  @media (max-width: ${props => props.theme.breakpoints.values.md}px) {
    height: 50px;
  }
`;

// Placeholder logo content
const LogoContent = styled.div`
  font-family: ${props => props.theme.typography.fontFamily.body};
  font-size: ${props => props.theme.typography.fontSizes.caption};
  font-weight: ${props => props.theme.typography.fontWeights.medium};
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