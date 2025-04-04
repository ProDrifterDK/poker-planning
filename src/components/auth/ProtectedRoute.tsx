'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/authContext';
import { Box, CircularProgress, Button, TextField, Typography, Paper, Modal } from '@mui/material';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebaseConfig';

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  redirectTo = '/auth/signin'
}) => {
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  // Estado para el modal de acceso como invitado
  const [openGuestModal, setOpenGuestModal] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestError, setGuestError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingAuth, setProcessingAuth] = useState(false);
  
  // Verificar si la ruta actual es una página de sala
  const isRoomPage = pathname?.startsWith('/room/') && pathname?.length > 6;
  
  // Guardar la URL actual para redirección después del inicio de sesión
  useEffect(() => {
    if (isRoomPage && !currentUser && !loading) {
      // Guardar la URL actual en sessionStorage para redirección posterior
      sessionStorage.setItem('redirectAfterAuth', pathname);
    }
  }, [isRoomPage, currentUser, loading, pathname]);
  
  useEffect(() => {
    if (!loading && !currentUser && !processingAuth) {
      if (isRoomPage) {
        // Si es una página de sala, mostrar el modal de acceso como invitado
        setOpenGuestModal(true);
      } else {
        // Para otras páginas protegidas, redirigir normalmente
        router.push(`${redirectTo}?returnUrl=${encodeURIComponent(pathname || '/')}`);
      }
    }
  }, [currentUser, loading, redirectTo, router, isRoomPage, pathname, processingAuth]);

  // Función para continuar como invitado
  const handleContinueAsGuest = async () => {
    if (!guestName.trim()) {
      setGuestError('Por favor ingresa tu nombre');
      return;
    }
    
    setIsSubmitting(true);
    setProcessingAuth(true); // Marcar que estamos procesando la autenticación
    
    try {
      // Generar un correo electrónico aleatorio para el usuario invitado
      const randomEmail = `guest_${Math.random().toString(36).substring(2, 10)}@guest.planningpokerpro.com`;
      const randomPassword = Math.random().toString(36).substring(2, 15);
      
      // Crear un usuario con Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, randomEmail, randomPassword);
      
      // Actualizar el perfil con el nombre proporcionado y marcar como invitado
      await updateProfile(userCredential.user, {
        displayName: guestName,
        // Añadir un campo personalizado para identificar a los usuarios invitados
        photoURL: 'guest_user' // Usamos photoURL como un indicador de usuario invitado
      });
      
      console.log('Usuario invitado creado con éxito:', userCredential.user);
      console.log('photoURL establecido:', userCredential.user.photoURL);
      console.log('displayName establecido:', userCredential.user.displayName);
      
      // Cerrar el modal - el useEffect detectará que el usuario está autenticado
      setOpenGuestModal(false);
      
      // Guardar en localStorage que es un usuario invitado y su nombre para futuras referencias
      localStorage.setItem('isGuestUser', 'true');
      localStorage.setItem('guestName', guestName);
      console.log('Nombre de invitado guardado en localStorage:', guestName);
      
    } catch (error) {
      console.error('Error al crear usuario invitado:', error);
      setGuestError('Error al crear usuario invitado. Por favor intenta nuevamente.');
      setProcessingAuth(false); // Resetear el estado si hay un error
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Función para ir a la página de inicio de sesión
  const handleGoToSignIn = () => {
    setOpenGuestModal(false);
    setProcessingAuth(true); // Marcar que estamos procesando la autenticación
    router.push(`${redirectTo}?returnUrl=${encodeURIComponent(pathname || '/')}`);
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!currentUser) {
    return (
      <Modal
        open={openGuestModal}
        aria-labelledby="guest-access-modal-title"
        aria-describedby="guest-access-modal-description"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper
          sx={{
            width: '90%',
            maxWidth: 400,
            p: 4,
            outline: 'none',
            borderRadius: 2,
          }}
        >
          <Typography id="guest-access-modal-title" variant="h5" component="h2" gutterBottom>
            Acceso a la sala
          </Typography>
          
          <Typography id="guest-access-modal-description" sx={{ mt: 2, mb: 3 }}>
            Puedes iniciar sesión con tu cuenta o continuar como invitado para acceder a esta sala.
          </Typography>
          
          {guestError && (
            <Typography color="error" sx={{ mb: 2 }}>
              {guestError}
            </Typography>
          )}
          
          <TextField
            label="Tu nombre"
            fullWidth
            value={guestName}
            onChange={(e) => {
              setGuestName(e.target.value);
              if (guestError) setGuestError(null);
            }}
            margin="normal"
            disabled={isSubmitting}
            placeholder="Ej: Juan Pérez"
          />
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={handleGoToSignIn}
              disabled={isSubmitting}
              sx={{ flex: 1 }}
            >
              Iniciar sesión
            </Button>
            
            <Button
              variant="contained"
              color="primary"
              onClick={handleContinueAsGuest}
              disabled={isSubmitting}
              sx={{ flex: 1 }}
            >
              {isSubmitting ? <CircularProgress size={24} /> : 'Continuar como invitado'}
            </Button>
          </Box>
        </Paper>
      </Modal>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;