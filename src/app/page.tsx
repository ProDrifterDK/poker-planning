"use client";

import RoomManager from "@/components/RoomManager";
import { WelcomeMessage } from "@/components/Onboarding";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import SessionPersistence from "@/components/SessionPersistence";
import { useAuth } from "@/context/authContext";
import { Box, Typography, Button } from "@mui/material";
import Link from "next/link";

export default function HomePage() {
  const { currentUser } = useAuth();

  return (
    <>
      {currentUser ? (
        <ProtectedRoute>
          <RoomManager />
        </ProtectedRoute>
      ) : (
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
      )}
      <WelcomeMessage showDelay={2000} />
    </>
  );
}
