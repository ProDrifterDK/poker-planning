'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Alert,
  Container
} from '@mui/material';
import RoleManager from './RoleManager';
import { useAuth } from '@/context/authContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `admin-tab-${index}`,
    'aria-controls': `admin-tabpanel-${index}`,
  };
}

const AdminDashboard: React.FC = () => {
  const { isModerator } = useAuth();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Verificar si el usuario es moderador
  if (!isModerator()) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">
          No tienes permisos para acceder al panel de administración
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Panel de Administración
      </Typography>
      
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="Pestañas de administración"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Gestión de Roles" {...a11yProps(0)} />
          <Tab label="Configuración" {...a11yProps(1)} />
          <Tab label="Estadísticas" {...a11yProps(2)} />
        </Tabs>
        
        <TabPanel value={tabValue} index={0}>
          <RoleManager />
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6">Configuración del Sistema</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
            Esta sección está en desarrollo. Próximamente podrás configurar parámetros globales del sistema.
          </Typography>
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6">Estadísticas de Uso</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
            Esta sección está en desarrollo. Próximamente podrás ver estadísticas de uso de la aplicación.
          </Typography>
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default AdminDashboard;