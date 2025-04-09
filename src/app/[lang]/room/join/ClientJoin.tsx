"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useRoomStore } from "@/store/roomStore";
import { useAuth } from "@/context/authContext";
import { getLocalizedRoute } from "@/utils/routeUtils";

export default function ClientJoin() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation('common');
  const roomCode = searchParams.get("code");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Obtener información del usuario autenticado
  const { currentUser } = useAuth();

  // Usar el store de Zustand
  const { joinRoomWithName, isLoading, error, setError } = useRoomStore();

  // Usar el nombre del usuario autenticado si está disponible
  useEffect(() => {
    if (currentUser?.displayName) {
      setName(currentUser.displayName);
    }
  }, [currentUser]);
  
  // Verificar si hay un nombre guardado en localStorage para usuarios invitados
  useEffect(() => {
    const guestName = localStorage.getItem('guestName');
    if (guestName && currentUser?.photoURL === 'guest_user') {
      setName(guestName);
    }
  }, [currentUser]);

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
                setError(t('clientJoin.roomClosed'));
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

    // Función para intentar unirse automáticamente
    const autoJoin = async () => {
      // Determinar el nombre a usar
      let userName = currentUser?.displayName || '';
      
      // Para usuarios invitados, intentar obtener el nombre del localStorage
      if (currentUser?.photoURL === 'guest_user') {
        const guestName = localStorage.getItem('guestName');
        if (guestName) {
          userName = guestName;
        }
      }
      
      if (userName && roomCode && !isSubmitting && !isLoading && !error) {
        setIsSubmitting(true);
        try {
          await joinRoomWithName(roomCode, userName);
          router.push(getLocalizedRoute(`/room/${roomCode}`));
        } catch (error) {
          console.error("Error al unirse automáticamente a la sala:", error);
          setIsSubmitting(false);
        }
      }
    };

    // Primero verificar si hay una sesión persistente, luego intentar unirse automáticamente
    const checkAndJoin = async () => {
      const hasPersistedSession = await checkPersistedSession();
      
      // Si no hay sesión persistente, intentar unirse automáticamente con el usuario autenticado o invitado
      if (!hasPersistedSession && currentUser) {
        // Para usuarios normales, verificar displayName
        // Para usuarios invitados, verificar si hay un nombre guardado en localStorage
        const isGuestWithName = currentUser.photoURL === 'guest_user' && localStorage.getItem('guestName');
        
        if (currentUser.displayName || isGuestWithName) {
          autoJoin();
        }
      }
    };

    checkAndJoin();
  }, [currentUser, roomCode, joinRoomWithName, router, isSubmitting, isLoading, error, setError]);

  const handleJoinRoom = async () => {
    if (!roomCode) {
      setError(t('clientJoin.invalidRoomCode'));
      return;
    }

    if (!name.trim()) {
      setError(t('clientJoin.enterName'));
      return;
    }

    setIsSubmitting(true);
    try {
      await joinRoomWithName(roomCode, name);
      router.push(getLocalizedRoute(`/room/${roomCode}`));
    } catch (error) {
      console.error("Error al unirse a la sala:", error);
      setIsSubmitting(false);
    }
  };

  // Si el usuario está autenticado y estamos intentando unirlo automáticamente
  const isGuestWithName = currentUser?.photoURL === 'guest_user' && localStorage.getItem('guestName');
  const isAutoJoining = (currentUser?.displayName || isGuestWithName) && isSubmitting;

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
      <Typography variant="h4" gutterBottom>
        {t('clientJoin.joinRoom')}
      </Typography>

      <Typography variant="h6" color="text.secondary">
        {t('clientJoin.roomCode')}<strong>{roomCode}</strong>
      </Typography>

      {error && (
        <Alert
          severity="error"
          onClose={() => setError(null)}
          sx={{ width: "100%", maxWidth: 400 }}
        >
          {error}
        </Alert>
      )}

      {isAutoJoining ? (
        <Box
          sx={{
            width: "100%",
            maxWidth: 400,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            p: 3,
            borderRadius: 2,
            boxShadow: 3,
            bgcolor: "background.paper",
          }}
        >
          <Typography variant="body1">
            {t('clientJoin.joiningAutomatically')} <strong>{
              currentUser.photoURL === 'guest_user'
                ? localStorage.getItem('guestName')
                : currentUser.displayName
            }</strong>...
          </Typography>
          <CircularProgress size={40} />
        </Box>
      ) : (
        <Box
          sx={{
            width: "100%",
            maxWidth: 400,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            p: 3,
            borderRadius: 2,
            boxShadow: 3,
            bgcolor: "background.paper",
          }}
        >
          <TextField
            label={t('clientJoin.yourName')}
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading || isSubmitting}
          />

          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleJoinRoom}
            disabled={isLoading || isSubmitting}
            sx={{ mt: 2 }}
          >
            {isLoading || isSubmitting ? (
              <CircularProgress size={24} />
            ) : (
              t('clientJoin.joinRoom')
            )}
          </Button>
        </Box>
      )}
    </Box>
  );
}
