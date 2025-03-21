"use client";

import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import { useIntegrationStore } from '@/store/integrationStore';
import {
  Integration,
  IntegrationType,
  JiraConfig,
  TrelloConfig,
  GitHubConfig,
} from '@/integrations';

// Formulario para configurar Jira
const JiraForm = ({
  config,
  onChange,
}: {
  config: Partial<JiraConfig>;
  onChange: (config: Partial<JiraConfig>) => void;
}) => {
  return (
    <Box>
      <TextField
        label="Dominio de Jira"
        fullWidth
        margin="normal"
        value={config.domain || ''}
        onChange={(e) => onChange({ ...config, domain: e.target.value })}
        helperText="Ejemplo: mycompany (para mycompany.atlassian.net)"
        required
      />
      <TextField
        label="Email"
        fullWidth
        margin="normal"
        value={config.email || ''}
        onChange={(e) => onChange({ ...config, email: e.target.value })}
        helperText="Email asociado a tu cuenta de Jira"
        required
      />
      <TextField
        label="Token API"
        fullWidth
        margin="normal"
        value={config.apiToken || ''}
        onChange={(e) => onChange({ ...config, apiToken: e.target.value })}
        helperText="Token API de Jira (se puede generar en la configuración de tu cuenta)"
        type="password"
        required
      />
      <TextField
        label="Clave del Proyecto"
        fullWidth
        margin="normal"
        value={config.projectKey || ''}
        onChange={(e) => onChange({ ...config, projectKey: e.target.value })}
        helperText="Ejemplo: PROJ"
        required
      />
    </Box>
  );
};

// Formulario para configurar Trello
const TrelloForm = ({
  config,
  onChange,
}: {
  config: Partial<TrelloConfig>;
  onChange: (config: Partial<TrelloConfig>) => void;
}) => {
  return (
    <Box>
      <TextField
        label="API Key"
        fullWidth
        margin="normal"
        value={config.apiKey || ''}
        onChange={(e) => onChange({ ...config, apiKey: e.target.value })}
        helperText="API Key de Trello (se puede obtener en https://trello.com/power-ups/admin)"
        required
      />
      <TextField
        label="Token"
        fullWidth
        margin="normal"
        value={config.token || ''}
        onChange={(e) => onChange({ ...config, token: e.target.value })}
        helperText="Token de Trello (se puede generar desde la página de API Key)"
        type="password"
        required
      />
      <TextField
        label="ID del Tablero"
        fullWidth
        margin="normal"
        value={config.boardId || ''}
        onChange={(e) => onChange({ ...config, boardId: e.target.value })}
        helperText="ID del tablero de Trello (se puede obtener de la URL del tablero)"
        required
      />
      <TextField
        label="ID de la Lista"
        fullWidth
        margin="normal"
        value={config.listId || ''}
        onChange={(e) => onChange({ ...config, listId: e.target.value })}
        helperText="ID de la lista donde se crearán las tarjetas"
        required
      />
    </Box>
  );
};

// Formulario para configurar GitHub
const GitHubForm = ({
  config,
  onChange,
}: {
  config: Partial<GitHubConfig>;
  onChange: (config: Partial<GitHubConfig>) => void;
}) => {
  return (
    <Box>
      <TextField
        label="Token de Acceso Personal"
        fullWidth
        margin="normal"
        value={config.token || ''}
        onChange={(e) => onChange({ ...config, token: e.target.value })}
        helperText="Token de acceso personal de GitHub (con permisos para issues)"
        type="password"
        required
      />
      <TextField
        label="Propietario del Repositorio"
        fullWidth
        margin="normal"
        value={config.owner || ''}
        onChange={(e) => onChange({ ...config, owner: e.target.value })}
        helperText="Nombre de usuario o organización propietaria del repositorio"
        required
      />
      <TextField
        label="Nombre del Repositorio"
        fullWidth
        margin="normal"
        value={config.repo || ''}
        onChange={(e) => onChange({ ...config, repo: e.target.value })}
        helperText="Nombre del repositorio donde se crearán los issues"
        required
      />
    </Box>
  );
};

interface IntegrationFormProps {
  open: boolean;
  onClose: () => void;
  editIndex?: number;
}

