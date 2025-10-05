import React from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import styled from '@emotion/styled';
import { Theme } from '@mui/material/styles';
import { Button } from './Button';
import AnimatedSection from './AnimatedSection';

const CTAContainer = styled.section`
  background: linear-gradient(135deg, ${({ theme }) => (theme as unknown as Theme).palette.background.default} 0%, ${({ theme }) => (theme as unknown as Theme).palette.background.paper} 100%);
  padding: ${({ theme }) => (theme as unknown as Theme).spacing(16)} ${({ theme }) => (theme as unknown as Theme).spacing(6)};
  text-align: center;
  position: relative;
  overflow: hidden;

  @media (max-width: 768px) {
    padding: ${({ theme }) => theme.spacing(12)} ${({ theme }) => theme.spacing(4)};
  }
`;

const BackgroundGlow = styled.div`
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(18, 151, 253, 0.1) 0%, transparent 70%);
  z-index: 1;
  pointer-events: none;
`;

const CTAContent = styled.div`
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  z-index: 2;
`;

const CTAHeadline = styled.h2`
  font-family: ${({ theme }) => theme.typography.fontFamily.heading};
  font-size: ${({ theme }) => theme.typography.fontSizes.h2};
  font-weight: ${({ theme }) => theme.typography.fontWeights.bold};
  line-height: ${({ theme }) => theme.typography.lineHeights.heading};
  color: ${({ theme }) => theme.palette.text.primary};
  margin: 0 0 ${({ theme }) => theme.spacing(6)} 0;
  background: linear-gradient(135deg, ${({ theme }) => theme.palette.text.primary} 0%, ${({ theme }) => theme.palette.primary.main} 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;

  @media (max-width: 768px) {
    font-size: ${({ theme }) => theme.typography.fontSizes.h2};
  }

  @media (max-width: 480px) {
    font-size: ${({ theme }) => theme.typography.fontSizes.h3};
  }
`;

const TestimonialSection = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing(8)};
`;

const TestimonialText = styled.blockquote`
  font-family: ${({ theme }) => theme.typography.fontFamily.body};
  font-size: ${({ theme }) => theme.typography.fontSizes.body};
  line-height: ${({ theme }) => theme.typography.lineHeights.body};
  color: ${({ theme }) => theme.palette.text.secondary};
  margin: 0 0 ${({ theme }) => theme.spacing(4)} 0;
  font-style: italic;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;

  &::before {
    content: '"';
    color: ${({ theme }) => theme.palette.primary.main};
    font-size: ${({ theme }) => theme.typography.fontSizes.h2};
    font-family: ${({ theme }) => theme.typography.fontFamily.heading};
    line-height: 1;
    display: block;
    margin-bottom: ${({ theme }) => theme.spacing(2)};
  }

  &::after {
    content: '"';
    color: ${({ theme }) => theme.palette.primary.main};
    font-size: ${({ theme }) => theme.typography.fontSizes.h2};
    font-family: ${({ theme }) => theme.typography.fontFamily.heading};
    line-height: 1;
    display: block;
    margin-top: ${({ theme }) => theme.spacing(2)};
  }

  @media (max-width: 768px) {
    font-size: ${({ theme }) => theme.typography.fontSizes.body};
    max-width: none;
  }
`;


const CTAButton = styled(Button)`
  font-size: ${({ theme }) => (theme as unknown as Theme).typography.h4.fontSize};
  padding: ${({ theme }) => (theme as unknown as Theme).spacing(4)} ${({ theme }) => (theme as unknown as Theme).spacing(8)};
  border-radius: ${({ theme }) => (theme as unknown as Theme).shape.borderRadius * 2}px;

  @media (max-width: 768px) {
    font-size: ${({ theme }) => (theme as unknown as Theme).typography.body1.fontSize};
    padding: ${({ theme }) => (theme as unknown as Theme).spacing(3)} ${({ theme }) => (theme as unknown as Theme).spacing(6)};
  }
`;

export interface FinalCTAProps {
  className?: string;
}

export const FinalCTA: React.FC<FinalCTAProps> = ({ className }) => {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const handleCTAClick = () => {
    const currentLang = i18n.language || 'en';
    router.push(`/${currentLang}/auth/signup`);
  };

  return (
    <CTAContainer id="about" className={className}>
      <BackgroundGlow />
      <AnimatedSection animation="fade-up" delay={0.1}>
        <CTAContent>
          <AnimatedSection animation="fade-down" delay={0.2}>
            <CTAHeadline>
              {t('finalCTA.headline')}
            </CTAHeadline>
          </AnimatedSection>

          <AnimatedSection animation="fade-up" delay={0.3}>
            <TestimonialSection>
              <TestimonialText>
                {t('finalCTA.testimonial')}
              </TestimonialText>
            </TestimonialSection>
          </AnimatedSection>

          <AnimatedSection
            animation="scale-up"
            delay={0.4}
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <CTAButton
              variant="primary"
              onClick={handleCTAClick}
              aria-label={t('finalCTA.cta')}
            >
              {t('finalCTA.cta')}
            </CTAButton>
          </AnimatedSection>
        </CTAContent>
      </AnimatedSection>
    </CTAContainer>
  );
};

export default FinalCTA;