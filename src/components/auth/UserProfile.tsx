'use client';

import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Avatar,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import { useAuth } from '@/context/authContext';

const UserProfile: React.FC = () => {
  const { currentUser, updateProfile, logout, error, clearError } = useAuth();
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayName(e.target.value);
    if (formError) setFormError(null);
    if (error) clearError();
    if (isSuccess) setIsSuccess(false);
  };

  const validateForm = () => {
    if (!displayName.trim()) {
      setFormError('El nombre es obligatorio');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      await updateProfile(displayName);
      setIsSuccess(true);
    } catch (error) {
      // El error ya se maneja en el contexto de autenticación
      // No registramos el error en la consola por razones de seguridad
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      // La redirección se manejará automáticamente por el ProtectedRoute
    } catch (error) {
      // No registramos el error en la consola por razones de seguridad
    }
  };

  if (!currentUser) {
    return null; // No debería ocurrir debido al ProtectedRoute
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        p: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 500,
          borderRadius: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar
            src={currentUser.photoURL || undefined}
            alt={currentUser.displayName || 'Usuario'}
            sx={{ width: 64, height: 64, mr: 2 }}
          />
          <Box>
            <Typography variant="h5" component="h1" gutterBottom>
              Mi Perfil
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {currentUser.email}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />
        
        {isSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Perfil actualizado correctamente
          </Alert>
        )}
        
        {(error || formError) && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error || formError}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <TextField
            label="Nombre"
            fullWidth
            margin="normal"
            variant="outlined"
            value={displayName}
            onChange={handleDisplayNameChange}
            disabled={isSubmitting}
            required
          />
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              color="error"
              onClick={handleLogout}
              disabled={isSubmitting}
            >
              Cerrar Sesión
            </Button>
            
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Guardar Cambios'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default UserProfile;