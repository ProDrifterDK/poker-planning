'use client';

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
    IconButton,
} from '@mui/material';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import MenuCloseIcon from '@mui/icons-material/Menu';
import { realtimeDb } from '../../../lib/firebaseConfig';
import { ref, push, onValue, update } from 'firebase/database';
import { Participant } from '../../../types/room';
import Card from '../../../components/Card';
import IssueSidebar from '../../../components/IssueSidebar';

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

    // Estado de la sidebar plegable
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Este estado local indica cuál es el "Issue actual" en discusión
    const [currentIssueId, setCurrentIssueId] = useState<string | null>(null);

    useEffect(() => {
        if (!roomId) return;

        const roomRef = ref(realtimeDb, `rooms/${roomId}`);
        const unsubscribe = onValue(roomRef, (snapshot) => {
            const data = snapshot.val();
            if (!data) return;

            // Participants
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

            // currentIssueId
            if (typeof data.currentIssueId === 'string') {
                setCurrentIssueId(data.currentIssueId);
            } else {
                setCurrentIssueId(null);
            }
        });

        return () => unsubscribe();
    }, [roomId]);

    // Unirse a la sala
    const joinRoom = async () => {
        if (!roomId) return;
        if (name.trim()) {
            const participantsRef = ref(realtimeDb, `rooms/${roomId}/participants`);
            const newParticipantRef = push(participantsRef);
            await update(newParticipantRef, { name });
            setIsJoined(true);
        }
    };

    // Seleccionar carta
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

    // Revelar estimaciones
    const revealEstimations = async () => {
        if (!roomId) return;
        const roomRef = ref(realtimeDb, `rooms/${roomId}`);
        await update(roomRef, { reveal: true });

        // Calcular promedio local
        const { avg } = calculateSummary();

        // Si hay un issue actual, guardamos su promedio en la DB
        if (currentIssueId) {
            const issueRef = ref(realtimeDb, `rooms/${roomId}/issues/${currentIssueId}`);
            await update(issueRef, { average: avg });
        }
    };

    // "Volver a votar"
    const startNewVote = async () => {
        if (!roomId) return;

        // Poner todas las estimaciones a null
        await Promise.all(
            participants.map(async (participant) => {
                const participantRef = ref(
                    realtimeDb,
                    `rooms/${roomId}/participants/${participant.id}`
                );
                return update(participantRef, { estimation: null });
            })
        );

        // reveal = false
        const roomRef = ref(realtimeDb, `rooms/${roomId}`);
        await update(roomRef, { reveal: false });

        setSelectedEstimation(null);

        // Limpia el promedio del issue actual
        if (currentIssueId) {
            const issueRef = ref(realtimeDb, `rooms/${roomId}/issues/${currentIssueId}`);
            await update(issueRef, { average: null });
        }
    };

    // Calcular conteo y promedio
    const calculateSummary = () => {
        const allEstimations = participants.map((p) => p.estimation);
        const numericEstimations = allEstimations.filter((val) => typeof val === 'number') as number[];

        const counts: Record<string, number> = {};
        allEstimations.forEach((val) => {
            if (val == null) return;
            const key = String(val);
            counts[key] = (counts[key] || 0) + 1;
        });

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

    // Toggle sidebar
    const handleToggleSidebar = () => setSidebarOpen((prev) => !prev);

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
            {/* CONTENIDO PRINCIPAL */}
            <Box flex="1" display="flex" flexDirection="column" alignItems="center" padding={2}>
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
                                        opacity: 0.7,
                                    },
                                }}
                            >
                                Unirse
                            </Button>
                        </Box>
                    </>
                ) : (
                    <>
                        {/* Botón toggle sidebar */}
                        <Box
                            position="absolute"
                            top={16}
                            right={16}
                            sx={{ zIndex: 10 }}
                        >
                            <IconButton
                                onClick={handleToggleSidebar}
                                sx={{
                                    backgroundColor: theme.palette.background.paper,
                                    boxShadow: `0px 2px 6px rgba(0,0,0,0.2)`,
                                }}
                            >
                                {sidebarOpen ? <MenuCloseIcon /> : <MenuOpenIcon />}
                            </IconButton>
                        </Box>

                        {/* Lista de participantes y sus cartas */}
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

                        {/* Opciones de estimación */}
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

                        {/* Botones de Revelar / Volver a Votar */}
                        <Box marginTop={4} display="flex" justifyContent="center" gap={2}>
                            {allParticipantsHaveEstimated && !reveal && (
                                <Button
                                    onClick={revealEstimations}
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
                                    Revelar Estimaciones
                                </Button>
                            )}
                            {reveal && (
                                <Button
                                    onClick={startNewVote}
                                    sx={{
                                        padding: '10px 20px',
                                        fontSize: '16px',
                                        backgroundColor: theme.palette.secondary.main,
                                        color: 'white',
                                        fontWeight: 'bold',
                                        borderRadius: '5px',
                                        cursor: 'pointer',
                                        textTransform: 'none',
                                    }}
                                >
                                    Volver a Votar
                                </Button>
                            )}
                        </Box>

                        {/* Detalle de estimaciones y promedio */}
                        {reveal && (
                            <Box marginTop={4}>
                                <Typography variant="h5" gutterBottom>
                                    Detalle de estimaciones
                                </Typography>
                                {Object.keys(counts).length > 0 && (() => {
                                    const maxCount = Math.max(...Object.values(counts));
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
                                                const barHeight = (count / safeMax) * 100;
                                                return (
                                                    <Box
                                                        key={option}
                                                        display="flex"
                                                        flexDirection="column"
                                                        alignItems="center"
                                                        justifyContent="end"
                                                        sx={{ height: 200 }}
                                                    >
                                                        <Box
                                                            sx={{
                                                                width: 8,
                                                                backgroundColor: theme.palette.primary.main,
                                                                borderRadius: 2,
                                                                transition: 'height 0.3s ease',
                                                                marginBottom: 1,
                                                                height: barHeight,
                                                            }}
                                                        />
                                                        <Card
                                                            value={option}
                                                            selected={false}
                                                            showCorners={false}
                                                            fontSize="1.2rem"
                                                            sx={{
                                                                width: 50,
                                                                height: 60,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
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
                                })()}
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

            {/* SIDEBAR a la derecha, sólo si el usuario ingresó su nombre */}
            {isJoined && (
                <Box
                    sx={{
                        width: sidebarOpen ? 300 : 0,
                        transition: 'width 0.3s ease',
                        overflow: 'hidden', // para que se oculte cuando width=0
                        borderLeft: (theme) =>
                            sidebarOpen ? `1px solid ${theme.palette.divider}` : 'none',
                        backgroundColor: theme.palette.background.paper,
                        boxShadow: sidebarOpen
                            ? '-2px 0px 5px rgba(0,0,0,0.15)'
                            : 'none',
                    }}
                >
                    <IssueSidebar
                        roomId={roomId}
                        currentIssueId={currentIssueId}
                        setCurrentIssueId={setCurrentIssueId}
                    />
                </Box>
            )}
        </Box>
    );
}
