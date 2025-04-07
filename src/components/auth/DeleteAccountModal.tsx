'use client';

import React, { useState } from 'react';
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
          Confirmación de Eliminación de Cuenta
        </Box>
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        {/* Mensaje de advertencia */}
        <Typography variant="subtitle1" color="error" gutterBottom>
          Esta acción es permanente y no se puede deshacer.
        </Typography>
        
        <Typography variant="body1" paragraph>
          Al eliminar tu cuenta, ocurrirá lo siguiente:
        </Typography>
        
        {/* Lista de consecuencias */}
        <List>
          <ListItem>
            <ListItemIcon>
              <DeleteForeverIcon color="error" />
            </ListItemIcon>
            <ListItemText
              primary="Todos tus datos personales serán eliminados permanentemente"
              secondary="Incluyendo tu perfil, preferencias y configuraciones"
            />
          </ListItem>
          
          <ListItem>
            <ListItemIcon>
              <DataObjectIcon color="error" />
            </ListItemIcon>
            <ListItemText
              primary="Perderás acceso a todas las salas que hayas creado"
              secondary="Las salas activas serán cerradas y su historial eliminado"
            />
          </ListItem>
          
          <ListItem>
            <ListItemIcon>
              <CancelIcon color="error" />
            </ListItemIcon>
            <ListItemText
              primary="Tu participación en salas de otros usuarios será eliminada"
              secondary="Tu nombre y votos serán removidos de todas las sesiones"
            />
          </ListItem>
          
          <ListItem>
            <ListItemIcon>
              <PaymentIcon color="error" />
            </ListItemIcon>
            <ListItemText
              primary="Todas tus suscripciones activas serán canceladas automáticamente"
              secondary="No se te realizarán más cargos por suscripciones en PayPal"
            />
          </ListItem>
        </List>
        
        {/* Instrucciones para confirmar */}
        <Typography variant="body1" sx={{ mt: 2, mb: 3 }}>
          Para confirmar la eliminación de tu cuenta, por favor ingresa tu contraseña:
        </Typography>
        
        {/* Campo de contraseña */}
        <TextField
          label="Contraseña"
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
          Cancelar
        </Button>
        <Button 
          onClick={handleConfirm} 
          color="error" 
          variant="contained"
          disabled={!deletePassword || isSubmitting}
          startIcon={<DeleteForeverIcon />}
        >
          {isSubmitting ? <CircularProgress size={24} /> : "Eliminar mi cuenta permanentemente"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteAccountModal;