'use client';

import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, Paper, Grid, Button, CircularProgress, Alert } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { SubscriptionPlan, getLocalizedSubscriptionPlans } from '@/types/subscription';
import { auth } from '@/lib/firebaseConfig';
import PlanCard from '@/components/subscription/PlanCard';
import CurrentSubscription from '@/components/subscription/CurrentSubscription';
import PaymentHistory from '@/components/subscription/PaymentHistory';
import { useTranslation } from 'react-i18next';
import { useParams } from 'next/navigation';
import LanguageAwareComponent from '@/features/internationalization/LanguageAwareComponent';

// Lista de idiomas soportados
const supportedLocales = ['es', 'en'];

// Función auxiliar para obtener la ruta con el idioma
const getLocalizedRoute = (route: string): string => {
  // Intentar obtener el idioma de i18next primero (cliente)
  let lang = 'es'; // Valor por defecto
  
  if (typeof window !== 'undefined') {
    // Estamos en el cliente, podemos acceder a i18next
    const i18nLang = window.localStorage.getItem('i18nextLng');
    
    if (i18nLang && supportedLocales.includes(i18nLang)) {
      lang = i18nLang;
    } else {
      // Fallback a la URL si no hay idioma en i18next
      const urlLang = window.location.pathname.split('/')[1];
      if (supportedLocales.includes(urlLang)) {
        lang = urlLang;
      }
    }
  }
  
  return `/${lang}${route}`;
};

export default function SubscriptionPage() {
  const router = useRouter();
  const params = useParams();
  const { lang } = params as { lang: string };
  const { t, i18n } = useTranslation(['common']);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [localizedPlans, setLocalizedPlans] = useState(getLocalizedSubscriptionPlans(lang));
  
  // Force a re-render when the language changes
  React.useEffect(() => {
    // This is just to ensure the component re-renders when the language changes
    console.log('SubscriptionPage - Current language:', i18n.language);
    
    // Update localized plans when language changes
    setLocalizedPlans(getLocalizedSubscriptionPlans(i18n.language));
  }, [i18n.language]);
  
  // Listen for language change events
  React.useEffect(() => {
    const handleLanguageChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.language) {
        const newLang = customEvent.detail.language;
        console.log('Language changed to:', newLang);
        setLocalizedPlans(getLocalizedSubscriptionPlans(newLang));
      }
    };
    
    window.addEventListener('languageChanged', handleLanguageChange);
    
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange);
    };
  }, []);
  
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
        router.push(getLocalizedRoute('/auth/signin'));
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
          {t('subscription.loading', 'Cargando información de suscripción...')}
        </Typography>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <LanguageAwareComponent>
        <Typography variant="h4" component="h1" gutterBottom>
          {t('menu.subscription', 'Suscripción')}
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
              {t('subscription.current', 'Tu suscripción actual')}
            </Typography>
            <CurrentSubscription subscription={currentSubscription} />
          </Box>
        )}
      </LanguageAwareComponent>
      
      {/* Planes de suscripción */}
      <LanguageAwareComponent>
        <Box mb={4}>
          <Typography variant="h5" gutterBottom>
            {t('plansSection.title', 'Planes disponibles')}
          </Typography>
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            {t('subscription.monthlyPlans', 'Planes Mensuales')}
          </Typography>
          
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {Object.entries(localizedPlans)
              .filter(([key, plan]) => plan.billingInterval === 'month')
              .map(([key, plan]) => (
                <Grid item xs={12} md={4} key={key}>
                  <PlanCard
                    plan={plan}
                    planKey={key}
                    isCurrentPlan={
                      currentSubscription?.plan === plan.id
                    }
                    userId={userId || ''}
                  />
                </Grid>
              ))}
          </Grid>
          
          <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
            {t('subscription.yearlyPlans', 'Planes Anuales (Ahorra más de 15%)')}
          </Typography>
          
          <Grid container spacing={3}>
            {Object.entries(localizedPlans)
              .filter(([key, plan]) => plan.billingInterval === 'year' && plan.id !== SubscriptionPlan.FREE)
              .map(([key, plan]) => (
                <Grid item xs={12} md={4} key={key}>
                  <PlanCard
                    plan={plan}
                    planKey={key}
                    isCurrentPlan={
                      currentSubscription?.plan === plan.id
                    }
                    userId={userId || ''}
                  />
                </Grid>
              ))}
          </Grid>
        </Box>
      </LanguageAwareComponent>
      
      {/* Historial de pagos y información adicional */}
      <LanguageAwareComponent>
        {paymentHistory.length > 0 && (
          <Box mb={4}>
            <Typography variant="h5" gutterBottom>
              {t('subscription.paymentHistory', 'Historial de pagos')}
            </Typography>
            <PaymentHistory payments={paymentHistory} />
          </Box>
        )}
        
        {/* Información adicional */}
        <Paper sx={{ p: 3, mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            {t('subscription.info', 'Información sobre suscripciones')}
          </Typography>
          <Typography variant="body1" paragraph>
            {t('subscription.renewalInfo', 'Las suscripciones se renuevan automáticamente al final de cada período. Puedes cancelar tu suscripción en cualquier momento.')}
          </Typography>
          <Typography variant="body1" paragraph>
            {t('subscription.supportInfo', 'Si tienes alguna pregunta sobre tu suscripción, por favor contacta a nuestro equipo de soporte.')}
          </Typography>
          <Button variant="outlined" href="mailto:support@planningpokerpro.com">
            {t('subscription.contactSupport', 'Contactar soporte')}
          </Button>
        </Paper>
      </LanguageAwareComponent>
    </Container>
  );
}