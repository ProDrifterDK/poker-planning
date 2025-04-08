"use client";

import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Switch,
  Divider,
  Button,
  Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useIntegrationStore } from '@/store/integrationStore';
import { IntegrationType } from '@/integrations';
import { useTranslation } from 'react-i18next';

// Function to get the name of the integration type
const getIntegrationTypeName = (type: IntegrationType): string => {
  switch (type) {
    case IntegrationType.JIRA:
      return 'Jira';
    case IntegrationType.TRELLO:
      return 'Trello';
    case IntegrationType.GITHUB:
      return 'GitHub';
    default:
      return 'Unknown';
  }
};

interface IntegrationsListProps {
  onAddClick: () => void;
  onEditClick: (index: number) => void;
}

export default function IntegrationsList({ onAddClick, onEditClick }: IntegrationsListProps) {
  const { integrations, toggleIntegration, removeIntegration } = useIntegrationStore();
  const { t, i18n } = useTranslation('common');
  
  // Force a re-render when the language changes
  React.useEffect(() => {
    // This is just to ensure the component re-renders when the language changes
    console.log('IntegrationsList - Current language:', i18n.language);
  }, [i18n.language]);
  
  // Function to get the localized name of the integration type
  const getLocalizedIntegrationTypeName = (type: IntegrationType): string => {
    switch (type) {
      case IntegrationType.JIRA:
        return 'Jira';
      case IntegrationType.TRELLO:
        return 'Trello';
      case IntegrationType.GITHUB:
        return 'GitHub';
      default:
        return t('integrations.unknown', 'Unknown');
    }
  };

  // Handle toggling an integration's state
  const handleToggle = (index: number) => {
    toggleIntegration(index);
  };

  // Handle deleting an integration
  const handleDelete = (index: number) => {
    if (window.confirm(t('integrations.confirmDelete', '¿Estás seguro de que deseas eliminar esta integración?'))) {
      removeIntegration(index);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">{t('integrations.configured', 'Integraciones Configuradas')}</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={onAddClick}
          size="small"
        >
          {t('integrations.add', 'Añadir Integración')}
        </Button>
      </Box>

      {integrations.length === 0 ? (
        <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
          {t('integrations.noIntegrations', 'No hay integraciones configuradas. Haz clic en "Añadir Integración" para comenzar.')}
        </Typography>
      ) : (
        <List>
          {integrations.map((integration, index) => (
            <React.Fragment key={index}>
              <ListItem>
                <ListItemText
                  primary={integration.name}
                  secondary={t('integrations.type', 'Tipo: {{type}}', { type: getLocalizedIntegrationTypeName(integration.type) })}
                />
                <ListItemSecondaryAction>
                  <Tooltip title={t('integrations.edit', 'Editar')}>
                    <IconButton
                      edge="end"
                      aria-label="edit"
                      onClick={() => onEditClick(index)}
                      size="small"
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('integrations.delete', 'Eliminar')}>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => handleDelete(index)}
                      size="small"
                      sx={{ mr: 1 }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={integration.enabled
                    ? t('integrations.disable', 'Deshabilitar')
                    : t('integrations.enable', 'Habilitar')}>
                    <Switch
                      edge="end"
                      checked={integration.enabled}
                      onChange={() => handleToggle(index)}
                      inputProps={{ 'aria-labelledby': `integration-${index}` }}
                    />
                  </Tooltip>
                </ListItemSecondaryAction>
              </ListItem>
              {index < integrations.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      )}
    </Box>
  );
}