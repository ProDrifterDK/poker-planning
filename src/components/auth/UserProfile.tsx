'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  InputAdornment,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
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
import DeleteAccountModal from './DeleteAccountModal';

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
  const { t } = useTranslation('auth');
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

  // Estado para el modal de eliminación de cuenta
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

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
      setFormError(t('errors.nameRequired'));
      return false;
    }

    // Validar email
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError(t('errors.invalidEmail'));
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

  const handleEmailUpdate = async () => {

    // Aquí se implementaría un diálogo para solicitar la contraseña actual
    const currentPassword = prompt(t('profile.currentPassword'));

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

  const handleDeleteAccount = () => {
    // Abrir el modal de confirmación
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async (password: string) => {
    setIsSubmitting(true);
    try {
      await deleteAccount(password);
      // La redirección se manejará automáticamente por el ProtectedRoute
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // El error ya se maneja en el contexto de autenticación
    } finally {
      setIsSubmitting(false);
      setDeleteConfirmOpen(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
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
            setFormError(t('profile.imageTooBig'));
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
          setFormError(t('errors.genericError'));
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
        <CircularProgress color="primary" />
        <Typography variant="h6" sx={{ ml: 2 }}>
          {t('profile.loading')}
        </Typography>
      </Box>
    );
  }

  // Debug output
  console.log('Rendering UserProfile with photoURL:', photoURL ? photoURL.substring(0, 50) + '...' : 'null');

  return (
    <>
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
            borderRadius: theme => theme.shape.borderRadius,
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
                  color: (theme) => theme.palette.getContrastText(theme.palette.primary.main),
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
              <Typography variant="h5" component="h3" gutterBottom>
                {t('profile.title')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {currentUser.email}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 2 }} />

          {isSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {t('profile.updated')}
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
              <Tab icon={<PersonIcon />} label={t('profile.personalInfo')} />
              <Tab icon={<BusinessIcon />} label={t('profile.professionalInfo')} />
              <Tab icon={<NotificationsIcon />} label={t('profile.notifications')} />
              <Tab icon={<SecurityIcon />} label={t('profile.security')} />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label={t('profile.name')}
                    fullWidth
                    variant="outlined"
                    value={displayName}
                    onChange={handleDisplayNameChange}
                    disabled={isSubmitting}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label={t('profile.email')}
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
                          <Tooltip title={t('profile.updateEmail')}>
                            <span>
                              <IconButton
                                edge="end"
                                color="primary"
                                onClick={handleEmailUpdate}
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
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label={t('profile.phoneNumber')}
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
                  {t('profile.logout')}
                </Button>

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <CircularProgress size={24} color="inherit" /> : t('profile.saveChanges')}
                </Button>
              </Box>
            </form>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label={t('profile.jobTitle')}
                    fullWidth
                    variant="outlined"
                    value={jobTitle}
                    onChange={handleJobTitleChange}
                    disabled={isSubmitting}
                    placeholder="Scrum Master, Project Manager, Developer"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label={t('profile.company')}
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
                  {isSubmitting ? <CircularProgress size={24} color="inherit" /> : t('profile.saveChanges')}
                </Button>
              </Box>
            </form>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <form onSubmit={handleNotificationSubmit}>
              <Typography variant="h6" gutterBottom>
                {t('profile.notifications')}
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
                    label={t('profile.emailNotifications')}
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
                    label={t('profile.pushNotifications')}
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
                    label={t('profile.roomInvites')}
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
                    label={t('profile.weeklyDigest')}
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
                  {isSubmitting ? <CircularProgress size={24} color="inherit" /> : t('profile.savePreferences')}
                </Button>
              </Box>
            </form>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <Typography variant="h6" gutterBottom>
              {t('profile.security')}
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                {t('profile.changePassword')}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {t('forgotPassword.instructions')}
              </Typography>
              <Button
                variant="outlined"
                color="primary"
                onClick={handleLogout}
              >
                {t('profile.logout')}
              </Button>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box>
              <Typography variant="subtitle1" gutterBottom color="error">
                {t('profile.deleteAccount')}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {t('errors.genericError')}
              </Typography>
              <Button
                variant="outlined"
                color="error"
                onClick={handleDeleteAccount}
                disabled={isSubmitting}
              >
                {t('profile.deleteAccount')}
              </Button>
            </Box>
          </TabPanel>
        </Paper>
      </Box>

      {/* Modal de confirmación para eliminar cuenta */}
      <DeleteAccountModal
        open={deleteConfirmOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        isSubmitting={isSubmitting}
      />
    </>
  );
};

export default UserProfile;