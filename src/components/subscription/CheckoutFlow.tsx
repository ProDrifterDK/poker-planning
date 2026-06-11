"use client";

import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Button,
  Alert,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  BillingInterval,
  PaymentProvider,
  SubscriptionPlan,
  SubscriptionStatus,
  UserSubscription,
} from '@/types/subscription';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { billingApi } from '@/lib/billingApi';
import { getCheckoutTranslations } from '@/types/checkoutTranslations';

import BillingIntervalToggle from './BillingIntervalToggle';
import PlanComparison from './PlanComparison';
import PaymentProviderSelector from './PaymentProviderSelector';
import {
  ENABLED_PAYMENT_PROVIDERS,
  DEFAULT_PAYMENT_PROVIDER,
  HAS_MULTIPLE_PROVIDERS,
} from '@/config/paymentProviders';

interface CheckoutFlowProps {
  lang?: string;
  currentSubscription: UserSubscription | null;
  onBack?: () => void;
}

type CheckoutStep = 'select-plan' | 'choose-provider';

export default function CheckoutFlow({
  lang = 'en',
  currentSubscription,
  onBack,
}: CheckoutFlowProps) {
  const theme = useTheme();
  const t = getCheckoutTranslations(lang);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [step, setStep] = useState<CheckoutStep>('select-plan');
  const [interval, setInterval] = useState<BillingInterval>(
    currentSubscription?.billingInterval ?? BillingInterval.MONTH
  );
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>(DEFAULT_PAYMENT_PROVIDER);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingCheckout, setPendingCheckout] = useState(false);

  const { loading: storeLoading } = useSubscriptionStore();

  const steps = HAS_MULTIPLE_PROVIDERS
    ? [
        lang === 'es' ? 'Seleccionar Plan' : 'Select Plan',
        lang === 'es' ? 'Método de Pago' : 'Payment Method',
      ]
    : [lang === 'es' ? 'Seleccionar Plan' : 'Select Plan'];

  const activeStep = step === 'select-plan' ? 0 : 1;

  const handleSelectPlan = useCallback((plan: SubscriptionPlan, selectedInterval: BillingInterval) => {
    if (plan === SubscriptionPlan.FREE) {
      // Downgrade handled separately via store
      return;
    }
    setSelectedPlan(plan);
    setInterval(selectedInterval);
    // When only one provider is available, skip the selector step and
    // proceed straight to checkout to reduce friction.
    if (HAS_MULTIPLE_PROVIDERS) {
      setStep('choose-provider');
    } else {
      setSelectedProvider(DEFAULT_PAYMENT_PROVIDER);
      // Defer so state settles before the async checkout fires.
      setTimeout(() => {
        // We can't call handleProceedToCheckout here directly due to closure;
        // the effect below will trigger it instead.
        setPendingCheckout(true);
      }, 0);
    }
    setError(null);
  }, []);

  const handleBack = useCallback(() => {
    if (step === 'choose-provider') {
      setStep('select-plan');
      setSelectedPlan(null);
      setError(null);
    } else if (onBack) {
      onBack();
    }
  }, [step, onBack]);

  const handleProceedToCheckout = useCallback(async () => {
    if (!selectedPlan || selectedPlan === SubscriptionPlan.FREE) return;

    // Guard: never send a provider that is not enabled (defense-in-depth
    // against the selector step being bypassed or a stale state).
    if (!ENABLED_PAYMENT_PROVIDERS.includes(selectedProvider)) {
      setError(
        lang === 'es'
          ? 'El método de pago seleccionado no está disponible.'
          : 'The selected payment method is not available.'
      );
      return;
    }

    setCheckoutLoading(true);
    setError(null);

    try {
      const result = await billingApi.createCheckoutSession({
        plan: selectedPlan as SubscriptionPlan.PRO | SubscriptionPlan.ENTERPRISE,
        billingInterval: interval,
        provider: selectedProvider,
        locale: lang === 'en' ? 'en' : 'es',
      });

      if (result.checkoutUrl) {
        // Redirect to provider checkout
        window.location.href = result.checkoutUrl;
      } else {
        setError(lang === 'es'
          ? 'No se pudo iniciar el proceso de pago. Inténtalo de nuevo.'
          : 'Could not start the checkout process. Please try again.');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(
        err instanceof Error
          ? err.message
          : lang === 'es'
            ? 'Error desconocido al iniciar el pago'
            : 'Unknown error starting checkout'
      );
    } finally {
      setCheckoutLoading(false);
    }
  }, [selectedPlan, interval, selectedProvider, lang]);

  // Auto-trigger checkout when there's only one provider and the user
  // just selected a plan (the selector step was skipped).
  useEffect(() => {
    if (pendingCheckout && selectedPlan) {
      setPendingCheckout(false);
      handleProceedToCheckout();
    }
  }, [pendingCheckout, selectedPlan, handleProceedToCheckout]);

  return (
    <Box>
      {/* Stepper */}
      <Box sx={{ mb: 4 }}>
        <Stepper activeStep={activeStep} alternativeLabel={!isMobile}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {/* Error display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Step 1: Select Plan */}
      {step === 'select-plan' && (
        <Box>
          <BillingIntervalToggle
            interval={interval}
            onChange={setInterval}
            lang={lang}
          />

          <PlanComparison
            interval={interval}
            currentSubscription={currentSubscription}
            onSelectPlan={handleSelectPlan}
            lang={lang}
          />
        </Box>
      )}

      {/* Step 2: Choose Payment Provider */}
      {step === 'choose-provider' && selectedPlan && (
        <Box>
          <Box sx={{ mb: 2 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={handleBack}
              size="small"
              sx={{ textTransform: 'none' }}
            >
              {t.general.back} — {lang === 'es' ? 'Cambiar plan' : 'Change plan'}
            </Button>
          </Box>

          <PaymentProviderSelector
            selectedProvider={selectedProvider}
            onProviderChange={setSelectedProvider}
            onProceed={handleProceedToCheckout}
            plan={selectedPlan}
            interval={interval}
            loading={checkoutLoading || storeLoading}
            lang={lang}
          />
        </Box>
      )}
    </Box>
  );
}
