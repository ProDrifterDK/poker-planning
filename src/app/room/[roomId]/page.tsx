'use client';

import { useParams } from 'next/navigation';
import { Box, Typography } from '@mui/material';

export default function RoomPage() {
    const params = useParams();
    const roomId = params.roomId; // Extrae el roomId desde la URL

    return (
        <Box
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            height="100vh"
            padding={2}
        >
            <Typography variant="h4" gutterBottom>
                Sala: {roomId}
            </Typography>
            <Typography>
                Bienvenido a la sala de planificación. Comparte este código con los demás participantes.
            </Typography>
        </Box>
    );
}
