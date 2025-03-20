'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Link as MuiLink
} from '@mui/material';
import { useAuth } from '@/context/authContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const ResetPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const { resetUserPassword, error, clearError } = useAuth();
  const router = useRouter();
  
  // Redireccionar después de un tiempo si se envió el correo
  useEffect(() => {
    if (resetSent) {
      const timer = setTimeout(() => {
        router.push('/auth/signin');
      }, 5000); // Dar más tiempo para leer el mensaje
      
      return () => clearTimeout(timer);
    }
  }, [resetSent, router]);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (formError) setFormError(null);
    if (error) clearError();
  };

  const validateForm = () => {
    if (!email.trim()) {
      setFormError('El correo electrónico es obligatorio');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      await resetUserPassword(email);
      setResetSent(true);
    } catch (error) {
      // El error ya se maneja en el contexto de autenticación
      console.error('Error al restablecer contraseña:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

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
          maxWidth: 400,
          borderRadius: 2,
        }}
      >
        <Typography variant="h5" component="h1" gutterBottom align="center" fontWeight="bold">
          Restablecer Contraseña
        </Typography>
        
        {resetSent ? (
          <>
            <Alert severity="success" sx={{ mb: 2 }}>
              Se ha enviado un correo electrónico con instrucciones para restablecer tu contraseña.
              Serás redirigido a la página de inicio de sesión en unos segundos...
            </Alert>
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <MuiLink
                component={Link}
                href="/auth/signin"
                underline="hover"
              >
                Volver a Iniciar Sesión
              </MuiLink>
            </Box>
          </>
        ) : (
          <>
            <Typography variant="body1" paragraph>
              Ingresa tu correo electrónico y te enviaremos instrucciones para restablecer tu contraseña.
            </Typography>
            
            {(error || formError) && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error || formError}
              </Alert>
            )}
            
            <form onSubmit={handleSubmit}>
              <TextField
                label="Correo electrónico"
                type="email"
                fullWidth
                margin="normal"
                variant="outlined"
                value={email}
                onChange={handleEmailChange}
                disabled={isSubmitting}
                required
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                size="large"
                disabled={isSubmitting}
                sx={{ mt: 2, mb: 2, textTransform: "none" }}
              >
                {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Enviar instrucciones'}
              </Button>
            </form>
            
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <MuiLink
                component={Link}
                href="/auth/signin"
                underline="hover"
              >
                Volver a iniciar sesión
              </MuiLink>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default ResetPassword;