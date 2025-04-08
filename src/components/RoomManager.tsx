"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Divider,
  Tooltip,
} from "@mui/material";
import { useRoomStore } from "@/store/roomStore";
import { useSubscriptionStore } from "@/store/subscriptionStore";
import { useErrorStore, ErrorType, createError } from "@/store/errorStore";
import { SUBSCRIPTION_PLANS, SubscriptionPlan } from "@/types/subscription";
import { getPlanLookupKey } from "@/utils/planUtils";
import { OnboardingButton } from "./Onboarding";
import SessionPersistence from "./SessionPersistence";
import SubscriptionLimits from "./subscription/SubscriptionLimits";
import ActiveRoomsList from "./ActiveRoomsList";
import { useAuth } from "@/context/authContext";
import { useTranslation } from "react-i18next";

// Lista de idiomas soportados
const supportedLocales = ['es', 'en'];

// Función auxiliar para obtener la ruta con el idioma
const getLocalizedRoute = (route: string): string => {
  // Intentar obtener el idioma de i18next primero (cliente)
  let lang = 'es'; // Valor por defecto
  
  if (typeof window !== 'undefined') {
    // Estamos en el cliente, podemos acceder a i18next
    const i18nLang = window.localStorage.getItem('i18nextLng');
    
    if (i18nLang && supportedLocales.includes(i18nLang)) {
      lang = i18nLang;
    } else {
      // Fallback a la URL si no hay idioma en i18next
      const urlLang = window.location.pathname.split('/')[1];
      if (supportedLocales.includes(urlLang)) {
        lang = urlLang;
      }
    }
  }
  
  return `/${lang}${route}`;
};

