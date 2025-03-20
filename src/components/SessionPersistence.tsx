"use client";

import React, { useEffect, useState } from 'react';
import { Box, Button, Typography, Paper, Chip, Divider } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useRoomStore } from '@/store/roomStore';
import { ref, update, get as firebaseGet } from 'firebase/database';
import { realtimeDb } from '@/lib/firebaseConfig';

/**
 * Componente que muestra información sobre sesiones persistentes
 * y permite al usuario volver a una sesión anterior
 */
export default function SessionPersistence() {
  const router = useRouter();
  const [hasSession, setHasSession] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [seriesName, setSeriesName] = useState<string>('');
  const [participantId, setParticipantId] = useState<string | null>(null);

  // Obtener la función leaveRoom del store
  const leaveRoom = useRoomStore(state => state.leaveRoom);

  // Mapeo de claves de series a nombres legibles
  const seriesNames: Record<string, string> = {
    fibonacci: 'Fibonacci',
    tshirt: 'Tallas de Camiseta',
    powers2: 'Potencias de 2',
    days: 'Días',
  };

  // Verificar si hay una sesión persistente al cargar el componente
  useEffect(() => {
    // Verificar si estamos en el cliente
    if (typeof window === 'undefined') return;

    const checkSession = async () => {
      try {
        // Intentar obtener datos de la sesión desde localStorage
        const storageData = localStorage.getItem('poker-planning-storage');
        
        if (storageData) {
          const sessionData = JSON.parse(storageData);
          const state = sessionData.state;
          
          if (state && state.roomId) {
            // Verificar si la sala sigue activa en Firebase
            try {
              const roomRef = ref(realtimeDb, `rooms/${state.roomId}/metadata`);
              const roomSnapshot = await firebaseGet(roomRef);
              
              // Si la sala no existe o está marcada para eliminación, limpiar la sesión
              if (!roomSnapshot.exists() ||
                  roomSnapshot.val().markedForDeletion === true ||
                  roomSnapshot.val().active === false) {
                console.log(`La sala ${state.roomId} ya no está disponible. Limpiando sesión.`);
                localStorage.removeItem('poker-planning-storage');
                return;
              }
            } catch (fbError) {
              console.error('Error al verificar estado de la sala:', fbError);
              // En caso de error, asumimos que la sala sigue activa
            }
            
            setHasSession(true);
            setRoomId(state.roomId);
            
            // Guardar el ID del participante
            if (state.currentParticipantId) {
              setParticipantId(state.currentParticipantId);
            }
            
            // Establecer el nombre de la serie
            if (state.seriesKey && seriesNames[state.seriesKey]) {
              setSeriesName(seriesNames[state.seriesKey]);
            } else {
              setSeriesName('Personalizada');
            }
          }
        }
      } catch (error) {
        console.error('Error al verificar sesión persistente:', error);
      }
    };
    
    checkSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Si no hay sesión persistente, no mostrar nada
  if (!hasSession || !roomId) {
    return null;
  }

  // Función para volver a la sala
  const returnToRoom = () => {
    router.push(`/room/${roomId}`);
  };

  // Función para limpiar la sesión persistente y marcar al participante como inactivo
  const clearSession = async () => {
    try {
      // Si tenemos el ID del participante y de la sala, marcar al participante como inactivo
      if (roomId && participantId) {
        try {
          // Usar la función leaveRoom del store si está disponible
          // Esta función ya verifica si es el último participante y marca la sala para eliminación
          await leaveRoom();
        } catch (error) {
          console.error('Error al usar leaveRoom del store:', error);
          
          // Como fallback, intentar actualizar directamente en Firebase
          try {
            // 1. Marcar al participante como inactivo
            const participantRef = ref(realtimeDb, `rooms/${roomId}/participants/${participantId}`);
            await update(participantRef, {
              active: false,
              lastActive: Date.now(),
              estimation: null
            });
            console.log(`Participante ${participantId} marcado como inactivo desde SessionPersistence`);
            
            // 2. Verificar si hay otros participantes activos
            try {
              const participantsRef = ref(realtimeDb, `rooms/${roomId}/participants`);
              const participantsSnapshot = await firebaseGet(participantsRef);
              
              if (participantsSnapshot.exists()) {
                const participantsData = participantsSnapshot.val();
                const activeParticipants = Object.entries(participantsData)
                  .filter(([id, data]) => {
                    const participant = data as { active?: boolean };
                    return participant.active !== false && id !== participantId;
                  });
                
                // Si no quedan participantes activos, marcar la sala para eliminación
                if (activeParticipants.length === 0) {
                  console.log(`No quedan participantes activos en la sala ${roomId}. Marcando para eliminación.`);
                  
                  const roomRef = ref(realtimeDb, `rooms/${roomId}/metadata`);
                  await update(roomRef, {
                    active: false,
                    lastActive: Date.now(),
                    markedForDeletion: true
                  });
                }
              }
            } catch (checkError) {
              console.error('Error al verificar participantes activos:', checkError);
            }
          } catch (fbError) {
            console.error('Error al marcar participante como inactivo en Firebase:', fbError);
          }
        }
      }

      // Limpiar localStorage
      localStorage.removeItem('poker-planning-storage');
      setHasSession(false);
      setRoomId(null);
      setParticipantId(null);
    } catch (error) {
      console.error('Error al limpiar sesión persistente:', error);
    }
  };

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 3, 
        mb: 4, 
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'primary.light',
        backgroundColor: 'background.paper',
      }}
    >
      <Typography variant="h6" gutterBottom color="primary">
        Sesión Activa
      </Typography>
      
      <Divider sx={{ mb: 2 }} />
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="body1" gutterBottom>
          Tienes una sesión activa en la sala:
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Typography variant="body1" fontWeight="bold">
            {roomId}
          </Typography>
          <Chip 
            label={seriesName} 
            size="small" 
            color="primary" 
            variant="outlined" 
          />
        </Box>
        
        <Typography variant="body2" color="text.secondary">
          Puedes volver a esta sala o iniciar una nueva sesión.
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={returnToRoom}
        >
          Volver a la Sala
        </Button>
        
        <Button 
          variant="outlined" 
          color="secondary" 
          onClick={clearSession}
        >
          Olvidar Sesión
        </Button>
      </Box>
    </Paper>
  );
}