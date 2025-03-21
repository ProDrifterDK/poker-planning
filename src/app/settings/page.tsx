"use client";

import React from 'react';
import { Container, Typography, Box, Grid, Paper, Button, Breadcrumbs, Link as MuiLink } from '@mui/material';
import Link from 'next/link';
import ExtensionIcon from '@mui/icons-material/Extension';
import SettingsIcon from '@mui/icons-material/Settings';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SecurityIcon from '@mui/icons-material/Security';

// Definir las opciones de configuración
const settingsOptions = [
  {
    title: 'Integraciones',
    description: 'Configura integraciones con Jira, Trello, GitHub y más',
    icon: <ExtensionIcon fontSize="large" />,
    path: '/settings/integrations',
  },
  {
    title: 'Perfil',
    description: 'Gestiona tu información de perfil y preferencias',
    icon: <AccountCircleIcon fontSize="large" />,
    path: '/settings/profile',
    disabled: true,
  },
  {
    title: 'Preferencias',
    description: 'Personaliza la apariencia y comportamiento de la aplicación',
    icon: <SettingsIcon fontSize="large" />,
    path: '/settings/preferences',
    disabled: true,
  },
  {
    title: 'Seguridad',
    description: 'Gestiona la seguridad de tu cuenta',
    icon: <SecurityIcon fontSize="large" />,
    path: '/settings/security',
    disabled: true,
  },
];

export default function SettingsPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box mb={4}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link href="/" passHref>
            <MuiLink underline="hover" color="inherit">
              Inicio
            </MuiLink>
          </Link>
          <Typography color="text.primary">Configuración</Typography>
        </Breadcrumbs>
      </Box>

      <Typography variant="h4" component="h1" gutterBottom>
        Configuración
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Gestiona tus preferencias y configura integraciones con herramientas externas.
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
              <Button
                variant="outlined"
                component={Link}
                href={option.path}
                disabled={option.disabled}
                fullWidth
              >
                {option.disabled ? 'Próximamente' : 'Configurar'}
              </Button>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}