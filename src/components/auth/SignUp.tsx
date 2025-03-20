'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Divider,
  Alert,
  CircularProgress,
  Link as MuiLink
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { useAuth } from '@/context/authContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const SignUp: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const { signUp, signInWithGoogleProvider, error, clearError, currentUser } = useAuth();
  const router = useRouter();

  // Redireccionar si el usuario está autenticado o si el registro fue exitoso
  useEffect(() => {
    if (currentUser || success) {
      // Pequeño retraso para mostrar el mensaje de éxito
      const timer = setTimeout(() => {
        router.push('/');
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [currentUser, success, router]);

  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => 
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setter(e.target.value);
      if (formError) setFormError(null);
      if (error) clearError();
    };

  const validateForm = () => {
    if (!name.trim()) {
      setFormError('El nombre es obligatorio');
      return false;
    }
    if (!email.trim()) {
      setFormError('El correo electrónico es obligatorio');
      return false;
    }
    if (!password) {
      setFormError('La contraseña es obligatoria');
      return false;
    }
    if (password.length < 6) {
      setFormError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    if (password !== confirmPassword) {
      setFormError('Las contraseñas no coinciden');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      await signUp(email, password, name);
      setSuccess(true); // Establecer estado de éxito
    } catch (error) {
      // El error ya se maneja en el contexto de autenticación
      console.error('Error al registrar usuario:', error);
      setSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    try {
      await signInWithGoogleProvider();
      // La redirección se manejará en el componente de protección de rutas
    } catch (error) {
      // El error ya se maneja en el contexto de autenticación
      console.error('Error al iniciar sesión con Google:', error);
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
          Crear Cuenta
        </Typography>
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            ¡Registro exitoso! Redirigiendo...
          </Alert>
        )}
        
        {(error || formError) && !success && (
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
            value={name}
            onChange={handleInputChange(setName)}
            disabled={isSubmitting}
            required
          />
          
          <TextField
            label="Correo electrónico"
            type="email"
            fullWidth
            margin="normal"
            variant="outlined"
            value={email}
            onChange={handleInputChange(setEmail)}
            disabled={isSubmitting}
            required
          />
          
          <TextField
            label="Contraseña"
            type="password"
            fullWidth
            margin="normal"
            variant="outlined"
            value={password}
            onChange={handleInputChange(setPassword)}
            disabled={isSubmitting}
            required
            helperText="La contraseña debe tener al menos 6 caracteres"
          />
          
          <TextField
            label="Confirmar contraseña"
            type="password"
            fullWidth
            margin="normal"
            variant="outlined"
            value={confirmPassword}
            onChange={handleInputChange(setConfirmPassword)}
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
            {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Registrarse'}
          </Button>
        </form>
        
        <Divider sx={{ my: 2 }}>o</Divider>
        
        <Button
          fullWidth
          variant="outlined"
          startIcon={<GoogleIcon />}
          onClick={handleGoogleSignIn}
          disabled={isSubmitting}
          sx={{ mb: 2, textTransform: "none" }}
        >
          Continuar con Google
        </Button>
        
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2">
            ¿Ya tienes una cuenta?{' '}
            <MuiLink
              component={Link}
              href="/auth/signin"
              underline="hover"
            >
              Inicia sesión
            </MuiLink>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default SignUp;