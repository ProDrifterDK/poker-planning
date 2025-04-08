'use client';

import React from 'react';
import { Container, Typography, Paper, Button, Box } from '@mui/material';
import { useRouter } from 'next/navigation';
import CancelIcon from '@mui/icons-material/Cancel';
import { useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';

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

export default function SubscriptionCancelPage() {
  const router = useRouter();
  const params = useParams();
  const { lang } = params as { lang: string };
  const { t, i18n } = useTranslation('common');
  
  // Force a re-render when the language changes
  React.useEffect(() => {
    // This is just to ensure the component re-renders when the language changes
    console.log('SubscriptionCancelPage - Current language:', i18n.language);
    
    // Force i18n to use the language from the URL
    if (i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
  }, [i18n, lang]);
  
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <CancelIcon color="error" sx={{ fontSize: 80, mb: 2 }} />
        
        <Typography variant="h4" gutterBottom>
          {t('subscription.canceled', 'Suscripción cancelada')}
        </Typography>
        
        <Typography variant="body1" paragraph>
          {t('subscription.cancelMessage', 'Has cancelado el proceso de suscripción. No se ha realizado ningún cargo.')}
        </Typography>
        
        <Typography variant="body1" paragraph>
          {t('subscription.supportMessage', 'Si tuviste algún problema durante el proceso o necesitas ayuda, no dudes en contactar a nuestro equipo de soporte.')}
        </Typography>
        
        <Box sx={{ mt: 4 }}>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => router.push(getLocalizedRoute('/settings/subscription'))}
            sx={{ mx: 1 }}
          >
            {t('subscription.backToSubscriptions', 'Volver a suscripciones')}
          </Button>
          
          <Button 
            variant="outlined"
            onClick={() => router.push(getLocalizedRoute(''))}
            sx={{ mx: 1 }}
          >
            {t('subscription.goToHome', 'Ir al inicio')}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}