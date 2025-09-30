"use client";

import React, { useState } from 'react';
import { Typography, Paper, Divider, useTheme } from '@mui/material';
import IntegrationsList from './IntegrationsList';
import IntegrationForm from './IntegrationForm';
import { useTranslation } from 'react-i18next';

export default function IntegrationsManager() {
  const [formOpen, setFormOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | undefined>(undefined);
  const { t, i18n } = useTranslation('common');
  const theme = useTheme();
  
  // Force a re-render when the language changes
  React.useEffect(() => {
    // This is just to ensure the component re-renders when the language changes
    console.log('Current language:', i18n.language);
  }, [i18n.language]);

  // Open the form to add a new integration
  const handleAddClick = () => {
    setEditIndex(undefined);
    setFormOpen(true);
  };

  // Open the form to edit an existing integration
  const handleEditClick = (index: number) => {
    setEditIndex(index);
    setFormOpen(true);
  };

  // Close the form
  const handleFormClose = () => {
    setFormOpen(false);
    setEditIndex(undefined);
  };

  return (
    <Paper elevation={2} sx={{ p: theme.spacing(3), mb: theme.spacing(4) }}>
      <Typography variant="h5" gutterBottom>
        {t('settings.integrations.title', 'Integraciones')}
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        {t('settings.integrations.description', 'Configura integraciones con herramientas externas para enviar los resultados de las estimaciones.')}
      </Typography>

      <Divider sx={{ my: theme.spacing(2) }} />

      <IntegrationsList
        onAddClick={handleAddClick}
        onEditClick={handleEditClick}
      />

      <IntegrationForm
        open={formOpen}
        onClose={handleFormClose}
        editIndex={editIndex}
      />
    </Paper>
  );
}