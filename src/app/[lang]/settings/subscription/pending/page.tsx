'use client';

import React from 'react';
import { Container, Typography, Box, Paper, Button, CircularProgress } from '@mui/material';
import HourglassIcon from '@mui/icons-material/HourglassTop';
import EmailIcon from '@mui/icons-material/Email';
import { useRouter, useParams } from 'next/navigation';
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

export default function SubscriptionPendingPage() {
  const router = useRouter();
  const params = useParams();
  const { lang } = params as { lang: string };
  const t = getCheckoutTranslations(lang);

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Box sx={{ position: 'relative', display: 'inline-block', mb: 3 }}>
          <CircularProgress size={80} thickness={2} color="warning" />
          <HourglassIcon
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: 36,
              color: 'warning.main',
            }}
          />
        </Box>

        <Typography variant="h4" gutterBottom>
          {t.pending.title}
        </Typography>

        <Typography variant="body1" color="text.secondary" paragraph>
          {t.pending.message}
        </Typography>

        <Typography variant="body2" color="text.secondary" paragraph>
          {t.pending.processingMessage}
        </Typography>

        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
          {t.pending.expectedTime}
        </Typography>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            mt: 3,
            p: 2,
            borderRadius: 2,
            bgcolor: 'action.hover',
          }}
        >
          <EmailIcon color="action" fontSize="small" />
          <Typography variant="body2">
            {t.pending.checkEmail}
          </Typography>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Button
            variant="outlined"
            onClick={() => router.push(getLocalizedRoute('/settings/subscription'))}
            sx={{ mx: 1, textTransform: 'none' }}
          >
            {t.pending.backToSubscription}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
