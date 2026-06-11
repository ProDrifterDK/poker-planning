'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Divider,
  Paper,
  Button,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { useRouter, useParams } from 'next/navigation';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import {
  SubscriptionPlan,
  SubscriptionStatus,
  UserSubscription,
} from '@/types/subscription';
import { auth } from '@/lib/firebaseConfig';
import { getCheckoutTranslations } from '@/types/checkoutTranslations';

import CheckoutFlow from '@/components/subscription/CheckoutFlow';
import ManageSubscription from '@/components/subscription/ManageSubscription';
import PaymentHistory from '@/components/subscription/PaymentHistory';

const supportedLocales = ['es', 'en'];

const getLocalizedRoute = (route: string): string => {
  let lang = 'es';
  if (typeof window !== 'undefined') {
    const i18nLang = window.localStorage.getItem('i18nextLng');
    if (i18nLang && supportedLocales.includes(i18nLang)) {
      lang = i18nLang;
    } else {
      const urlLang = window.location.pathname.split('/')[1];
      if (supportedLocales.includes(urlLang)) lang = urlLang;
    }
  }
  return `/${lang}${route}`;
};

type ViewMode = 'manage' | 'checkout' | 'change-plan';

export default function SubscriptionPage() {
  const router = useRouter();
  const params = useParams();
  const { lang } = params as { lang: string };
  const t = getCheckoutTranslations(lang);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('checkout');

  const {
    currentSubscription,
    paymentHistory,
    error,
    loading: storeLoading,
    fetchUserSubscription,
    fetchPaymentHistory,
    clearError,
  } = useSubscriptionStore();

  // Determine initial view mode based on subscription
  useEffect(() => {
    if (currentSubscription) {
      const isPaid = currentSubscription.plan !== SubscriptionPlan.FREE;
      const isActive = currentSubscription.status === SubscriptionStatus.ACTIVE;
      if (isPaid && isActive) {
        setViewMode('manage');
      } else {
        setViewMode('checkout');
      }
    }
  }, [currentSubscription]);

  // Auth and data loading
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUserId(user.uid);
        localStorage.removeItem('poker-planning-subscription');
        await fetchUserSubscription(user.uid);
        await fetchPaymentHistory(user.uid);
      } else {
        router.push(getLocalizedRoute('/auth/signin'));
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [fetchUserSubscription, fetchPaymentHistory, router]);

  // Error auto-clear
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => clearError(), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const handleChangePlan = useCallback(() => {
    setViewMode('change-plan');
  }, []);

  const handleBackToManage = useCallback(() => {
    setViewMode('manage');
  }, []);

  if (loading || storeLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }} color="text.secondary">
          {t.general.loading}
        </Typography>
      </Container>
    );
  }

  const hasActivePaidSubscription =
    currentSubscription &&
    currentSubscription.plan !== SubscriptionPlan.FREE &&
    (currentSubscription.status === SubscriptionStatus.ACTIVE ||
     currentSubscription.cancelAtPeriodEnd);

  return (
    <Container maxWidth="lg" sx={{ py: isMobile ? 2 : 4 }}>
      {/* Page header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant={isMobile ? 'h5' : 'h4'} component="h1" gutterBottom fontWeight="bold">
          {hasActivePaidSubscription ? t.manage.title : t.title}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {hasActivePaidSubscription
            ? (lang === 'es'
                ? 'Gestiona tu plan, facturación y método de pago.'
                : 'Manage your plan, billing, and payment method.')
            : t.subtitle}
        </Typography>
      </Box>

      {/* Error display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
          {error}
        </Alert>
      )}

      {/* View: Manage existing subscription */}
      {hasActivePaidSubscription && viewMode === 'manage' && currentSubscription && (
        <Box>
          <ManageSubscription
            subscription={currentSubscription}
            onChangePlan={handleChangePlan}
            lang={lang}
          />

          {/* Payment History */}
          {paymentHistory.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                {t.manage.paymentHistory}
              </Typography>
              <PaymentHistory payments={paymentHistory} />
            </Box>
          )}
        </Box>
      )}

      {/* View: Checkout flow (new subscription or change plan) */}
      {(viewMode === 'checkout' || viewMode === 'change-plan') && (
        <Box>
          {viewMode === 'change-plan' && (
            <Box sx={{ mb: 2 }}>
              <Button
                onClick={handleBackToManage}
                sx={{ textTransform: 'none' }}
              >
                ← {t.general.back} — {t.manage.title}
              </Button>
            </Box>
          )}

          <CheckoutFlow
            lang={lang}
            currentSubscription={currentSubscription}
          />
        </Box>
      )}

      {/* Support footer */}
      <Divider sx={{ my: 4 }} />
      <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {lang === 'es'
            ? '¿Necesitas ayuda con tu suscripción?'
            : 'Need help with your subscription?'}
        </Typography>
        <Button
          variant="text"
          size="small"
          href={`mailto:${t.general.supportEmail}`}
          sx={{ textTransform: 'none' }}
        >
          {t.general.contactSupport}
        </Button>
      </Paper>
    </Container>
  );
}
