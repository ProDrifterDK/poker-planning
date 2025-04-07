"use client";

import React from 'react';
import { Box, Typography, LinearProgress, Button, Tooltip } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { SUBSCRIPTION_PLANS, SubscriptionPlan } from '@/types/subscription';
import { getPlanLookupKey } from '@/utils/planUtils';
import Link from 'next/link';

/**
 * Component to display the current subscription limits
 */
export default function SubscriptionLimits() {
  const { currentSubscription, getCurrentPlan } = useSubscriptionStore();
  
  // Get the current plan
  const currentPlan = getCurrentPlan();
  
  // Get the plan details
  const planLookupKey = getPlanLookupKey(currentPlan);
  const planDetails = SUBSCRIPTION_PLANS[planLookupKey];
  
  // Get the limits
  const maxActiveRooms = planDetails.features.maxActiveRooms;
  const maxParticipants = planDetails.features.maxParticipants;
  
  // Get the current usage (this would need to be implemented in the subscription store)
  // For now, we'll just show the limits
  
  return (
    <Box
      sx={{
        p: 1.5,
        border: '1px dashed',
        borderColor: 'divider',
        borderRadius: 1,
        bgcolor: 'background.paper',
        mb: 2,
        width: '100%',
        maxWidth: 500,
        opacity: 0.9,
        '&:hover': {
          opacity: 1,
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        },
        transition: 'opacity 0.2s, box-shadow 0.2s'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', marginRight: '15px' }}>
            Plan
          </Typography>
          <Typography variant="subtitle2" fontWeight="medium">
            {planDetails.name}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Tooltip title="Número máximo de salas activas">
              <Typography variant="caption" color="text.secondary" display="block">
                Salas
              </Typography>
            </Tooltip>
            <Typography variant="body2" fontWeight="medium">
              {maxActiveRooms}
            </Typography>
          </Box>
          
          <Box sx={{ textAlign: 'center', mx: 1 }}>
            <Tooltip title="Número máximo de participantes por sala">
              <Typography variant="caption" color="text.secondary" display="block">
                Participantes
              </Typography>
            </Tooltip>
            <Typography variant="body2" fontWeight="medium">
              {maxParticipants}
            </Typography>
          </Box>
          
          {currentPlan !== SubscriptionPlan.ENTERPRISE && (
            <Link href="/settings/subscription" passHref>
              <Button
                variant="text"
                size="small"
                color="primary"
                sx={{ textTransform: 'none', minWidth: 'auto', p: 0.5 }}
              >
                Mejorar
              </Button>
            </Link>
          )}
        </Box>
      </Box>
      
      {/* Removed promotional messages to make the component more minimalist */}
    </Box>
  );
}