import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from '@emotion/styled';
import { useTheme } from '@emotion/react';
import AnimatedSection from './AnimatedSection';

// TrustBar container - full width section below hero
const TrustBarContainer = styled.section`
  background: ${props => props.theme.colors.background.paper};
  background: ${props => props.theme.palette.background.paper};
  padding: ${props => props.theme.spacing(8, 0)};
  border-top: 1px solid ${props => props.theme.palette.divider};

  @media (max-width: 768px) {
    padding: ${props => props.theme.spacing(6, 0)};
  }
`;

// Content wrapper with max-width constraint
const TrustBarContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: ${props => props.theme.spacing(0, 6)};
  text-align: center;

  @media (max-width: 768px) {
    padding: ${props => props.theme.spacing(0, 4)};
  }
`;

// Heading section
const TrustBarHeading = styled.h2`
  font-family: ${props => props.theme.typography.fontFamily};
  font-size: ${props => props.theme.typography.h4.fontSize};
  font-weight: ${props => props.theme.typography.h4.fontWeight};
  line-height: ${props => props.theme.typography.h4.lineHeight};
  color: ${props => props.theme.palette.text.secondary};
  margin: ${props => props.theme.spacing(0, 0, 8)};

  @media (max-width: 768px) {
    font-size: ${props => props.theme.typography.body1.fontSize};
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

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: ${props => props.theme.spacing(4)};
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
  background: ${props => props.theme.palette.background.default};
  border: 2px solid ${props => props.theme.palette.divider};
  border-radius: ${props => props.theme.shape.borderRadius}px;
  filter: grayscale(100%);
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    filter: grayscale(80%);
    border-color: ${props => props.theme.palette.primary.main};
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.shadows[1]};
  }

  @media (max-width: 768px) {
    height: 50px;
  }
`;

// Placeholder logo content
const LogoContent = styled.div`
  font-family: ${props => props.theme.typography.fontFamily};
  font-size: ${props => props.theme.typography.caption.fontSize};
  font-weight: ${props => props.theme.typography.caption.fontWeight};
  color: ${props => props.theme.palette.text.disabled};
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