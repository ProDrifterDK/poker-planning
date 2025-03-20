'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Paper,
  CircularProgress
} from '@mui/material';
import { useAuth } from '@/context/authContext';
import { setUserRole } from '@/lib/roleService';
import { UserRole } from '@/types/roles';

// Obtener la clave secreta de las variables de entorno o usar un valor por defecto
// En producción, asegúrate de configurar esta variable de entorno
const ADMIN_SECRET_KEY = process.env.NEXT_PUBLIC_ADMIN_SECRET_KEY || 'admin123';

const BecomeAdmin: React.FC = () => {
  const { currentUser, userRole } = useAuth();
  const [secretKey, setSecretKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError('Debes iniciar sesión para convertirte en administrador');
      return;
    }
    
    if (secretKey !== ADMIN_SECRET_KEY) {
      setError('Clave secreta incorrecta');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await setUserRole(currentUser.uid, UserRole.MODERATOR);
      setSuccess('¡Felicidades! Ahora eres moderador. Recarga la página para ver los cambios.');
      
      // Actualizar la página automáticamente después de 2 segundos
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err: unknown) {
      console.error('Error al convertir en moderador:', err);
      
      // Mostrar mensaje de error específico si está disponible
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error al cambiar el rol. Inténtalo de nuevo más tarde.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Si el usuario ya es moderador, mostrar un mensaje
  if (userRole === UserRole.MODERATOR) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        Ya tienes el rol de moderador.
      </Alert>
    );
  }

  return (
    <Paper sx={{ p: 3, mt: 3, maxWidth: 500, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        Convertirse en Moderador
      </Typography>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        Si conoces la clave secreta, puedes convertirte en moderador para acceder a funcionalidades adicionales.
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}
      
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
        <TextField
          label="Clave Secreta"
          type="password"
          fullWidth
          value={secretKey}
          onChange={(e) => setSecretKey(e.target.value)}
          disabled={loading}
          required
          sx={{ mb: 2 }}
        />
        
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          disabled={loading || !secretKey.trim()}
        >
          {loading ? <CircularProgress size={24} /> : 'Convertirse en Moderador'}
        </Button>
      </Box>
    </Paper>
  );
};

export default BecomeAdmin;