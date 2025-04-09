"use client";

import React, { ReactNode } from 'react';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { Box, Typography, Button } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import { PlanFeatures } from '@/types/subscription';
import { useTranslation } from 'react-i18next';

interface FeatureGuardProps {
  feature: keyof PlanFeatures;
  children: ReactNode;
  fallback?: ReactNode;
}

// Mapa de nombres legibles para cada característica
const featureNames: Record<string, Record<keyof PlanFeatures, string>> = {
  es: {
    maxParticipants: "Participantes máximos",
    maxActiveRooms: "Salas activas máximas",
    exportData: "Exportación de datos",
    advancedStats: "Estadísticas avanzadas",
    timer: "Temporizador",
    fullHistory: "Historial completo",
    integrations: "Integraciones",
    branding: "Personalización de marca",
    advancedRoles: "Roles avanzados",
    prioritySupport: "Soporte prioritario",
    api: "API",
    adFree: "Sin anuncios"
  },
  en: {
    maxParticipants: "Maximum participants",
    maxActiveRooms: "Maximum active rooms",
    exportData: "Data export",
    advancedStats: "Advanced statistics",
    timer: "Timer",
    fullHistory: "Full history",
    integrations: "Integrations",
    branding: "Branding",
    advancedRoles: "Advanced roles",
    prioritySupport: "Priority support",
    api: "API",
    adFree: "Ad-free"
  }
};

/**
 * FeatureGuard component that checks if the user has access to a feature
 * based on their subscription plan.
 *
 * @param feature - The feature to check access for (must be a key of PlanFeatures)
 * @param children - The content to render if the user has access
 * @param fallback - Optional custom content to render if the user doesn't have access
 *
 * @example
 * // Restrict access to export data feature
 * <FeatureGuard feature="exportData">
 *   <ExportData />
 * </FeatureGuard>
 */
export default function FeatureGuard({ feature, children, fallback }: FeatureGuardProps) {
  const { canUserAccessFeature } = useSubscriptionStore();
  const { t, i18n } = useTranslation('common');
  const currentLang = i18n.language || 'es'; // Usar 'es' como valor predeterminado si no hay idioma

  const hasAccess = canUserAccessFeature(feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  // Obtener el nombre legible de la característica
  const langKey = currentLang.startsWith('es') ? 'es' : 'en';
  const featureName = featureNames[langKey][feature] || feature;

  // Default fallback UI
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        border: '1px dashed',
        borderColor: 'divider',
        borderRadius: 1,
        bgcolor: 'background.paper',
        minWidth: 200,
        minHeight: 100
      }}
    >
      <LockIcon color="action" sx={{ mb: 1 }} />
      <Typography variant="body1" color="initial">
        {featureName}
      </Typography>
      <Typography variant="caption" color="text.secondary" align="center" gutterBottom>
        {t('featureGuard.requiresHigherPlan', 'Esta función requiere un plan superior')}
      </Typography>
      <Button
        variant="outlined"
        size="small"
        href={`/${currentLang}/settings/subscription`}
        sx={{ mt: 1 }}
      >
        {t('featureGuard.upgradePlan', 'Actualizar Plan')}
      </Button>
    </Box>
  );
}