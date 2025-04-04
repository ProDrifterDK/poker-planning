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
import ExportData from '@/components/ExportData';
import VotingTimer from '@/components/VotingTimer';
import ParticipantCounter from '@/components/ParticipantCounter';
import { SendToIntegration } from '@/components/integrations';
import FeatureGuard from '@/components/FeatureGuard';
import SidebarAdvertisement from '@/components/SidebarAdvertisement';
import Advertisement from '@/components/Advertisement';
import { useRoomStore } from '@/store/roomStore';
import { useAuth } from '@/context/authContext';
import { ref, update } from 'firebase/database';
import { realtimeDb } from '@/lib/firebaseConfig';
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

    // Usar el store de Zustand (solo los campos necesarios)
    const {
        roomId: storeRoomId,
        roomTitle,
        participants,
        issues,
        votes,
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
    const [isJoined, setIsJoined] = useState(false);
    
    // Estado para controlar cuándo intentar la auto-unión
    const [shouldAttemptJoin, setShouldAttemptJoin] = useState(false);
    
    // Actualizar el estado isJoined cuando cambian los datos del store
    useEffect(() => {
        const joined = storeRoomId === roomId && participants.length > 0;
        if (joined) {
            console.log('Usuario detectado como unido a la sala');
            setIsJoined(true);
        }
    }, [storeRoomId, roomId, participants]);
    
    // Verificar si hay un nombre de invitado en localStorage cada 500ms hasta encontrarlo
    useEffect(() => {
        if (!isJoined && !shouldAttemptJoin) {
            const checkInterval = setInterval(() => {
                const guestName = localStorage.getItem('guestName');
                if (guestName) {
                    console.log("Nombre de invitado encontrado en localStorage:", guestName);
                    setName(guestName);
                    setShouldAttemptJoin(true);
                    clearInterval(checkInterval);
                }
            }, 500);
            
            return () => clearInterval(checkInterval);
        }
    }, [isJoined, shouldAttemptJoin]);

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
                    console.log('Encontrada sesión persistente para la sala:', roomId);
                    
                    // Determinar el nombre a usar
                    let userName = name;
                    
                    // Si no hay nombre en el estado, intentar obtenerlo directamente del localStorage
                    if (!userName.trim()) {
                        const guestName = localStorage.getItem('guestName');
                        if (guestName) {
                            console.log("Usando nombre de invitado del localStorage para sesión persistente:", guestName);
                            userName = guestName;
                            // Actualizar el estado para futuros usos
                            setName(guestName);
                        } else if (currentUser?.displayName) {
                            userName = currentUser.displayName;
                            // Actualizar el estado para futuros usos
                            setName(currentUser.displayName);
                        }
                    }
                    
                    // Si tenemos un nombre de usuario, unirse automáticamente
                    if (userName.trim()) {
                        try {
                            console.log(`Intentando unirse a la sala ${roomId} con el nombre ${userName} (sesión persistente)`);
                            await joinRoomWithName(roomId, userName);
                            console.log('Unido a la sala exitosamente (sesión persistente)');
                            // Actualizar el estado isJoined directamente
                            setIsJoined(true);
                            // Indicar que se ha intentado la auto-unión
                            setShouldAttemptJoin(true);
                            return true;
                        } catch (error) {
                            console.error("Error al unirse automáticamente a la sala:", error);
                            return false;
                        }
                    } else {
                        console.log('No se pudo determinar el nombre del usuario para la sesión persistente');
                    }
                    
                    return false;
                }
            }
            return false;
        } catch (error) {
            console.error("Error al verificar sesión persistente:", error);
            return false;
        }
    }, [roomId, isJoined, name, joinRoomWithName, currentUser]);

    // Usar el nombre del usuario autenticado
    useEffect(() => {
        console.log("Entrando al useEffect de nombre de usuario");
        
        // Intentar obtener el nombre del usuario autenticado
        if (currentUser?.displayName) {
            console.log("Usando displayName del usuario:", currentUser.displayName);
            setName(currentUser.displayName);
            // Si tenemos un nombre de usuario autenticado, intentar unirse
            setShouldAttemptJoin(true);
        }
    }, [currentUser]);
    
    // Auto-unirse a la sala cuando shouldAttemptJoin cambia a true
    useEffect(() => {
        if (!isJoined && roomId && name && shouldAttemptJoin) {
            console.log("Intentando auto-unirse a la sala con nombre:", name);
            
            // Establecer un timeout para intentar unirse manualmente si la auto-unión tarda demasiado
            const autoJoinTimeout = setTimeout(() => {
                if (!isJoined) {
                    console.log('Timeout de auto-unión alcanzado, intentando unirse manualmente');
                    handleJoinRoom();
                }
            }, 3000); // 3 segundos de timeout
            
            // Establecer un segundo timeout que forzará el estado isJoined a true si aún no se ha unido
            const forceJoinTimeout = setTimeout(() => {
                if (!isJoined) {
                    console.log('Forzando estado isJoined a true después de timeout extendido');
                    setIsJoined(true);
                }
            }, 8000); // 8 segundos de timeout
            
            // Eliminar el ID de participante guardado para esta sala para forzar la creación de un nuevo participante
            localStorage.removeItem(`participant_id_${roomId}`);
            console.log(`ID de participante eliminado para la sala ${roomId} (auto-unión)`);
            
            joinRoomWithName(roomId, name)
                .then(() => {
                    console.log('Auto-unión exitosa');
                    // Actualizar el estado isJoined directamente
                    setIsJoined(true);
                    // Limpiar los timeouts si la unión fue exitosa
                    clearTimeout(autoJoinTimeout);
                    clearTimeout(forceJoinTimeout);
                })
                .catch(error => {
                    console.error('Error al unirse automáticamente a la sala:', error);
                    // Si falla la auto-unión, mostrar un mensaje de error
                    setErrorMessage('Error al unirse automáticamente. Puedes intentar unirte manualmente.');
                    // Limpiar los timeouts si hubo un error
                    clearTimeout(autoJoinTimeout);
                    clearTimeout(forceJoinTimeout);
                });
            
            // Limpiar los timeouts cuando el componente se desmonte
            return () => {
                clearTimeout(autoJoinTimeout);
                clearTimeout(forceJoinTimeout);
            };
        }
    }, [isJoined, roomId, name, joinRoomWithName, shouldAttemptJoin]);

    // Función para actualizar el nombre del moderador
    const updateModeratorName = useCallback(async () => {
        if (!roomId || !currentUser || !participants.length) return;
        
        // Buscar el participante con rol de moderador
        const moderator = participants.find(p => p.role === 'moderator');
        
        // Si encontramos un moderador con nombre "Moderador", actualizarlo
        if (moderator && moderator.name === 'Moderador') {
            const newName = currentUser.displayName || 'Moderador';
            console.log(`Actualizando nombre del moderador de "Moderador" a "${newName}"`);
            
            try {
                // Actualizar el nombre en la base de datos
                const participantRef = ref(realtimeDb, `rooms/${roomId}/participants/${moderator.id}`);
                await update(participantRef, {
                    name: newName
                });
                console.log('Nombre del moderador actualizado exitosamente');
            } catch (error) {
                console.error('Error al actualizar el nombre del moderador:', error);
            }
        }
    }, [roomId, currentUser, participants]);
    
    // Verificar sesión persistente al cargar el componente
    useEffect(() => {
        // Solo verificar si no estamos ya unidos a la sala
        if (!isJoined) {
            console.log('Verificando sesión persistente...');
            checkPersistedSession()
                .then(joined => {
                    if (joined) {
                        console.log('Unido a la sala mediante sesión persistente');
                    } else {
                        console.log('No se encontró sesión persistente');
                    }
                })
                .catch(error => console.error('Error al verificar sesión persistente:', error));
        }
    }, [checkPersistedSession, isJoined]);
    
    // Actualizar el nombre del moderador cuando se carga la sala
    useEffect(() => {
        if (isJoined && participants.length > 0) {
            updateModeratorName();
        }
    }, [isJoined, participants, updateModeratorName]);

    // Unirse a la sala
    const handleJoinRoom = async () => {
        if (!roomId) return;
        
        // Usar el nombre del estado, que debería estar configurado correctamente por los useEffect
        let userName = name;
        
        // Si aún no hay nombre en el estado, intentar obtenerlo directamente del localStorage
        if (!userName || !userName.trim()) {
            const guestName = localStorage.getItem('guestName');
            if (guestName) {
                console.log("Usando nombre de invitado del localStorage para unirse manualmente:", guestName);
                userName = guestName;
                // Actualizar el estado para futuros usos
                setName(guestName);
                // Indicar que se debe intentar la auto-unión
                setShouldAttemptJoin(true);
            } else if (currentUser?.displayName) {
                userName = currentUser.displayName;
                // Actualizar el estado para futuros usos
                setName(currentUser.displayName);
                // Indicar que se debe intentar la auto-unión
                setShouldAttemptJoin(true);
            }
        }
        
        // Verificar que tengamos un nombre
        if (!userName || !userName.trim()) {
            setErrorMessage('No se pudo determinar tu nombre. Por favor, inicia sesión nuevamente.');
            return;
        }

        try {
            console.log(`Intentando unirse manualmente a la sala ${roomId} con el nombre ${userName}`);
            
            // Eliminar el ID de participante guardado para esta sala para forzar la creación de un nuevo participante
            localStorage.removeItem(`participant_id_${roomId}`);
            console.log(`ID de participante eliminado para la sala ${roomId}`);
            
            await joinRoomWithName(roomId, userName);
            console.log('Unido a la sala exitosamente (unión manual)');
            // Actualizar el estado isJoined directamente
            setIsJoined(true);
        } catch (error) {
            console.error('Error al unirse a la sala:', error);
            setErrorMessage('Error al unirse a la sala. Por favor, intenta nuevamente.');
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
                {/* Anuncio para usuarios free */}
                <Box sx={{ width: '100%', mb: 2 }}>
                    <FeatureGuard
                        feature="adFree"
                        fallback={
                            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                                <Advertisement slot="1234567890" format="horizontal" position="top" />
                            </Box>
                        }
                    >
                        {/* No se muestra nada para usuarios premium */}
                        <></>
                    </FeatureGuard>
                </Box>
                <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    width="100%"
                >
                    <Box textAlign="center" mb={2}>
                        {roomTitle && (
                            <Typography
                                variant="h4"
                                gutterBottom
                                sx={{
                                    fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
                                    fontWeight: 'bold',
                                    mb: 1
                                }}
                                role="heading"
                                aria-level={1}
                            >
                                {roomTitle}
                            </Typography>
                        )}
                        <Typography
                            variant="h6"
                            color="text.secondary"
                            sx={{
                                fontSize: { xs: '1rem', sm: '1.25rem' }
                            }}
                            aria-label={`Código de sala: ${roomId}`}
                        >
                            Código: {roomId}
                        </Typography>
                    </Box>
                    
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
                    // Mostrar un estado de carga mientras se une automáticamente
                    <Box
                        sx={{
                            width: '100%',
                            maxWidth: 500,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 2,
                            p: 3,
                            borderRadius: 2,
                            boxShadow: 3,
                            bgcolor: 'background.paper',
                        }}
                    >
                        <Typography variant="h5" textAlign="center">
                            Uniéndose a la Sala...
                        </Typography>
                        
                        <CircularProgress size={40} />
                        
                        <Typography variant="body1" textAlign="center">
                            Estás ingresando como <strong>{name || localStorage.getItem('guestName') || 'Usuario invitado'}</strong>
                        </Typography>
                        
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => {
                                // Indicar que se debe intentar la auto-unión
                                setShouldAttemptJoin(true);
                                handleJoinRoom();
                            }}
                            sx={{ mt: 2 }}
                        >
                            Unirse Manualmente
                        </Button>
                    </Box>
                ) : (
                    <>
                        {/* Contador de participantes */}
                        <ParticipantCounter />
                        
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
                                            {participant.role === 'moderator' ? (
                                                <>
                                                    {participant.name === 'Moderador' ? currentUser?.displayName || 'Moderador' : participant.name}
                                                    <span style={{
                                                        fontSize: '0.7em',
                                                        opacity: 0.7,
                                                        marginLeft: '3px',
                                                        display: 'block'
                                                    }}>
                                                        (moderador)
                                                    </span>
                                                </>
                                            ) : (
                                                participant.name
                                            )}
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
                        
                        {/* Temporizador de votación */}
                        {!reveal && (
                            <Box sx={{
                                width: '100%',
                                display: 'flex',
                                justifyContent: 'center',
                                mt: { xs: 2, sm: 0 } // Margen superior solo en móviles
                            }}>
                                <VotingTimer />
                            </Box>
                        )}

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

                        {/* Componentes de exportación e integración */}
                        {reveal && (
                            <Box marginTop={4} display="flex" justifyContent="center" gap={2} flexWrap="wrap">
                                <FeatureGuard feature="exportData">
                                    <ExportData
                                        roomId={roomId}
                                        participants={participants}
                                        issues={issues || []}
                                        estimations={votes || {}}
                                    />
                                </FeatureGuard>
                                
                                <FeatureGuard feature="integrations">
                                    <SendToIntegration
                                        issueData={{
                                            key: currentIssueId || 'unknown',
                                            summary: issues?.find(i => i.id === currentIssueId)?.summary || 'Sin título',
                                            description: `Estimación realizada en la sala ${roomId}`,
                                            average: avg,
                                            estimations: participants.reduce((acc, participant) => {
                                                if (participant.estimation !== undefined && participant.estimation !== null) {
                                                    acc[participant.name] = participant.estimation;
                                                }
                                                return acc;
                                            }, {} as Record<string, string | number>)
                                        }}
                                    />
                                </FeatureGuard>
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
                <Box sx={{ display: 'flex' }}>
                    {/* Anuncio lateral para usuarios free */}
                    <FeatureGuard
                        feature="adFree"
                        fallback={
                            <SidebarAdvertisement slot="9876543210" />
                        }
                    >
                        {/* No se muestra nada para usuarios premium */}
                        <></>
                    </FeatureGuard>
                    
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
                </Box>
            )}
            </Box>
        </ProtectedRoute>
    );
}
