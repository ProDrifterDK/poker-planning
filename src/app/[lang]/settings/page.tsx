"use client";

import React from 'react';
import { Container, Typography, Box, Grid, Paper, Button, Breadcrumbs, Link as MuiLink } from '@mui/material';
import Link from 'next/link';
import ExtensionIcon from '@mui/icons-material/Extension';
import SettingsIcon from '@mui/icons-material/Settings';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SecurityIcon from '@mui/icons-material/Security';
import { useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';

export default function SettingsPage() {
  const params = useParams();
  const { lang } = params as { lang: string };
  const { t } = useTranslation('common');
  
  // Definir las opciones de configuración
  const settingsOptions = [
    {
      title: t('settings.integrations.title'),
      description: t('settings.integrations.description'),
      icon: <ExtensionIcon fontSize="large" />,
      path: `/${lang}/settings/integrations`,
    },
    {
      title: t('settings.profile.title'),
      description: t('settings.profile.description'),
      icon: <AccountCircleIcon fontSize="large" />,
      path: `/${lang}/settings/profile`,
      disabled: true,
    },
    {
      title: t('settings.preferences.title'),
      description: t('settings.preferences.description'),
      icon: <SettingsIcon fontSize="large" />,
      path: `/${lang}/settings/preferences`,
      disabled: true,
    },
    {
      title: t('settings.security.title'),
      description: t('settings.security.description'),
      icon: <SecurityIcon fontSize="large" />,
      path: `/${lang}/settings/security`,
      disabled: true,
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box mb={4}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link href={`/${lang}`} style={{ textDecoration: 'none' }}>
            <Typography color="inherit" sx={{ '&:hover': { textDecoration: 'underline' } }}>
              {t('home')}
            </Typography>
          </Link>
          <Typography color="text.primary">{t('settings.title')}</Typography>
        </Breadcrumbs>
      </Box>

      <Typography variant="h4" component="h1" gutterBottom>
        {t('settings.title')}
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        {t('settings.description')}
      </Typography>

      <Grid container spacing={3} mt={2}>
        {settingsOptions.map((option) => (
          <Grid item xs={12} sm={6} md={4} key={option.title}>
            <Paper
              elevation={2}
              sx={{
                p: 3,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                opacity: option.disabled ? 0.7 : 1,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  mb: 2,
                  color: 'primary.main',
                }}
              >
                {option.icon}
                <Typography variant="h6" ml={1}>
                  {option.title}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
                {option.description}
              </Typography>
              <Link href={option.path} style={{ textDecoration: 'none', width: '100%' }} passHref>
                <Button
                  variant="outlined"
                  disabled={option.disabled}
                  fullWidth
                >
                  {option.disabled ? t('settings.comingSoon') : t('settings.configure')}
                </Button>
              </Link>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}