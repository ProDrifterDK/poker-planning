'use client'

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
    Box,
    Typography,
    TextField,
    Button,
    Snackbar,
    Alert,
} from '@mui/material';
import { realtimeDb } from '../../../lib/firebaseConfig';
import { ref, push, onValue, update } from 'firebase/database';
import { Participant } from '../../../types/room';
import Card from '../../../components/Card';

export default function RoomPage() {
    const params = useParams();
    const roomId = params.roomId;

    const [name, setName] = useState<string>('');
    const [isJoined, setIsJoined] = useState<boolean>(false);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [selectedEstimation, setSelectedEstimation] = useState<number | null>(null);
    const [reveal, setReveal] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        const participantsRef = ref(realtimeDb, `rooms/${roomId}/participants`);
        const unsubscribe = onValue(participantsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const participantsArray: Participant[] = Object.entries(data).map(
                    ([key, value]) => {
                        const participant = value as { name: string; estimation?: number };
                        return {
                            id: key,
                            name: participant.name,
                            estimation: participant.estimation,
                        };
                    }
                );
                setParticipants(participantsArray);
            }
        });

        return () => unsubscribe();
    }, [roomId]);

    const joinRoom = async () => {
        if (name) {
            const participantsRef = ref(realtimeDb, `rooms/${roomId}/participants`);
            const newParticipantRef = push(participantsRef);
            await update(newParticipantRef, { name });
            setIsJoined(true);
        }
    };

    const selectEstimation = async (value: number) => {
        const myParticipant = participants.find((p) => p.name === name);
        if (reveal) {
            setErrorMessage('No puedes cambiar tu estimación hasta una nueva votación.');
            return;
        }

        setSelectedEstimation(value);

        if (myParticipant) {
            const participantRef = ref(
                realtimeDb,
                `rooms/${roomId}/participants/${myParticipant.id}`
            );
            await update(participantRef, { estimation: value });
        }
    };

    const revealEstimations = () => {
        setReveal(true);
    };

    const startNewVote = async () => {
        participants.forEach(async (participant) => {
            const participantRef = ref(realtimeDb, `rooms/${roomId}/participants/${participant.id}`);
            await update(participantRef, { estimation: null });
        });

        setReveal(false);
        setSelectedEstimation(null);
    };

    const calculateAverage = () => {
        const estimations = participants
            .map((participant) => participant.estimation)
            .filter((estimation) => estimation !== null && estimation !== undefined) as number[];
        const total = estimations.reduce((sum, value) => sum + value, 0);
        return (total / estimations.length).toFixed(2);
    };

    const allParticipantsHaveEstimated = participants.every(
        (participant) => participant.estimation !== null && participant.estimation !== undefined
    );

    return (
        <Box display="flex" flexDirection="column" alignItems="center" padding={2}>
            <Typography variant="h4" gutterBottom>
                Sala: {roomId}
            </Typography>
            {!isJoined ? (
                <>
                    <TextField
                        label="Tu nombre"
                        variant="outlined"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        fullWidth
                    />
                    <Box marginTop={2}>
                        <Button
                            onClick={joinRoom}
                            style={{
                                padding: '10px 20px',
                                fontSize: '16px',
                                backgroundColor: 'orange',
                                color: 'white',
                                fontWeight: 'bold',
                                borderRadius: '5px',
                                cursor: 'pointer',
                            }}
                        >
                            Unirse
                        </Button>
                    </Box>
                </>
            ) : (
                <>
                    <Box
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                        flexWrap="wrap"
                        gap={4}
                        marginTop={4}
                    >
                        {participants.map((participant) => {
                            const noSelection =
                                participant.estimation === null || participant.estimation === undefined;

                            return (
                                <Box key={participant.id} textAlign="center">
                                    <Typography variant="body2" gutterBottom>
                                        {participant.name}
                                    </Typography>
                                    <Card
                                        value={participant.estimation}
                                        selected={false}
                                        onClick={() => { }}
                                        flipped={!reveal && !noSelection}
                                        noSelection={noSelection}
                                    />
                                </Box>
                            );
                        })}
                    </Box>
                    <Box
                        display="flex"
                        flexWrap="wrap"
                        justifyContent="center"
                        marginTop={4}
                        gap={4}
                    >
                        {[1, 2, 3, 5, 8, 13, 21].map((value) => (
                            <Card
                                key={value}
                                value={value}
                                selected={selectedEstimation === value}
                                onClick={() => selectEstimation(value)}
                                flipped={false}
                                noSelection={false}
                            />
                        ))}
                    </Box>
                    <Box marginTop={4} display="flex" justifyContent="center">
                        {allParticipantsHaveEstimated && !reveal && (
                            <Button
                                onClick={revealEstimations}
                                style={{
                                    padding: '10px 20px',
                                    fontSize: '16px',
                                    backgroundColor: 'blue',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                }}
                            >
                                Revelar Estimaciones
                            </Button>
                        )}
                        {reveal && (
                            <Button
                                onClick={startNewVote}
                                style={{
                                    padding: '10px 20px',
                                    fontSize: '16px',
                                    backgroundColor: 'green',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                }}
                            >
                                Nueva Votación
                            </Button>
                        )}
                    </Box>

                    {reveal && (
                        <Box marginTop={2}>
                            <Typography variant="h6">
                                Promedio de estimaciones: {calculateAverage()}
                            </Typography>
                        </Box>
                    )}

                    <Snackbar
                        open={!!errorMessage}
                        autoHideDuration={3000}
                        onClose={() => setErrorMessage(null)}
                    >
                        <Alert severity="warning" onClose={() => setErrorMessage(null)}>
                            {errorMessage}
                        </Alert>
                    </Snackbar>
                </>
            )}
        </Box>
    );
}
