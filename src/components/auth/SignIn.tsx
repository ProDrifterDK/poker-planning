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

const SignIn: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const { signIn, signInWithGoogleProvider, error, clearError, currentUser } = useAuth();
  const router = useRouter();

  // Redireccionar si el usuario está autenticado o si el inicio de sesión fue exitoso
  useEffect(() => {
    if (currentUser || success) {
      // Verificar si hay una suscripción pendiente en localStorage
      const pendingSubscription = typeof window !== 'undefined' ? localStorage.getItem('pendingSubscription') : null;
      
      // Verificar si hay una URL de redirección guardada en sessionStorage (para salas)
      const redirectAfterAuth = typeof window !== 'undefined' ? sessionStorage.getItem('redirectAfterAuth') : null;
      
      // Obtener la URL de retorno de los parámetros de la URL si existe
      const urlParams = new URLSearchParams(window.location.search);
      const returnUrl = urlParams.get('returnUrl');
      
      // Pequeño retraso para mostrar el mensaje de éxito
      const timer = setTimeout(() => {
        // Prioridad de redirección:
        // 1. URL de retorno de parámetros
        // 2. URL guardada en sessionStorage (para salas)
        // 3. Página de suscripción si hay una pendiente
        // 4. Página de inicio
        
        if (returnUrl) {
          console.log('Redirigiendo a URL de retorno:', returnUrl);
          router.push(returnUrl);
        } else if (redirectAfterAuth) {
          console.log('Redirigiendo a sala:', redirectAfterAuth);
          router.push(redirectAfterAuth);
          // Limpiar la URL guardada
          sessionStorage.removeItem('redirectAfterAuth');
        } else if (pendingSubscription) {
          console.log('Encontrada suscripción pendiente, redirigiendo a página de éxito');
          router.push('/settings/subscription');
        } else {
          // Si no hay ninguna redirección específica, ir a la página de inicio
          console.log('Redirigiendo a página de inicio');
          router.push('/');
        }
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [currentUser, success, router]);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (formError) setFormError(null);
    if (error) clearError();
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (formError) setFormError(null);
    if (error) clearError();
  };

  const validateForm = () => {
    if (!email.trim()) {
      setFormError('El correo electrónico es obligatorio');
      return false;
    }
    if (!password) {
      setFormError('La contraseña es obligatoria');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await signIn(email, password);
      setSuccess(true); // Establecer estado de éxito
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // El error ya se maneja en el contexto de autenticación
      // No registramos el error en la consola por razones de seguridad
      setSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    try {
      await signInWithGoogleProvider();
      setSuccess(true); // Establecer estado de éxito
    } catch (error) {
      // El error ya se maneja en el contexto de autenticación
      console.error('Error al iniciar sesión con Google:', error);
      setSuccess(false);
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
          Iniciar Sesión
        </Typography>

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            ¡Inicio de sesión exitoso! Redirigiendo...
          </Alert>
        )}

        {(error || formError) && !success && (
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

          <TextField
            label="Contraseña"
            type="password"
            fullWidth
            margin="normal"
            variant="outlined"
            value={password}
            onChange={handlePasswordChange}
            disabled={isSubmitting}
            required
          />

          <Box sx={{ mt: 1, mb: 2, textAlign: 'right' }}>
            <MuiLink
              component={Link}
              href="/auth/reset-password"
              underline="hover"
              variant="body2"
            >
              ¿Olvidaste tu contraseña?
            </MuiLink>
          </Box>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            size="large"
            disabled={isSubmitting}
            sx={{ mb: 2, textTransform: "none" }}
          >
            {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Iniciar sesión'}
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
            ¿No tienes una cuenta?{' '}
            <MuiLink
              component={Link}
              href="/auth/signup"
              underline="hover"
            >
              Regístrate
            </MuiLink>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default SignIn;