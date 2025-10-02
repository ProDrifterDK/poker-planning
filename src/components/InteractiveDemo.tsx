import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from '@emotion/styled';
import AnimatedSection from './AnimatedSection';
import { motion } from 'framer-motion';

const AnimatedGradientBackground = styled.section`
  min-height: 80vh;
  padding: ${({ theme }) => theme.spacing(16)} ${({ theme }) => theme.spacing(6)};
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;

  background: ${props => props.theme.palette.mode === 'dark'
    ? `linear-gradient(45deg, ${props.theme.palette.primary.dark}, ${props.theme.palette.secondary.dark}, ${props.theme.palette.primary.dark}, ${props.theme.palette.secondary.dark})`
    : `linear-gradient(45deg, ${props.theme.palette.primary.light}, ${props.theme.palette.secondary.light}, ${props.theme.palette.primary.light}, ${props.theme.palette.background.paper})`
  };
  background-size: 400% 400%;
  animation: gradientAnimation 15s ease infinite;

  @keyframes gradientAnimation {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.values.md}px) {
    min-height: 70vh;
    padding: ${({ theme }) => theme.spacing(12)} ${({ theme }) => theme.spacing(4)};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.values.sm}px) {
    min-height: 60vh;
    padding: ${({ theme }) => theme.spacing(8)} ${({ theme }) => theme.spacing(3)};
  }
`;

const GlassmorphicCard = styled(motion.div)`
  width: 100%;
  height: 500px;
  background: ${props => props.theme.palette.mode === 'dark' ? 'rgba(40, 40, 40, 0.25)' : 'rgba(255, 255, 255, 0.25)'};
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid ${props => props.theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.18)'};
  box-shadow: ${props => props.theme.shadows.primaryGlow};
  border-radius: ${({ theme }) => theme.shape.borderRadius * 2}px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.3s ease;
  padding: ${({ theme }) => theme.spacing(4)};

  @media (max-width: ${({ theme }) => theme.breakpoints.values.md}px) {
    height: 400px;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.values.sm}px) {
    height: 300px;
  }
`;

const DemoContent = styled.div`
  max-width: 1400px;
  width: 100%;
  text-align: center;
  position: relative;
  z-index: 2;
`;

const DemoHeading = styled.h2`
  font-family: ${({ theme }) => theme.typography.fontFamily.heading};
  font-size: ${({ theme }) => theme.typography.fontSizes.h2};
  font-weight: ${({ theme }) => theme.typography.fontWeights.bold};
  line-height: ${({ theme }) => theme.typography.lineHeights.heading};
  color: ${props => props.theme.palette.text.primary};
  margin: 0 0 ${({ theme }) => theme.spacing(4)} 0;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.values.md}px) {
    font-size: 2.5rem;
    margin-bottom: ${({ theme }) => theme.spacing(3)};
  }
  @media (max-width: ${({ theme }) => theme.breakpoints.values.sm}px) {
    font-size: 2rem;
  }
`;

const DemoDescription = styled.p`
  font-family: ${({ theme }) => theme.typography.fontFamily.body};
  font-size: ${({ theme }) => theme.typography.fontSizes.body};
  line-height: ${({ theme }) => theme.typography.lineHeights.body};
  color: ${props => props.theme.palette.text.primary};
  margin: 0 auto ${({ theme }) => theme.spacing(12)} auto;
  max-width: 700px;

  @media (max-width: ${({ theme }) => theme.breakpoints.values.md}px) {
    font-size: 1rem;
    margin-bottom: ${({ theme }) => theme.spacing(8)};
    max-width: none;
  }
`;

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

export interface InteractiveDemoProps {
  className?: string;
}

export const InteractiveDemo: React.FC<InteractiveDemoProps> = ({ className }) => {
  const { t } = useTranslation();

  return (
    <AnimatedGradientBackground className={className}>
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
              <GlassmorphicCard>
                <video src="/videos/planning-room-demo.mp4" loop autoPlay muted style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </GlassmorphicCard>
            </DemoContainer>
          </AnimatedSection>
        </DemoContent>
      </AnimatedSection>
    </AnimatedGradientBackground>
  );
};

export default InteractiveDemo;
