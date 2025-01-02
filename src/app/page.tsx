'use client';

import { ref, set } from 'firebase/database';
import { realtimeDb } from '@/lib/firebaseConfig';
import { Box, Button, Card, TextField, Typography, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const seriesList: Record<string, (string | number)[]> = {
  fibonacci: [1, 2, 3, 5, 8, 13, 21, '?', '∞', '☕'],
  tshirt: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '?', '∞', '☕'],
  powers2: [1, 2, 4, 8, 16, 32, '?', '∞', '☕'],
  days: ['1d', '2d', '3d', '5d', '8d', '?', '∞', '☕']
};

export default function HomePage() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState('');
  const [selectedSeries, setSelectedSeries] = useState('fibonacci');

  const handleCreateRoom = async () => {
    // Genera un ID aleatorio
    const roomId = Math.random().toString(36).substring(7);

    // Aquí guardamos tanto la serie "clave" (p.ej. 'fibonacci') como el array
    await set(ref(realtimeDb, `rooms/${roomId}`), {
      createdAt: Date.now(),
      seriesKey: selectedSeries,                     // 'fibonacci', 'tshirt', etc.
      seriesValues: seriesList[selectedSeries],      // [1, 2, 3, 5...] o ['XS','S'...]
    });

    router.push(`/room/${roomId}`);
  };

  const handleJoinRoom = () => {
    if (roomCode) router.push(`/room/join?code=${roomCode}`);
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      height="100vh"
      padding={2}
    >
      <Typography variant="h4" marginBottom={2}>
        Poker Planning
      </Typography>
      <Card style={{ padding: 20, maxWidth: 400, width: '100%' }}>
        <Box marginBottom={2}>
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
        </Box>

        <Box marginBottom={2}>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={handleCreateRoom}
            sx={{
              textTransform: 'none'
            }}
          >
            Crear Sala
          </Button>
        </Box>

        <Box marginBottom={2}>
          <TextField
            label="Código de Sala"
            fullWidth
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
          />
        </Box>

        <Button
          fullWidth
          variant="outlined"
          onClick={handleJoinRoom}
          sx={{
            textTransform: 'none'
          }}>
          Unirse a una Sala
        </Button>
      </Card>
    </Box>
  );
}
