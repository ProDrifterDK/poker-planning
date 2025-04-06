"use client";

import RoomManager from "@/components/RoomManager";
import { WelcomeMessage } from "@/components/Onboarding";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import SessionPersistence from "@/components/SessionPersistence";
import { useAuth } from "@/context/authContext";
import { Box, Typography, Button, Paper, Alert, useTheme, Fade, Grow, Zoom } from "@mui/material";
import { keyframes } from '@mui/system';
import Link from "next/link";
import { useEffect } from "react";
import Advertisement from "@/components/Advertisement";
import AdFreeContent from "@/components/AdFreeContent";

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

const shimmer = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`;

export default function HomePage() {
  const { currentUser, isGuestUser, logout } = useAuth();
  const theme = useTheme();
  
  // Verificar si el usuario es un invitado
  const isGuest = isGuestUser();
  
  // Limpiar el localStorage cuando un usuario invitado llega a la página de inicio
  useEffect(() => {
    if (isGuest) {
      // Eliminar la marca de usuario invitado cuando llega a la página de inicio
      localStorage.removeItem('isGuestUser');
      localStorage.removeItem('guestName');
    }
  }, [isGuest]);

  return (
    <>
      {currentUser ? (
        isGuest ? (
          // Vista especial para usuarios invitados
          <AdFreeContent adSlot="3456789012" adFormat="horizontal" adPosition="top">
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
                  Has ingresado como invitado. Para crear salas o acceder a todas las funcionalidades, necesitas registrarte.
                </Alert>
                
                <Typography variant="h4" component="h1" gutterBottom>
                  ¡Gracias por probar Poker Planning Pro!
                </Typography>
                
                <Typography variant="body1" paragraph>
                  Como usuario invitado, puedes unirte a salas existentes usando un código de invitación, pero no puedes crear nuevas salas.
                </Typography>
                
                <Typography variant="body1" paragraph>
                  Regístrate para desbloquear todas las funcionalidades:
                </Typography>
                
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
                  <Link href="/auth/signup" passHref>
                    <Button variant="contained" color="primary" size="large" sx={{ textTransform: "none" }}>
                      Registrarse
                    </Button>
                  </Link>
                  
                  <Button
                    variant="outlined"
                    color="secondary"
                    size="large"
                    onClick={logout}
                    sx={{ textTransform: "none" }}
                  >
                    Cerrar Sesión
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
                  ¿Tienes un código de sala?
                </Typography>
                
                <Typography variant="body1" paragraph>
                  Puedes unirte a una sala existente usando el código que te compartieron.
                </Typography>
                
                <Link href="/room/join" passHref>
                  <Button variant="contained" color="secondary" sx={{ textTransform: "none" }}>
                    Unirse a una Sala
                  </Button>
                </Link>
              </Paper>
            </Box>
          </AdFreeContent>
        ) : (
          // Vista normal para usuarios registrados
          <ProtectedRoute>
            <RoomManager />
          </ProtectedRoute>
        )
      ) : (
        // Vista para usuarios no autenticados
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
                Bienvenido a Poker Planning Pro
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
                La herramienta perfecta para estimar tareas en equipo de forma ágil y efectiva, sin importar dónde se encuentren los miembros del equipo.
              </Typography>
              <Box
                sx={{
                  mt: 3,
                  animation: `${fadeInUp} 1.4s ease-out`,
                  animationDelay: '0.4s',
                  animationFillMode: 'both'
                }}
              >
                <Link href="/auth/signin" passHref>
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
                    Iniciar Sesión
                  </Button>
                </Link>
                <Link href="/auth/signup" passHref>
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
                    Registrarse
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
                ¿Por qué usar Poker Planning Pro?
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
                    Estimación en Tiempo Real
                  </Typography>
                  <Box
                    component="img"
                    src="/images/planning-estimation.gif"
                    alt="Demostración de estimación en tiempo real"
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
                    Todos los miembros del equipo pueden votar simultáneamente y ver los resultados en tiempo real, facilitando la discusión y el consenso.
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
                    Múltiples Series de Estimación
                  </Typography>
                  <Box
                    component="img"
                    src="/images/planning-series.gif"
                    alt="Demostración de series de estimación"
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
                    Soportamos Fibonacci, T-shirt Sizing, Powers of 2 y más, adaptándose a la metodología preferida de tu equipo.
                  </Typography>
                </Paper>
              </Zoom>
            </Box>
          </Box>
          
          {/* Sección de demostración */}
          <Box
            sx={{
              width: '100%',
              mb: 8,
              mt: 4,
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: -30,
                left: 0,
                right: 0,
                height: 1,
                zIndex: 1
              }
            }}
          >
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
                Vea Poker Planning Pro en acción
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
                    alt="Demostración completa de Poker Planning Pro"
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
                      Flujo completo de una sesión de Planning Poker
                    </Typography>
                    
                    <Typography
                      variant="body1"
                      sx={{
                        textAlign: 'center',
                        px: { xs: 1, md: 4 }
                      }}
                    >
                      Observe cómo un equipo crea una sala, añade issues, vota y revela las estimaciones en tiempo real.
                      Experimente la simplicidad y eficiencia de Poker Planning Pro.
                    </Typography>
                  </Box>
                </Fade>
              </Paper>
            </Zoom>
          </Box>
          
          {/* Sección de planes */}
          <Box sx={{ width: '100%', mb: 6 }}>
            <Typography variant="h4" component="h2" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
              Planes disponibles
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 4 }}>
              <Paper elevation={3} sx={{ p: 3, maxWidth: 300, flex: '1 1 300px', borderTop: '4px solid #2196f3' }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Plan Free
                </Typography>
                <Typography variant="h6" color="primary" gutterBottom>
                  $0 / mes
                </Typography>
                <Typography variant="body2" paragraph>
                  Ideal para equipos pequeños o para probar la plataforma.
                </Typography>
                <Box component="ul" sx={{ pl: 2 }}>
                  <Typography component="li" variant="body2">Hasta 5 participantes por sala</Typography>
                  <Typography component="li" variant="body2">1 sala activa</Typography>
                  <Typography component="li" variant="body2">Funcionalidades básicas</Typography>
                </Box>
              </Paper>
              
              <Paper elevation={3} sx={{ p: 3, maxWidth: 300, flex: '1 1 300px', borderTop: '4px solid #ff9800' }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Plan Pro
                </Typography>
                <Typography variant="h6" color="primary" gutterBottom>
                  $9.99 / mes
                </Typography>
                <Typography variant="body2" paragraph>
                  Para equipos medianos con necesidades avanzadas.
                </Typography>
                <Box component="ul" sx={{ pl: 2 }}>
                  <Typography component="li" variant="body2">Hasta 15 participantes por sala</Typography>
                  <Typography component="li" variant="body2">5 salas activas</Typography>
                  <Typography component="li" variant="body2">Exportación de datos</Typography>
                  <Typography component="li" variant="body2">Estadísticas avanzadas</Typography>
                </Box>
              </Paper>
              
              <Paper elevation={3} sx={{ p: 3, maxWidth: 300, flex: '1 1 300px', borderTop: '4px solid #f44336' }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Plan Enterprise
                </Typography>
                <Typography variant="h6" color="primary" gutterBottom>
                  $29.99 / mes
                </Typography>
                <Typography variant="body2" paragraph>
                  Solución completa para equipos grandes y empresas.
                </Typography>
                <Box component="ul" sx={{ pl: 2 }}>
                  <Typography component="li" variant="body2">Hasta 100 participantes por sala</Typography>
                  <Typography component="li" variant="body2">20 salas activas</Typography>
                  <Typography component="li" variant="body2">Integraciones con Jira, Trello, GitHub</Typography>
                  <Typography component="li" variant="body2">Personalización de marca</Typography>
                </Box>
              </Paper>
            </Box>
          </Box>
          
          {/* Sección de testimonios */}
          <Box sx={{ width: '100%', mb: 6 }}>
            <Typography variant="h4" component="h2" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
              Lo que dicen nuestros usuarios
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 4 }}>
              <Paper elevation={1} sx={{ p: 3, maxWidth: 350, flex: '1 1 350px', bgcolor: 'background.paper' }}>
                <Typography variant="body1" paragraph sx={{ fontStyle: 'italic' }}>
                  &ldquo;Poker Planning Pro ha transformado nuestras sesiones de estimación. Ahora son más eficientes y todos los miembros del equipo participan activamente.&rdquo;
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  — María González, Scrum Master
                </Typography>
              </Paper>
              
              <Paper elevation={1} sx={{ p: 3, maxWidth: 350, flex: '1 1 350px', bgcolor: 'background.paper' }}>
                <Typography variant="body1" paragraph sx={{ fontStyle: 'italic' }}>
                  &ldquo;La interfaz intuitiva y las funcionalidades avanzadas hacen que sea muy fácil de usar. Definitivamente recomendaría esta herramienta.&rdquo;
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  — Carlos Rodríguez, Product Owner
                </Typography>
              </Paper>
            </Box>
          </Box>
          
          {/* Anuncio al final de todo el contenido */}
          <Box sx={{ width: '100%', overflow: 'hidden' }}>
            <AdFreeContent adSlot="7890123456" adFormat="horizontal" adPosition="bottom">
              <Box sx={{ width: '100%', textAlign: 'center', mt: 4 }}>
                <Typography variant="h5" gutterBottom>
                  ¿Listo para mejorar tus sesiones de Planning Poker?
                </Typography>
                <Typography variant="body1" paragraph>
                  Regístrate hoy y comienza a disfrutar de todas las ventajas de Poker Planning Pro.
                </Typography>
                <Link href="/auth/signup" passHref>
                  <Button variant="contained" color="primary" size="large" sx={{ textTransform: "none", px: 4, py: 1 }}>
                    Comenzar Ahora
                  </Button>
                </Link>
              </Box>
            </AdFreeContent>
          </Box>
          </Box>
        </Box>
      )}
      <WelcomeMessage showDelay={2000} />
    </>
  );
}
