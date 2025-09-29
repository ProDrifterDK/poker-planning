'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/authContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Box, Paper, Typography, Divider, Button } from '@mui/material';
import { Input } from '@/components/forms/Input';
import { FormButton } from '@/components/forms/FormButton';
import { Alert } from '@/components/feedback/Alert';

// Lista de idiomas soportados
const supportedLocales = ['es', 'en'];

// Función auxiliar para obtener la ruta con el idioma
const getLocalizedRoute = (route: string): string => {
  // Intentar obtener el idioma de i18next primero (cliente)
  let lang = 'es'; // Valor por defecto

  if (typeof window !== 'undefined') {
    // Estamos en el cliente, podemos acceder a i18next
    const i18nLang = window.localStorage.getItem('i18nextLng');

    if (i18nLang && supportedLocales.includes(i18nLang)) {
      lang = i18nLang;
    } else {
      // Fallback a la URL si no hay idioma en i18next
      const urlLang = window.location.pathname.split('/')[1];
      if (supportedLocales.includes(urlLang)) {
        lang = urlLang;
      }
    }
  }

  return `/${lang}${route}`;
};

const SignIn: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const { signIn, signInWithGoogleProvider, error, clearError, currentUser } = useAuth();
  const router = useRouter();
  const { t } = useTranslation('auth');

  // Redireccionar si el usuario está autenticado o si el inicio de sesión fue exitoso
  useEffect(() => {
    if (currentUser || success) {
      // Verificar si hay una suscripción pendiente en localStorage
      const pendingSubscription = typeof window !== 'undefined' ? localStorage.getItem('pendingSubscription') : null;

      // Verificar si hay una URL de redirección guardada en sessionStorage (para salas)
      const redirectAfterAuth = typeof window !== 'undefined' ? sessionStorage.getItem('redirectAfterAuth') : null;

      // Obtener la URL de retorno de los parámetros de la URL si existe
      const returnUrl = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('returnUrl') : null;

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
          router.push(getLocalizedRoute('/settings/subscription'));
        } else {
          // Si no hay ninguna redirección específica, ir a la página de inicio
          console.log('Redirigiendo a página de inicio');
          router.push(getLocalizedRoute(''));
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
      setFormError(t('signin.errors.emailRequired'));
      return false;
    }
    if (!password) {
      setFormError(t('signin.errors.passwordRequired'));
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
        minHeight: '100vh',
        padding: 2,
        backgroundColor: 'background.default',
        '&.MuiBox-root': {
          backgroundColor: 'background.default !important'
        }
      }}
    >
      <Paper
        elevation={3}
        sx={{
          padding: 4,
          width: '100%',
          maxWidth: 400,
          borderRadius: 2,
          backgroundColor: 'background.paper',
          '&.MuiPaper-root': {
            backgroundColor: 'background.paper !important',
            backgroundImage: 'none !important'
          }
        }}
      >
        {/* Título del formulario */}
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          textAlign="center"
          sx={{ mb: 3, fontWeight: 'bold' }}
        >
          {t('signin.title')}
        </Typography>

        {/* Alert para errores y mensajes de éxito */}
        {(formError || error) && (
          <Box sx={{ mb: 2 }}>
            <Alert
              variant="error"
              message={formError || error || ''}
            />
          </Box>
        )}

        {success && (
          <Box sx={{ mb: 2 }}>
            <Alert
              variant="success"
              message={t('signin.success')}
            />
          </Box>
        )}

        {/* Formulario de inicio de sesión */}
        <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
          {/* Campo de correo electrónico */}
          <Box sx={{ mb: 2 }}>
            <Input
              type="email"
              placeholder={t('signin.email')}
              value={email}
              onChange={handleEmailChange}
              disabled={isSubmitting}
              error={!!formError && !email.trim()}
              required
            />
          </Box>

          {/* Campo de contraseña */}
          <Box sx={{ mb: 3 }}>
            <Input
              type="password"
              placeholder={t('signin.password')}
              value={password}
              onChange={handlePasswordChange}
              disabled={isSubmitting}
              error={!!formError && !password}
              required
            />
          </Box>

          {/* Botón de inicio de sesión */}
          <Box sx={{ mb: 2 }}>
            <FormButton
              type="submit"
              variant="primary"
              isSubmitting={isSubmitting}
              loadingText={t('signin.signingIn')}
            >
              {t('signin.submit')}
            </FormButton>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Botón de Google Sign-In */}
        <Box sx={{ mb: 3 }}>
          <FormButton
            type="button"
            variant="secondary"
            onClick={handleGoogleSignIn}
            isSubmitting={isSubmitting}
            loadingText={t('signin.signingIn')}
          >
            {t('signin.continueWithGoogle')}
          </FormButton>
        </Box>

        {/* Enlaces de navegación */}
        <Box sx={{ textAlign: 'center' }}>
          <Button
            component={Link}
            href={getLocalizedRoute('/auth/reset-password')}
            variant="text"
            sx={{
              textTransform: 'none',
              color: 'primary.main',
              '&:hover': {
                backgroundColor: 'transparent',
                textDecoration: 'underline'
              }
            }}
          >
            {t('signin.forgotPassword')}
          </Button>
        </Box>

        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {t('signin.noAccount')}{' '}
            <Button
              component={Link}
              href={getLocalizedRoute('/auth/signup')}
              variant="text"
              sx={{
                textTransform: 'none',
                color: 'primary.main',
                padding: 0,
                minWidth: 'auto',
                '&:hover': {
                  backgroundColor: 'transparent',
                  textDecoration: 'underline'
                }
              }}
            >
              {t('signin.createAccount')}
            </Button>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default SignIn;