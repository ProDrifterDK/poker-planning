"use client";

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  SelectChangeEvent,
  Stack,
  Tooltip,
  IconButton,
  useMediaQuery,
  useTheme
} from '@mui/material';
import TimerIcon from '@mui/icons-material/Timer';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { useRoomStore } from '@/store/roomStore';
import { UserRole } from '@/types/roles';

// Opciones de tiempo predefinidas (en segundos)
const TIME_OPTIONS = [
  { value: 30, label: '30s' },
  { value: 60, label: '1m' },
  { value: 120, label: '2m' },
  { value: 180, label: '3m' },
  { value: 300, label: '5m' },
  { value: 600, label: '10m' },
];

export default function VotingTimer() {
  const { t } = useTranslation('common');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const {
    participants,
    currentParticipantId,
    timerEnabled,
    timerDuration,
    timerStartedAt,
    setTimerEnabled,
    setTimerDuration,
    startTimer,
    stopTimer,
    resetTimer,
    revealEstimations
  } = useRoomStore();

  // Estado local para el tiempo restante
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  
  // Verificar si el usuario actual es moderador
  const currentParticipant = participants.find(p => p.id === currentParticipantId);
  const isModerator = currentParticipant?.role === UserRole.MODERATOR;

  // Estado para controlar si el temporizador ha expirado
  const [timerExpired, setTimerExpired] = useState(false);
  
  // Verificar si todos los participantes han votado
  const allParticipantsHaveVoted = participants
    .filter(p => p.active !== false) // Solo considerar participantes activos
    .every(p => p.estimation !== null && p.estimation !== undefined);
  
  // Verificar si hay al menos un voto
  const hasAnyVotes = participants
    .filter(p => p.active !== false)
    .some(p => p.estimation !== null && p.estimation !== undefined);

  // Efecto para sincronizar el estado local con el estado del store
  useEffect(() => {
  }, [timerEnabled, timerStartedAt, timerDuration]);

  // Efecto para actualizar el tiempo restante
  useEffect(() => {
    if (!timerEnabled || !timerStartedAt) {
      setTimeLeft(null);
      setTimerExpired(false);
      return;
    }

    // Calcular tiempo restante inicial
    const now = Date.now();
    const elapsed = now - timerStartedAt;
    const initialTimeLeft = Math.max(0, timerDuration * 1000 - elapsed);
    setTimeLeft(initialTimeLeft);
    
    // Si el temporizador ya está en 0, marcarlo como expirado
    if (initialTimeLeft === 0) {
      setTimerExpired(true);
    } else {
      setTimerExpired(false);
    }

    // Actualizar el tiempo restante cada segundo
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - timerStartedAt;
      const remaining = Math.max(0, timerDuration * 1000 - elapsed);
      
      setTimeLeft(remaining);
      
      // Si el tiempo ha terminado
      if (remaining === 0) {
        clearInterval(interval);
        setTimerExpired(true);
        
        // Solo revelar automáticamente si todos han votado y es moderador
        if (allParticipantsHaveVoted && isModerator) {
          revealEstimations();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timerEnabled, timerStartedAt, timerDuration, isModerator, revealEstimations, allParticipantsHaveVoted]);

  // Manejar cambio de duración del temporizador
  const handleDurationChange = (event: SelectChangeEvent<number>) => {
    const newDuration = Number(event.target.value);
    setTimerDuration(newDuration);
  };

  // Manejar activación/desactivación del temporizador
  const handleToggleTimer = () => {
    setTimerEnabled(!timerEnabled);
  };

  // Manejar inicio del temporizador
  const handleStartTimer = () => {
    startTimer();
  };

  // Manejar detención del temporizador
  const handleStopTimer = () => {
    stopTimer();
  };

  // Manejar reinicio del temporizador
  const handleResetTimer = () => {
    resetTimer();
  };

  // Formatear tiempo restante
  const formatTimeLeft = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Calcular porcentaje de tiempo restante para el CircularProgress
  const calculateProgress = () => {
    if (timeLeft === null) return 0;
    return (timeLeft / (timerDuration * 1000)) * 100;
  };

  // Nota: timerRemaining no se usa directamente porque calculamos el tiempo restante
  // basado en timerStartedAt y timerDuration para mayor precisión en tiempo real
  
  // Verificar si el temporizador debe mostrarse - siempre mostrar para todos los usuarios
  const shouldShowTimer = true; // Siempre mostrar el temporizador

  // Siempre renderizar el componente para todos los usuarios

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: isMobile ? 'center' : 'flex-start',
        gap: 1,
        p: 1,
        borderRadius: 1,
        bgcolor: 'background.paper',
        boxShadow: 1,
        width: 'auto',
        zIndex: 10,
        ...(isMobile ? {
          // Estilos para móvil - posicionamiento relativo en la parte superior
          position: 'relative',
          margin: '0 auto',
          marginBottom: 2,
          maxWidth: '95%',
        } : {
          // Estilos para desktop - posicionamiento absoluto
          position: 'absolute',
          top: 16,
          left: 16,
        })
      }}
    >
      {/* Controles para moderadores */}
      {isModerator && (
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          justifyContent={isMobile ? "center" : "flex-start"}
          sx={{ width: '100%' }}
        >
          {!timerStartedAt ? (
            <>
              <FormControl size="small" sx={{ minWidth: 70, width: 'auto' }}>
                <Select
                  value={timerDuration}
                  onChange={handleDurationChange}
                  displayEmpty
                  variant="outlined"
                  size="small"
                >
                  {TIME_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <Tooltip title={timerEnabled ? t('votingTimer.disableTimer') : t('votingTimer.enableTimer')}>
                <IconButton
                  size="small"
                  color={timerEnabled ? "error" : "primary"}
                  onClick={handleToggleTimer}
                >
                  <TimerIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              
              {timerEnabled && (
                <Tooltip title={t('votingTimer.startTimer')}>
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={handleStartTimer}
                  >
                    <PlayArrowIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </>
          ) : (
            <>
              <Tooltip title={t('votingTimer.stopTimer')}>
                <IconButton
                  size="small"
                  color="error"
                  onClick={handleStopTimer}
                >
                  <StopIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              
              <Tooltip title={t('votingTimer.restartTimer')}>
                <IconButton
                  size="small"
                  color="warning"
                  onClick={handleResetTimer}
                >
                  <RestartAltIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Stack>
      )}
      
      {/* Visualización minimalista del temporizador - visible para todos */}
      {shouldShowTimer && (
        <>
          <Box sx={{
            position: 'relative',
            display: 'inline-flex',
            margin: isMobile ? '8px auto' : 0
          }}>
            <CircularProgress
              variant="determinate"
              value={calculateProgress()}
              size={40}
              thickness={4}
              color={timerExpired ? "error" : (timeLeft && timeLeft < 10000 ? "warning" : "primary")}
              sx={{
                opacity: timerExpired ? 0.8 : 1,
                animation: timerExpired ? 'pulse 1.5s infinite' : 'none',
                '@keyframes pulse': {
                  '0%': { opacity: 0.6 },
                  '50%': { opacity: 1 },
                  '100%': { opacity: 0.6 },
                }
              }}
            />
            <Box
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography
                variant="caption"
                component="div"
                color="text.primary"
                fontWeight="bold"
                fontSize="0.7rem"
              >
                {timeLeft !== null ? formatTimeLeft(timeLeft) : formatTimeLeft(timerDuration * 1000)}
              </Typography>
            </Box>
          </Box>
          
          {/* Mensaje cuando el temporizador ha expirado pero no todos han votado - visible para todos */}
          {timerExpired && !allParticipantsHaveVoted && (
            <Box sx={{
              ml: isMobile ? 0 : 1,
              mt: isMobile ? 1 : 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: isMobile ? 'center' : 'flex-start',
              width: isMobile ? '100%' : 'auto'
            }}>
              <Typography
                variant="caption"
                color="error"
                sx={{ fontSize: '0.7rem', fontWeight: 'bold' }}
              >
                {!hasAnyVotes ? t('votingTimer.noVotes') : t('votingTimer.votesNeeded')}
              </Typography>
              
              {/* Botón de reinicio solo visible para moderadores */}
              {isModerator && (
                <Tooltip title={t('votingTimer.restartTimer')}>
                  <IconButton
                    size="small"
                    color="warning"
                    onClick={handleResetTimer}
                    sx={{ ml: 0.5 }}
                  >
                    <RestartAltIcon sx={{ fontSize: '0.9rem' }} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          )}
        </>
      )}
    </Box>
  );
}