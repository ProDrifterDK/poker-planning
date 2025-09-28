import React, { useState } from 'react';
import styled from '@emotion/styled';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';
import { emotionTheme } from '../styles/theme';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

// Styled container for the pricing section
const PricingSection = styled.section`
  padding: ${emotionTheme.spacing(20)} ${emotionTheme.spacing(6)};
  background-color: ${emotionTheme.colors.background.default};
  text-align: center;

  @media (max-width: 900px) {
    padding: ${emotionTheme.spacing(15)} ${emotionTheme.spacing(4)};
  }
`;

// Styled container for the pricing cards grid
const PricingGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: ${emotionTheme.spacing(8)};
  max-width: 1200px;
  margin: 0 auto;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: ${emotionTheme.spacing(6)};
  }
`;

// Styled section title
const SectionTitle = styled.h2`
  font-family: ${emotionTheme.typography.fontFamily.heading};
  font-size: ${emotionTheme.typography.fontSizes.h2};
  font-weight: ${emotionTheme.typography.fontWeights.bold};
  color: ${emotionTheme.colors.text.primary};
  margin-bottom: ${emotionTheme.spacing(4)};
  line-height: ${emotionTheme.typography.lineHeights.heading};
`;

// Styled section subtitle
const SectionSubtitle = styled.p`
  font-family: ${emotionTheme.typography.fontFamily.body};
  font-size: ${emotionTheme.typography.fontSizes.body};
  color: ${emotionTheme.colors.text.secondary};
  margin-bottom: ${emotionTheme.spacing(12)};
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  line-height: ${emotionTheme.typography.lineHeights.body};
`;

// Styled billing toggle container
const BillingToggleContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${emotionTheme.spacing(2)};
  margin-bottom: ${emotionTheme.spacing(8)};
`;

// Styled billing toggle
const BillingToggle = styled.div<{ isYearly: boolean }>`
  display: flex;
  align-items: center;
  background-color: ${emotionTheme.colors.background.paper};
  border: 1px solid ${emotionTheme.colors.border.main};
  border-radius: ${emotionTheme.borderRadius.large};
  padding: ${emotionTheme.spacing(1)};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${emotionTheme.colors.primary.main};
  }
`;

// Styled toggle option
const ToggleOption = styled.button<{ active: boolean }>`
  background: ${({ active }) => active ? emotionTheme.colors.primary.main : 'transparent'};
  color: ${({ active }) => active ? emotionTheme.colors.text.primary : emotionTheme.colors.text.secondary};
  border: none;
  padding: ${emotionTheme.spacing(2)} ${emotionTheme.spacing(4)};
  border-radius: ${emotionTheme.borderRadius.medium};
  font-family: ${emotionTheme.typography.fontFamily.body};
  font-size: ${emotionTheme.typography.fontSizes.body};
  font-weight: ${emotionTheme.typography.fontWeights.medium};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${({ active }) => active ? emotionTheme.colors.primary.main : emotionTheme.colors.border.light};
  }
`;

// Styled price display
const PriceDisplay = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: ${emotionTheme.spacing(2)};
  margin-bottom: ${emotionTheme.spacing(4)};
`;

// Styled price amount
const PriceAmount = styled.span`
  font-family: ${emotionTheme.typography.fontFamily.heading};
  font-size: 3rem;
  font-weight: ${emotionTheme.typography.fontWeights.bold};
  color: ${emotionTheme.colors.text.primary};
  line-height: 1;
`;

// Styled price period
const PricePeriod = styled.span`
  font-family: ${emotionTheme.typography.fontFamily.body};
  font-size: ${emotionTheme.typography.fontSizes.body};
  color: ${emotionTheme.colors.text.secondary};
`;

// Styled savings badge
const SavingsBadge = styled.span`
  font-family: ${emotionTheme.typography.fontFamily.body};
  font-size: ${emotionTheme.typography.fontSizes.caption};
  color: ${emotionTheme.colors.success.main};
  font-weight: ${emotionTheme.typography.fontWeights.medium};
`;

// Styled popular badge
const PopularBadge = styled.div`
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(45deg, ${emotionTheme.colors.primary.main}, ${emotionTheme.colors.primary.dark});
  color: ${emotionTheme.colors.text.primary};
  padding: ${emotionTheme.spacing(1)} ${emotionTheme.spacing(3)};
  border-radius: ${emotionTheme.borderRadius.large};
  font-family: ${emotionTheme.typography.fontFamily.body};
  font-size: ${emotionTheme.typography.fontSizes.caption};
  font-weight: ${emotionTheme.typography.fontWeights.bold};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  z-index: 1;
`;

// Styled features list
const FeaturesList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 ${emotionTheme.spacing(6)} 0;
  text-align: left;
`;

