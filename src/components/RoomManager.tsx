"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Divider,
} from "@mui/material";
import { useRoomStore } from "@/store/roomStore";
import { useErrorStore, ErrorType, createError } from "@/store/errorStore";
import { OnboardingButton } from "./Onboarding";
import { useAuth } from "@/context/authContext";

export default function RoomManager() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState("");
  const [name, setName] = useState("");
  const [selectedSeries, setSelectedSeries] = useState("fibonacci");

  // Usar el store de Zustand
  const { createRoom, joinRoomWithName, isLoading } = useRoomStore();

  // Usar el store de errores
  const errorStore = useErrorStore.getState();

  // Obtener el usuario autenticado
  const { currentUser } = useAuth();

  // Usar el nombre del usuario autenticado si está disponible
  useEffect(() => {
    if (currentUser && currentUser.displayName) {
      setName(currentUser.displayName);
    }
  }, [currentUser]);

  const handleCreateRoom = async () => {
    if (!name.trim()) {
      errorStore.setError(createError(
        ErrorType.VALIDATION_ERROR,
        "Debes ingresar tu nombre para crear una sala"
      ));
      return;
    }

    try {
      const roomId = await createRoom(selectedSeries);
      // Después de crear la sala, unirse a ella con el nombre
      await joinRoomWithName(roomId, name);
      router.push(`/room/${roomId}`);
    } catch (error) {
      // Los errores ya son manejados por el store
      // No registramos el error en la consola por razones de seguridad
    }
  };

  const handleJoinRoom = async () => {
    if (!roomCode.trim()) {
      errorStore.setError(createError(
        ErrorType.VALIDATION_ERROR,
        "Debes ingresar un código de sala"
      ));
      return;
    }

    if (!name.trim()) {
      errorStore.setError(createError(
        ErrorType.VALIDATION_ERROR,
        "Debes ingresar tu nombre"
      ));
      return;
    }

    try {
      await joinRoomWithName(roomCode, name);
      router.push(`/room/${roomCode}`);
    } catch (error) {
      // Los errores ya son manejados por el store
      // No registramos el error en la consola por razones de seguridad
    }
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      padding={2}
      gap={4}
    >
      <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
        <Typography variant="h3" marginBottom={1}>
          Poker Planning Pro
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <OnboardingButton variant="text" />
          <Divider orientation="vertical" flexItem />
          <Typography variant="body2" color="text.secondary">
            ¿Primera vez? Prueba nuestro tutorial interactivo
          </Typography>
        </Box>
      </Box>

      {/* Sección para CREAR SALA */}
      <Box
        data-onboarding="create-room"
        sx={{
          p: 4,
          width: "100%",
          maxWidth: 500,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          boxShadow: 3,
          borderRadius: 2,
          bgcolor: "background.paper",
        }}
      >
        <Typography variant="h5" textAlign="center">
          Crear Sala
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Crea una nueva sala y comparte el código con tu equipo para comenzar a
          estimar.
        </Typography>

        <TextField
          label="Tu nombre"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={!!(currentUser && currentUser.displayName)}
          helperText={currentUser && currentUser.displayName ? "Usando tu nombre de perfil" : ""}
        />

        <FormControl fullWidth>
          <InputLabel id="series-label">Tipo de Serie</InputLabel>
          <Select
            labelId="series-label"
            value={selectedSeries}
            label="Tipo de Serie"
            onChange={(e) => setSelectedSeries(e.target.value)}
          >
            <MenuItem value="fibonacci">Fibonacci</MenuItem>
            <MenuItem value="tshirt">T-Shirt</MenuItem>
            <MenuItem value="powers2">Poderes de 2</MenuItem>
            <MenuItem value="days">Días</MenuItem>
          </Select>
        </FormControl>

        <Button
          variant="contained"
          color="primary"
          onClick={handleCreateRoom}
          disabled={isLoading}
          sx={{
            textTransform: "none",
            transition: "transform 0.2s ease",
            "&:hover": {
              transform: "translateY(-2px) scale(1.02)",
            },
          }}
        >
          {isLoading ? <CircularProgress size={24} /> : "Crear Sala"}
        </Button>
      </Box>

      {/* Sección para UNIRSE A SALA */}
      <Box
        data-onboarding="join-room"
        sx={{
          p: 4,
          width: "100%",
          maxWidth: 500,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          boxShadow: 3,
          borderRadius: 2,
          bgcolor: "background.paper",
        }}
      >
        <Typography variant="h5" textAlign="center">
          Unirse a una Sala
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Ingresa el código de sala que te compartieron para unirte a la sesión
          de estimación.
        </Typography>

        <TextField
          label="Código de Sala"
          fullWidth
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
        />

        <TextField
          label="Tu nombre"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={!!(currentUser && currentUser.displayName)}
          helperText={currentUser && currentUser.displayName ? "Usando tu nombre de perfil" : ""}
        />

        <Button
          variant="outlined"
          color="secondary"
          onClick={handleJoinRoom}
          disabled={isLoading}
          sx={{
            textTransform: "none",
            transition: "transform 0.2s ease",
            "&:hover": {
              transform: "translateY(-2px) scale(1.02)",
            },
          }}
        >
          {isLoading ? <CircularProgress size={24} /> : "Unirse"}
        </Button>
      </Box>
    </Box>
  );
}
