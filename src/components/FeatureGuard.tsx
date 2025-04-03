"use client";

import React, { ReactNode } from 'react';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { Box, Typography, Button } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import { PlanFeatures } from '@/types/subscription';

interface FeatureGuardProps {
  feature: keyof PlanFeatures;
  children: ReactNode;
  fallback?: ReactNode;
}

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
  
  const hasAccess = canUserAccessFeature(feature);
  
  if (hasAccess) {
    return <>{children}</>;
  }
  
  if (fallback) {
    return <>{fallback}</>;
  }
  
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
      <Typography variant="body2" color="text.secondary" align="center" gutterBottom>
        Esta función requiere un plan superior
      </Typography>
      <Button 
        variant="outlined" 
        size="small" 
        href="/settings/subscription" 
        sx={{ mt: 1 }}
      >
        Actualizar Plan
      </Button>
    </Box>
  );
}