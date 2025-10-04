import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Paper,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/authContext';

interface JoinRoomPanelProps {
  onJoinRoom: (roomCode: string) => void;
  isLoading: boolean;
  name: string;
  onNameChange: (name: string) => void;
}

const JoinRoomPanel: React.FC<JoinRoomPanelProps> = ({ onJoinRoom, isLoading, name, onNameChange }) => {
  const { t } = useTranslation(['room', 'common']);
  const { currentUser } = useAuth();
  const [roomCode, setRoomCode] = useState('');

  useEffect(() => {
    if (currentUser?.displayName && !name) {
      onNameChange(currentUser.displayName);
    }
  }, [currentUser, name, onNameChange]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode.trim()) {
      onJoinRoom(roomCode.trim());
    }
  };

  const isButtonDisabled = !roomCode.trim() || !name.trim() || isLoading;

  return (
    <Paper
      elevation={3}
      sx={{
        p: 4,
        width: '100%',
        maxWidth: 400,
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        textAlign: 'center',
      }}
    >
      <Box>
        <Typography variant="h4" component="h2" gutterBottom>
          {t('join.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('joinRoomDescription', 'Ingresa el código de sala que te compartieron para unirte a la sesión de estimación.')}
        </Typography>
      </Box>
      <Box component="form" onSubmit={handleJoin} sx={{ display: 'contents' }}>
        <TextField
          id="your-name-input-join"
          label={t('join.yourName')}
          variant="outlined"
          fullWidth
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          disabled={isLoading || !!currentUser?.displayName}
          required
          helperText={currentUser?.displayName ? t('usingProfileName', 'Usando tu nombre de perfil') : ''}
        />
        <TextField
          id="room-code-input"
          label={t('join.roomCode')}
          variant="outlined"
          fullWidth
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
          disabled={isLoading}
          required
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          disabled={isButtonDisabled}
          sx={{
            height: 56,
            textTransform: 'none',
            fontSize: '1rem',
            transition: (theme) =>
              theme.transitions.create(['background-color', 'transform'], {
                duration: theme.transitions.duration.short,
              }),
            '&:hover': {
              transform: isButtonDisabled ? 'none' : 'translateY(-2px)',
            },
          }}
        >
          {isLoading ? <CircularProgress size={24} color="inherit" /> : t('join.submit')}
        </Button>
      </Box>
    </Paper>
  );
};

export default JoinRoomPanel;