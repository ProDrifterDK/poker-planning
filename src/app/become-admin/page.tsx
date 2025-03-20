import React from 'react';
import { Metadata } from 'next';
import BecomeAdmin from '@/components/admin/BecomeAdmin';
import { Box, Typography, Container } from '@mui/material';

export const metadata: Metadata = {
  title: 'Convertirse en Moderador | Planning Poker Pro',
  description: 'Solicita permisos de moderador para Planning Poker Pro',
};

export default function BecomeAdminPage() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box textAlign="center" mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Solicitud de Permisos de Moderador
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Esta página te permite convertirte en moderador si conoces la clave secreta.
          Los moderadores tienen acceso a funcionalidades adicionales como el panel de administración.
        </Typography>
      </Box>
      
      <BecomeAdmin />
      
      <Box mt={4} textAlign="center">
        <Typography variant="body2" color="text.secondary">
          Nota: El rol de moderador te da acceso a funcionalidades administrativas.
          Usa estos privilegios de manera responsable.
        </Typography>
      </Box>
    </Container>
  );
}