export default function IntegrationForm({
  open,
  onClose,
  editIndex,
}: IntegrationFormProps) {
  const { integrations, addIntegration, updateIntegration, isLoading, error } = useIntegrationStore();
  
  // Estado para el formulario
  const [name, setName] = useState('');
  const [type, setType] = useState<IntegrationType>(IntegrationType.JIRA);
  const [config, setConfig] = useState<Partial<Integration>>({});
  const [formError, setFormError] = useState<string | null>(null);
  
  // Cargar datos si estamos editando
  useEffect(() => {
    if (editIndex !== undefined && integrations[editIndex]) {
      const integration = integrations[editIndex];
      setName(integration.name);
      setType(integration.type);
      setConfig(integration);
    } else {
      // Valores por defecto para nueva integración
      setName('');
      setType(IntegrationType.JIRA);
      setConfig({});
    }
  }, [editIndex, integrations, open]);
  
  // Manejar cambios en el tipo de integración
  const handleTypeChange = (newType: IntegrationType) => {
    setType(newType);
    // Reiniciar la configuración pero mantener el nombre
    setConfig({ name, type: newType, enabled: true });
  };
  
  // Manejar cambios en la configuración específica
  const handleConfigChange = (newConfig: Partial<Integration>) => {
    setConfig({ ...config, ...newConfig });
  };
  
  // Validar el formulario
  const validateForm = (): boolean => {
    if (!name.trim()) {
      setFormError('El nombre es requerido');
      return false;
    }
    
    switch (type) {
      case IntegrationType.JIRA:
        const jiraConfig = config as Partial<JiraConfig>;
        if (!jiraConfig.domain || !jiraConfig.email || !jiraConfig.apiToken || !jiraConfig.projectKey) {
          setFormError('Todos los campos de Jira son requeridos');
          return false;
        }
        break;
      case IntegrationType.TRELLO:
        const trelloConfig = config as Partial<TrelloConfig>;
        if (!trelloConfig.apiKey || !trelloConfig.token || !trelloConfig.boardId || !trelloConfig.listId) {
          setFormError('Todos los campos de Trello son requeridos');
          return false;
        }
        break;
      case IntegrationType.GITHUB:
        const githubConfig = config as Partial<GitHubConfig>;
        if (!githubConfig.token || !githubConfig.owner || !githubConfig.repo) {
          setFormError('Todos los campos de GitHub son requeridos');
          return false;
        }
        break;
    }
    
    setFormError(null);
    return true;
  };
  
  // Manejar el guardado del formulario
  const handleSave = () => {
    if (!validateForm()) {
      return;
    }
    
    // Crear la configuración completa según el tipo
    let completeConfig: Integration;
    
    switch (type) {
      case IntegrationType.JIRA:
        completeConfig = {
          name,
          type,
          enabled: config.enabled !== undefined ? config.enabled : true,
          domain: (config as Partial<JiraConfig>).domain || '',
          email: (config as Partial<JiraConfig>).email || '',
          apiToken: (config as Partial<JiraConfig>).apiToken || '',
          projectKey: (config as Partial<JiraConfig>).projectKey || '',
        } as JiraConfig;
        break;
      case IntegrationType.TRELLO:
        completeConfig = {
          name,
          type,
          enabled: config.enabled !== undefined ? config.enabled : true,
          apiKey: (config as Partial<TrelloConfig>).apiKey || '',
          token: (config as Partial<TrelloConfig>).token || '',
          boardId: (config as Partial<TrelloConfig>).boardId || '',
          listId: (config as Partial<TrelloConfig>).listId || '',
        } as TrelloConfig;
        break;
      case IntegrationType.GITHUB:
        completeConfig = {
          name,
          type,
          enabled: config.enabled !== undefined ? config.enabled : true,
          token: (config as Partial<GitHubConfig>).token || '',
          owner: (config as Partial<GitHubConfig>).owner || '',
          repo: (config as Partial<GitHubConfig>).repo || '',
        } as GitHubConfig;
        break;
      default:
        setFormError('Tipo de integración no soportado');
        return;
    }
    
    // Guardar la configuración
    if (editIndex !== undefined) {
      updateIntegration(editIndex, completeConfig);
    } else {
      addIntegration(completeConfig);
    }
    
    // Cerrar el formulario
    onClose();
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {editIndex !== undefined ? 'Editar Integración' : 'Añadir Integración'}
      </DialogTitle>
      <DialogContent>
        {(formError || error) && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {formError || error}
          </Alert>
        )}
        
        <TextField
          label="Nombre de la Integración"
          fullWidth
          margin="normal"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setConfig({ ...config, name: e.target.value });
          }}
          required
        />
        
        <FormControl fullWidth margin="normal">
          <InputLabel id="integration-type-label">Tipo de Integración</InputLabel>
          <Select
            labelId="integration-type-label"
            value={type}
            onChange={(e) => handleTypeChange(e.target.value as IntegrationType)}
            label="Tipo de Integración"
          >
            <MenuItem value={IntegrationType.JIRA}>Jira</MenuItem>
            <MenuItem value={IntegrationType.TRELLO}>Trello</MenuItem>
            <MenuItem value={IntegrationType.GITHUB}>GitHub</MenuItem>
          </Select>
          <FormHelperText>Selecciona el tipo de integración</FormHelperText>
        </FormControl>
        
        <Divider sx={{ my: 2 }} />
        
        {/* Formulario específico según el tipo */}
        {type === IntegrationType.JIRA && (
          <JiraForm
            config={config as Partial<JiraConfig>}
            onChange={handleConfigChange}
          />
        )}
        
        {type === IntegrationType.TRELLO && (
          <TrelloForm
            config={config as Partial<TrelloConfig>}
            onChange={handleConfigChange}
          />
        )}
        
        {type === IntegrationType.GITHUB && (
          <GitHubForm
            config={config as Partial<GitHubConfig>}
            onChange={handleConfigChange}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          color="primary"
          variant="contained"
          disabled={isLoading}
        >
          {isLoading ? <CircularProgress size={24} /> : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}