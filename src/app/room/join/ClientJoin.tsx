"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useRoomStore } from "@/store/roomStore";

export default function ClientJoin() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomCode = searchParams.get("code");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Usar el store de Zustand
  const { joinRoomWithName, isLoading, error, setError } = useRoomStore();

  const handleJoinRoom = async () => {
    if (!roomCode) {
      setError("Código de sala no válido");
      return;
    }

    if (!name.trim()) {
      setError("Debes ingresar tu nombre");
      return;
    }

    setIsSubmitting(true);
    try {
      await joinRoomWithName(roomCode, name);
      router.push(`/room/${roomCode}`);
    } catch (error) {
      console.error("Error al unirse a la sala:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="70vh"
      padding={4}
      gap={3}
    >
      <Typography variant="h4" gutterBottom>
        Unirse a la Sala
      </Typography>

      <Typography variant="h6" color="text.secondary">
        Código de sala: <strong>{roomCode}</strong>
      </Typography>

      {error && (
        <Alert
          severity="error"
          onClose={() => setError(null)}
          sx={{ width: "100%", maxWidth: 400 }}
        >
          {error}
        </Alert>
      )}

      <Box
        sx={{
          width: "100%",
          maxWidth: 400,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          p: 3,
          borderRadius: 2,
          boxShadow: 3,
          bgcolor: "background.paper",
        }}
      >
        <TextField
          label="Tu nombre"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isLoading || isSubmitting}
        />

        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={handleJoinRoom}
          disabled={isLoading || isSubmitting}
          sx={{ mt: 2 }}
        >
          {isLoading || isSubmitting ? (
            <CircularProgress size={24} />
          ) : (
            "Unirse a la Sala"
          )}
        </Button>
      </Box>
    </Box>
  );
}
