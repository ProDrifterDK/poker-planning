'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ref, get } from 'firebase/database';
import { realtimeDb } from '@/lib/firebaseConfig';
import { Box, Typography } from '@mui/material';

export default function ClientJoin() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const roomCode = searchParams.get('code');

    useEffect(() => {
        const checkRoomAndRedirect = async () => {
            if (!roomCode) return;

            const roomRef = ref(realtimeDb, `rooms/${roomCode}`);
            const snapshot = await get(roomRef);
            if (snapshot.exists()) {
                router.push(`/room/${roomCode}`);
            } else {
                alert('La sala no existe');
            }
        };

        checkRoomAndRedirect();
    }, [roomCode, router]);

    return (
        <Box textAlign="center" padding={4}>
            <Typography variant="h5">
                Validando sala con código <strong>{roomCode}</strong>...
            </Typography>
        </Box>
    );
}
