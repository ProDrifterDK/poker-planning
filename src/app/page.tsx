'use client';

import { Box, Button, Card, TextField, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function HomePage() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState('');

  const handleCreateRoom = () => {
    // Redirige a una nueva sala
    router.push(`/room/${Math.random().toString(36).substring(7)}`);
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
          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={handleCreateRoom}
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
        <Button fullWidth variant="outlined" onClick={handleJoinRoom}>
          Unirse a una Sala
        </Button>
      </Card>
    </Box>
  );
}
