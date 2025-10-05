import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import Image from 'next/image';
import AnimatedSection from '../../core/AnimatedSection';


const companyLogos = [
  {
    name: 'Google',
    path: '/images/logo/icons8-google-480.svg', // Assuming a generic google icon exists or will be added
  },
  {
    name: 'Microsoft',
    path: '/images/logo/Microsoft_logo.svg', // Assuming a generic microsoft icon exists or will be added
  },
  {
    name: 'Amazon',
    path: '/images/logo/amazon-tile.svg',
  },
  {
    name: 'Meta',
    path: '/images/logo/Meta_Platforms_logo.svg',
  },
  {
    name: 'Apple',
    path: '/images/logo/Apple_logo_black.svg',
  },
  {
    name: 'Netflix',
    path: '/images/logo/netflix-logo-icon.svg',
  },
  {
    name: 'Spotify',
    path: '/images/logo/iconmonstr-spotify-1.svg',
  },
  {
    name: 'Salesforce',
    path: '/images/logo/salesforce-svgrepo-com.svg',
  },
];


// --- 2. Animation Definition ---
const scrollingAnimation = keyframes`
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
`;

// --- 3. Styled Components ---

const TrustBarContainer = styled.section`
  background: linear-gradient(90deg, ${props => props.theme.colors.background.paper} 0%, ${props => props.theme.colors.background.default} 100%);
  padding: ${props => `${props.theme.spacing(12)} 0`};
  border-top: 1px solid ${props => props.theme.colors.border.main};
  border-bottom: 1px solid ${props => props.theme.colors.border.main};
  position: relative;
  overflow: hidden;

  &::before,
  &::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    width: 200px;
    z-index: 2;
    pointer-events: none;
  }

  &::before {
    left: 0;
    background: linear-gradient(to right, ${props => props.theme.colors.background.paper}, transparent);
  }

  &::after {
    right: 0;
    background: linear-gradient(to left, ${props => props.theme.colors.background.default}, transparent);
  }

  @media (max-width: ${props => props.theme.breakpoints.values.sm}px) {
    &::before,
    &::after {
      width: 100px;
    }
  }
`;

const TrustBarContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: ${props => `0 ${props.theme.spacing(4)}`};
  text-align: center;
`;

const TrustBarHeading = styled.h2`
  font-family: ${props => props.theme.typography.fontFamily.heading};
  font-size: ${props => props.theme.typography.fontSizes.caption};
  font-weight: ${props => props.theme.typography.fontWeights.medium};
  color: ${props => props.theme.colors.text.secondary};
  margin-bottom: ${props => props.theme.spacing(8)};
  text-transform: uppercase;
  letter-spacing: 2px;
`;

const ScrollerTrack = styled.div`
  display: flex;
  // Calculate width to be twice the number of logos times their container width
  width: calc(250px * ${companyLogos.length * 2});
  gap: ${props => props.theme.spacing(10)};
  animation: ${scrollingAnimation} 40s linear infinite;
  will-change: transform;

  &:hover {
    animation-play-state: paused;
  }

  @media (prefers-reduced-motion: reduce) {
    animation-play-state: paused;
  }
`;

const LogoItem = styled.div`
  flex-shrink: 0;
  width: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  .logo-image {
    width: auto;
    height: 40px;
    max-width: 120px;
    filter: grayscale(100%);
    opacity: 0.7;
    transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  }
  &:hover .logo-image {
    filter: grayscale(0%) drop-shadow(0 0 8px ${props => props.theme.colors.text.primary}33);
    opacity: 1;
    transform: scale(1.1);
  }
`;

export interface TrustBarProps {
  className?: string;
}

// --- 4. Main React Component ---

export const TrustBar: React.FC<TrustBarProps> = ({ className }) => {
  const { t } = useTranslation('common');

  return (
    <TrustBarContainer className={className}>
      <AnimatedSection animation="fade-up" delay={0.1}>
        <TrustBarContent>
          <AnimatedSection animation="fade-down" delay={0.2}>
            <TrustBarHeading>
              {t('trustBar.heading', 'Trusted by Industry Leaders')}
            </TrustBarHeading>
          </AnimatedSection>

          <ScrollerTrack>
            {/* Render logos twice for a seamless infinite loop */}
            {[...companyLogos, ...companyLogos].map((logo, index) => (
              <LogoItem key={`${logo.name}-${index}`} aria-hidden={index >= companyLogos.length}>
                <Image
                  src={logo.path}
                  alt={`${logo.name} logo`}
                  width={120}
                  height={40}
                  className="logo-image"
                />
              </LogoItem>
            ))}
          </ScrollerTrack>
        </TrustBarContent>
      </AnimatedSection>
    </TrustBarContainer>
  );
};

export default TrustBar;
