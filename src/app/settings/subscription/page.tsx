'use client';

import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, Paper, Grid, Button, CircularProgress, Alert } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { SubscriptionPlan, SUBSCRIPTION_PLANS } from '@/types/subscription';
import { auth } from '@/lib/firebaseConfig';
import PlanCard from '@/components/subscription/PlanCard';
import CurrentSubscription from '@/components/subscription/CurrentSubscription';
import PaymentHistory from '@/components/subscription/PaymentHistory';

export default function SubscriptionPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { 
    currentSubscription,
    paymentHistory,
    error,
    loading: storeLoading,
    fetchUserSubscription,
    fetchPaymentHistory,
    clearError
  } = useSubscriptionStore();
  
  // Verificar autenticación y cargar datos
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUserId(user.uid);
        
        // Forzar una recarga completa de los datos
        console.log('SubscriptionPage: Cargando datos de suscripción');
        
        // Limpiar el localStorage para forzar una recarga fresca
        localStorage.removeItem('poker-planning-subscription');
        
        // Cargar la suscripción y el historial de pagos
        const subscription = await fetchUserSubscription(user.uid);
        console.log('SubscriptionPage: Suscripción cargada', subscription);
        
        await fetchPaymentHistory(user.uid);
      } else {
        // Redirigir a login si no está autenticado
        router.push('/auth/signin');
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [fetchUserSubscription, fetchPaymentHistory, router]);
  
  // Manejar errores
  useEffect(() => {
    if (error) {
      // Mostrar error por 5 segundos y luego limpiar
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);
  
  // Mostrar loading mientras se cargan los datos
  if (loading || storeLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Cargando información de suscripción...
        </Typography>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Suscripción
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Mostrar suscripción actual si existe */}
      {currentSubscription && (
        <Box mb={4}>
          <Typography variant="h5" gutterBottom>
            Tu suscripción actual
          </Typography>
          <CurrentSubscription subscription={currentSubscription} />
        </Box>
      )}
      
      {/* Planes de suscripción */}
      <Box mb={4}>
        <Typography variant="h5" gutterBottom>
          Planes disponibles
        </Typography>
        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          Planes Mensuales
        </Typography>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {Object.values(SUBSCRIPTION_PLANS)
            .filter(plan => plan.billingInterval === 'month')
            .map((plan) => (
              <Grid item xs={12} md={4} key={plan.id + '-' + plan.billingInterval}>
                <PlanCard
                  plan={plan}
                  isCurrentPlan={
                    currentSubscription?.plan === plan.id
                  }
                  userId={userId || ''}
                />
              </Grid>
            ))}
        </Grid>
        
        <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
          Planes Anuales (Ahorra más de 15%)
        </Typography>
        <Grid container spacing={3}>
          {Object.values(SUBSCRIPTION_PLANS)
            .filter(plan => plan.billingInterval === 'year' && plan.id !== SubscriptionPlan.FREE)
            .map((plan) => (
              <Grid item xs={12} md={4} key={plan.id + '-' + plan.billingInterval}>
                <PlanCard
                  plan={plan}
                  isCurrentPlan={
                    currentSubscription?.plan === plan.id
                  }
                  userId={userId || ''}
                />
              </Grid>
            ))}
        </Grid>
      </Box>
      
      {/* Historial de pagos */}
      {paymentHistory.length > 0 && (
        <Box mb={4}>
          <Typography variant="h5" gutterBottom>
            Historial de pagos
          </Typography>
          <PaymentHistory payments={paymentHistory} />
        </Box>
      )}
      
      {/* Información adicional */}
      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Información sobre suscripciones
        </Typography>
        <Typography variant="body1" paragraph>
          Las suscripciones se renuevan automáticamente al final de cada período. Puedes cancelar tu suscripción en cualquier momento.
        </Typography>
        <Typography variant="body1" paragraph>
          Si tienes alguna pregunta sobre tu suscripción, por favor contacta a nuestro equipo de soporte.
        </Typography>
        <Button variant="outlined" href="mailto:support@planningpokerpro.com">
          Contactar soporte
        </Button>
      </Paper>
    </Container>
  );
}