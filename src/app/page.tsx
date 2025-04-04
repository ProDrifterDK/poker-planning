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
        <AdFreeContent adSlot="7890123456" adFormat="horizontal" adPosition="top">
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
            {/* Componente de persistencia de sesión */}
            <SessionPersistence />
            
            <Typography variant="h4" component="h1" gutterBottom>
              Bienvenido a Poker Planning Pro
            </Typography>
            <Typography variant="body1" paragraph>
              La herramienta perfecta para estimar tareas en equipo de forma ágil y efectiva.
            </Typography>
            <Typography variant="body1" paragraph>
              Para crear o unirte a una sala, necesitas iniciar sesión.
            </Typography>
            <Box sx={{ mt: 3 }}>
              <Link href="/auth/signin" passHref>
                <Button variant="contained" color="primary" size="large" sx={{ mr: 2, textTransform: "none" }}>
                  Iniciar Sesión
                </Button>
              </Link>
              <Link href="/auth/signup" passHref>
                <Button variant="outlined" color="primary" size="large" sx={{ textTransform: "none" }}>
                  Registrarse
                </Button>
              </Link>
            </Box>
          </Box>
        </AdFreeContent>
      )}
      <WelcomeMessage showDelay={2000} />
    </>
  );
}
