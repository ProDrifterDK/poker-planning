"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Typography, Divider, Container } from "@mui/material";
import { useRoomStore } from "@/store/roomStore";
import { useSubscriptionStore } from "@/store/subscriptionStore";
import { useErrorStore, ErrorType, createError } from "@/store/errorStore";
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

    // Backend 409 ROOM_LIMIT_REACHED is the sole admission authority;
    // local subscription state is a non-authoritative hint only.
    try {
      const roomId = await createRoom(selectedSeries, roomTitle.trim() || undefined);
      const photoURL = currentUser?.photoURL && currentUser.photoURL !== 'guest_user' ? currentUser.photoURL : undefined;
      await joinRoomWithName(roomId, name, photoURL);
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
