"use client";

import RoomManager from "@/components/RoomManager";
import { WelcomeMessage } from "@/components/Onboarding";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import SessionPersistence from "@/components/SessionPersistence";
import { useAuth } from "@/context/authContext";
import { Box, Typography, Button, Paper, Alert } from "@mui/material";
import Link from "next/link";
import { useEffect } from "react";
import Advertisement from "@/components/Advertisement";
import AdFreeContent from "@/components/AdFreeContent";

export default function HomePage() {
  const { currentUser, isGuestUser, logout } = useAuth();
  
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
            p: 4,
            maxWidth: 1000,
            mx: 'auto',
            mt: 2
          }}
        >
          {/* Componente de persistencia de sesión */}
          <SessionPersistence />
          
          {/* Sección de bienvenida */}
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
              Bienvenido a Poker Planning Pro
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto', mb: 4 }}>
              La herramienta perfecta para estimar tareas en equipo de forma ágil y efectiva, sin importar dónde se encuentren los miembros del equipo.
            </Typography>
            <Box sx={{ mt: 3 }}>
              <Link href="/auth/signin" passHref>
                <Button variant="contained" color="primary" size="large" sx={{ mr: 2, textTransform: "none", px: 4, py: 1 }}>
                  Iniciar Sesión
                </Button>
              </Link>
              <Link href="/auth/signup" passHref>
                <Button variant="outlined" color="primary" size="large" sx={{ textTransform: "none", px: 4, py: 1 }}>
                  Registrarse
                </Button>
              </Link>
            </Box>
          </Box>
          
          {/* Sección de características */}
          <Box sx={{ width: '100%', mb: 6 }}>
            <Typography variant="h4" component="h2" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
              ¿Por qué usar Poker Planning Pro?
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 4 }}>
              <Paper elevation={2} sx={{ p: 3, maxWidth: 300, flex: '1 1 300px' }}>
                <Typography variant="h6" gutterBottom>
                  🚀 Estimación en Tiempo Real
                </Typography>
                <Typography variant="body1">
                  Todos los miembros del equipo pueden votar simultáneamente y ver los resultados en tiempo real, facilitando la discusión y el consenso.
                </Typography>
              </Paper>
              
              <Paper elevation={2} sx={{ p: 3, maxWidth: 300, flex: '1 1 300px' }}>
                <Typography variant="h6" gutterBottom>
                  🔄 Múltiples Series de Estimación
                </Typography>
                <Typography variant="body1">
                  Soportamos Fibonacci, T-shirt Sizing, Powers of 2 y más, adaptándose a la metodología preferida de tu equipo.
                </Typography>
              </Paper>
              
              <Paper elevation={2} sx={{ p: 3, maxWidth: 300, flex: '1 1 300px' }}>
                <Typography variant="h6" gutterBottom>
                  👥 Roles y Permisos
                </Typography>
                <Typography variant="body1">
                  Sistema de roles que permite controlar quién puede realizar qué acciones, ideal para Scrum Masters y facilitadores.
                </Typography>
              </Paper>
            </Box>
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
      )}
      <WelcomeMessage showDelay={2000} />
    </>
  );
}
