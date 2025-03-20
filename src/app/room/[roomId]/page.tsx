'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import {
    Box,
    Typography,
    TextField,
    Button,
    Snackbar,
    Alert,
    useTheme,
    IconButton,
    CircularProgress,
} from '@mui/material';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import MenuCloseIcon from '@mui/icons-material/Menu';
import Card from '../../../components/Card';
import IssueSidebar from '../../../components/IssueSidebar';
import { useRoomStore } from '@/store/roomStore';
import { useAuth } from '@/context/authContext';
export default function RoomPage() {
    const theme = useTheme();
    const params = useParams();
    const roomId = params.roomId as string;
    const [name, setName] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    
    // Obtener el usuario autenticado
    const { currentUser } = useAuth();
    

    // Usar el router para la navegación
    const router = useRouter();

    // Usar el store de Zustand
    const {
        roomId: storeRoomId,
        participants,
        currentIssueId,
        reveal,
        estimationOptions,
        error,
        isLoading,
        joinRoomWithName,
        selectEstimation,
        selectCurrentIssue,
        revealEstimations,
        startNewVote,
        setError,
        leaveRoom,
    } = useRoomStore();

    // Estado local para la estimación seleccionada
    const [selectedEstimation, setSelectedEstimation] = useState<number | string | null>(null);

    // Verificar si el usuario ya está en la sala
    const isJoined = storeRoomId === roomId && participants.length > 0;

    // Función para verificar si hay una sesión persistente
    const checkPersistedSession = useCallback(async () => {
        try {
            // Verificar si estamos en el cliente
            if (typeof window === 'undefined') return false;
            
            // Verificar si ya estamos unidos a la sala
            if (isJoined) return true;
            
            // Verificar si hay una sesión persistente en localStorage
            const storageData = localStorage.getItem('poker-planning-storage');
            if (storageData) {
                const sessionData = JSON.parse(storageData);
                const state = sessionData.state;
                
                // Si hay una sesión para esta sala, unirse automáticamente
                if (state && state.roomId === roomId && state.currentParticipantId) {
                    console.log("Sesión persistente encontrada para la sala:", roomId);
                    
                    // Si tenemos un nombre de usuario, unirse automáticamente
                    if (name) {
                        try {
                            await joinRoomWithName(roomId, name);
                            return true;
                        } catch (error) {
                            console.error("Error al unirse automáticamente a la sala:", error);
                            return false;
                        }
                    }
                    
                    return false;
                }
            }
            return false;
        } catch (error) {
            console.error("Error al verificar sesión persistente:", error);
            return false;
        }
    }, [roomId, isJoined, name, joinRoomWithName]);

    // Usar el nombre del usuario autenticado
    useEffect(() => {
        if (currentUser?.displayName) {
            setName(currentUser.displayName);
        }
    }, [currentUser]);

    // Verificar sesión persistente al cargar el componente
    useEffect(() => {
        checkPersistedSession();
    }, [checkPersistedSession]);

    // Unirse a la sala
    const handleJoinRoom = async () => {
        if (!roomId) return;
        if (!name.trim()) {
            setErrorMessage('Debes ingresar tu nombre');
            return;
        }

        try {
            await joinRoomWithName(roomId, name);
        } catch (error) {
            console.error('Error al unirse a la sala:', error);
        }
    };

    // Seleccionar carta
    const handleSelectEstimation = async (value: number | string) => {
        if (reveal) {
            setErrorMessage('No puedes cambiar tu estimación hasta una nueva votación.');
            return;
        }
        
        setSelectedEstimation(value);
        await selectEstimation(value);
    };

    // Calcular conteo y promedio (solo de participantes activos)
    const calculateSummary = () => {
        // Filtrar solo participantes activos
        const activeParticipants = participants.filter(p => p.active !== false);
        const allEstimations = activeParticipants.map((p) => p.estimation);
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

    // Verificar si todos los participantes activos han estimado
    const allParticipantsHaveEstimated = participants
        .filter(p => p.active !== false) // Solo considerar participantes activos
        .every(p => p.estimation !== null && p.estimation !== undefined);

    // Función para salir de la sala
    const handleLeaveRoom = async () => {
        try {
            await leaveRoom();
            router.push('/');
        } catch (error) {
            console.error('Error al salir de la sala:', error);
            setErrorMessage('Error al salir de la sala. Intenta nuevamente.');
        }
    };

    // Toggle sidebar
    const handleToggleSidebar = () => setSidebarOpen((prev) => !prev);

    // Wrapper para selectCurrentIssue que acepta string | null
    const handleSelectCurrentIssue = (issueId: string | null) => {
        if (issueId !== null) {
            selectCurrentIssue(issueId);
        }
    };

    // Efecto para limpiar el error
    useEffect(() => {
        if (error) {
            setErrorMessage(error);
            setError(null);
        }
    }, [error, setError]);

    return (
        <ProtectedRoute>
            <Box sx={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
            {/* CONTENIDO PRINCIPAL */}
            <Box flex="1" display="flex" flexDirection="column" alignItems="center" padding={2}>
                <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    width="100%"
                >
                    <Typography
                        variant="h4"
                        gutterBottom
                        sx={{
                            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
                        }}
                        role="heading"
                        aria-level={1}
                        aria-label={`Sala de Planning Poker con código ${roomId}`}
                    >
                        Sala: {roomId}
                    </Typography>
                    
                    {isJoined && (
                        <Button
                            variant="outlined"
                            color="error"
                            onClick={handleLeaveRoom}
                            sx={{
                                mt: 1,
                                mb: 2,
                                textTransform: 'none',
                                borderRadius: '20px',
                                px: 3
                            }}
                            startIcon={<span role="img" aria-label="Salir">🚪</span>}
                            aria-label="Salir de la sala"
                        >
                            Salir de la sala
                        </Button>
                    )}
                </Box>

                {!isJoined ? (
                    <Box
                        component="form"
                        role="form"
                        aria-labelledby="join-room-title"
                        onSubmit={(e) => { e.preventDefault(); handleJoinRoom(); }}
                        sx={{
                            width: '100%',
                            maxWidth: 500,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                            p: 3,
                            borderRadius: 2,
                            boxShadow: 3,
                            bgcolor: 'background.paper',
                        }}
                    >
                        <Typography
                            variant="h5"
                            textAlign="center"
                            id="join-room-title"
                            role="heading"
                            aria-level={2}
                        >
                            Unirse a la Sala
                        </Typography>
                        
                        <TextField
                            label="Tu nombre"
                            variant="outlined"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            fullWidth
                            disabled={isLoading}
                            required
                            aria-required="true"
                            inputProps={{
                                'aria-label': 'Tu nombre para unirte a la sala',
                            }}
                        />
                        
                        <Button
                            type="submit"
                            onClick={handleJoinRoom}
                            disabled={!name.trim() || isLoading}
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
                            aria-label="Unirse a la sala"
                        >
                            {isLoading ? <CircularProgress size={24} color="inherit" aria-label="Cargando..." /> : 'Unirse'}
                        </Button>
                    </Box>
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
                                aria-label={sidebarOpen ? "Cerrar panel lateral" : "Abrir panel lateral"}
                                aria-expanded={sidebarOpen}
                                aria-controls="issue-sidebar"
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
                            gap={{ xs: 2, sm: 3, md: 4 }}
                            marginTop={4}
                            sx={{
                                width: '100%',
                                maxWidth: '100vw',
                                px: { xs: 1, sm: 2 },
                                py: { xs: 3, sm: 4 }, // Añadir padding vertical para las animaciones
                                overflowX: 'hidden',
                                overflowY: 'visible', // Permitir que las animaciones se desborden verticalmente
                                position: 'relative', // Para el posicionamiento correcto de los elementos animados
                            }}
                        >
                            {/* Filtrar solo participantes activos - asegurarse de que no se muestren los inactivos */}
                            {participants
                                .filter(p => p.active !== false)
                                .map((participant) => {
                                const noSelection =
                                    participant.estimation === null ||
                                    participant.estimation === undefined;

                                return (
                                    <Box key={participant.id} textAlign="center">
                                        <Typography
                                            variant="body2"
                                            gutterBottom
                                            sx={{
                                                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                maxWidth: { xs: 70, sm: 100 }
                                            }}
                                        >
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
                            data-onboarding="card-deck"
                            display="flex"
                            flexWrap="wrap"
                            justifyContent="center"
                            marginTop={4}
                            gap={{ xs: 2, sm: 3, md: 4 }}
                            sx={{
                                width: '100%',
                                maxWidth: '100vw',
                                px: { xs: 1, sm: 2 },
                                py: { xs: 3, sm: 4 }, // Añadir padding vertical para las animaciones
                                overflowX: 'hidden',
                                overflowY: 'visible', // Permitir que las animaciones se desborden verticalmente
                                position: 'relative', // Para el posicionamiento correcto de los elementos animados
                            }}
                        >
                            {estimationOptions.map((value) => (
                                <Card
                                    key={String(value)}
                                    value={value}
                                    selected={selectedEstimation === value}
                                    onClick={() => handleSelectEstimation(value)}
                                    flipped={false}
                                    noSelection={false}
                                />
                            ))}
                        </Box>

                        {/* Botones de Revelar / Volver a Votar */}
                        <Box marginTop={4} display="flex" justifyContent="center" gap={2}>
                            {allParticipantsHaveEstimated && !reveal && (
                                <Button
                                    data-onboarding="reveal-button"
                                    onClick={revealEstimations}
                                    sx={{
                                        padding: { xs: '8px 16px', sm: '10px 20px' },
                                        fontSize: { xs: '14px', sm: '16px' },
                                        backgroundColor: theme.palette.primary.main,
                                        color: 'white',
                                        fontWeight: 'bold',
                                        borderRadius: '5px',
                                        cursor: 'pointer',
                                        textTransform: 'none',
                                    }}
                                    aria-label="Revelar todas las estimaciones"
                                    role="button"
                                >
                                    Revelar Estimaciones
                                </Button>
                            )}
                            {reveal && (
                                <Button
                                    onClick={startNewVote}
                                    sx={{
                                        padding: { xs: '8px 16px', sm: '10px 20px' },
                                        fontSize: { xs: '14px', sm: '16px' },
                                        backgroundColor: theme.palette.secondary.main,
                                        color: 'white',
                                        fontWeight: 'bold',
                                        borderRadius: '5px',
                                        cursor: 'pointer',
                                        textTransform: 'none',
                                    }}
                                    aria-label="Iniciar nueva votación"
                                    role="button"
                                >
                                    Volver a Votar
                                </Button>
                            )}
                        </Box>

                        {/* Detalle de estimaciones y promedio */}
                        {reveal && (
                            <Box marginTop={4}>
                                <Typography
                                    variant="h5"
                                    gutterBottom
                                    sx={{
                                        fontSize: { xs: '1.25rem', sm: '1.5rem' }
                                    }}
                                    aria-live="polite"
                                    role="heading"
                                    aria-level={2}
                                >
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
                                            gap={{ xs: 2, sm: 3, md: 4 }}
                                            marginTop={4}
                                            sx={{
                                                width: '100%',
                                                maxWidth: '100vw',
                                                px: { xs: 1, sm: 2 },
                                                py: { xs: 3, sm: 4 }, // Añadir padding vertical para las animaciones
                                                overflowX: 'hidden',
                                                overflowY: 'visible', // Permitir que las animaciones se desborden verticalmente
                                                position: 'relative', // Para el posicionamiento correcto de los elementos animados
                                            }}
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
                                                        sx={{ height: { xs: 150, sm: 200 } }}
                                                    >
                                                        <Box
                                                            sx={{
                                                                width: { xs: 6, sm: 8 },
                                                                backgroundColor: theme.palette.primary.main,
                                                                borderRadius: 2,
                                                                transition: 'height 0.3s ease',
                                                                marginBottom: 1,
                                                                height: barHeight,
                                                            }}
                                                            role="img"
                                                            aria-label={`${count} ${count === 1 ? 'voto' : 'votos'} para el valor ${option}`}
                                                        />
                                                        <Card
                                                            value={option}
                                                            selected={false}
                                                            showCorners={false}
                                                            fontSize="1.2rem"
                                                            sx={{
                                                                width: { xs: 40, sm: 50 },
                                                                height: { xs: 50, sm: 60 },
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                            }}
                                                            flipped={false}
                                                            noSelection={false}
                                                            onClick={() => { }}
                                                        />
                                                        <Typography
                                                            variant="body2"
                                                            marginTop={1}
                                                            sx={{
                                                                fontSize: { xs: '0.7rem', sm: '0.875rem' }
                                                            }}
                                                        >
                                                            {count} {count === 1 ? 'Voto' : 'Votos'}
                                                        </Typography>
                                                    </Box>
                                                );
                                            })}
                                        </Box>
                                    );
                                })()}
                                <Box marginTop={4}>
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            fontSize: { xs: '1rem', sm: '1.25rem' }
                                        }}
                                        aria-live="polite"
                                        role="status"
                                    >
                                        Promedio de estimaciones: <span aria-label={`${avg} puntos`}>{avg}</span>
                                    </Typography>
                                </Box>
                            </Box>
                        )}

                        <Snackbar
                            open={!!errorMessage}
                            autoHideDuration={3000}
                            onClose={() => setErrorMessage(null)}
                            aria-live="assertive"
                            role="alert"
                        >
                            <Alert
                                severity="warning"
                                onClose={() => setErrorMessage(null)}
                                aria-label={errorMessage || "Mensaje de error"}
                            >
                                {errorMessage}
                            </Alert>
                        </Snackbar>
                    </>
                )}
            </Box>

            {/* SIDEBAR a la derecha, sólo si el usuario ingresó su nombre */}
            {isJoined && (
                <Box
                    id="issue-sidebar"
                    role="complementary"
                    aria-label="Panel de gestión de issues"
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
                        data-onboarding="issue-sidebar"
                        roomId={roomId}
                        currentIssueId={currentIssueId}
                        setCurrentIssueId={handleSelectCurrentIssue}
                    />
                </Box>
            )}
        </Box>
        </ProtectedRoute>
    );
}
