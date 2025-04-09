'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Box,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  InputAdornment,
  IconButton,
  CircularProgress
} from '@mui/material';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import WarningIcon from '@mui/icons-material/Warning';
import CancelIcon from '@mui/icons-material/Cancel';
import DataObjectIcon from '@mui/icons-material/DataObject';
import PaymentIcon from '@mui/icons-material/Payment';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

interface DeleteAccountModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (password: string) => Promise<void>;
  isSubmitting: boolean;
}

/**
 * Modal de confirmación para eliminar cuenta de usuario
 * Muestra información detallada sobre las implicaciones de eliminar la cuenta
 * y solicita la contraseña del usuario para confirmar la acción
 */
const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  open,
  onClose,
  onConfirm,
  isSubmitting
}) => {
  const { t } = useTranslation('auth');
  
  // Estados locales
  const [deletePassword, setDeletePassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Manejar el cierre del modal
  const handleCancel = () => {
    setDeletePassword('');
    setShowPassword(false);
    onClose();
  };

  // Manejar la confirmación de eliminación
  const handleConfirm = async () => {
    if (!deletePassword) return;
    await onConfirm(deletePassword);
    setDeletePassword('');
    setShowPassword(false);
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      aria-labelledby="delete-account-dialog-title"
      aria-describedby="delete-account-dialog-description"
      maxWidth="md"
    >
      <DialogTitle id="delete-account-dialog-title" sx={{ bgcolor: 'error.main', color: 'white' }}>
        <Box display="flex" alignItems="center">
          <WarningIcon sx={{ mr: 1 }} />
          {t('deleteAccountModal.title')}
        </Box>
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        {/* Mensaje de advertencia */}
        <Typography variant="subtitle1" color="error" gutterBottom>
          {t('deleteAccountModal.warning')}
        </Typography>
        
        <Typography variant="body1" paragraph>
          {t('deleteAccountModal.consequences')}
        </Typography>
        
        {/* Lista de consecuencias */}
        <List>
          <ListItem>
            <ListItemIcon>
              <DeleteForeverIcon color="error" />
            </ListItemIcon>
            <ListItemText
              primary={t('deleteAccountModal.personalData')}
              secondary={t('deleteAccountModal.personalDataDetails')}
            />
          </ListItem>
          
          <ListItem>
            <ListItemIcon>
              <DataObjectIcon color="error" />
            </ListItemIcon>
            <ListItemText
              primary={t('deleteAccountModal.rooms')}
              secondary={t('deleteAccountModal.roomsDetails')}
            />
          </ListItem>
          
          <ListItem>
            <ListItemIcon>
              <CancelIcon color="error" />
            </ListItemIcon>
            <ListItemText
              primary={t('deleteAccountModal.participation')}
              secondary={t('deleteAccountModal.participationDetails')}
            />
          </ListItem>
          
          <ListItem>
            <ListItemIcon>
              <PaymentIcon color="error" />
            </ListItemIcon>
            <ListItemText
              primary={t('deleteAccountModal.subscriptions')}
              secondary={t('deleteAccountModal.subscriptionsDetails')}
            />
          </ListItem>
        </List>
        
        {/* Instrucciones para confirmar */}
        <Typography variant="body1" sx={{ mt: 2, mb: 3 }}>
          {t('deleteAccountModal.confirmInstructions')}
        </Typography>
        
        {/* Campo de contraseña */}
        <TextField
          label={t('deleteAccountModal.password')}
          type={showPassword ? "text" : "password"}
          fullWidth
          value={deletePassword}
          onChange={(e) => setDeletePassword(e.target.value)}
          variant="outlined"
          required
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                >
                  {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button 
          onClick={handleCancel} 
          variant="outlined"
          startIcon={<CancelIcon />}
        >
          {t('deleteAccountModal.cancel')}
        </Button>
        <Button 
          onClick={handleConfirm} 
          color="error" 
          variant="contained"
          disabled={!deletePassword || isSubmitting}
          startIcon={<DeleteForeverIcon />}
        >
          {isSubmitting ? <CircularProgress size={24} /> : t('deleteAccountModal.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteAccountModal;