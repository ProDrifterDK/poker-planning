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

// Función para obtener el nombre del tipo de integración
const getIntegrationTypeName = (type: IntegrationType): string => {
  switch (type) {
    case IntegrationType.JIRA:
      return 'Jira';
    case IntegrationType.TRELLO:
      return 'Trello';
    case IntegrationType.GITHUB:
      return 'GitHub';
    default:
      return 'Desconocido';
  }
};

interface IntegrationsListProps {
  onAddClick: () => void;
  onEditClick: (index: number) => void;
}

export default function IntegrationsList({ onAddClick, onEditClick }: IntegrationsListProps) {
  const { integrations, toggleIntegration, removeIntegration } = useIntegrationStore();

  // Manejar el cambio de estado de una integración
  const handleToggle = (index: number) => {
    toggleIntegration(index);
  };

  // Manejar la eliminación de una integración
  const handleDelete = (index: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta integración?')) {
      removeIntegration(index);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Integraciones Configuradas</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={onAddClick}
          size="small"
        >
          Añadir Integración
        </Button>
      </Box>

      {integrations.length === 0 ? (
        <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
          No hay integraciones configuradas. Haz clic en &quot;Añadir Integración&quot; para comenzar.
        </Typography>
      ) : (
        <List>
          {integrations.map((integration, index) => (
            <React.Fragment key={index}>
              <ListItem>
                <ListItemText
                  primary={integration.name}
                  secondary={`Tipo: ${getIntegrationTypeName(integration.type)}`}
                />
                <ListItemSecondaryAction>
                  <Tooltip title="Editar">
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
                  <Tooltip title="Eliminar">
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
                  <Tooltip title={integration.enabled ? 'Deshabilitar' : 'Habilitar'}>
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