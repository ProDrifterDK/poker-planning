"use client";

import React from 'react';
import { Container, Typography, Box, Breadcrumbs } from '@mui/material';
import Link from 'next/link';
import { IntegrationsManager } from '@/components/integrations';
import { useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';

export default function IntegrationsPage() {
  const params = useParams();
  const { lang } = params as { lang: string };
  const { t, i18n } = useTranslation('common');
  
  // Force a re-render when the language changes
  React.useEffect(() => {
    // This is just to ensure the component re-renders when the language changes
    console.log('IntegrationsPage - Current language:', i18n.language);
    
    // Force i18n to use the language from the URL
    if (i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
  }, [i18n, lang]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box mb={4}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link href={`/${lang}`} style={{ textDecoration: 'none' }}>
            <Typography color="inherit" sx={{ '&:hover': { textDecoration: 'underline' } }}>
              {t('home')}
            </Typography>
          </Link>
          <Link href={`/${lang}/settings`} style={{ textDecoration: 'none' }}>
            <Typography color="inherit" sx={{ '&:hover': { textDecoration: 'underline' } }}>
              {t('settings.title')}
            </Typography>
          </Link>
          <Typography color="text.primary">{t('settings.integrations.title')}</Typography>
        </Breadcrumbs>
      </Box>

      <Typography variant="h4" component="h1" gutterBottom>
        {t('settings.integrations.title')}
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        {t('settings.integrations.description')}
      </Typography>

      <IntegrationsManager />
    </Container>
  );
}