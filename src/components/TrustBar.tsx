import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from '@emotion/styled';
import Image from 'next/image';
import AnimatedSection from './AnimatedSection';

const TrustBarContainer = styled.section`
  background: ${props => props.theme.colors.background.paper};
  padding: ${props => `${props.theme.spacing(10)} 0`};
  border-top: 1px solid ${props => props.theme.colors.border.main};
`;

const TrustBarContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: ${props => `0 ${props.theme.spacing(4)}`};
  text-align: center;
`;

const TrustBarHeading = styled.h2`
  font-family: ${props => props.theme.typography.fontFamily.heading};
  font-size: ${props => props.theme.typography.fontSizes.h5};
  font-weight: ${props => props.theme.typography.fontWeights.semiBold};
  color: ${props => props.theme.colors.text.secondary};
  margin-bottom: ${props => props.theme.spacing(6)};
  text-transform: uppercase;
  letter-spacing: 1.5px;
`;

const LogoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: ${props => props.theme.spacing(8)};
  align-items: center;
  justify-items: center;

  @media (max-width: ${props => props.theme.breakpoints.values.sm}px) {
    grid-template-columns: repeat(2, 1fr);
    gap: ${props => props.theme.spacing(6)};
  }
`;

const LogoImage = styled(Image)`
  filter: grayscale(100%);
  opacity: 0.6;
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);

  &:hover {
    filter: grayscale(0%);
    opacity: 1;
    transform: scale(1.1);
  }
`;

export interface TrustBarProps {
  className?: string;
}

// TODO: Replace these placeholder image URLs with the actual company logos.
// Instructions:
// 1. Obtain the final logo images (preferably in SVG format for best quality).
// 2. Place the images in the `public/images/logos` directory (create it if it doesn't exist).
// 3. Update the URLs in the `placeholderLogos` array below to point to your new images.
//    For example: '/images/logos/company-name.svg'
const placeholderLogos = [
  { name: 'TechCorp', src: 'https://via.placeholder.com/150x60.png?text=TechCorp' },
  { name: 'InnovateLab', src: 'https://via.placeholder.com/150x60.png?text=InnovateLab' },
  { name: 'AgileWorks', src: 'https://via.placeholder.com/150x60.png?text=AgileWorks' },
  { name: 'DevTeam Pro', src: 'https://via.placeholder.com/150x60.png?text=DevTeam+Pro' },
  { name: 'SprintMasters', src: 'https://via.placeholder.com/150x60.png?text=SprintMasters' },
  { name: 'CodeCollab', src: 'https://via.placeholder.com/150x60.png?text=CodeCollab' }
];

export const TrustBar: React.FC<TrustBarProps> = ({ className }) => {
  const { t } = useTranslation('common');

  return (
    <TrustBarContainer className={className}>
      <AnimatedSection animation="fade-up" delay={0.1}>
        <TrustBarContent>
          <AnimatedSection animation="fade-down" delay={0.2}>
            <TrustBarHeading>
              {t('trustBar.heading')}
            </TrustBarHeading>
          </AnimatedSection>

          <AnimatedSection animation="fade-up" delay={0.4}>
            <LogoGrid>
              {placeholderLogos.map((logo) => (
                <LogoImage
                  key={logo.name}
                  src={logo.src}
                  alt={`${logo.name} Logo`}
                  width={150}
                  height={60}
                  unoptimized // Necessary for external placeholder images
                />
              ))}
            </LogoGrid>
          </AnimatedSection>
        </TrustBarContent>
      </AnimatedSection>
    </TrustBarContainer>
  );
};

export default TrustBar;