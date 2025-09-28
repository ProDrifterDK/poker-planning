import React from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import styled from '@emotion/styled';
import { emotionTheme } from '../styles/theme';
import { Button } from './Button';
import AnimatedSection from './AnimatedSection';

// High-contrast container with dark background and gradient
const CTAContainer = styled.section`
  background: linear-gradient(135deg, ${emotionTheme.colors.background.default} 0%, #0F0F0F 100%);
  padding: ${emotionTheme.spacing(16)} ${emotionTheme.spacing(6)};
  text-align: center;
  position: relative;
  overflow: hidden;

  @media (max-width: 768px) {
    padding: ${emotionTheme.spacing(12)} ${emotionTheme.spacing(4)};
  }
`;

// Background glow effect for visual interest
const BackgroundGlow = styled.div`
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(18, 151, 253, 0.1) 0%, transparent 70%);
  z-index: 1;
`;

// Content wrapper
const CTAContent = styled.div`
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  z-index: 2;
`;

// Bold, compelling headline
const CTAHeadline = styled.h2`
  font-family: ${emotionTheme.typography.fontFamily.heading};
  font-size: ${emotionTheme.typography.fontSizes.h2};
  font-weight: ${emotionTheme.typography.fontWeights.bold};
  line-height: ${emotionTheme.typography.lineHeights.heading};
  color: ${emotionTheme.colors.text.primary};
  margin: 0 0 ${emotionTheme.spacing(6)} 0;
  background: linear-gradient(135deg, ${emotionTheme.colors.text.primary} 0%, ${emotionTheme.colors.primary.main} 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;

  @media (max-width: 768px) {
    font-size: 2rem;
  }

  @media (max-width: 480px) {
    font-size: 1.75rem;
  }
`;

// Testimonial section for social proof
const TestimonialSection = styled.div`
  margin-bottom: ${emotionTheme.spacing(8)};
`;

// Testimonial text with quotation marks
const TestimonialText = styled.blockquote`
  font-family: ${emotionTheme.typography.fontFamily.body};
  font-size: ${emotionTheme.typography.fontSizes.body};
  line-height: ${emotionTheme.typography.lineHeights.body};
  color: ${emotionTheme.colors.text.secondary};
  margin: 0 0 ${emotionTheme.spacing(4)} 0;
  font-style: italic;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;

  &::before {
    content: '"';
    color: ${emotionTheme.colors.primary.main};
    font-size: 3rem;
    font-family: ${emotionTheme.typography.fontFamily.heading};
    line-height: 1;
    display: block;
    margin-bottom: ${emotionTheme.spacing(2)};
  }

  &::after {
    content: '"';
    color: ${emotionTheme.colors.primary.main};
    font-size: 3rem;
    font-family: ${emotionTheme.typography.fontFamily.heading};
    line-height: 1;
    display: block;
    margin-top: ${emotionTheme.spacing(2)};
  }

  @media (max-width: 768px) {
    font-size: 1rem;
    max-width: none;
  }
`;

// CTA button section
const CTAButtonSection = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

// Prominent CTA button
const CTAButton = styled(Button)`
  font-size: 1.125rem;
  padding: ${emotionTheme.spacing(4)} ${emotionTheme.spacing(8)};
  border-radius: ${emotionTheme.borderRadius.large};

  @media (max-width: 768px) {
    font-size: 1rem;
    padding: ${emotionTheme.spacing(3)} ${emotionTheme.spacing(6)};
  }
`;

// FinalCTA component props
export interface FinalCTAProps {
  className?: string;
}

// Main FinalCTA component
export const FinalCTA: React.FC<FinalCTAProps> = ({ className }) => {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const handleCTAClick = () => {
    // Navigate to signup page with current language
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

          <AnimatedSection animation="scale-up" delay={0.4}>
            <CTAButtonSection>
              <CTAButton
                variant="primary"
                onClick={handleCTAClick}
                aria-label={t('finalCTA.cta')}
              >
                {t('finalCTA.cta')}
              </CTAButton>
            </CTAButtonSection>
          </AnimatedSection>
        </CTAContent>
      </AnimatedSection>
    </CTAContainer>
  );
};

export default FinalCTA;