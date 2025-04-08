'use client';

import { useEffect, useState, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  Container,
  Alert,
  useTheme,
  Fade,
  Grow,
  Zoom
} from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/authContext';
import RoomManager from '@/components/RoomManager';
import { WelcomeMessage } from '@/components/Onboarding';
import SessionPersistence from '@/components/SessionPersistence';
import { keyframes } from '@mui/system';
import { useTranslation } from 'react-i18next';

// Definir animaciones personalizadas
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const pulse = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
`;

const float = keyframes`
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0px);
  }
`;

// No longer need the ClientHomePageProps interface as we're using useTranslation

export default function ClientHomePage({ lang }: { lang: string }) {
  const { t, i18n } = useTranslation('common');
  const { currentUser, loading, isGuestUser, logout } = useAuth();
  // Use the current language from i18n context for consistent language display
  const currentLang = i18n.language || lang;
  const router = useRouter();
  const theme = useTheme();
  const [isClient, setIsClient] = useState(false);
  
  // Referencias para medir el contenido
  const topContentRef = useRef<HTMLDivElement>(null);
  const bottomContentRef = useRef<HTMLDivElement>(null);
  
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

  // Si el usuario no está autenticado, mostramos la página de bienvenida
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        p: { xs: 2, md: 4 },
        maxWidth: 1200,
        mx: 'auto',
        mt: 0,
        minHeight: '100vh',
        backgroundAttachment: 'fixed',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundSize: '20px 20px',
          opacity: 0.5,
          zIndex: 0
        }
      }}
    >
      <Box sx={{ position: 'relative', zIndex: 1, width: '100%' }}>
        {/* Componente de persistencia de sesión */}
        <SessionPersistence />
        
        {/* Sección de bienvenida */}
        <Fade in={true} timeout={1000}>
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography
              variant="h3"
              component="h1"
              gutterBottom
              sx={{
                fontWeight: 'bold',
                animation: `${fadeInUp} 1s ease-out`,
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)'
                  : 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                backgroundClip: 'text',
                textFillColor: 'transparent',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2
              }}
            >
              {t('welcome')}
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{
                maxWidth: 800,
                mx: 'auto',
                mb: 4,
                animation: `${fadeInUp} 1.2s ease-out`,
                animationDelay: '0.2s',
                animationFillMode: 'both'
              }}
            >
              {t('description')}
            </Typography>
            <Box
              sx={{
                mt: 3,
                animation: `${fadeInUp} 1.4s ease-out`,
                animationDelay: '0.4s',
                animationFillMode: 'both'
              }}
            >
              <Link href={`/${currentLang}/auth/signin`} passHref>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  sx={{
                    mr: 2,
                    textTransform: "none",
                    px: 4,
                    py: 1,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                    }
                  }}
                >
                  {t('login')}
                </Button>
              </Link>
              <Link href={`/${currentLang}/auth/signup`} passHref>
                <Button
                  variant="outlined"
                  color="primary"
                  size="large"
                  sx={{
                    textTransform: "none",
                    px: 4,
                    py: 1,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                    }
                  }}
                >
                  {t('signup')}
                </Button>
              </Link>
            </Box>
          </Box>
        </Fade>
        
        {/* Sección de características */}
        <Box sx={{ width: '100%', mb: 6 }}>
          <Grow in={true} timeout={1000}>
            <Typography
              variant="h4"
              component="h2"
              gutterBottom
              sx={{
                textAlign: 'center',
                mb: 4,
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: -10,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 80,
                  height: 3,
                  backgroundColor: 'primary.main',
                  borderRadius: 2
                }
              }}
            >
              {t('features.title')}
            </Typography>
          </Grow>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 4 }}>
            <Zoom in={true} style={{ transitionDelay: '200ms' }}>
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  maxWidth: 350,
                  flex: '1 1 350px',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 20px rgba(0,0,0,0.1)'
                  },
                  borderRadius: 2,
                  overflow: 'hidden'
                }}
              >
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    color: 'primary.main',
                    fontWeight: 'bold'
                  }}
                >
                  <Box
                    component="span"
                    sx={{
                      mr: 1,
                      animation: `${pulse} 2s infinite ease-in-out`,
                      fontSize: '1.5rem'
                    }}
                  >
                    🚀
                  </Box>
                  {t('features.realtime')}
                </Typography>
                <Box
                  component="img"
                  src="/images/planning-estimation.gif"
                  alt={currentLang === 'es' ? "Demostración de estimación en tiempo real" : "Real-time estimation demonstration"}
                  sx={{
                    width: '100%',
                    height: 'auto',
                    borderRadius: 1,
                    mb: 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.02)'
                    }
                  }}
                />
                <Typography variant="body1">
                  {t('features.realtimeDescription')}
                </Typography>
              </Paper>
            </Zoom>
            
            <Zoom in={true} style={{ transitionDelay: '400ms' }}>
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  maxWidth: 350,
                  flex: '1 1 350px',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 20px rgba(0,0,0,0.1)'
                  },
                  borderRadius: 2,
                  overflow: 'hidden'
                }}
              >
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    color: 'primary.main',
                    fontWeight: 'bold'
                  }}
                >
                  <Box
                    component="span"
                    sx={{
                      mr: 1,
                      animation: `${float} 3s infinite ease-in-out`,
                      fontSize: '1.5rem'
                    }}
                  >
                    🔄
                  </Box>
                  {t('features.remote')}
                </Typography>
                <Box
                  component="img"
                  src="/images/planning-series.gif"
                  alt={currentLang === 'es' ? "Demostración de series de estimación" : "Estimation series demonstration"}
                  sx={{
                    width: '100%',
                    height: 'auto',
                    borderRadius: 1,
                    mb: 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.02)'
                    }
                  }}
                />
                <Typography variant="body1">
                  {t('features.remoteDescription')}
                </Typography>
              </Paper>
            </Zoom>
          </Box>
        </Box>
        
        {/* Sección de demostración */}
        <Box sx={{ width: '100%', mb: 8, mt: 4 }}>
          <Fade in={true} timeout={1500}>
            <Typography
              variant="h4"
              component="h2"
              gutterBottom
              sx={{
                textAlign: 'center',
                mb: 4,
                fontWeight: 'bold',
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(45deg, #FF5722 30%, #FFC107 90%)'
                  : 'linear-gradient(45deg, #FF5722 30%, #FFC107 90%)',
                backgroundClip: 'text',
                textFillColor: 'transparent',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {t('demo.title')}
            </Typography>
          </Fade>
          
          <Zoom in={true} timeout={1000} style={{ transitionDelay: '500ms' }}>
            <Paper
              elevation={5}
              sx={{
                p: { xs: 2, md: 4 },
                borderRadius: 3,
                overflow: 'hidden',
                maxWidth: 900,
                mx: 'auto',
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(to bottom, rgba(30,30,30,1) 0%, rgba(20,20,20,1) 100%)'
                  : 'linear-gradient(to bottom, rgba(255,255,255,1) 0%, rgba(245,245,245,1) 100%)',
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 15px 25px rgba(0,0,0,0.3)'
                  : '0 15px 25px rgba(0,0,0,0.1)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 20px 30px rgba(0,0,0,0.4)'
                    : '0 20px 30px rgba(0,0,0,0.15)'
                }
              }}
            >
              <Box sx={{ position: 'relative', paddingTop: '56.25%', width: '100%' }}>
                <Box
                  component="img"
                  src="/images/planning-demo.gif"
                  alt={currentLang === 'es' ? "Demostración completa de Poker Planning Pro" : "Complete demonstration of Poker Planning Pro"}
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: 2
                  }}
                />
              </Box>
              
              <Fade in={true} timeout={1000} style={{ transitionDelay: '800ms' }}>
                <Box>
                  <Typography
                    variant="h6"
                    sx={{
                      mt: 3,
                      mb: 1,
                      textAlign: 'center',
                      fontWeight: 'bold',
                      color: 'primary.main'
                    }}
                  >
                    {t('demo.subtitle')}
                  </Typography>
                  
                  <Typography
                    variant="body1"
                    sx={{
                      textAlign: 'center',
                      px: { xs: 1, md: 4 }
                    }}
                  >
                    {t('demo.description')}
                  </Typography>
                </Box>
              </Fade>
            </Paper>
          </Zoom>
        </Box>
        
        {/* Sección de planes */}
        <Box sx={{ width: '100%', mb: 6 }}>
          <Typography variant="h4" component="h2" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
            {t('plansSection.title')}
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 4 }}>
            <Paper elevation={3} sx={{ p: 3, maxWidth: 300, flex: '1 1 300px', borderTop: '4px solid #2196f3' }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                {t('plansSection.free.title')}
              </Typography>
              <Typography variant="h6" color="primary" gutterBottom>
                {t('plansSection.free.price')}
              </Typography>
              <Typography variant="body2" paragraph>
                {t('plansSection.free.description')}
              </Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                {(t('plansSection.free.features', { returnObjects: true }) as string[]).map((feature: string, index: number) => (
                  <Typography key={index} component="li" variant="body2">{feature}</Typography>
                ))}
              </Box>
            </Paper>
            
            <Paper elevation={3} sx={{ p: 3, maxWidth: 300, flex: '1 1 300px', borderTop: '4px solid #ff9800' }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                {t('plansSection.pro.title')}
              </Typography>
              <Typography variant="h6" color="primary" gutterBottom>
                {t('plansSection.pro.price')}
              </Typography>
              <Typography variant="body2" paragraph>
                {t('plansSection.pro.description')}
              </Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                {(t('plansSection.pro.features', { returnObjects: true }) as string[]).map((feature: string, index: number) => (
                  <Typography key={index} component="li" variant="body2">{feature}</Typography>
                ))}
              </Box>
            </Paper>
            
            <Paper elevation={3} sx={{ p: 3, maxWidth: 300, flex: '1 1 300px', borderTop: '4px solid #f44336' }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                {t('plansSection.enterprise.title')}
              </Typography>
              <Typography variant="h6" color="primary" gutterBottom>
                {t('plansSection.enterprise.price')}
              </Typography>
              <Typography variant="body2" paragraph>
                {t('plansSection.enterprise.description')}
              </Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                {(t('plansSection.enterprise.features', { returnObjects: true }) as string[]).map((feature: string, index: number) => (
                  <Typography key={index} component="li" variant="body2">{feature}</Typography>
                ))}
              </Box>
            </Paper>
          </Box>
        </Box>
        
        {/* Sección de testimonios */}
        <Box sx={{ width: '100%', mb: 6 }}>
          <Typography variant="h4" component="h2" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
            {t('testimonials.title')}
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 4 }}>
            <Paper elevation={1} sx={{ p: 3, maxWidth: 350, flex: '1 1 350px', bgcolor: 'background.paper' }}>
              <Typography variant="body1" paragraph sx={{ fontStyle: 'italic' }}>
                {currentLang === 'es'
                  ? "Poker Planning Pro ha transformado nuestras sesiones de estimación. Ahora son más eficientes y todos los miembros del equipo participan activamente."
                  : "Poker Planning Pro has transformed our estimation sessions. They are now more efficient and all team members actively participate."}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                {currentLang === 'es' ? "— María González, Scrum Master" : "— Maria Gonzalez, Scrum Master"}
              </Typography>
            </Paper>
            
            <Paper elevation={1} sx={{ p: 3, maxWidth: 350, flex: '1 1 350px', bgcolor: 'background.paper' }}>
              <Typography variant="body1" paragraph sx={{ fontStyle: 'italic' }}>
                {currentLang === 'es'
                  ? "La interfaz intuitiva y las funcionalidades avanzadas hacen que sea muy fácil de usar. Definitivamente recomendaría esta herramienta."
                  : "The intuitive interface and advanced features make it very easy to use. I would definitely recommend this tool."}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                {currentLang === 'es' ? "— Carlos Rodríguez, Product Owner" : "— Carlos Rodriguez, Product Owner"}
              </Typography>
            </Paper>
          </Box>
        </Box>
        
        {/* Llamada a la acción final */}
        <Box ref={bottomContentRef} sx={{ width: '100%', textAlign: 'center', mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            {t('cta.title')}
          </Typography>
          <Typography variant="body1" paragraph>
            {t('cta.description')}
          </Typography>
          <Link href={`/${currentLang}/auth/signup`} passHref>
            <Button variant="contained" color="primary" size="large" sx={{ textTransform: "none", px: 4, py: 1 }}>
              {t('cta.button')}
            </Button>
          </Link>
        </Box>
      </Box>
      <WelcomeMessage showDelay={2000} />
    </Box>
  );
}