import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Theme,
  useTheme,
} from '@mui/material';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/authContext';
import { SubscriptionPlan } from '@/types/subscription';

interface CreateRoomPanelProps {
  onCreateRoom: (roomTitle: string, selectedSeries: string) => void;
  isLoading: boolean;
  canCreateRoom: boolean;
  currentPlan: SubscriptionPlan;
  name: string;
  onNameChange: (name: string) => void;
}

const StyledPaper = styled(Paper)<{ theme: Theme }>`
  padding: ${({ theme }) => theme.spacing(4)};
  width: 100%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(3)};
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

const CreateRoomPanel: React.FC<CreateRoomPanelProps> = ({
  onCreateRoom,
  isLoading,
  canCreateRoom,
  currentPlan,
  name,
  onNameChange,
}) => {
  const { t } = useTranslation(['room', 'common']);
  const { currentUser } = useAuth();
  const theme = useTheme();

  const [roomTitle, setRoomTitle] = useState('');
  const [selectedSeries, setSelectedSeries] = useState('fibonacci');

  useEffect(() => {
    if (currentUser?.displayName && !name) {
      onNameChange(currentUser.displayName);
    }
  }, [currentUser, name, onNameChange]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreateRoom(roomTitle.trim(), selectedSeries);
    }
  };

  const isButtonDisabled = !name.trim() || isLoading || !canCreateRoom;

  return (
    <StyledPaper elevation={3} theme={theme} role="region" aria-labelledby="create-room-title">
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h4" component="h2" gutterBottom id="create-room-title">
          {t('create.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary" id="create-room-description">
          {t('createRoomDescription', 'Crea una nueva sala y comparte el código con tu equipo para comenzar a estimar.')}
        </Typography>
      </Box>
      <Box component="form" onSubmit={handleCreate} sx={{ display: 'contents' }} aria-busy={isLoading}>
        <TextField
          id="your-name-input-create"
          label={t('join.yourName')}
          variant="outlined"
          fullWidth
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          disabled={isLoading || !!currentUser?.displayName}
          required
          helperText={currentUser?.displayName ? t('usingProfileName', 'Usando tu nombre de perfil') : ''}
          aria-describedby={currentUser?.displayName ? "your-name-helper-text-create" : undefined}
          FormHelperTextProps={{ id: 'your-name-helper-text-create' }}
        />
        <TextField
          id="room-title-input"
          label={t('roomTitle', 'Título de la sala (opcional)')}
          variant="outlined"
          fullWidth
          value={roomTitle}
          onChange={(e) => setRoomTitle(e.target.value)}
          disabled={isLoading}
          placeholder={t('roomTitlePlaceholder', 'Ej: Sprint 5 - Poker Planning Project')}
        />
        <FormControl fullWidth disabled={isLoading}>
          <InputLabel id="series-type-label">{t('seriesType', 'Tipo de Serie')}</InputLabel>
          <Select
            labelId="series-type-label"
            id="series-type-select"
            value={selectedSeries}
            label={t('seriesType', 'Tipo de Serie')}
            onChange={(e) => setSelectedSeries(e.target.value)}
          >
            <MenuItem value="fibonacci">{t('create.fibonacci')}</MenuItem>
            <MenuItem value="tshirt">{t('create.tShirt')}</MenuItem>
            <MenuItem value="powers2">{t('powers2', 'Poderes de 2')}</MenuItem>
            <MenuItem value="days">{t('activeRooms.days')}</MenuItem>
          </Select>
        </FormControl>
        <Tooltip
          title={
            !canCreateRoom && currentPlan === SubscriptionPlan.FREE
              ? t('activeRooms.freePlanLimit', 'Los usuarios del plan Free solo pueden tener una sala activa a la vez. Por favor, abandona tu sala actual antes de crear una nueva.')
              : ''
          }
          placement="top"
        >
          <span>
            <StyledButton
              type="submit"
              variant="contained"
              color="secondary"
              size="large"
              disabled={isButtonDisabled}
              fullWidth
              theme={theme}
              aria-label={isLoading ? t('create.loading', 'Creating room...') : t('create.submit')}
            >
              {isLoading ? <CircularProgress size={24} color="inherit" /> : t('create.submit')}
            </StyledButton>
          </span>
        </Tooltip>
      </Box>
    </StyledPaper>
  );
};

export default CreateRoomPanel;