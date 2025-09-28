'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert
} from '@mui/material';
import Link from 'next/link';
import { useAuth } from '@/context/authContext';
import RoomManager from '@/components/RoomManager';
import SessionPersistence from '@/components/SessionPersistence';
import { useTranslation } from 'react-i18next';
import HeroSection from '@/components/HeroSection';
import TrustBar from '@/components/TrustBar';
import FeatureShowcase from '@/components/FeatureShowcase';
import InteractiveDemo from '@/components/InteractiveDemo';
import PricingTable from '@/components/PricingTable';
import FinalCTA from '@/components/FinalCTA';

// No longer need the ClientHomePageProps interface as we're using useTranslation

export default function ClientHomePage({ lang }: { lang: string }) {
  const { t, i18n } = useTranslation('common');
  const { currentUser, loading, isGuestUser, logout } = useAuth();
  // Use the current language from i18n context for consistent language display
  const currentLang = i18n.language || lang;
  const [isClient, setIsClient] = useState(false);

  // Verificar si el usuario es un invitado
  const isGuest = isGuestUser ? isGuestUser() : false;

  // Este efecto se ejecuta solo en el cliente
  useEffect(() => {
    setIsClient(true);

    // Limpiar el localStorage cuando un usuario invitado llega a la página de inicio
    if (isGuest) {
      // Eliminar la marca de usuario invitado cuando llega a la página de inicio
      localStorage.removeItem('isGuestUser');
      localStorage.removeItem('guestName');
    }
  }, [isGuest]);

  // Si estamos en el servidor o cargando, mostramos un estado de carga
  if (!isClient || loading) {
    return null; // O un componente de carga si prefieres
  }

  // Si el usuario está autenticado, mostramos el RoomManager
  if (currentUser) {
    if (isGuest) {
      // Vista especial para usuarios invitados
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            p: 4,
            maxWidth: 800,
            mx: 'auto',
            mt: 4
          }}
        >
          <SessionPersistence />

          <Paper
            elevation={3}
            sx={{
              p: 4,
              width: '100%',
              maxWidth: 600,
              borderRadius: 2,
              mb: 4
            }}
          >
            <Alert severity="info" sx={{ mb: 3 }}>
              {t('guest.alert')}
            </Alert>

            <Typography variant="h4" component="h1" gutterBottom>
              {t('guest.title')}
            </Typography>

            <Typography variant="body1" paragraph>
              {t('guest.description')}
            </Typography>

            <Typography variant="body1" paragraph>
              {t('guest.registerPrompt')}
            </Typography>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Link href={`/${currentLang}/auth/signup`} passHref>
                <Button variant="contained" color="primary" size="large" sx={{ textTransform: "none" }}>
                  {t('signup')}
                </Button>
              </Link>

              <Button
                variant="outlined"
                color="secondary"
                size="large"
                onClick={logout}
                sx={{ textTransform: "none" }}
              >
                {t('navigation.logout')}
              </Button>
            </Box>
          </Paper>

          <Paper
            elevation={2}
            sx={{
              p: 3,
              width: '100%',
              maxWidth: 600,
              borderRadius: 2
            }}
          >
            <Typography variant="h5" gutterBottom>
              {t('guest.joinRoomTitle')}
            </Typography>

            <Typography variant="body1" paragraph>
              {t('guest.joinRoomDescription')}
            </Typography>

            <Link href={`/${currentLang}/room/join`} passHref>
              <Button variant="contained" color="secondary" sx={{ textTransform: "none" }}>
                {t('guest.joinRoomButton')}
              </Button>
            </Link>
          </Paper>
        </Box>
      );
    } else {
      // Vista normal para usuarios registrados
      return <RoomManager />;
    }
  }

  // Si el usuario no está autenticado, mostramos la página de bienvenida con los nuevos componentes
  return (
    <>
      {/* Componente de persistencia de sesión */}
      <SessionPersistence />

      {/* Secciones de la landing page en orden narrativo */}
      <HeroSection />
      <TrustBar />
      <FeatureShowcase />
      <InteractiveDemo />
      <PricingTable />
      <FinalCTA />
    </>
  );
}