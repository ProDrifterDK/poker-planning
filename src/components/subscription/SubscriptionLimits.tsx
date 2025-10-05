"use client";

import React from 'react';
import { Box, Typography, Button, useTheme, Chip } from '@mui/material';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { SUBSCRIPTION_PLANS, SubscriptionPlan } from '@/types/subscription';
import { getPlanLookupKey } from '@/utils/planUtils';
import { getLocalizedRoute } from '@/utils/routeUtils';

import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';

const PlanIcon: React.FC<{ plan: SubscriptionPlan }> = ({ plan }) => {
  switch (plan) {
    case SubscriptionPlan.PRO:
      return <WorkspacePremiumIcon color="primary" />;
    case SubscriptionPlan.ENTERPRISE:
      return <BusinessCenterIcon color="secondary" />;
    default:
      return <StarBorderIcon color="action" />;
  }
};

export default function SubscriptionLimits() {
  const theme = useTheme();
  const { getCurrentPlan } = useSubscriptionStore();
  const { t } = useTranslation('common');
  
  const currentPlan = getCurrentPlan();
  const planLookupKey = getPlanLookupKey(currentPlan);
  const planDetails = SUBSCRIPTION_PLANS[planLookupKey];
  
  const maxActiveRooms = planDetails.features.maxActiveRooms;
  const maxParticipants = planDetails.features.maxParticipants;
  
  return (
    <Box
      sx={{
        p: 2,
        mt: 2,
        borderRadius: 2,
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
        border: '1px solid',
        borderColor: 'divider',
        width: '100%',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <PlanIcon plan={currentPlan} />
        <Typography variant="h6" sx={{ ml: 1.5, flexGrow: 1 }}>
          {planDetails.name} {t('subscription.plan', 'Plan')}
        </Typography>
        {currentPlan !== SubscriptionPlan.ENTERPRISE && (
          <Link href={getLocalizedRoute('/settings/subscription')} passHref>
            <Button
              variant="contained"
              size="small"
              color="primary"
              sx={{ textTransform: 'none', fontWeight: 'bold' }}
            >
              {t('subscription.upgrade', 'Upgrade')}
            </Button>
          </Link>
        )}
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', gap: 2 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
            <MeetingRoomIcon sx={{ fontSize: '1rem' }} />
            {t('subscription.rooms', 'Rooms')}
          </Typography>
          <Chip label={maxActiveRooms} size="small" variant="outlined" sx={{ mt: 0.5, fontWeight: 'bold' }} />
        </Box>
        
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
            <PeopleOutlineIcon sx={{ fontSize: '1rem' }} />
            {t('subscription.participants', 'Participants')}
          </Typography>
          <Chip label={maxParticipants} size="small" variant="outlined" sx={{ mt: 0.5, fontWeight: 'bold' }} />
        </Box>
      </Box>
    </Box>
  );
}