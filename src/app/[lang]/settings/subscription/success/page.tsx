'use client';

import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  CircularProgress,
  Chip,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { auth } from '@/lib/firebaseConfig';
import { getCheckoutTranslations } from '@/types/checkoutTranslations';

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

export default function SubscriptionSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const { lang } = params as { lang: string };
  const t = getCheckoutTranslations(lang);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [confirmedPlan, setConfirmedPlan] = useState<string | null>(null);

  const { confirmCheckoutSession, fetchUserSubscription, currentSubscription } =
    useSubscriptionStore();

  useEffect(() => {
    const processSubscription = async () => {
      try {
        const sessionId =
          searchParams.get('session_id') ||
          searchParams.get('checkout_session_id');

        // The success URL includes `provider` (set by the backend when
        // creating the checkout session). Forward it to the confirm endpoint
        // so the backend can disambiguate sessions by provider when needed.
        const provider = searchParams.get('provider') ?? undefined;

        if (!sessionId) {
          setError(
            lang === 'es'
              ? 'No se encontró el ID de sesión de checkout'
              : 'Checkout session ID not found'
          );
          setLoading(false);
          return;
        }

        // Wait for auth
        let user = auth.currentUser;
        if (!user) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          user = auth.currentUser;
          if (!user) {
            router.push(
              getLocalizedRoute('/auth/signin') +
                '?returnUrl=' +
                encodeURIComponent(window.location.pathname + window.location.search)
            );
            return;
          }
        }

        // Confirm the checkout session with backend — forward provider
        // from the success URL so the backend can scope the session lookup.
        const result = await confirmCheckoutSession(sessionId, provider);
        if (!result) {
          // Error case — store already captured the error
          setError(
            lang === 'es'
              ? 'Error al confirmar el pago'
              : 'Error confirming payment'
          );
          setLoading(false);
          return;
        }

        // The backend returns a top-level `status` field. We must route
        // based on it rather than assuming any non-null result means success.
        // "pending" = Stripe session not yet complete → redirect to pending page.
        if (result.status === 'pending') {
          router.replace(getLocalizedRoute('/settings/subscription/pending'));
          return;
        }

        // Guard: subscription is undefined only when status === 'pending'
        // (billingApi normalizes it away). If somehow undefined here, treat
        // as error rather than rendering the success UI with no plan data.
        if (!result.subscription) {
          setError(
            lang === 'es'
              ? 'Respuesta de pago inesperada'
              : 'Unexpected payment response'
          );
          return;
        }

        // Fast path: show the confirmed plan immediately from the confirm
        // response, then refresh from /billing/me for the authoritative record.
        setConfirmedPlan(result.subscription.plan);
        await fetchUserSubscription(user.uid);
        setSuccess(true);
      } catch (err) {
        console.error('Error confirming checkout:', err);
        setError(
          err instanceof Error
            ? err.message
            : lang === 'es'
              ? 'Error desconocido al procesar la suscripción'
              : 'Unknown error processing subscription'
        );
      } finally {
        setLoading(false);
      }
    };

    processSubscription();
  }, [confirmCheckoutSession, fetchUserSubscription, router, searchParams, lang]);

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h5" sx={{ mt: 4 }}>
          {t.pending.processingMessage}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
          {t.general.loading}
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h4" color="error" gutterBottom>
            {t.failed.title}
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary">
            {error}
          </Typography>
          <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              onClick={() => router.push(getLocalizedRoute('/settings/subscription'))}
              sx={{ textTransform: 'none' }}
            >
              {t.failed.retry}
            </Button>
            <Button
              variant="outlined"
              onClick={() => router.push(getLocalizedRoute('/settings/subscription/failed'))}
              sx={{ textTransform: 'none' }}
            >
              {t.failed.tryDifferentMethod}
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  // If we're not in a definitive success or error state (e.g. pending
  // redirect just fired), keep showing the loading spinner so users
  // never see a flash of the success UI.
  if (!success) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h5" sx={{ mt: 4 }}>
          {t.pending.processingMessage}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
          {t.general.loading}
        </Typography>
      </Container>
    );
  }

  // Success state
  const planDisplayName = confirmedPlan
    ? confirmedPlan.charAt(0).toUpperCase() + confirmedPlan.slice(1)
    : currentSubscription?.plan ?? '';

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <CheckCircleIcon color="success" sx={{ fontSize: 80, mb: 2 }} />

        <Typography variant="h4" gutterBottom fontWeight="bold">
          {t.success.title}
        </Typography>

        <Typography variant="body1" color="text.secondary" paragraph>
          {t.success.message}
        </Typography>

        {planDisplayName && (
          <Chip
            label={t.success.planActivated.replace('{plan}', planDisplayName)}
            color="success"
            variant="outlined"
            sx={{ mb: 3, px: 2, py: 0.5 }}
          />
        )}

        <Typography variant="body1" paragraph>
          {t.success.welcomeMessage.replace('{plan}', planDisplayName)}
        </Typography>

        <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            onClick={() => router.push(getLocalizedRoute(''))}
            sx={{ textTransform: 'none' }}
          >
            {t.success.goToDashboard}
          </Button>
          <Button
            variant="outlined"
            onClick={() => router.push(getLocalizedRoute('/settings/subscription'))}
            sx={{ textTransform: 'none' }}
          >
            {t.success.backToSubscription}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
