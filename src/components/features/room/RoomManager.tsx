"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Typography, Divider, Container } from "@mui/material";
import { useRoomStore } from "@/store/roomStore";
import { useSubscriptionStore } from "@/store/subscriptionStore";
import { useErrorStore, ErrorType, createError } from "@/store/errorStore";
import { getPlanLookupKey } from "@/utils/planUtils";
import { SUBSCRIPTION_PLANS, SubscriptionPlan } from "@/types/subscription";
import { useTranslation } from "react-i18next";
import SessionPersistence from "./SessionPersistence";
import SubscriptionLimits from "../../subscription/SubscriptionLimits";
import ActiveRoomsList from "./ActiveRoomsList";
import SplitScreenLayout from '../../core/SplitScreenLayout';
import JoinRoomPanel from './JoinRoomPanel';
import CreateRoomPanel from './CreateRoomPanel';
import { OnboardingButton } from "../../Onboarding";
import { useAuth } from "@/context/authContext";
import { getLocalizedRoute } from "@/utils/routeUtils";

export default function RoomManager() {
  const router = useRouter();
  const { t } = useTranslation(['room', 'common']);
  const { createRoom, joinRoomWithName, isLoading } = useRoomStore();
  const subscriptionStore = useSubscriptionStore();
  const errorStore = useErrorStore.getState();
  const { currentUser } = useAuth();
  
  const [name, setName] = useState(currentUser?.displayName || '');
  
  const currentPlan = subscriptionStore.getCurrentPlan();
  const canCreateRoom = subscriptionStore.canUserCreateRoom();

  const handleCreateRoom = async (roomTitle: string, selectedSeries: string) => {
    if (!name.trim()) {
      errorStore.setError(createError(ErrorType.VALIDATION_ERROR, t('join.nameRequired')));
      return;
    }

    if (!canCreateRoom) {
      const planLookupKey = getPlanLookupKey(currentPlan);
      const maxRooms = SUBSCRIPTION_PLANS[planLookupKey].features.maxActiveRooms;
      
      if (currentPlan === SubscriptionPlan.FREE) {
        errorStore.setError(createError(
          ErrorType.SUBSCRIPTION_LIMIT_REACHED,
          t('activeRooms.freePlanLimit', 'Los usuarios del plan Free solo pueden tener una sala activa a la vez. Por favor, abandona tu sala actual antes de crear una nueva.')
        ));
      } else {
        errorStore.setError(createError(
          ErrorType.SUBSCRIPTION_LIMIT_REACHED,
          t('activeRooms.planLimit', 'Has alcanzado el límite de {{maxRooms}} {{roomText}} de tu plan. Actualiza tu suscripción para crear más salas.', {
            maxRooms,
            roomText: maxRooms === 1 ? t('activeRooms.singleRoom', 'sala activa') : t('activeRooms.multipleRooms', 'salas activas')
          })
        ));
      }
      return;
    }

    try {
      const roomId = await createRoom(selectedSeries, roomTitle.trim() || undefined);
      await joinRoomWithName(roomId, name);
      router.push(getLocalizedRoute(`/room/${roomId}`));
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };

  const handleJoinRoom = (roomCode: string) => {
    if (!roomCode.trim()) {
      errorStore.setError(createError(ErrorType.VALIDATION_ERROR, t('join.invalidCode')));
      return;
    }
    router.push(getLocalizedRoute(`/room/join?code=${roomCode.trim()}`));
  };

  return (
    <Box>
      <SessionPersistence />
      <Box display="flex" flexDirection="column" alignItems="center" gap={2} sx={{ my: 4 }}>
        <Typography variant="h3" component="h1">
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
      
      <SplitScreenLayout 
        leftPanel={<JoinRoomPanel onJoinRoom={handleJoinRoom} isLoading={isLoading} name={name} onNameChange={setName} />}
        rightPanel={
          <CreateRoomPanel
            onCreateRoom={handleCreateRoom}
            isLoading={isLoading}
            canCreateRoom={canCreateRoom}
            currentPlan={currentPlan}
            name={name}
            onNameChange={setName}
          />
        } 
      />

      <Container maxWidth="sm" sx={{ my: 4 }}>
        <ActiveRoomsList />
      </Container>
      
      <Container maxWidth="xs" sx={{ mb: 4 }}>
        <SubscriptionLimits />
      </Container>
    </Box>
  );
}
