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
    useTheme,
} from '@mui/material';
import { realtimeDb } from '../../../lib/firebaseConfig';
import { ref, push, onValue, update } from 'firebase/database';
import { Participant } from '../../../types/room';
import Card from '../../../components/Card';

export default function RoomPage() {
    const theme = useTheme();
    const params = useParams();
    const roomId = params.roomId;

    const [name, setName] = useState('');
    const [isJoined, setIsJoined] = useState(false);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [selectedEstimation, setSelectedEstimation] = useState<number | string | null>(null);
    const [reveal, setReveal] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [estimationOptions, setEstimationOptions] = useState<(number | string)[]>([1, 2, 3, 5, 8, 13, 21, '☕']);

    useEffect(() => {
        const roomRef = ref(realtimeDb, `rooms/${roomId}`);

        const unsubscribe = onValue(roomRef, (snapshot) => {
            const data = snapshot.val();
            if (!data) return;

            // participants
            if (data.participants) {
                const participantsArray: Participant[] = Object.entries(data.participants).map(
                    ([key, value]) => {
                        const participant = value as { name: string; estimation?: number | string };
                        return {
                            id: key,
                            name: participant.name,
                            estimation: participant.estimation,
                        };
                    }
                );
                setParticipants(participantsArray);
            }

            // reveal
            if (typeof data.reveal === 'boolean') {
                setReveal(data.reveal);
            }

            // series
            if (Array.isArray(data.seriesValues)) {
                setEstimationOptions(data.seriesValues);
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

    const selectEstimation = async (value: number | string) => {
        if (reveal) {
            setErrorMessage('No puedes cambiar tu estimación hasta una nueva votación.');
            return;
        }
        setSelectedEstimation(value);

        const myParticipant = participants.find((p) => p.name === name);
        if (myParticipant) {
            const participantRef = ref(realtimeDb, `rooms/${roomId}/participants/${myParticipant.id}`);
            await update(participantRef, { estimation: value });
        }
    };

    const revealEstimations = async () => {
        const roomRef = ref(realtimeDb, `rooms/${roomId}`);
        await update(roomRef, { reveal: true });
    };

    const startNewVote = async () => {
        // Poner todas las estimaciones a null
        await Promise.all(participants.map(async (participant) => {
            const participantRef = ref(realtimeDb, `rooms/${roomId}/participants/${participant.id}`);
            return update(participantRef, { estimation: null });
        }));

        // Actualizar reveal
        const roomRef = ref(realtimeDb, `rooms/${roomId}`);
        await update(roomRef, { reveal: false });

        setSelectedEstimation(null);
    };

    /**
     * Calculamos el promedio y también un conteo de
     * cuántos eligieron cada opción.
     */
    const calculateSummary = () => {
        const allEstimations = participants.map((p) => p.estimation);
        const numericEstimations = allEstimations.filter((val) => typeof val === 'number') as number[];

        // Contamos cuántos eligió cada opción (numérica o string)
        const counts: Record<string, number> = {};
        allEstimations.forEach((val) => {
            if (val == null) return;
            const key = String(val);
            counts[key] = (counts[key] || 0) + 1;
        });

        // Calculamos promedio numérico
        let avg = 'N/A';
        if (numericEstimations.length > 0) {
            const total = numericEstimations.reduce((sum, value) => sum + value, 0);
            avg = (total / numericEstimations.length).toFixed(2);
        }

        return { counts, avg };
    };

    const { counts, avg } = calculateSummary();

    const allParticipantsHaveEstimated = participants.every(
        (p) => p.estimation !== null && p.estimation !== undefined
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
                            disabled={!name.trim()}
                            sx={{
                                padding: '10px 20px',
                                fontSize: '16px',
                                backgroundColor: 'orange',
                                color: 'white',
                                fontWeight: 'bold',
                                borderRadius: '5px',
                                textTransform: 'none',
                                '&.Mui-disabled': {
                                    backgroundColor: '#999',
                                    color: '#ccc',
                                    cursor: 'not-allowed',
                                    opacity: 0.7
                                },
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
                                participant.estimation === null ||
                                participant.estimation === undefined;

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
                        {estimationOptions.map((value) => (
                            <Card
                                key={String(value)}
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
                                sx={{
                                    padding: '10px 20px',
                                    fontSize: '16px',
                                    backgroundColor: 'blue',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    textTransform: 'none',
                                }}
                            >
                                Revelar Estimaciones
                            </Button>
                        )}
                        {reveal && (
                            <Button
                                onClick={startNewVote}
                                sx={{
                                    padding: '10px 20px',
                                    fontSize: '16px',
                                    backgroundColor: theme.palette.primary.main,
                                    color: 'white',
                                    fontWeight: 'bold',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    textTransform: 'none',
                                }}
                            >
                                Nueva Votación
                            </Button>
                        )}
                    </Box>

                    {reveal && (
                        <Box marginTop={4}>
                            <Typography variant="h5" gutterBottom>
                                Detalle de estimaciones
                            </Typography>

                            {/* 1) Sacamos la cantidad máxima de votos */}
                            {Object.keys(counts).length > 0 && (
                                (() => {
                                    const maxCount = Math.max(...Object.values(counts));
                                    // Evitar división por cero
                                    const safeMax = maxCount === 0 ? 1 : maxCount;

                                    return (
                                        <Box
                                            display="flex"
                                            flexWrap="wrap"
                                            justifyContent="center"
                                            gap={4}
                                            marginTop={4}
                                        >
                                            {Object.entries(counts).map(([option, count]) => {
                                                // 2) Barra en función de la proporción de votos
                                                const barHeight = (count / safeMax) * 100;

                                                return (
                                                    <Box
                                                        key={option}
                                                        display="flex"
                                                        flexDirection="column"
                                                        alignItems="center"
                                                        justifyContent="end"
                                                        // Ajustamos un alto total suficiente para ver la barra
                                                        sx={{ height: 200 }}
                                                    >
                                                        {/* 3) Barra vertical */}
                                                        <Box
                                                            sx={{
                                                                width: 8,
                                                                backgroundColor: theme.palette.primary.main,
                                                                borderRadius: 2,
                                                                transition: 'height 0.3s ease',
                                                                // lo situamos "arriba" (al final del contenedor)
                                                                marginBottom: 1,
                                                                height: barHeight,
                                                            }}
                                                        />
                                                        {/* 4) La Card pequeñita */}
                                                        <Card
                                                            value={option}
                                                            selected={false}
                                                            showCorners={false}
                                                            // Podrías agregarle estilos para que sea más chica
                                                            sx={{
                                                                width: 50,
                                                                height: 60,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontSize: '1.2rem',
                                                            }}
                                                            flipped={false}
                                                            noSelection={false}
                                                            onClick={() => { }}
                                                        />
                                                        <Typography variant="body2" marginTop={1}>
                                                            {count} {count === 1 ? 'Voto' : 'Votos'}
                                                        </Typography>
                                                    </Box>
                                                );
                                            })}
                                        </Box>
                                    );
                                })()
                            )}

                            {/* 6) Promedio */}
                            <Box marginTop={4}>
                                <Typography variant="h6">
                                    Promedio de estimaciones: {avg}
                                </Typography>
                            </Box>
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
