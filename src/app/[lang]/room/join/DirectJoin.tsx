"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
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
import { getLocalizedRoute } from "@/utils/routeUtils";
import Link from "next/link";

export default function DirectJoin() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation('common');
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
                setJoinError(t('directJoin.roomClosed'));
                return false;
              }
              
              // Si la sala sigue activa, redirigir automáticamente
              router.push(getLocalizedRoute(`/room/${roomCode}`));
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
      setJoinError(t('directJoin.invalidRoomCode'));
      return;
    }

    if (!currentUser) {
      setJoinError(t('directJoin.mustSignIn'));
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
      setJoinError(t('directJoin.nameNotDetermined'));
      return;
    }

    // Verificar si la sala puede aceptar más participantes
    try {
      const canJoin = await subscriptionStore.canRoomAddParticipant(roomCode);
      if (!canJoin) {
        setJoinError(t('directJoin.roomLimitReached'));
        return;
      }

      setIsJoining(true);
      const photoURL = currentUser?.photoURL && currentUser.photoURL !== 'guest_user' ? currentUser.photoURL : undefined;
      await joinRoomWithName(roomCode, userName, photoURL);
      router.push(getLocalizedRoute(`/room/${roomCode}`));
    } catch (error) {
      console.error("Error al unirse a la sala:", error);
      setIsJoining(false);
      setJoinError(error instanceof Error ? error.message : t('directJoin.errorJoiningRoom'));
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
            {t('directJoin.errorJoiningRoom')}
          </Typography>
          <Typography variant="body1" paragraph>
            {t('directJoin.noValidRoomCode')}
          </Typography>
          <Link href={`/${params.lang}`} passHref>
            <Button variant="contained" color="primary">
              {t('directJoin.backToHome')}
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
          {t('directJoin.joinRoom')}
        </Typography>

        <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
          {t('directJoin.roomCode')}<strong>{roomCode}</strong>
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
              {t('directJoin.joiningAs')} <strong>{
                isGuest
                  ? localStorage.getItem('guestName')
                  : currentUser?.displayName
              }</strong>...
            </Typography>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="body1" paragraph>
              {t('directJoin.aboutToJoin')}
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
              {t('directJoin.joinRoom')}
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
}