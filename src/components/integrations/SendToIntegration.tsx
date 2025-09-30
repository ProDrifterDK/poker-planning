"use client";

import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  CircularProgress,
  Alert,
  Divider,
  Snackbar,
  Tooltip,
  useTheme,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { useIntegrationStore } from '@/store/integrationStore';
import { IntegrationType, IssueData, IntegrationResult } from '@/integrations';

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

interface SendToIntegrationProps {
  issueData: IssueData;
  disabled?: boolean;
}

export default function SendToIntegration({ issueData, disabled = false }: SendToIntegrationProps) {
  const { integrations, sendIssueToIntegration, isLoading } = useIntegrationStore();
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [results, setResults] = useState<IntegrationResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [notification, setNotification] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Filtrar integraciones habilitadas
  const enabledIntegrations = integrations.filter((integration) => integration.enabled);

  // Abrir el diálogo
  const handleOpen = () => {
    setOpen(true);
    setSelectedIndices(enabledIntegrations.map((_, index) => index));
    setResults([]);
    setShowResults(false);
  };

  // Cerrar el diálogo
  const handleClose = () => {
    setOpen(false);
  };

  // Manejar el cambio de selección
  const handleToggle = (index: number) => {
    const currentIndex = selectedIndices.indexOf(index);
    const newSelectedIndices = [...selectedIndices];

    if (currentIndex === -1) {
      newSelectedIndices.push(index);
    } else {
      newSelectedIndices.splice(currentIndex, 1);
    }

    setSelectedIndices(newSelectedIndices);
  };

  // Enviar a las integraciones seleccionadas
  const handleSend = async () => {
    if (selectedIndices.length === 0) {
      setNotification({
        open: true,
        message: 'Selecciona al menos una integración',
        severity: 'error',
      });
      return;
    }

    const results: IntegrationResult[] = [];

    for (const index of selectedIndices) {
      // Obtener el índice real de la integración en el array completo
      const enabledIndices = integrations
        .map((integration, idx) => integration.enabled ? idx : -1)
        .filter(idx => idx !== -1);

      const integrationIndex = enabledIndices[index];
      if (integrationIndex !== undefined) {
        const result = await sendIssueToIntegration(integrationIndex, issueData);
        results.push(result);
      }
    }

    setResults(results);
    setShowResults(true);

    // Mostrar notificación de éxito o error
    const successCount = results.filter((result) => result.success).length;
    if (successCount === results.length) {
      setNotification({
        open: true,
        message: `Enviado correctamente a ${successCount} ${successCount === 1 ? 'integración' : 'integraciones'}`,
        severity: 'success',
      });
    } else {
      setNotification({
        open: true,
        message: `${successCount} de ${results.length} integraciones completadas con éxito`,
        severity: 'error',
      });
    }
  };

  // Cerrar la notificación
  const handleNotificationClose = () => {
    setNotification({
      ...notification,
      open: false,
    });
  };

  return (
    <><Tooltip title={enabledIntegrations.length === 0 ? 'Debes conectar tus integraciones antes de sincronizar issues' : 'Sincronizar con tus integraciones'}>
      <span>
        <Button
          variant="contained"
          color="primary"
          startIcon={<SendIcon fontSize="small" />}
          onClick={handleOpen}
          aria-controls="send-to-integrations"
          size="medium"
          disabled={disabled || enabledIntegrations.length === 0 || isLoading}
          sx={{
            textTransform: 'none',
            width: theme.spacing(25),
            height: theme.spacing(4.5),
            justifyContent: 'center',
            fontSize: theme.typography.button.fontSize
          }}
        >
          Sincronizar Issues
        </Button>
      </span>
    </Tooltip>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Enviar a Integraciones</DialogTitle>
        <DialogContent>
          {enabledIntegrations.length === 0 ? (
            <Typography variant="body2" color="text.secondary" textAlign="center" py={theme.spacing(2)}>
              No hay integraciones habilitadas. Configura al menos una integración para continuar.
            </Typography>
          ) : (
            <>
              <Typography variant="body2" gutterBottom>
                Selecciona las integraciones a las que deseas enviar los resultados:
              </Typography>

              <List>
                {enabledIntegrations.map((integration, index) => (
                  <ListItem key={index} dense onClick={() => handleToggle(index)}>
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        checked={selectedIndices.includes(index)}
                        tabIndex={-1}
                        disableRipple
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={integration.name}
                      secondary={getIntegrationTypeName(integration.type)}
                    />
                  </ListItem>
                ))}
              </List>

              {showResults && (
                <>
                  <Divider sx={{ my: theme.spacing(2) }} />
                  <Typography variant="subtitle1" gutterBottom>
                    Resultados:
                  </Typography>
                  <List>
                    {results.map((result, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          {result.success ? (
                            <CheckCircleIcon color="success" />
                          ) : (
                            <ErrorIcon color="error" />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={enabledIntegrations[selectedIndices[index]]?.name || 'Integración'}
                          secondary={result.message}
                        />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="inherit">
            Cerrar
          </Button>
          {enabledIntegrations.length > 0 && !showResults && (
            <Button
              onClick={handleSend}
              color="primary"
              variant="contained"
              disabled={selectedIndices.length === 0 || isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Enviar'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleNotificationClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleNotificationClose}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  );
}