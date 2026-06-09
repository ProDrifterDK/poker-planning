'use client';

import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, Paper, Button, CircularProgress } from '@mui/material';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { auth } from '@/lib/firebaseConfig';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useTranslation } from 'react-i18next';

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
  const { t, i18n } = useTranslation('common');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { confirmCheckoutSession, fetchUserSubscription } = useSubscriptionStore();

  useEffect(() => {
    if (i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
  }, [i18n, lang]);

  useEffect(() => {
    const processSubscription = async () => {
      try {
        const sessionId = searchParams.get('session_id') || searchParams.get('checkout_session_id');
        if (!sessionId) {
          setError(t('subscription.noSubscriptionId', 'No se encontró el ID de suscripción'));
          setLoading(false);
          return;
        }

        let user = auth.currentUser;
        if (!user) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          user = auth.currentUser;
          if (!user) {
            router.push(getLocalizedRoute('/auth/signin') + '?returnUrl=' + encodeURIComponent(window.location.pathname + window.location.search));
            return;
          }
        }

        const subscription = await confirmCheckoutSession(sessionId);
        if (!subscription) {
          setError(t('subscription.processingError', 'Error al procesar la suscripción'));
          setLoading(false);
          return;
        }

        await fetchUserSubscription(user.uid);
        setSuccess(true);
      } catch (error) {
        console.error('Error al confirmar checkout:', error);
        setError(error instanceof Error ? error.message : t('subscription.unknownError', 'Error desconocido al procesar suscripción'));
      } finally {
        setLoading(false);
      }
    };

    processSubscription();
  }, [confirmCheckoutSession, fetchUserSubscription, router, searchParams, t]);

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h5" sx={{ mt: 4 }}>
          {t('subscription.processing', 'Procesando tu suscripción...')}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
          {t('subscription.processingMessage', 'Esto puede tomar unos momentos. Por favor, no cierres esta ventana.')}
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h4" color="error" gutterBottom>
            {t('subscription.processingError', 'Error al procesar la suscripción')}
          </Typography>
          <Typography variant="body1" paragraph>{error}</Typography>
          <Button variant="contained" color="primary" onClick={() => router.push(getLocalizedRoute('/settings/subscription'))} sx={{ mt: 2 }}>
            {t('subscription.backToSubscriptions', 'Volver a suscripciones')}
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <CheckCircleIcon color="success" sx={{ fontSize: 80, mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          {success ? t('subscription.successTitle', '¡Suscripción activada!') : t('subscription.processing', 'Procesando tu suscripción...')}
        </Typography>
        <Typography variant="body1" paragraph>
          {t('subscription.successMessage', 'Tu suscripción fue confirmada por el backend de billing.')}
        </Typography>
        <Box sx={{ mt: 4 }}>
          <Button variant="contained" color="primary" onClick={() => router.push(getLocalizedRoute('/settings/subscription'))} sx={{ mx: 1 }}>
            {t('subscription.backToSubscriptions', 'Volver a suscripciones')}
          </Button>
          <Button variant="outlined" onClick={() => router.push(getLocalizedRoute(''))} sx={{ mx: 1 }}>
            {t('subscription.goToHome', 'Ir al inicio')}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
