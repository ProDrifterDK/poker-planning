'use client';

import React from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
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

export default function SubscriptionFailedPage() {
  const router = useRouter();
  const params = useParams();
  const { lang } = params as { lang: string };
  const t = getCheckoutTranslations(lang);

  const failureReasons = [
    t.failed.insufficientFunds,
    t.failed.cardDeclined,
    t.failed.networkError,
  ];

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <ErrorOutlineIcon color="error" sx={{ fontSize: 80, mb: 2 }} />

        <Typography variant="h4" gutterBottom>
          {t.failed.title}
        </Typography>

        <Typography variant="body1" color="text.secondary" paragraph>
          {t.failed.message}
        </Typography>

        {/* Common reasons */}
        <Box
          sx={{
            textAlign: 'left',
            maxWidth: 400,
            mx: 'auto',
            mt: 3,
            mb: 3,
            p: 2,
            borderRadius: 2,
            bgcolor: 'action.hover',
          }}
        >
          <Typography variant="subtitle2" gutterBottom>
            {t.failed.commonReasons}
          </Typography>
          <List dense disablePadding>
            {failureReasons.map((reason, i) => (
              <ListItem key={i} disablePadding sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 28 }}>
                  <ArrowForwardIcon fontSize="small" color="action" />
                </ListItemIcon>
                <ListItemText
                  primary={reason}
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
            ))}
          </List>
        </Box>

        <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            onClick={() => router.push(getLocalizedRoute('/settings/subscription'))}
            sx={{ textTransform: 'none' }}
          >
            {t.failed.retry}
          </Button>

          <Button
            variant="outlined"
            onClick={() => router.push(getLocalizedRoute('/settings/subscription'))}
            sx={{ textTransform: 'none' }}
          >
            {t.failed.tryDifferentMethod}
          </Button>

          <Button
            variant="text"
            startIcon={<EmailIcon />}
            href={`mailto:${t.general.supportEmail}`}
            sx={{ textTransform: 'none' }}
          >
            {t.failed.contactSupport}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
