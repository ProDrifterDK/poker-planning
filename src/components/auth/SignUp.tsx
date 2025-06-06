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
  Link as MuiLink,
  LinearProgress
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useAuth } from '@/context/authContext';
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

  // Estados para los requisitos de contraseña
  const [hasMinLength, setHasMinLength] = useState(false);
  const [hasUpperCase, setHasUpperCase] = useState(false);
  const [hasLowerCase, setHasLowerCase] = useState(false);
  const [hasNumber, setHasNumber] = useState(false);
  const [hasSpecialChar, setHasSpecialChar] = useState(false);
  const { signUp, signInWithGoogleProvider, error, clearError, currentUser } = useAuth();
  const router = useRouter();
  const { t, i18n } = useTranslation('auth');

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

  // Función para verificar los requisitos de la contraseña
  const checkPasswordRequirements = (password: string) => {
    const minLength = 8;

    // Verificar cada requisito y actualizar los estados
    setHasMinLength(password.length >= minLength);
    setHasUpperCase(/[A-Z]/.test(password));
    setHasLowerCase(/[a-z]/.test(password));
    setHasNumber(/\d/.test(password));
    setHasSpecialChar(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password));
  };

  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setter(value);

      // Actualizar la fortaleza de la contraseña si el campo es la contraseña
      if (setter === setPassword) {
        setPasswordStrength(calculatePasswordStrength(value));
        checkPasswordRequirements(value);
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
      return { valid: false, message: t('signup.specialCharRequired', 'Password must include at least one special character (!@#$%^&*()_+-=[]{};\':"\\|,.<>/?)') };
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
          {t('signup.title')}
        </Typography>

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {t('signup.success', 'Registration successful! Redirecting...')}
          </Alert>
        )}

        {(error || formError) && !success && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error || formError}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            label={t('signup.name')}
            fullWidth
            margin="normal"
            variant="outlined"
            value={name}
            onChange={handleInputChange(setName)}
            disabled={isSubmitting}
            required
          />

          <TextField
            label={t('signup.email')}
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
            label={t('signup.password')}
            type="password"
            fullWidth
            margin="normal"
            variant="outlined"
            value={password}
            onChange={handleInputChange(setPassword)}
            disabled={isSubmitting}
            required
            helperText={
              <Box sx={{ mt: 0.5 }}>
                <Typography variant="caption" display="block">
                  {t('signup.passwordRequirements', 'Password must have:')}
                </Typography>
                <Box component="ul" sx={{ pl: 2, m: 0 }}>
                  <Box component="li" sx={{
                    display: 'flex',
                    alignItems: 'center',
                    color: hasMinLength ? 'success.main' : 'text.secondary',
                    transition: 'color 0.3s'
                  }}>
                    {hasMinLength ?
                      <CheckCircleOutlineIcon sx={{ fontSize: 14, mr: 0.5 }} /> :
                      <ErrorOutlineIcon sx={{ fontSize: 14, mr: 0.5 }} />
                    }
                    <Typography variant="caption">
                      {t('signup.minLength', 'At least 8 characters')}
                    </Typography>
                  </Box>

                  <Box component="li" sx={{
                    display: 'flex',
                    alignItems: 'center',
                    color: hasUpperCase ? 'success.main' : 'text.secondary',
                    transition: 'color 0.3s'
                  }}>
                    {hasUpperCase ?
                      <CheckCircleOutlineIcon sx={{ fontSize: 14, mr: 0.5 }} /> :
                      <ErrorOutlineIcon sx={{ fontSize: 14, mr: 0.5 }} />
                    }
                    <Typography variant="caption">
                      {t('signup.upperCase', 'At least one uppercase letter')}
                    </Typography>
                  </Box>

                  <Box component="li" sx={{
                    display: 'flex',
                    alignItems: 'center',
                    color: hasLowerCase ? 'success.main' : 'text.secondary',
                    transition: 'color 0.3s'
                  }}>
                    {hasLowerCase ?
                      <CheckCircleOutlineIcon sx={{ fontSize: 14, mr: 0.5 }} /> :
                      <ErrorOutlineIcon sx={{ fontSize: 14, mr: 0.5 }} />
                    }
                    <Typography variant="caption">
                      {t('signup.lowerCase', 'At least one lowercase letter')}
                    </Typography>
                  </Box>

                  <Box component="li" sx={{
                    display: 'flex',
                    alignItems: 'center',
                    color: hasNumber ? 'success.main' : 'text.secondary',
                    transition: 'color 0.3s'
                  }}>
                    {hasNumber ?
                      <CheckCircleOutlineIcon sx={{ fontSize: 14, mr: 0.5 }} /> :
                      <ErrorOutlineIcon sx={{ fontSize: 14, mr: 0.5 }} />
                    }
                    <Typography variant="caption">
                      {t('signup.number', 'At least one number')}
                    </Typography>
                  </Box>

                  <Box component="li" sx={{
                    display: 'flex',
                    alignItems: 'center',
                    color: hasSpecialChar ? 'success.main' : 'text.secondary',
                    transition: 'color 0.3s'
                  }}>
                    {hasSpecialChar ?
                      <CheckCircleOutlineIcon sx={{ fontSize: 14, mr: 0.5 }} /> :
                      <ErrorOutlineIcon sx={{ fontSize: 14, mr: 0.5 }} />
                    }
                    <Typography variant="caption">
                      {t('signup.specialChar', 'At least one special character (!@#$%^&*)')}
                    </Typography>
                  </Box>
                </Box>
                {password && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" display="block">
                      {t('signup.strength', 'Strength')}: {getStrengthText(passwordStrength)}
                    </Typography>
                    <Box
                      sx={{
                        height: 4,
                        width: '100%',
                        bgcolor: 'grey.300',
                        borderRadius: 2,
                        mt: 0.5
                      }}
                    >
                      <Box
                        sx={{
                          height: '100%',
                          width: `${passwordStrength}%`,
                          bgcolor: getStrengthColor(passwordStrength),
                          borderRadius: 2,
                          transition: 'width 0.3s, background-color 0.3s'
                        }}
                      />
                    </Box>
                  </Box>
                )}
              </Box>
            }
          />

          <TextField
            label={t('signup.confirmPassword')}
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
            {isSubmitting ? <CircularProgress size={24} color="inherit" /> : t('signup.submit')}
          </Button>
        </form>
        <Divider sx={{ my: 2 }}>{t('signup.or', 'or')}</Divider>

        <Button
          fullWidth
          variant="outlined"
          startIcon={<GoogleIcon />}
          onClick={handleGoogleSignIn}
          disabled={isSubmitting}
          sx={{ mb: 2, textTransform: "none" }}
        >
          {t('signup.continueWithGoogle', 'Continue with Google')}
        </Button>

        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2">
            {t('signup.alreadyAccount')}{' '}
            <MuiLink
              component={Link}
              href={getLocalizedRoute('/auth/signin')}
              underline="hover"
            >
              {t('signup.login')}
            </MuiLink>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default SignUp;