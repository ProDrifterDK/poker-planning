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
          router.push('/');
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
      return { valid: false, message: `La contraseña debe tener al menos ${minLength} caracteres` };
    }
    
    if (!hasUpperCase) {
      return { valid: false, message: 'La contraseña debe incluir al menos una letra mayúscula' };
    }
    
    if (!hasLowerCase) {
      return { valid: false, message: 'La contraseña debe incluir al menos una letra minúscula' };
    }
    
    if (!hasNumbers) {
      return { valid: false, message: 'La contraseña debe incluir al menos un número' };
    }
    
    if (!hasSpecialChar) {
      return { valid: false, message: 'La contraseña debe incluir al menos un carácter especial (!@#$%^&*()_+-=[]{};\':"\\|,.<>/?)' };
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
    if (strength < 30) return 'Muy débil';
    if (strength < 60) return 'Débil';
    if (strength < 80) return 'Moderada';
    return 'Fuerte';
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
    
    // Validar requisitos de contraseña
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      setFormError(passwordValidation.message);
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
            helperText={
              <Box sx={{ mt: 0.5 }}>
                <Typography variant="caption" display="block">
                  La contraseña debe tener:
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
                      Al menos 8 caracteres
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
                      Al menos una letra mayúscula
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
                      Al menos una letra minúscula
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
                      Al menos un número
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
                      Al menos un carácter especial (!@#$%^&*)
                    </Typography>
                  </Box>
                </Box>
                {password && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" display="block">
                      Fortaleza: {getStrengthText(passwordStrength)}
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