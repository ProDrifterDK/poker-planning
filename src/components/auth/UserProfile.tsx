'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Avatar,
  Alert,
  CircularProgress,
  Divider,
  Tabs,
  Tab,
  Grid,
  FormControlLabel,
  Switch,
  IconButton,
  Tooltip,
  InputAdornment
} from '@mui/material';
import { useAuth } from '@/context/authContext';
import { getUserProfile, uploadProfileImage } from '@/lib/userProfileService';
import { useUserProfile } from '@/hooks/useUserProfile';
import EditIcon from '@mui/icons-material/Edit';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import BusinessIcon from '@mui/icons-material/Business';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SecurityIcon from '@mui/icons-material/Security';
import PersonIcon from '@mui/icons-material/Person';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const UserProfile: React.FC = () => {
  const {
    currentUser,
    updateProfile,
    updateUserData,
    updateUserEmail,
    updateNotificationPreferences,
    deleteAccount,
    logout,
    error,
    clearError
  } = useAuth();
  const { updateProfilePhoto, reloadProfile } = useUserProfile();
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  
  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [roomInvites, setRoomInvites] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  
  // Load user profile data when component mounts
  useEffect(() => {
    const loadUserProfile = async () => {
      if (currentUser) {
        try {
          setIsLoading(true);
          const profileData = await getUserProfile(currentUser.uid);
          
          if (profileData) {
            // Set basic profile data
            setDisplayName(profileData.displayName || '');
            setEmail(profileData.email || '');
            
            if (profileData.photoURL) {
              console.log('Loading profile photo from Firestore:', profileData.photoURL.substring(0, 50) + '...');
              setPhotoURL(profileData.photoURL);
            } else {
              console.log('No profile photo found in Firestore');
              setPhotoURL(null);
            }
            
            // Set additional profile data
            setPhoneNumber(profileData.phoneNumber || '');
            setJobTitle(profileData.jobTitle || '');
            setCompany(profileData.company || '');
            
            // Set notification preferences
            if (profileData.notificationPreferences) {
              setEmailNotifications(profileData.notificationPreferences.email ?? true);
              setPushNotifications(profileData.notificationPreferences.push ?? true);
              setRoomInvites(profileData.notificationPreferences.roomInvites ?? true);
              setWeeklyDigest(profileData.notificationPreferences.weeklyDigest ?? false);
            }
          }
        } catch (error) {
          console.error('Error loading user profile:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    loadUserProfile();
  }, [currentUser]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayName(e.target.value);
    if (formError) setFormError(null);
    if (error) clearError();
    if (isSuccess) setIsSuccess(false);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (formError) setFormError(null);
    if (error) clearError();
    if (isSuccess) setIsSuccess(false);
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(e.target.value);
    if (formError) setFormError(null);
    if (error) clearError();
    if (isSuccess) setIsSuccess(false);
  };

  const handleJobTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setJobTitle(e.target.value);
    if (formError) setFormError(null);
    if (error) clearError();
    if (isSuccess) setIsSuccess(false);
  };

  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCompany(e.target.value);
    if (formError) setFormError(null);
    if (error) clearError();
    if (isSuccess) setIsSuccess(false);
  };

  const validateForm = () => {
    if (!displayName.trim()) {
      setFormError('El nombre es obligatorio');
      return false;
    }
    
    // Validar email
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError('El formato del correo electrónico no es válido');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      // Actualizar nombre y preservar la foto de perfil actual
      console.log('Guardando cambios, preservando photoURL:', photoURL ? 'presente' : 'ausente');
      await updateProfile(displayName, photoURL || undefined);
      
      // Actualizar campos adicionales
      await updateUserData({
        phoneNumber,
        jobTitle,
        company
      });
      
      setIsSuccess(true);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // El error ya se maneja en el contexto de autenticación
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Aquí se implementaría un diálogo para solicitar la contraseña actual
    const currentPassword = prompt('Ingresa tu contraseña actual para confirmar el cambio de email:');
    
    if (!currentPassword) return;
    
    setIsSubmitting(true);
    try {
      await updateUserEmail(currentPassword, email);
      setIsSuccess(true);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // El error ya se maneja en el contexto de autenticación
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNotificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    try {
      await updateNotificationPreferences({
        email: emailNotifications,
        push: pushNotifications,
        roomInvites,
        weeklyDigest
      });
      
      setIsSuccess(true);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // El error ya se maneja en el contexto de autenticación
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    // Confirmar con el usuario
    const confirmed = window.confirm('¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer.');
    
    if (!confirmed) return;
    
    // Solicitar contraseña
    const currentPassword = prompt('Ingresa tu contraseña para confirmar la eliminación de tu cuenta:');
    
    if (!currentPassword) return;
    
    setIsSubmitting(true);
    try {
      await deleteAccount(currentPassword);
      // La redirección se manejará automáticamente por el ProtectedRoute
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // El error ya se maneja en el contexto de autenticación
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      // La redirección se manejará automáticamente por el ProtectedRoute
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // No registramos el error en la consola por razones de seguridad
    }
  };

  const handleUploadPhoto = () => {
    if (!currentUser) return;
    
    setIsSubmitting(true);
    setFormError(null);
    
    console.log('Iniciando proceso de subida de imagen');
    
    // Crear un input de tipo file y abrirlo
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    
    fileInput.onchange = async (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        try {
          const file = target.files[0];
          console.log('Archivo seleccionado:', file.name, 'Tamaño:', file.size, 'bytes');
          
          // Verificar tamaño del archivo (máximo 2MB)
          if (file.size > 2 * 1024 * 1024) {
            setFormError('La imagen es demasiado grande. El tamaño máximo es 2MB.');
            setIsSubmitting(false);
            return;
          }
          
          // Subir la imagen como base64
          console.log('Subiendo imagen...');
          const dataUrl = await uploadProfileImage(currentUser.uid, file);
          console.log('Imagen subida correctamente, longitud de dataUrl:', dataUrl.length);
          
          // Actualizar el estado local y el header
          console.log('Imagen subida correctamente, actualizando estado local con dataUrl:', dataUrl.substring(0, 50) + '...');
          setPhotoURL(dataUrl);
          updateProfilePhoto(dataUrl);
          
          // Forzar una recarga del perfil en el header
          reloadProfile();
          
          // Mostrar mensaje de éxito
          setFormError(null);
          setIsSuccess(true);
          
          // No es necesario recargar la página ya que actualizamos el estado local
          console.log('Proceso de subida completado con éxito');
        } catch (error) {
          console.error('Error al subir imagen:', error);
          setFormError('No se pudo subir la imagen. Inténtalo de nuevo.');
        } finally {
          setIsSubmitting(false);
        }
      } else {
        console.log('No se seleccionó ningún archivo');
        setIsSubmitting(false);
      }
    };
    
    fileInput.click();
  };

  if (!currentUser) {
    return null; // No debería ocurrir debido al ProtectedRoute
  }
  
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Cargando perfil...
        </Typography>
      </Box>
    );
  }
  
  // Debug output
  console.log('Rendering UserProfile with photoURL:', photoURL ? photoURL.substring(0, 50) + '...' : 'null');

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
          maxWidth: 800,
          borderRadius: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Box sx={{ position: 'relative' }}>
            {photoURL ? (
              <Avatar
                src={photoURL}
                alt={currentUser.displayName || 'Usuario'}
                sx={{ width: 80, height: 80, mr: 2 }}
                imgProps={{
                  onError: (e) => {
                    console.error('Error loading profile image:', e);
                    // Fallback to default avatar
                    (e.target as HTMLImageElement).src = '';
                  }
                }}
              />
            ) : (
              <Avatar
                sx={{ width: 80, height: 80, mr: 2, bgcolor: 'secondary.main' }}
              >
                <PersonIcon sx={{ fontSize: 40 }} />
              </Avatar>
            )}
            <IconButton
              size="small"
              sx={{
                position: 'absolute',
                bottom: 0,
                right: 8,
                backgroundColor: 'primary.main',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                }
              }}
              onClick={handleUploadPhoto}
            >
              <PhotoCameraIcon fontSize="small" />
            </IconButton>
          </Box>
          <Box>
            <Typography variant="h5" component="h1" gutterBottom>
              Mi Perfil
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {currentUser.email}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 2 }} />
        
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
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="profile tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab icon={<PersonIcon />} label="Información Personal" />
            <Tab icon={<BusinessIcon />} label="Información Profesional" />
            <Tab icon={<NotificationsIcon />} label="Notificaciones" />
            <Tab icon={<SecurityIcon />} label="Seguridad" />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Nombre"
                  fullWidth
                  variant="outlined"
                  value={displayName}
                  onChange={handleDisplayNameChange}
                  disabled={isSubmitting}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <form onSubmit={handleEmailUpdate}>
                  <TextField
                    label="Correo Electrónico"
                    fullWidth
                    variant="outlined"
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    disabled={isSubmitting}
                    required
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="Cambiar email requiere verificación">
                            <span>
                              <IconButton
                                edge="end"
                                color="primary"
                                type="submit"
                                disabled={isSubmitting || email === currentUser?.email}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }}
                  />
                </form>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Teléfono"
                  fullWidth
                  variant="outlined"
                  value={phoneNumber}
                  onChange={handlePhoneNumberChange}
                  disabled={isSubmitting}
                  placeholder="Opcional"
                />
              </Grid>
            </Grid>
            
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
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Cargo / Puesto"
                  fullWidth
                  variant="outlined"
                  value={jobTitle}
                  onChange={handleJobTitleChange}
                  disabled={isSubmitting}
                  placeholder="Ej: Scrum Master, Project Manager, Developer"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Empresa / Organización"
                  fullWidth
                  variant="outlined"
                  value={company}
                  onChange={handleCompanyChange}
                  disabled={isSubmitting}
                  placeholder="Opcional"
                />
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
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
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <form onSubmit={handleNotificationSubmit}>
            <Typography variant="h6" gutterBottom>
              Preferencias de Notificación
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={emailNotifications}
                      onChange={(e) => setEmailNotifications(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Recibir notificaciones por correo electrónico"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={pushNotifications}
                      onChange={(e) => setPushNotifications(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Recibir notificaciones push en el navegador"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={roomInvites}
                      onChange={(e) => setRoomInvites(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Notificarme sobre invitaciones a salas"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={weeklyDigest}
                      onChange={(e) => setWeeklyDigest(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Recibir resumen semanal de actividad"
                />
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Guardar Preferencias'}
              </Button>
            </Box>
          </form>
        </TabPanel>
        
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            Seguridad de la Cuenta
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Cambio de Contraseña
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Para cambiar tu contraseña, primero debes cerrar sesión y usar la opción &ldquo;Olvidé mi contraseña&rdquo; en la pantalla de inicio de sesión.
            </Typography>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleLogout}
            >
              Cerrar Sesión para Cambiar Contraseña
            </Button>
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          <Box>
            <Typography variant="subtitle1" gutterBottom color="error">
              Zona de Peligro
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Eliminar tu cuenta es una acción permanente y no se puede deshacer. Todos tus datos serán eliminados.
            </Typography>
            <Button
              variant="outlined"
              color="error"
              onClick={handleDeleteAccount}
              disabled={isSubmitting}
            >
              Eliminar mi Cuenta
            </Button>
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default UserProfile;