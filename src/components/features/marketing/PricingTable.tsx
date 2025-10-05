import React, { useState } from 'react';
import styled from '@emotion/styled';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { Button } from '../../core/Button';
import { darkEmotionTheme } from '../../../styles/theme';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AnimatedSection from '../../core/AnimatedSection';

// Styled container for the pricing section
const PricingSection = styled.section`
  padding: ${(props) => props.theme.spacing(20)} ${(props) => props.theme.spacing(6)};
  background-color: ${({ theme }) => theme.colors.background.default};
  text-align: center;

  @media (max-width: 900px) {
    padding: ${(props) => props.theme.spacing(15)} ${(props) => props.theme.spacing(4)};
  }
`;

// Styled container for the pricing cards grid
const PricingGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: ${(props) => props.theme.spacing(8)};
  max-width: 1200px;
  margin: 0 auto;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: ${(props) => props.theme.spacing(6)};
  }
`;

// Styled section title
const SectionTitle = styled.h2`
  font-family: ${(props) => props.theme.typography.fontFamily.heading};
  font-size: ${(props) => props.theme.typography.fontSizes.h2};
  font-weight: ${(props) => props.theme.typography.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${(props) => props.theme.spacing(4)};
  line-height: ${(props) => props.theme.typography.lineHeights.heading};
`;

// Styled section subtitle
const SectionSubtitle = styled.p`
  font-family: ${(props) => props.theme.typography.fontFamily.body};
  font-size: ${(props) => props.theme.typography.fontSizes.body};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${(props) => props.theme.spacing(12)};
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  line-height: ${(props) => props.theme.typography.lineHeights.body};
`;

// Styled billing toggle container
const BillingToggleContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${(props) => props.theme.spacing(2)};
  margin-bottom: ${(props) => props.theme.spacing(8)};
`;

// Styled billing toggle
const BillingToggle = styled.div<{ isYearly: boolean }>`
  display: flex;
  align-items: center;
  background-color: ${({ theme }) => theme.colors.background.paper};
  border: 1px solid ${({ theme }) => theme.colors.border.main};
  border-radius: ${(props) => props.theme.borderRadius.large};
  padding: ${(props) => props.theme.spacing(1)};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary.main};
  }
`;

// Styled toggle option
const ToggleOption = styled.button<{ active: boolean }>`
  background: ${({ active, theme }) => active ? theme.colors.primary.main : 'transparent'};
  color: ${({ active, theme }) => active ? theme.colors.text.primary : theme.colors.text.secondary};
  border: none;
  padding: ${(props) => props.theme.spacing(2)} ${(props) => props.theme.spacing(4)};
  border-radius: ${(props) => props.theme.borderRadius.medium};
  font-family: ${(props) => props.theme.typography.fontFamily.body};
  font-size: ${(props) => props.theme.typography.fontSizes.body};
  font-weight: ${(props) => props.theme.typography.fontWeights.medium};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${({ active, theme }) => active ? theme.colors.primary.main : theme.colors.border.light};
  }
`;

// Styled price display
const PriceDisplay = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: ${(props) => props.theme.spacing(2)};
  margin-bottom: ${(props) => props.theme.spacing(4)};
`;

// Styled price amount
const PriceAmount = styled.span`
  font-family: ${(props) => props.theme.typography.fontFamily.heading};
  font-size: 3rem;
  font-weight: ${(props) => props.theme.typography.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  line-height: 1;
`;

// Styled price period
const PricePeriod = styled.span`
  font-family: ${(props) => props.theme.typography.fontFamily.body};
  font-size: ${(props) => props.theme.typography.fontSizes.body};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

// Styled savings badge
const SavingsBadge = styled.span`
  font-family: ${(props) => props.theme.typography.fontFamily.body};
  font-size: ${(props) => props.theme.typography.fontSizes.caption};
  color: ${({ theme }) => theme.colors.success.main};
  font-weight: ${(props) => props.theme.typography.fontWeights.medium};
`;

// Styled popular badge
const PopularBadge = styled.div`
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(45deg, ${({ theme }) => theme.colors.primary.main}, ${({ theme }) => theme.colors.primary.dark});
  color: ${({ theme }) => theme.colors.text.primary};
  padding: ${(props) => props.theme.spacing(1)} ${(props) => props.theme.spacing(3)};
  border-radius: ${(props) => props.theme.borderRadius.large};
  font-family: ${(props) => props.theme.typography.fontFamily.body};
  font-size: ${(props) => props.theme.typography.fontSizes.caption};
  font-weight: ${(props) => props.theme.typography.fontWeights.bold};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  z-index: 1;
`;

// Styled features list
const FeaturesList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 ${(props) => props.theme.spacing(6)} 0;
  text-align: left;
`;

// Styled feature item
const FeatureItem = styled.li`
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.spacing(2)};
  margin-bottom: ${(props) => props.theme.spacing(3)};
  font-family: ${(props) => props.theme.typography.fontFamily.body};
  font-size: ${(props) => props.theme.typography.fontSizes.body};
  color: ${({ theme }) => theme.colors.text.primary};
  line-height: ${(props) => props.theme.typography.lineHeights.body};
`;

// Styled checkmark icon
const CheckmarkIcon = styled(CheckCircleIcon)`
  color: ${({ theme }) => theme.colors.success.main};
  font-size: 1.25rem;
  flex-shrink: 0;
`;

// Styled plan description
const PlanDescription = styled.p`
  font-family: ${(props) => props.theme.typography.fontFamily.body};
  font-size: ${(props) => props.theme.typography.fontSizes.body};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${(props) => props.theme.spacing(6)};
  line-height: ${(props) => props.theme.typography.lineHeights.body};
`;

// Styled pricing card container
const PricingCardContainer = styled.div<{ popular: boolean }>`
  background-color: ${({ theme }) => theme.colors.background.paper};
  border: 1px solid ${({ theme }) => theme.colors.border.main};
  border-radius: ${(props) => props.theme.borderRadius.large};
  padding: ${(props) => props.theme.spacing(6)};
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  text-align: center;

  ${({ popular, theme }) => popular && `border: 2px solid ${theme.colors.primary.main};`}

  &:hover {
    transform: translateY(-4px);
    border-color: ${({ theme }) => theme.colors.primary.main};
    box-shadow: ${(props) => props.theme.shadows.primaryGlow};
  }

  &:focus-within {
    border-color: ${(props) => props.theme.colors.primary.main};
    box-shadow: ${(props) => props.theme.shadows.primaryGlow};
  }
`;

// Styled card title
const PricingCardTitle = styled.h3`
  font-family: ${(props) => props.theme.typography.fontFamily.heading};
  font-size: ${(props) => props.theme.typography.fontSizes.h4};
  font-weight: ${(props) => props.theme.typography.fontWeights.bold};
  line-height: ${(props) => props.theme.typography.lineHeights.heading};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 ${(props) => props.theme.spacing(2)} 0;
`;

// Styled card subtitle
const PricingCardSubtitle = styled.p`
  font-family: ${(props) => props.theme.typography.fontFamily.body};
  font-size: ${(props) => props.theme.typography.fontSizes.body};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0 0 ${(props) => props.theme.spacing(4)} 0;
  line-height: ${(props) => props.theme.typography.lineHeights.body};
`;

// Styled card wrapper for popular badge positioning
const CardWrapper = styled.div<{ popular: boolean }>`
  position: relative;
  ${({ popular, theme }) => popular && `padding-top: ${theme.spacing(4)};`}
`;

// Pricing plan interface
interface PricingPlan {
  key: string;
  popular: boolean;
  cta: string;
}

// PricingCard component props
interface PricingCardProps {
  planKey: string;
  popular: boolean;
  isYearly: boolean;
}

// Main PricingTable component
export const PricingTable: React.FC = () => {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [isYearly, setIsYearly] = useState(false);

  // Define pricing plans
  const plans: PricingPlan[] = [
    {
      key: 'free',
      popular: false,
      cta: t('plansSection.free.cta'),
    },
    {
      key: 'pro',
      popular: true,
      cta: t('plansSection.pro.cta'),
    },
    {
      key: 'enterprise',
      popular: false,
      cta: t('plansSection.enterprise.cta'),
    },
  ];

  // Handle billing toggle
  const handleBillingToggle = (yearly: boolean) => {
    setIsYearly(yearly);
  };

  // Get price for plan and billing period
  const getPrice = (planKey: string) => {
    const priceKey = isYearly ? 'yearlyPrice' : 'monthlyPrice';
    return t(`plansSection.${planKey}.${priceKey}`);
  };
  
  // Get formatted price display
  const getPriceDisplay = (planKey: string) => {
    const price = getPrice(planKey);
    if (price === '$0') {
      return { amount: '$0', period: '' };
    }
  
    const isFree = price === '$0';
    const period = isYearly ? t('subscription.pricePerYear', { price: '' }) : t('subscription.pricePerMonth', { price: '' });
  
    return {
      amount: price,
      period: isFree ? '' : period.replace('${{price}}', '').trim()
    };
  };
  
  // PricingCard component
  const PricingCard: React.FC<PricingCardProps> = ({
    planKey,
    popular,
    isYearly
  }) => {
    const { t } = useTranslation();
    const priceDisplay = getPriceDisplay(planKey);

    const handleCTAClick = () => {
      const currentLang = i18n.language || 'en';
      router.push(`/${currentLang}/auth/signup`);
    };

    return (
      <CardWrapper popular={popular}>
        {popular && <PopularBadge>Most Popular</PopularBadge>}
        <PricingCardContainer popular={popular}>
          <PricingCardTitle>
            {t(`plansSection.${planKey}.title`)}
          </PricingCardTitle>
          <PricingCardSubtitle>
            {t(`plansSection.${planKey}.subtitle`)}
          </PricingCardSubtitle>

          <PlanDescription>
            {t(`plansSection.${planKey}.description`)}
          </PlanDescription>

          <PriceDisplay>
            <PriceAmount>{priceDisplay.amount}</PriceAmount>
            {priceDisplay.period && (
              <PricePeriod>{priceDisplay.period}</PricePeriod>
            )}
          </PriceDisplay>

          {isYearly && planKey !== 'free' && (
            <SavingsBadge>
              {t('plansSection.billingToggle.save')}
            </SavingsBadge>
          )}

          <FeaturesList>
            {(
              t(`plansSection.${planKey}.features`, {
                returnObjects: true
              }) as string[]
            ).map((feature, index) => (
              <FeatureItem key={index}>
                <CheckmarkIcon />
                {feature}
              </FeatureItem>
            ))}
          </FeaturesList>

          <Button
            variant={popular ? 'primary' : 'secondary'}
            onClick={handleCTAClick}
            aria-label={`${t(`plansSection.${planKey}.title`)} - ${t(
              `plansSection.${planKey}.cta`
            )}`}
          >
            {t(`plansSection.${planKey}.cta`)}
          </Button>
        </PricingCardContainer>
      </CardWrapper>
    );
  };

  return (
    <PricingSection id="pricing">
      <AnimatedSection animation="fade-up" delay={0.1}>
        <SectionTitle>{t('plansSection.title')}</SectionTitle>
      </AnimatedSection>

      <AnimatedSection animation="fade-up" delay={0.2}>
        <SectionSubtitle>{t('plansSection.subtitle')}</SectionSubtitle>
      </AnimatedSection>

      <AnimatedSection animation="fade-up" delay={0.3}>
        <BillingToggleContainer>
          <span style={{ color: darkEmotionTheme.colors.text.secondary }}>
            {t('plansSection.billingToggle.monthly')}
          </span>
          <BillingToggle isYearly={isYearly}>
            <ToggleOption
              active={!isYearly}
              onClick={() => handleBillingToggle(false)}
            >
              {t('plansSection.billingToggle.monthly')}
            </ToggleOption>
            <ToggleOption
              active={isYearly}
              onClick={() => handleBillingToggle(true)}
            >
              {t('plansSection.billingToggle.yearly')}
            </ToggleOption>
          </BillingToggle>
          {isYearly && (
            <SavingsBadge>{t('plansSection.billingToggle.save')}</SavingsBadge>
          )}
        </BillingToggleContainer>
      </AnimatedSection>

      <AnimatedSection animation="fade-up" delay={0.4}>
        <PricingGrid>
          {plans.map((plan, index) => (
            <AnimatedSection
              key={plan.key}
              animation="scale-up"
              delay={0.5 + (index * 0.1)}
            >
              <PricingCard
                planKey={plan.key}
                popular={plan.popular}
                isYearly={isYearly}
              />
            </AnimatedSection>
          ))}
        </PricingGrid>
      </AnimatedSection>
    </PricingSection>
  );
};

export default PricingTable;