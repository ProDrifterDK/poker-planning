'use client';

import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, Paper, Button, CircularProgress } from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { auth } from '@/lib/firebaseConfig';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function SubscriptionSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const { executeSubscription } = useSubscriptionStore();
  
  useEffect(() => {
    const processSubscription = async () => {
      try {
        // Verificar si el usuario está autenticado
        const user = auth.currentUser;
        if (!user) {
          router.push('/auth/signin');
          return;
        }
        
        // Obtener token de PayPal
        const token = searchParams.get('token');
        if (!token) {
          setError('No se encontró el token de suscripción');
          setLoading(false);
          return;
        }
        
        // Ejecutar suscripción
        await executeSubscription(token, user.uid);
        setSuccess(true);
      } catch (error) {
        console.error('Error al procesar suscripción:', error);
        setError(error instanceof Error ? error.message : 'Error desconocido al procesar suscripción');
      } finally {
        setLoading(false);
      }
    };
    
    processSubscription();
  }, [executeSubscription, router, searchParams]);
  
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h5" sx={{ mt: 4 }}>
          Procesando tu suscripción...
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
          Esto puede tomar unos momentos. Por favor, no cierres esta ventana.
        </Typography>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h4" color="error" gutterBottom>
            Error al procesar la suscripción
          </Typography>
          <Typography variant="body1" paragraph>
            {error}
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => router.push('/settings/subscription')}
            sx={{ mt: 2 }}
          >
            Volver a suscripciones
          </Button>
        </Paper>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <CheckCircleIcon color="success" sx={{ fontSize: 80, mb: 2 }} />
        
        <Typography variant="h4" color="success.main" gutterBottom>
          ¡Suscripción completada con éxito!
        </Typography>
        
        <Typography variant="body1" paragraph>
          Tu suscripción ha sido procesada correctamente. Ya puedes disfrutar de todas las funciones premium.
        </Typography>
        
        <Box sx={{ mt: 4 }}>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => router.push('/settings/subscription')}
            sx={{ mx: 1 }}
          >
            Ver detalles de suscripción
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