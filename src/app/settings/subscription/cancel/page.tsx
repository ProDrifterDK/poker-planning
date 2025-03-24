'use client';

import React from 'react';
import { Container, Typography, Paper, Button, Box } from '@mui/material';
import { useRouter } from 'next/navigation';
import CancelIcon from '@mui/icons-material/Cancel';

export default function SubscriptionCancelPage() {
  const router = useRouter();
  
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <CancelIcon color="error" sx={{ fontSize: 80, mb: 2 }} />
        
        <Typography variant="h4" gutterBottom>
          Suscripción cancelada
        </Typography>
        
        <Typography variant="body1" paragraph>
          Has cancelado el proceso de suscripción. No se ha realizado ningún cargo.
        </Typography>
        
        <Typography variant="body1" paragraph>
          Si tuviste algún problema durante el proceso o necesitas ayuda, no dudes en contactar a nuestro equipo de soporte.
        </Typography>
        
        <Box sx={{ mt: 4 }}>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => router.push('/settings/subscription')}
            sx={{ mx: 1 }}
          >
            Volver a suscripciones
          </Button>
          
          <Button 
            variant="outlined"
            onClick={() => router.push('/')}
            sx={{ mx: 1 }}
          >
            Ir al inicio
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}