"use client";

import React from 'react';
import { Container, Typography, Box, Breadcrumbs, Link as MuiLink } from '@mui/material';
import Link from 'next/link';
import { IntegrationsManager } from '@/components/integrations';

export default function IntegrationsPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box mb={4}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link href="/" passHref>
            <MuiLink underline="hover" color="inherit">
              Inicio
            </MuiLink>
          </Link>
          <Link href="/settings" passHref>
            <MuiLink underline="hover" color="inherit">
              Configuración
            </MuiLink>
          </Link>
          <Typography color="text.primary">Integraciones</Typography>
        </Breadcrumbs>
      </Box>

      <Typography variant="h4" component="h1" gutterBottom>
        Configuración de Integraciones
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Configura integraciones con herramientas externas como Jira, Trello y GitHub para enviar los resultados de tus sesiones de Planning Poker.
      </Typography>

      <IntegrationsManager />
    </Container>
  );
}