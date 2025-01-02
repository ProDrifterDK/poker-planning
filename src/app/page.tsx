'use client';

import { ref, set } from 'firebase/database';
import { realtimeDb } from '@/lib/firebaseConfig';
import {
  Box,
  Button,
  Card,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const seriesList: Record<string, (string | number)[]> = {
  fibonacci: [1, 2, 3, 5, 8, 13, 21, '?', '∞', '☕'],
  tshirt: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '?', '∞', '☕'],
  powers2: [1, 2, 4, 8, 16, 32, '?', '∞', '☕'],
  days: ['1d', '2d', '3d', '5d', '8d', '?', '∞', '☕'],
};

export default function HomePage() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState('');
  const [selectedSeries, setSelectedSeries] = useState('fibonacci');

  const handleCreateRoom = async () => {
    const roomId = Math.random().toString(36).substring(7);
    await set(ref(realtimeDb, `rooms/${roomId}`), {
      createdAt: Date.now(),
      seriesKey: selectedSeries,
      seriesValues: seriesList[selectedSeries],
    });
    router.push(`/room/${roomId}`);
  };

  const handleJoinRoom = () => {
    if (roomCode) {
      router.push(`/room/join?code=${roomCode}`);
    }
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      padding={2}
      gap={4}
    >
      <Typography variant="h3" marginBottom={2}>
        Planning Poker
      </Typography>

      {/* Sección para CREAR SALA */}
      <Card
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 500,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <Typography variant="h5" textAlign="center">
          Crear Sala
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Crea una nueva sala y comparte el código con tu equipo para comenzar a estimar.
        </Typography>

        <FormControl fullWidth>
          <InputLabel id="series-label">Tipo de Serie</InputLabel>
          <Select
            labelId="series-label"
            value={selectedSeries}
            label="Tipo de Serie"
            onChange={(e) => setSelectedSeries(e.target.value)}
          >
            <MenuItem value="fibonacci">Fibonacci</MenuItem>
            <MenuItem value="tshirt">T-Shirt</MenuItem>
            <MenuItem value="powers2">Poderes de 2</MenuItem>
            <MenuItem value="days">Días</MenuItem>
          </Select>
        </FormControl>

        <Button
          variant="contained"
          color="primary"
          onClick={handleCreateRoom}
          sx={{
            textTransform: 'none',
            transition: 'transform 0.2s ease',
            '&:hover': {
              transform: 'translateY(-2px) scale(1.02)',
            },
          }}
        >
          Crear Sala
        </Button>
      </Card>

      {/* Sección para UNIRSE A SALA */}
      <Card
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 500,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <Typography variant="h5" textAlign="center">
          Unirse a una Sala
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Ingresa el código de sala que te compartieron para unirte a la sesión de estimación.
        </Typography>

        <TextField
          label="Código de Sala"
          fullWidth
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
        />

        <Button
          variant="outlined"
          color="secondary"
          onClick={handleJoinRoom}
          sx={{
            textTransform: 'none',
            transition: 'transform 0.2s ease',
            '&:hover': {
              transform: 'translateY(-2px) scale(1.02)',
            },
          }}
        >
          Unirse
        </Button>
      </Card>
    </Box>
  );
}
