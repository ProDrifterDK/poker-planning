'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Alert,
  CircularProgress,
  Button,
  Avatar
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Image from 'next/image';
import { useAuth } from '@/context/authContext';
import { Input } from '@/components/forms/Input';
import { FormButton } from '@/components/forms/FormButton';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

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

const SignUp: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const { signUp, signInWithGoogleProvider, error, clearError, currentUser } = useAuth();
  const router = useRouter();
  const { t } = useTranslation('auth');
  const theme = useTheme();

  // Redireccionar si el usuario está autenticado o si el registro fue exitoso
  useEffect(() => {
    if (currentUser || success) {
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
        // 3. Página de inicio

        if (returnUrl) {
          console.log('Redirigiendo a URL de retorno:', returnUrl);
          router.push(returnUrl);
        } else if (redirectAfterAuth) {
          console.log('Redirigiendo a sala:', redirectAfterAuth);
          router.push(redirectAfterAuth);
          // Limpiar la URL guardada
          sessionStorage.removeItem('redirectAfterAuth');
        } else {
          // Si no hay ninguna redirección específica, ir a la página de inicio
          console.log('Redirigiendo a página de inicio');
          router.push(getLocalizedRoute(''));
        }
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [currentUser, success, router]);

  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setter(value);

      // Actualizar la fortaleza de la contraseña si el campo es la contraseña
      if (setter === setPassword) {
        setPasswordStrength(calculatePasswordStrength(value));
      }

      if (formError) setFormError(null);
      if (error) clearError();
    };

  // Función para validar la fortaleza de la contraseña
  const validatePasswordStrength = (password: string) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    if (password.length < minLength) {
      return { valid: false, message: t('errors.passwordLength') };
    }

    if (!hasUpperCase) {
      return { valid: false, message: t('signup.upperCaseRequired', 'Password must include at least one uppercase letter') };
    }

    if (!hasLowerCase) {
      return { valid: false, message: t('signup.lowerCaseRequired', 'Password must include at least one lowercase letter') };
    }

    if (!hasNumbers) {
      return { valid: false, message: t('signup.numberRequired', 'Password must include at least one number') };
    }

    if (!hasSpecialChar) {
      return { valid: false, message: t('signup.specialCharRequired', 'Password must include at least one special character (!@#$%^&*()_+-=[]{};\':"\\|,.<>/?') };
    }

    return { valid: true, message: '' };
  };

  // Calcular la fortaleza de la contraseña (0-100)
  const calculatePasswordStrength = (password: string) => {
    if (!password) return 0;

    let strength = 0;

    // Longitud contribuye hasta 25 puntos (8 caracteres = 25 puntos)
    strength += Math.min(25, Math.floor((password.length / 8) * 25));

    // Variedad de caracteres
    if (/[A-Z]/.test(password)) strength += 15; // Mayúsculas
    if (/[a-z]/.test(password)) strength += 15; // Minúsculas
    if (/\d/.test(password)) strength += 15;    // Números
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength += 20; // Caracteres especiales
    
    // Complejidad adicional
    const uniqueChars = new Set(password).size;
    strength += Math.min(10, uniqueChars / 2); // Hasta 10 puntos por caracteres únicos

    return Math.min(100, strength);
  };

  // Obtener el color basado en la fortaleza
  const getStrengthColor = (strength: number) => {
    if (strength < 30) return 'error.main';
    if (strength < 60) return 'warning.main';
    if (strength < 80) return 'info.main';
    return 'success.main';
  };

  // Obtener el texto basado en la fortaleza
  const getStrengthText = (strength: number) => {
    if (strength < 30) return t('signup.passwordStrength.veryWeak', 'Very weak');
    if (strength < 60) return t('signup.passwordStrength.weak', 'Weak');
    if (strength < 80) return t('signup.passwordStrength.moderate', 'Moderate');
    return t('signup.passwordStrength.strong', 'Strong');
  };

  const validateForm = () => {
    if (!name.trim()) {
      setFormError(t('errors.nameRequired'));
      return false;
    }
    if (!email.trim()) {
      setFormError(t('errors.emailRequired'));
      return false;
    }
    if (!password) {
      setFormError(t('errors.passwordRequired'));
      return false;
    }

    // Validar requisitos de contraseña
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      setFormError(passwordValidation.message);
      return false;
    }

    if (password !== confirmPassword) {
      setFormError(t('errors.passwordMatch'));
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
      setSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    try {
      await signInWithGoogleProvider();
    } catch (error) {
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
        minHeight: '100vh',
        padding: 2,
        background: `linear-gradient(45deg, ${theme.palette.background.default} 30%, ${theme.palette.primary.main} 150%)`,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          padding: { xs: 3, sm: 4 },
          width: '100%',
          maxWidth: 400,
          borderRadius: 2,
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.3)',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: theme.shadows[10],
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <Avatar
            src="/images/logo/logo.svg"
            alt="Logo"
            sx={{ width: 64, height: 64, backgroundColor: 'transparent' }}
          />
        </Box>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          textAlign="center"
          sx={{ mb: 5, fontWeight: theme => theme.typography.fontWeightBold }}
        >
          {t('signup.title')}
        </Typography>

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {t('signup.success', 'Registration successful! Redirecting...')}
          </Alert>
        )}

        {(error || formError) && !success && (
          <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
            {error || formError}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Input
            placeholder={t('signup.name')}
            value={name}
            onChange={handleInputChange(setName)}
            disabled={isSubmitting}
            required
          />
          <Input
            placeholder={t('signup.email')}
            type="email"
            value={email}
            onChange={handleInputChange(setEmail)}
            disabled={isSubmitting}
            required
          />
          <Input
            placeholder={t('signup.password')}
            type="password"
            value={password}
            onChange={handleInputChange(setPassword)}
            disabled={isSubmitting}
            required
          />
          {password && (
            <Box sx={{ width: '100%', mt: -1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="caption" sx={{ color: getStrengthColor(passwordStrength) }}>
                  {getStrengthText(passwordStrength)}
                </Typography>
              </Box>
              <Box
                sx={{
                  height: 4,
                  width: '100%',
                  bgcolor: 'action.hover',
                  borderRadius: '2px',
                }}
              >
                <Box
                  sx={{
                    height: '100%',
                    width: `${passwordStrength}%`,
                    bgcolor: getStrengthColor(passwordStrength),
                    borderRadius: 'inherit',
                    transition: 'width 0.3s, background-color 0.3s',
                  }}
                />
              </Box>
            </Box>
          )}
          <Input
            placeholder={t('signup.confirmPassword')}
            type="password"
            value={confirmPassword}
            onChange={handleInputChange(setConfirmPassword)}
            disabled={isSubmitting}
            required
          />
          <FormButton
            variant="primary"
            type="submit"
            isSubmitting={isSubmitting}
            loadingText={t('signup.signingUp')}
          >
            {t('signup.submit')}
          </FormButton>
        </Box>
        <Divider sx={{ my: 4 }}>
          <Typography variant="caption" color="text.secondary">
            {t('signup.or', 'or')}
          </Typography>
        </Divider>
        <Box sx={{ mt: 4, mb: 4 }}>
          <FormButton
            type="button"
            variant="glass"
            onClick={handleGoogleSignIn}
            isSubmitting={isSubmitting}
            loadingText={t('signin.signingIn')}
            startIcon={<Image src="/images/logo/icons8-google-48.svg" alt="Google icon" width={24} height={24} />}
            fullWidth
          >
            {t('signup.continueWithGoogle', 'Continue with Google')}
          </FormButton>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Typography variant="body2" component="span">
            {t('signup.alreadyAccount')}{' '}
          </Typography>
          <Button
            component={Link}
            href={getLocalizedRoute('/auth/signin')}
            variant="text"
            sx={{
              textTransform: 'none',
              color: 'text.secondary',
              p: 0,
              ml: 1,
              '&:hover': {
                backgroundColor: 'transparent',
                textDecoration: 'underline',
              },
            }}
          >
            {t('signup.login')}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default SignUp;