export default function RoomManager() {
  const router = useRouter();
  const { t } = useTranslation(['room', 'common']);
  const [roomCode, setRoomCode] = useState("");
  const [name, setName] = useState("");
  const [roomTitle, setRoomTitle] = useState("");
  const [selectedSeries, setSelectedSeries] = useState("fibonacci");

  // Usar los stores de Zustand
  const { createRoom, joinRoomWithName, isLoading } = useRoomStore();
  const subscriptionStore = useSubscriptionStore();
  const currentPlan = subscriptionStore.getCurrentPlan();
  const canCreateRoom = subscriptionStore.canUserCreateRoom();

  // Usar el store de errores
  const errorStore = useErrorStore.getState();

  // Obtener el usuario autenticado
  const { currentUser } = useAuth();

  // Usar el nombre del usuario autenticado si está disponible
  useEffect(() => {
    if (currentUser && currentUser.displayName) {
      setName(currentUser.displayName);
    }
  }, [currentUser]);

  const handleCreateRoom = async () => {
    if (!name.trim()) {
      errorStore.setError(createError(
        ErrorType.VALIDATION_ERROR,
        t('join.nameRequired')
      ));
      return;
    }

    // Verificar si el usuario puede crear más salas según su plan
    const canCreate = subscriptionStore.canUserCreateRoom();
    if (!canCreate) {
      // Obtener el plan actual y el límite de salas
      const currentPlan = subscriptionStore.getCurrentPlan();
      const planLookupKey = getPlanLookupKey(currentPlan);
      const maxRooms = SUBSCRIPTION_PLANS[planLookupKey].features.maxActiveRooms;
      
      // Para usuarios Free, mostrar un mensaje específico indicando que deben abandonar su sala actual
      if (currentPlan === SubscriptionPlan.FREE) {
        errorStore.setError(createError(
          ErrorType.SUBSCRIPTION_LIMIT_REACHED,
          `${t('activeRooms.freePlanLimit', 'Los usuarios del plan Free solo pueden tener una sala activa a la vez. Por favor, abandona tu sala actual antes de crear una nueva.')}`
        ));
      } else {
        errorStore.setError(createError(
          ErrorType.SUBSCRIPTION_LIMIT_REACHED,
          `${t('activeRooms.planLimit', 'Has alcanzado el límite de {{maxRooms}} {{roomText}} de tu plan. Actualiza tu suscripción para crear más salas.', {
            maxRooms,
            roomText: maxRooms === 1 ? t('activeRooms.singleRoom', 'sala activa') : t('activeRooms.multipleRooms', 'salas activas')
          })}`
        ));
      }
      return;
    }

    try {
      const roomId = await createRoom(selectedSeries, roomTitle.trim() || undefined);
      // Después de crear la sala, unirse a ella con el nombre
      await joinRoomWithName(roomId, name);
      router.push(getLocalizedRoute(`/room/${roomId}`));
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // Los errores ya son manejados por el store
      // No registramos el error en la consola por razones de seguridad
    }
  };

  const handleJoinRoom = async () => {
    if (!roomCode.trim()) {
      errorStore.setError(createError(
        ErrorType.VALIDATION_ERROR,
        t('join.invalidCode')
      ));
      return;
    }

    // Redirigir a la página de unión con el código de sala
    router.push(getLocalizedRoute(`/room/join?code=${roomCode.trim()}`));
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      padding={2}
      gap={4}
    >
      <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
        <Typography variant="h3" marginBottom={1}>
          {t('common:appName')}
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <OnboardingButton variant="text" />
          <Divider orientation="vertical" flexItem />
          <Typography variant="body2" color="text.secondary">
            {t('tutorial', '¿Primera vez? Prueba nuestro tutorial interactivo')}
          </Typography>
        </Box>
      </Box>

      {/* Componente de persistencia de sesión */}
      <SessionPersistence />
      
      {/* Lista de salas activas (solo para usuarios Pro y Enterprise) */}
      <ActiveRoomsList />

      {/* Sección para CREAR SALA */}
      <Box
        data-onboarding="create-room"
        sx={{
          p: 4,
          width: "100%",
          maxWidth: 500,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          boxShadow: 3,
          borderRadius: 2,
          bgcolor: "background.paper",
        }}
      >
        <Typography variant="h5" textAlign="center">
          {t('create.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('createRoomDescription', 'Crea una nueva sala y comparte el código con tu equipo para comenzar a estimar.')}
        </Typography>

        <TextField
          label={t('join.yourName')}
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={!!(currentUser && currentUser.displayName)}
          helperText={currentUser && currentUser.displayName ? t('usingProfileName', 'Usando tu nombre de perfil') : ""}
        />
        
        <TextField
          label={t('roomTitle', 'Título de la sala (opcional)')}
          fullWidth
          value={roomTitle}
          onChange={(e) => setRoomTitle(e.target.value)}
          placeholder={t('roomTitlePlaceholder', 'Ej: Sprint 5 - Poker Planning Project')}
          helperText={t('roomTitleHelp', 'Un nombre descriptivo para identificar la sala')}
        />

        <FormControl fullWidth>
          <InputLabel id="series-label">{t('seriesType', 'Tipo de Serie')}</InputLabel>
          <Select
            labelId="series-label"
            value={selectedSeries}
            label={t('seriesType', 'Tipo de Serie')}
            onChange={(e) => setSelectedSeries(e.target.value)}
          >
            <MenuItem value="fibonacci">{t('create.fibonacci')}</MenuItem>
            <MenuItem value="tshirt">{t('create.tShirt')}</MenuItem>
            <MenuItem value="powers2">{t('powers2', 'Poderes de 2')}</MenuItem>
            <MenuItem value="days">{t('activeRooms.days')}</MenuItem>
          </Select>
        </FormControl>

        <Tooltip
          title={
            !canCreateRoom && currentPlan === SubscriptionPlan.FREE
              ? t('activeRooms.freePlanLimit', 'Los usuarios del plan Free solo pueden tener una sala activa a la vez. Por favor, abandona tu sala actual antes de crear una nueva.')
              : ""
          }
          placement="top"
          disableHoverListener={canCreateRoom}
        >
          <span>
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreateRoom}
              disabled={isLoading || !canCreateRoom}
              sx={{
                textTransform: "none",
                transition: "transform 0.2s ease",
                "&:hover": {
                  transform: canCreateRoom ? "translateY(-2px) scale(1.02)" : "none",
                },
              }}
            >
              {isLoading ? <CircularProgress size={24} /> : t('create.submit')}
            </Button>
          </span>
        </Tooltip>
      </Box>

      {/* Sección para UNIRSE A SALA */}
      <Box
        data-onboarding="join-room"
        sx={{
          p: 4,
          width: "100%",
          maxWidth: 500,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          boxShadow: 3,
          borderRadius: 2,
          bgcolor: "background.paper",
        }}
      >
        <Typography variant="h5" textAlign="center">
          {t('join.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('joinRoomDescription', 'Ingresa el código de sala que te compartieron para unirte a la sesión de estimación.')}
        </Typography>

        <TextField
          label={t('join.roomCode')}
          fullWidth
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
        />

        <Button
          variant="outlined"
          color="secondary"
          onClick={handleJoinRoom}
          disabled={isLoading}
          fullWidth
          sx={{
            textTransform: "none",
            transition: "transform 0.2s ease",
            "&:hover": {
              transform: "translateY(-2px) scale(1.02)",
            },
          }}
        >
          {isLoading ? <CircularProgress size={24} /> : t('join.submit')}
        </Button>
      </Box>
      
      {/* Mostrar límites de suscripción en una posición menos prominente */}
      <Box sx={{ mt: 4, opacity: 0.85 }}>
        <SubscriptionLimits />
      </Box>
    </Box>
  );
}