// Styled feature item
const FeatureItem = styled.li`
  display: flex;
  align-items: center;
  gap: ${emotionTheme.spacing(2)};
  margin-bottom: ${emotionTheme.spacing(3)};
  font-family: ${emotionTheme.typography.fontFamily.body};
  font-size: ${emotionTheme.typography.fontSizes.body};
  color: ${emotionTheme.colors.text.primary};
  line-height: ${emotionTheme.typography.lineHeights.body};
`;

// Styled checkmark icon
const CheckmarkIcon = styled(CheckCircleIcon)`
  color: ${emotionTheme.colors.success.main};
  font-size: 1.25rem;
  flex-shrink: 0;
`;

// Styled plan description
const PlanDescription = styled.p`
  font-family: ${emotionTheme.typography.fontFamily.body};
  font-size: ${emotionTheme.typography.fontSizes.body};
  color: ${emotionTheme.colors.text.secondary};
  margin-bottom: ${emotionTheme.spacing(6)};
  line-height: ${emotionTheme.typography.lineHeights.body};
`;

// Styled pricing card container
const PricingCardContainer = styled.div<{ popular: boolean }>`
  background-color: ${emotionTheme.colors.background.paper};
  border: 1px solid ${emotionTheme.colors.border.main};
  border-radius: ${emotionTheme.borderRadius.large};
  padding: ${emotionTheme.spacing(6)};
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  text-align: center;

  ${({ popular }) => popular && `border: 2px solid ${emotionTheme.colors.primary.main};`}

  &:hover {
    transform: translateY(-4px);
    border-color: ${emotionTheme.colors.primary.main};
    box-shadow: ${emotionTheme.shadows.primaryGlow};
  }

  &:focus-within {
    border-color: ${emotionTheme.colors.primary.main};
    box-shadow: ${emotionTheme.shadows.primaryGlow};
  }
`;

// Styled card title
const PricingCardTitle = styled.h3`
  font-family: ${emotionTheme.typography.fontFamily.heading};
  font-size: ${emotionTheme.typography.fontSizes.h4};
  font-weight: ${emotionTheme.typography.fontWeights.bold};
  line-height: ${emotionTheme.typography.lineHeights.heading};
  color: ${emotionTheme.colors.text.primary};
  margin: 0 0 ${emotionTheme.spacing(2)} 0;
`;

// Styled card subtitle
const PricingCardSubtitle = styled.p`
  font-family: ${emotionTheme.typography.fontFamily.body};
  font-size: ${emotionTheme.typography.fontSizes.body};
  color: ${emotionTheme.colors.text.secondary};
  margin: 0 0 ${emotionTheme.spacing(4)} 0;
  line-height: ${emotionTheme.typography.lineHeights.body};
`;

// Styled card wrapper for popular badge positioning
const CardWrapper = styled.div<{ popular: boolean }>`
  position: relative;
  ${({ popular }) => popular && `padding-top: ${emotionTheme.spacing(4)};`}
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
  const { t } = useTranslation();
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
  const PricingCard: React.FC<PricingCardProps> = ({ planKey, popular, isYearly }) => {
    const { t } = useTranslation();
    const priceDisplay = getPriceDisplay(planKey);
  
    return (
      <CardWrapper popular={popular}>
        {popular && <PopularBadge>Most Popular</PopularBadge>}
        <PricingCardContainer popular={popular}>
          <PricingCardTitle>{t(`plansSection.${planKey}.title`)}</PricingCardTitle>
          <PricingCardSubtitle>{t(`plansSection.${planKey}.subtitle`)}</PricingCardSubtitle>
  
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
            {(t(`plansSection.${planKey}.features`, { returnObjects: true }) as string[]).map((feature, index) => (
              <FeatureItem key={index}>
                <CheckmarkIcon />
                {feature}
              </FeatureItem>
            ))}
          </FeaturesList>
  
          <Button
            variant={popular ? 'primary' : 'secondary'}
            aria-label={`${t(`plansSection.${planKey}.title`)} - ${t(`plansSection.${planKey}.cta`)}`}
          >
            {t(`plansSection.${planKey}.cta`)}
          </Button>
        </PricingCardContainer>
      </CardWrapper>
    );
  };

  return (
    <PricingSection>
      <SectionTitle>{t('plansSection.title')}</SectionTitle>
      <SectionSubtitle>{t('plansSection.subtitle')}</SectionSubtitle>

      <BillingToggleContainer>
        <span style={{ color: emotionTheme.colors.text.secondary }}>
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

      <PricingGrid>
        {plans.map((plan) => (
          <PricingCard
            key={plan.key}
            planKey={plan.key}
            popular={plan.popular}
            isYearly={isYearly}
          />
        ))}
      </PricingGrid>
    </PricingSection>
  );
};

export default PricingTable;