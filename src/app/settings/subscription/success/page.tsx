'use client';

import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, Paper, Button, CircularProgress } from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { auth } from '@/lib/firebaseConfig';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { SubscriptionPlan } from '@/types/subscription';

export default function SubscriptionSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [planDetails, setPlanDetails] = useState<{
    name: string;
    price: string;
    interval: string;
  } | null>(null);
  
  const { executeSubscription, fetchUserSubscription } = useSubscriptionStore();
  
  useEffect(() => {
    // Función para procesar la suscripción
    const processSubscription = async () => {
      try {
        // Verificar si hay una suscripción pendiente en localStorage
        const pendingSubscriptionJson = typeof window !== 'undefined' ? localStorage.getItem('pendingSubscription') : null;
        
        // Variables para almacenar los detalles de la suscripción
        let subscriptionId: string | null = null;
        let planName: string | null = null;
        let planPrice: string | null = null;
        let planInterval: string | null = null;
        let plan = SubscriptionPlan.PRO; // Por defecto
        
        // Si hay una suscripción pendiente, usar esos datos
        if (pendingSubscriptionJson) {
          console.log('Encontrada suscripción pendiente en localStorage');
          const pendingSubscription = JSON.parse(pendingSubscriptionJson);
          subscriptionId = pendingSubscription.subscriptionId;
          planName = pendingSubscription.planName;
          planPrice = pendingSubscription.planPrice;
          planInterval = pendingSubscription.planInterval;
          
          // Si el plan está guardado en la suscripción pendiente, usarlo
          if (pendingSubscription.plan) {
            plan = pendingSubscription.plan;
          }
          
          // Limpiar la suscripción pendiente de localStorage
          localStorage.removeItem('pendingSubscription');
        } else {
          // Si no hay suscripción pendiente, obtener los datos de la URL
          console.log('Obteniendo datos de suscripción de la URL');
          subscriptionId = searchParams.get('subscription_id');
          planName = searchParams.get('plan_name');
          planPrice = searchParams.get('plan_price');
          planInterval = searchParams.get('plan_interval');
          
          // Verificar si el plan está explícitamente definido en la URL
          const planParam = searchParams.get('plan');
          if (planParam) {
            // Si el plan está explícitamente definido, usarlo directamente
            console.log(`Plan explícitamente definido en URL: ${planParam}`);
            if (planParam === 'pro') {
              plan = SubscriptionPlan.PRO;
            } else if (planParam === 'enterprise') {
              plan = SubscriptionPlan.ENTERPRISE;
            } else if (planParam === 'free') {
              plan = SubscriptionPlan.FREE;
            }
          } else {
            // Determinar el plan basado en el nombre
            if (planName) {
              const normalizedName = planName.toLowerCase();
              if (normalizedName === 'pro' || normalizedName.includes('pro')) {
                plan = SubscriptionPlan.PRO;
              } else if (normalizedName === 'enterprise' || normalizedName.includes('enterprise')) {
                plan = SubscriptionPlan.ENTERPRISE;
              } else if (normalizedName === 'free') {
                plan = SubscriptionPlan.FREE;
              }
            }
          }
          
          console.log(`Plan determinado: ${plan}`);
        }
        
        if (!subscriptionId) {
          setError('No se encontró el ID de suscripción');
          setLoading(false);
          return;
        }
        
        // Guardar detalles del plan para mostrarlos
        if (planName && planPrice) {
          setPlanDetails({
            name: planName,
            price: planPrice,
            interval: planInterval || 'MONTH'
          });
        }
        
        // Intentar obtener el usuario actual con un pequeño retraso
        // para dar tiempo a Firebase a restaurar la sesión
        let user = auth.currentUser;
        
        if (!user) {
          console.log('Usuario no detectado inmediatamente, esperando...');
          
          // Esperar un momento y volver a intentar
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Intentar obtener el usuario nuevamente
          user = auth.currentUser;
          
          if (!user) {
            console.log('Usuario no autenticado después de esperar, guardando en localStorage');
            
            // Guardar los datos de la suscripción en localStorage para procesarlos después
            localStorage.setItem('pendingSubscription', JSON.stringify({
              subscriptionId,
              planName,
              planPrice,
              planInterval,
              plan
            }));
            
            // Redirigir al login con URL de retorno a esta página
            router.push('/auth/signin?returnUrl=' + encodeURIComponent(window.location.pathname + window.location.search));
            return;
          }
        }
        
        // Verificar si la suscripción ya fue procesada por el SDK de PayPal
        const fromPayPalSdk = searchParams.get('from_paypal_sdk') === 'true';
        
        if (fromPayPalSdk) {
          console.log('Suscripción ya procesada por el SDK de PayPal, omitiendo executeSubscription');
          // Solo recargar la suscripción para actualizar el estado global
          await fetchUserSubscription(user.uid);
        } else {
          console.log(`Ejecutando suscripción: ${subscriptionId} para plan: ${plan}`);
          
          // Ejecutar suscripción con el plan determinado
          await executeSubscription(subscriptionId, user.uid, plan);
          
          // Forzar una recarga de la suscripción para actualizar el estado global
          // Esto asegura que el Header y otros componentes muestren el plan actualizado
          await fetchUserSubscription(user.uid);
        }
        
        // Guardar el ID de suscripción en localStorage para que la página de estado pueda acceder a él
        // Esto es útil para pruebas y desarrollo
        try {
          localStorage.setItem('last_subscription_id', subscriptionId);
          console.log('ID de suscripción guardado en localStorage:', subscriptionId);
        } catch (e) {
          console.error('Error al guardar ID de suscripción en localStorage:', e);
        }
        
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
        
        {planDetails && (
          <Box sx={{ mt: 2, mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>
              Detalles del plan
            </Typography>
            <Typography variant="body1">
              <strong>Plan:</strong> {planDetails.name}
            </Typography>
            <Typography variant="body1">
              <strong>Precio:</strong> ${planDetails.price}/{planDetails.interval.toLowerCase()}
            </Typography>
          </Box>
        )}
        
        <Box sx={{ mt: 4 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => router.push('/settings/subscription')}
            sx={{ mx: 1 }}
          >
            Ver detalles de suscripción
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}