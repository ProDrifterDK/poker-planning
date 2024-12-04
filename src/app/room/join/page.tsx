'use client';

import { useSearchParams } from 'next/navigation';
import { Box, Typography } from '@mui/material';

export default function JoinRoomPage() {
    const searchParams = useSearchParams();
    const roomCode = searchParams.get('code');

    return (
        <Box textAlign="center" padding={4}>
            <Typography variant="h5">
                Unirse a la Sala: <strong>{roomCode}</strong>
            </Typography>
        </Box>
    );
}
