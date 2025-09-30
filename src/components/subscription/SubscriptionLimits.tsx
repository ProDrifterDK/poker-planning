"use client";

import React from 'react';
import { Box, Typography, LinearProgress, Button, Tooltip, useTheme } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { SUBSCRIPTION_PLANS, SubscriptionPlan } from '@/types/subscription';
import { getPlanLookupKey } from '@/utils/planUtils';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

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

/**
 * Component to display the current subscription limits
 */
export default function SubscriptionLimits() {
  const theme = useTheme();
  const { currentSubscription, getCurrentPlan } = useSubscriptionStore();
  const { t } = useTranslation('common');
  
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
        border: `1px dashed ${theme.palette.divider}`,
        borderColor: 'divider',
        borderRadius: theme.shape.borderRadius,
        bgcolor: 'background.paper',
        mb: 2,
        width: '100%',
        maxWidth: 500,
        opacity: 0.9,
        '&:hover': {
          opacity: 1,
          boxShadow: theme.shadows[1]
        },
        transition: 'opacity 0.2s, box-shadow 0.2s'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', marginRight: '15px' }}>
            {t('subscription.plan', 'Plan')}
          </Typography>
          <Typography variant="subtitle2" fontWeight="medium">
            {planDetails.name}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Tooltip title={t('subscription.maxRoomsTooltip', 'Maximum number of active rooms')}>
              <Typography variant="caption" color="text.secondary" display="block">
                {t('subscription.rooms', 'Rooms')}
              </Typography>
            </Tooltip>
            <Typography variant="body2" fontWeight="medium">
              {maxActiveRooms}
            </Typography>
          </Box>
          
          <Box sx={{ textAlign: 'center', mx: 1 }}>
            <Tooltip title={t('subscription.maxParticipantsTooltip', 'Maximum number of participants per room')}>
              <Typography variant="caption" color="text.secondary" display="block">
                {t('subscription.participants', 'Participants')}
              </Typography>
            </Tooltip>
            <Typography variant="body2" fontWeight="medium">
              {maxParticipants}
            </Typography>
          </Box>
          
          {currentPlan !== SubscriptionPlan.ENTERPRISE && (
            <Link href={getLocalizedRoute('/settings/subscription')} passHref>
              <Button
                variant="text"
                size="small"
                color="primary"
                sx={{ textTransform: 'none', minWidth: 'auto', p: 0.5 }}
              >
                {t('subscription.upgrade', 'Upgrade')}
              </Button>
            </Link>
          )}
        </Box>
      </Box>
      
      {/* Removed promotional messages to make the component more minimalist */}
    </Box>
  );
}