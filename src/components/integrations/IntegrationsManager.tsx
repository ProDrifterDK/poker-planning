"use client";

import React, { useState } from 'react';
import { Typography, Paper, Divider } from '@mui/material';
import IntegrationsList from './IntegrationsList';
import IntegrationForm from './IntegrationForm';

export default function IntegrationsManager() {
  const [formOpen, setFormOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | undefined>(undefined);

  // Abrir el formulario para añadir una nueva integración
  const handleAddClick = () => {
    setEditIndex(undefined);
    setFormOpen(true);
  };

  // Abrir el formulario para editar una integración existente
  const handleEditClick = (index: number) => {
    setEditIndex(index);
    setFormOpen(true);
  };

  // Cerrar el formulario
  const handleFormClose = () => {
    setFormOpen(false);
    setEditIndex(undefined);
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
      <Typography variant="h5" gutterBottom>
        Integraciones
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Configura integraciones con herramientas externas para enviar los resultados de las estimaciones.
      </Typography>

      <Divider sx={{ my: 2 }} />

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