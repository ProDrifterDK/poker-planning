'use client';
export const dynamic = 'force-dynamic'

import { useSearchParams, useRouter } from 'next/navigation';
import { Box, Typography } from '@mui/material';
import { useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebaseConfig';

export default function JoinRoomPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const roomCode = searchParams.get('code');

    useEffect(() => {
        const checkRoomAndRedirect = async () => {
            if (!roomCode) return;

            // Verificar si la sala existe en Firestore
            const roomDocRef = doc(firestore, 'rooms', roomCode);
            const roomSnapshot = await getDoc(roomDocRef);

            if (roomSnapshot.exists()) {
                // Si la sala existe, nos vamos a /room/[roomId]
                router.push(`/room/${roomCode}`);
            } else {
                // Si no existe, podrías mostrar un error, 
                // redirigir a algún lugar o hacer lo que necesites
                alert('La sala no existe');
                // router.push('/');
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
