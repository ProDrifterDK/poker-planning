import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, CircularProgress, Paper, Theme, useTheme } from '@mui/material';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/authContext';

interface JoinRoomPanelProps {
  onJoinRoom: (roomCode: string) => void;
  isLoading: boolean;
  name: string;
  onNameChange: (name: string) => void;
}

const StyledPaper = styled(Paper)<{ theme: Theme }>`
  padding: ${({ theme }) => theme.spacing(4)};
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(3)};
  text-align: center;
`;

const StyledButton = styled(Button)<{ theme: Theme }>`
  height: 56px;
  text-transform: none;
  font-size: 1rem;
  transition: ${({ theme }) =>
    theme.transitions.create(['background-color', 'transform'], {
      duration: theme.transitions.duration.short,
    })};

  &:hover {
    transform: ${({ disabled }) => (disabled ? 'none' : 'translateY(-2px)')};
  }
`;

const JoinRoomPanel: React.FC<JoinRoomPanelProps> = ({ onJoinRoom, isLoading, name, onNameChange }) => {
  const { t } = useTranslation(['room', 'common']);
  const { currentUser } = useAuth();
  const theme = useTheme();
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
    <StyledPaper elevation={3} theme={theme} role="region" aria-labelledby="join-room-title">
      <Box>
        <Typography variant="h4" component="h2" gutterBottom id="join-room-title">
          {t('join.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary" id="join-room-description">
          {t('joinRoomDescription', 'Ingresa el código de sala que te compartieron para unirte a la sesión de estimación.')}
        </Typography>
      </Box>
      <Box component="form" onSubmit={handleJoin} sx={{ display: 'contents' }} aria-busy={isLoading}>
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
          aria-describedby={currentUser?.displayName ? "your-name-helper-text" : undefined}
          FormHelperTextProps={{ id: 'your-name-helper-text' }}
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
        <StyledButton
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          disabled={isButtonDisabled}
          theme={theme}
          aria-label={isLoading ? t('join.loading', 'Joining room...') : t('join.submit')}
        >
          {isLoading ? <CircularProgress size={24} color="inherit" /> : t('join.submit')}
        </StyledButton>
      </Box>
    </StyledPaper>
  );
};

export default JoinRoomPanel;