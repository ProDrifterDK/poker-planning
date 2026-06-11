"use client";

import React from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  Chip,
  Link as MuiLink,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import UpgradeIcon from '@mui/icons-material/Upgrade';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import PeopleIcon from '@mui/icons-material/People';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { SubscriptionPlan, SUBSCRIPTION_PLANS, BillingInterval } from '@/types/subscription';
import { getCheckoutTranslations } from '@/types/checkoutTranslations';
import { getLocalizedRoute } from '@/utils/routeUtils';

export type UpgradePromptType = 'room-limit' | 'participant-limit' | null;

interface UpgradePromptProps {
  type: UpgradePromptType;
  open: boolean;
  onClose: () => void;
  lang?: string;
}

export default function UpgradePrompt({
  type,
  open,
  onClose,
  lang = 'en',
}: UpgradePromptProps) {
  const theme = useTheme();
  const t = getCheckoutTranslations(lang);
  const { getCurrentPlan, getMaxActiveRooms, getMaxParticipants } = useSubscriptionStore();

  const currentPlan = getCurrentPlan();
  const maxRooms = getMaxActiveRooms();
  const maxParticipants = getMaxParticipants();

  if (!type) return null;

  const isRoomLimit = type === 'room-limit';
  const icon = isRoomLimit ? <MeetingRoomIcon sx={{ fontSize: 48 }} /> : <PeopleIcon sx={{ fontSize: 48 }} />;
  const title = isRoomLimit ? t.upgrade.roomLimit : t.upgrade.participantLimit;
  const message = isRoomLimit ? t.upgrade.roomLimitMessage : t.upgrade.participantLimitMessage;
  const currentLimit = isRoomLimit ? maxRooms : maxParticipants;

  // Next plan info
  const nextPlan = currentPlan === SubscriptionPlan.FREE ? SubscriptionPlan.PRO : SubscriptionPlan.ENTERPRISE;
  const nextPlanKey = `${nextPlan}-${BillingInterval.MONTH}`;
  const nextPlanDetails = SUBSCRIPTION_PLANS[nextPlanKey];
  const nextLimit = isRoomLimit
    ? nextPlanDetails?.features.maxActiveRooms ?? 0
    : nextPlanDetails?.features.maxParticipants ?? 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          <Box sx={{ color: 'warning.main' }}>{icon}</Box>
          <Typography variant="h6" fontWeight="bold">
            {title}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary" paragraph>
          {message}
        </Typography>

        {/* Current vs Next plan comparison */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: 3,
            my: 3,
            p: 2,
            borderRadius: 2,
            bgcolor: 'action.hover',
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              {lang === 'es' ? 'Plan actual' : 'Current Plan'}
            </Typography>
            <Typography variant="body2" fontWeight="bold" sx={{ textTransform: 'capitalize' }}>
              {currentPlan}
            </Typography>
            <Chip label={`${currentLimit}`} size="small" variant="outlined" sx={{ mt: 0.5 }} />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <UpgradeIcon color="primary" />
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Chip
              label={t.comparison.mostPopular}
              size="small"
              color="primary"
              sx={{ mb: 0.5, height: 18, fontSize: '0.6rem' }}
            />
            <Typography variant="body2" fontWeight="bold">
              {nextPlanDetails?.name ?? nextPlan}
            </Typography>
            <Chip label={`${nextLimit}`} size="small" color="success" variant="outlined" sx={{ mt: 0.5 }} />
          </Box>
        </Box>

        {nextPlanDetails && (
          <Typography variant="body2" color="text.secondary">
            ${nextPlanDetails.price}
            {lang === 'es' ? '/mes' : '/month'}
            {' — '}
            {isRoomLimit
              ? (lang === 'es' ? `${nextPlanDetails.features.maxActiveRooms} salas activas` : `${nextPlanDetails.features.maxActiveRooms} active rooms`)
              : (lang === 'es' ? `${nextPlanDetails.features.maxParticipants} participantes` : `${nextPlanDetails.features.maxParticipants} participants`)}
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'center', px: 3, pb: 3, gap: 1 }}>
        <Button
          variant="contained"
          href={getLocalizedRoute('/settings/subscription')}
          startIcon={<UpgradeIcon />}
          sx={{ textTransform: 'none', fontWeight: 'bold' }}
        >
          {t.upgrade.upgradeNow}
        </Button>
        <Button
          variant="text"
          onClick={onClose}
          sx={{ textTransform: 'none' }}
        >
          {lang === 'es' ? 'Quizás más tarde' : 'Maybe later'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/**
 * Inline upgrade banner (non-modal) for embedding in views
 */
export function UpgradeBanner({
  type,
  lang = 'en',
}: {
  type: UpgradePromptType;
  lang?: string;
}) {
  const t = getCheckoutTranslations(lang);

  if (!type) return null;

  const isRoomLimit = type === 'room-limit';
  const title = isRoomLimit ? t.upgrade.roomLimit : t.upgrade.participantLimit;
  const message = isRoomLimit ? t.upgrade.roomLimitMessage : t.upgrade.participantLimitMessage;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 2,
        borderRadius: 2,
        bgcolor: 'warning.light',
        color: 'warning.contrastText',
        border: '1px solid',
        borderColor: 'warning.main',
      }}
    >
      <LockIcon />
      <Box sx={{ flex: 1 }}>
        <Typography variant="body2" fontWeight="bold">{title}</Typography>
        <Typography variant="caption">{message}</Typography>
      </Box>
      <Button
        variant="contained"
        size="small"
        href={getLocalizedRoute('/settings/subscription')}
        sx={{ textTransform: 'none', whiteSpace: 'nowrap' }}
      >
        {t.upgrade.upgradeNow}
      </Button>
    </Box>
  );
}
