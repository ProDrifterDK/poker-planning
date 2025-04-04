"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  Button
} from "@mui/material";
import { useRoomStore } from "@/store/roomStore";
import { useSubscriptionStore } from "@/store/subscriptionStore";
import { useAuth } from "@/context/authContext";
import Link from "next/link";

export default function DirectJoin() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomCode = searchParams.get("code");
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Obtener información del usuario autenticado
  const { currentUser, isGuestUser } = useAuth();
  
  // Verificar si el usuario es un invitado
  const isGuest = isGuestUser();
  
  // Usar los stores de Zustand
  const { joinRoomWithName, error, setError } = useRoomStore();
  const subscriptionStore = useSubscriptionStore();

  // Verificar si ya hay una sesión persistente para esta sala
  useEffect(() => {
    const checkPersistedSession = async () => {
      try {
        // Verificar si estamos en el cliente
        if (typeof window === 'undefined') return false;
        
        // Verificar si hay una sesión persistente en localStorage
        const storageData = localStorage.getItem('poker-planning-storage');
        if (storageData) {
          const sessionData = JSON.parse(storageData);
          const state = sessionData.state;
          
          // Si hay una sesión para esta sala, verificar si la sala sigue activa
          if (state && state.roomId === roomCode) {
            try {
              // Verificar si la sala está marcada para eliminación
              const { ref, get } = await import('firebase/database');
              const { realtimeDb } = await import('@/lib/firebaseConfig');
              
              const roomRef = ref(realtimeDb, `rooms/${roomCode}/metadata`);
              const roomSnapshot = await get(roomRef);
              
              // Si la sala no existe o está marcada para eliminación, limpiar la sesión
              if (!roomSnapshot.exists() || 
                  roomSnapshot.val().markedForDeletion === true || 
                  roomSnapshot.val().active === false) {
                localStorage.removeItem('poker-planning-storage');
                setJoinError("Esta sala ha sido cerrada porque todos los participantes la abandonaron.");
                return false;
              }
              
              // Si la sala sigue activa, redirigir automáticamente
              router.push(`/room/${roomCode}`);
              return true;
            } catch (fbError) {
              console.error("Error al verificar estado de la sala:", fbError);
              // En caso de error, intentamos unirse normalmente
              return false;
            }
          }
        }
        return false;
      } catch (error) {
        console.error("Error al verificar sesión persistente:", error);
        return false;
      }
    };

    // Verificar sesión persistente primero
    checkPersistedSession().then(hasSession => {
      if (!hasSession && currentUser && roomCode) {
        joinRoom();
      }
    });
  }, [currentUser, roomCode, router]);

  // Función para unirse a la sala
  const joinRoom = async () => {
    if (!roomCode) {
      setJoinError("Código de sala no válido");
      return;
    }

    if (!currentUser) {
      setJoinError("Debes iniciar sesión para unirte a una sala");
      return;
    }

    // Determinar el nombre a usar
    let userName = currentUser.displayName || '';
    
    // Para usuarios invitados, intentar obtener el nombre del localStorage
    if (isGuest) {
      const guestName = localStorage.getItem('guestName');
      if (guestName) {
        userName = guestName;
      }
    }

    if (!userName) {
      setJoinError("No se pudo determinar tu nombre. Por favor, inicia sesión nuevamente.");
      return;
    }

    // Verificar si la sala puede aceptar más participantes
    try {
      const canJoin = await subscriptionStore.canRoomAddParticipant(roomCode);
      if (!canJoin) {
        setJoinError("Esta sala ha alcanzado su límite de participantes. El creador de la sala necesita actualizar su plan para permitir más participantes.");
        return;
      }

      setIsJoining(true);
      await joinRoomWithName(roomCode, userName);
      router.push(`/room/${roomCode}`);
    } catch (error) {
      console.error("Error al unirse a la sala:", error);
      setIsJoining(false);
      setJoinError(error instanceof Error ? error.message : "Error al unirse a la sala");
    }
  };

  // Si no hay código de sala, mostrar un mensaje de error
  if (!roomCode) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="70vh"
        padding={4}
        gap={3}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: "100%",
            maxWidth: 500,
            borderRadius: 2,
            textAlign: "center"
          }}
        >
          <Typography variant="h5" color="error" gutterBottom>
            Error al unirse a la sala
          </Typography>
          <Typography variant="body1" paragraph>
            No se ha proporcionado un código de sala válido.
          </Typography>
          <Link href="/" passHref>
            <Button variant="contained" color="primary">
              Volver al inicio
            </Button>
          </Link>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="70vh"
      padding={4}
      gap={3}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          width: "100%",
          maxWidth: 500,
          borderRadius: 2,
          textAlign: "center"
        }}
      >
        <Typography variant="h4" gutterBottom>
          Unirse a la Sala
        </Typography>

        <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
          Código de sala: <strong>{roomCode}</strong>
        </Typography>

        {(error || joinError) && (
          <Alert
            severity="error"
            onClose={() => {
              setError(null);
              setJoinError(null);
            }}
            sx={{ width: "100%", mb: 3 }}
          >
            {error || joinError}
          </Alert>
        )}

        {isJoining ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <CircularProgress size={40} sx={{ mb: 2 }} />
            <Typography variant="body1">
              Uniéndote a la sala como <strong>{
                isGuest
                  ? localStorage.getItem('guestName')
                  : currentUser?.displayName
              }</strong>...
            </Typography>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="body1" paragraph>
              Estás a punto de unirte a la sala con el nombre:
            </Typography>
            <Typography variant="h6" sx={{ mb: 3 }}>
              {isGuest
                ? localStorage.getItem('guestName')
                : currentUser?.displayName}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={joinRoom}
              disabled={isJoining}
              sx={{ minWidth: 200 }}
            >
              Unirse a la Sala
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
}