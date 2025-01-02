'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebaseConfig';
import { Box, Typography } from '@mui/material';

export default function ClientJoin() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const roomCode = searchParams.get('code');

    useEffect(() => {
        const checkRoomAndRedirect = async () => {
            if (!roomCode) return;

            const roomDocRef = doc(firestore, 'rooms', roomCode);
            const roomSnapshot = await getDoc(roomDocRef);

            if (roomSnapshot.exists()) {
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
