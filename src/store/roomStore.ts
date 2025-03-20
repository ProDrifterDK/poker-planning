import { create } from "zustand";
import { ref, onValue, update, push, get as firebaseGet } from "firebase/database";
import { realtimeDb } from "@/lib/firebaseConfig";
import { Participant } from "@/types/room";
import { useErrorStore, ErrorType, createError } from "@/store/errorStore";
import { UserRole } from "@/types/roles";

// Interfaces para el store
/**
 * Datos de una sesión de estimación
 */
interface SessionData {
  active: boolean;
  reveal: boolean;
  currentIssueId: string | null;
  startedAt: number;
}

/**
 * Información de un issue a estimar
 */
interface Issue {
  id: string;
  key: string;
  summary: string;
  createdAt: number;
  status: 'pending' | 'estimated' | 'skipped';
  average?: string | null;
}

interface RoomState {
  // Datos de la sala actual
  roomId: string | null;
  sessionId: string | null;
  participants: Participant[];
  issues: Issue[];
  votes: Record<string, Record<string, number | string>>; // issueId -> participantId -> value
  
  // Estado de la UI
  currentIssueId: string | null;
  reveal: boolean;
  estimationOptions: (number | string)[];
  seriesKey: string;
  isLoading: boolean;
  error: string | null;
}

interface RoomActions {
  // Acciones para la sala
  createRoom: (seriesKey: string) => Promise<string>;
  joinRoomWithName: (roomId: string, name: string) => Promise<void>;
  leaveRoom: () => void;

  // Acciones para votación
  selectEstimation: (value: number | string) => Promise<void>;
  revealEstimations: () => Promise<void>;
  startNewVote: () => Promise<void>;

  // Acciones para issues
  addIssue: (key: string, summary: string) => Promise<void>;
  selectCurrentIssue: (issueId: string) => Promise<void>;

  // Acciones para estado
  setError: (error: string | null) => void;
  setLoading: (isLoading: boolean) => void;
}

// Valores iniciales
const initialState: RoomState = {
  roomId: null,
  sessionId: null,
  participants: [],
  issues: [],
  votes: {},
  currentIssueId: null,
  reveal: false,
  estimationOptions: [1, 2, 3, 5, 8, 13, 21, "?", "∞", "☕"],
  seriesKey: "fibonacci",
  isLoading: false,
  error: null,
};

// Definición de series de estimación
const seriesList: Record<string, (string | number)[]> = {
  fibonacci: [1, 2, 3, 5, 8, 13, 21, "?", "∞", "☕"],
  tshirt: ["XS", "S", "M", "L", "XL", "XXL", "?", "∞", "☕"],
  powers2: [1, 2, 4, 8, 16, 32, "?", "∞", "☕"],
  days: ["1d", "2d", "3d", "5d", "8d", "?", "∞", "☕"],
};

// Creación del store
export const useRoomStore = create<RoomState & RoomActions>((set, get) => ({
  ...initialState,

  // Crear una nueva sala
  createRoom: async (seriesKey: string) => {
    const errorStore = useErrorStore.getState();
    set({ isLoading: true, error: null });
    
    try {
      const roomId = Math.random().toString(36).substring(7);
      const sessionId = Math.random().toString(36).substring(7);
      const timestamp = Date.now();
      
      // Crear metadatos de la sala
      await update(ref(realtimeDb, `rooms/${roomId}/metadata`), {
        createdAt: timestamp,
        seriesKey,
        seriesValues: seriesList[seriesKey],
      });
      
      // Crear sesión inicial
      await update(ref(realtimeDb, `rooms/${roomId}/sessions/${sessionId}`), {
        active: true,
        reveal: false,
        currentIssueId: null,
        startedAt: timestamp,
      });
      
      // Limpiar el estado anterior y establecer el nuevo estado
      set({
        ...initialState,
        roomId,
        sessionId,
        seriesKey,
        estimationOptions: seriesList[seriesKey],
        reveal: false,
        currentIssueId: null,
      });
      
      return roomId;
    } catch (error) {
      // Usar el sistema centralizado de errores
      const appError = createError(
        ErrorType.ROOM_CREATION_FAILED,
        "No se pudo crear la sala. Intenta nuevamente.",
        { originalError: error },
        () => get().createRoom(seriesKey) // Acción de recuperación: reintentar
      );
      
      errorStore.setError(appError);
      
      // Mantener el error en el estado local para compatibilidad
      set({
        error: appError.message,
      });
      
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Unirse a una sala existente
  joinRoomWithName: async (roomId: string, name: string) => {
    const errorStore = useErrorStore.getState();
    set({ isLoading: true, error: null });
    
    try {
      // Verificar si la sala existe
      const roomSnapshot = await firebaseGet(ref(realtimeDb, `rooms/${roomId}/metadata`));
      if (!roomSnapshot.exists()) {
        const appError = createError(
          ErrorType.ROOM_NOT_FOUND,
          "La sala no existe o ha sido eliminada.",
          { roomId }
        );
        errorStore.setError(appError);
        set({ error: appError.message });
        throw new Error(appError.message);
      }
      
      // Obtener la sesión activa o crear una nueva
      const sessionsSnapshot = await firebaseGet(ref(realtimeDb, `rooms/${roomId}/sessions`));
      let sessionId = null;
      
      if (sessionsSnapshot.exists()) {
        // Buscar una sesión activa
        const sessions = sessionsSnapshot.val();
        for (const [id, session] of Object.entries(sessions)) {
          const typedSession = session as SessionData;
          if (typedSession.active) {
            sessionId = id;
            break;
          }
        }
      }
      
      // Si no hay sesión activa, crear una nueva
      if (!sessionId) {
        sessionId = Math.random().toString(36).substring(7);
        await update(ref(realtimeDb, `rooms/${roomId}/sessions/${sessionId}`), {
          active: true,
          reveal: false,
          currentIssueId: null,
          startedAt: Date.now(),
        });
      }
      
      // Añadir participante
      const participantsRef = ref(realtimeDb, `rooms/${roomId}/participants`);
      const newParticipantRef = push(participantsRef);
      await update(newParticipantRef, {
        name,
        joinedAt: Date.now(),
        active: true,
        role: UserRole.PARTICIPANT // Asignar rol de participante por defecto
      });

      // Configurar listeners para la sala
      const roomRef = ref(realtimeDb, `rooms/${roomId}`);
      // Guardar IDs
      set({ roomId, sessionId });
      const unsubscribe = onValue(roomRef, (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        // Actualizar participantes
        if (data.participants) {
          const participantsArray: Participant[] = Object.entries(
            data.participants
          ).map(([key, value]) => {
            const participant = value as {
              name: string;
              estimation?: number | string;
              role?: string;
            };
            return {
              id: key,
              name: participant.name,
              estimation: participant.estimation,
              // Usar el rol del participante si existe, o asignar PARTICIPANT por defecto
              role: (participant.role as UserRole) || UserRole.PARTICIPANT,
              // Opcionalmente, podemos añadir el userId si está disponible
              userId: undefined
            };
          });
          set({ participants: participantsArray });
        }

        // Actualizar issues
        if (data.issues) {
          const issuesArray: Issue[] = Object.entries(data.issues).map(
            ([key, val]) => {
              const obj = val as {
                key: string;
                summary: string;
                votes?: number;
                average?: string;
              };
              return {
                id: key,
                key: obj.key,
                summary: obj.summary,
                createdAt: Date.now(),
                status: 'pending',
                average: obj.average ?? null,
              };
            }
          );
          set({ issues: issuesArray });
        } else {
          set({ issues: [] });
        }

        // Actualizar estado de revelación
        if (typeof data.reveal === "boolean") {
          set({ reveal: data.reveal });
        }

        // Actualizar opciones de estimación
        if (Array.isArray(data.seriesValues)) {
          set({ estimationOptions: data.seriesValues });
        }

        // Actualizar issue actual
        if (typeof data.currentIssueId === "string") {
          set({ currentIssueId: data.currentIssueId });
        } else {
          set({ currentIssueId: null });
        }

        // Actualizar serie seleccionada
        if (typeof data.seriesKey === "string") {
          set({ seriesKey: data.seriesKey });
        }
      });

      // Guardar ID de sala
      set({ roomId });

      // Limpiar listener cuando se deje la sala
      window.addEventListener("beforeunload", () => {
        unsubscribe();
      });
    } catch (error) {
      // Si no es un error que ya hemos manejado (como sala no encontrada)
      if (!(error instanceof Error && error.message.includes("La sala no existe"))) {
        const appError = createError(
          ErrorType.JOIN_ROOM_FAILED,
          "No se pudo unir a la sala. Verifica el código e intenta nuevamente.",
          { originalError: error, roomId },
          () => get().joinRoomWithName(roomId, name) // Acción de recuperación: reintentar
        );
        errorStore.setError(appError);
        set({ error: appError.message });
      }
      
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Salir de la sala
  leaveRoom: () => {
    const errorStore = useErrorStore.getState();
    const { roomId } = get();
    
    if (!roomId) {
      const appError = createError(
        ErrorType.VALIDATION_ERROR,
        "No estás en una sala activa."
      );
      errorStore.setError(appError);
      return;
    }
    
    try {
      // En una implementación futura, podríamos marcar al participante como inactivo en Firebase
      // const myParticipant = participants[participants.length - 1];
      // if (myParticipant) {
      //   const participantRef = ref(realtimeDb, `rooms/${roomId}/participants/${myParticipant.id}`);
      //   await update(participantRef, { active: false });
      // }
      
      // Por ahora solo limpiamos el estado local
      set({ ...initialState });
    } catch (error) {
      const appError = createError(
        ErrorType.UNKNOWN_ERROR,
        "Error al salir de la sala.",
        { originalError: error }
      );
      errorStore.setError(appError);
    }
  },

  // Seleccionar una estimación
  selectEstimation: async (value: number | string) => {
    const errorStore = useErrorStore.getState();
    const { roomId, sessionId, reveal, participants, currentIssueId } = get();
    
    if (!roomId || !sessionId) {
      const appError = createError(
        ErrorType.VALIDATION_ERROR,
        "No estás en una sala activa. Vuelve a unirte a la sala."
      );
      errorStore.setError(appError);
      set({ error: appError.message });
      return;
    }

    if (reveal) {
      const appError = createError(
        ErrorType.VALIDATION_ERROR,
        "No puedes cambiar tu estimación hasta una nueva votación."
      );
      errorStore.setError(appError);
      set({ error: appError.message });
      return;
    }

    // Encontrar al participante actual (asumimos que es el último que se unió)
    // En una implementación real, deberíamos tener un ID de usuario
    const myParticipant = participants[participants.length - 1];
    if (!myParticipant) {
      const appError = createError(
        ErrorType.VALIDATION_ERROR,
        "No se pudo identificar tu participante. Vuelve a unirte a la sala."
      );
      errorStore.setError(appError);
      set({ error: appError.message });
      return;
    }
    
    try {
      // Guardar la estimación en el participante para compatibilidad
      const participantRef = ref(
        realtimeDb,
        `rooms/${roomId}/participants/${myParticipant.id}`
      );
      await update(participantRef, { estimation: value });
      
      // Si hay un issue seleccionado, guardar el voto en la nueva estructura
      if (currentIssueId) {
        const voteRef = ref(
          realtimeDb,
          `votes/${roomId}/${sessionId}/${currentIssueId}/${myParticipant.id}`
        );
        await update(voteRef, {
          value,
          timestamp: Date.now()
        });
        
        // Actualizar el estado local de votos
        const votes = { ...get().votes };
        if (!votes[currentIssueId]) {
          votes[currentIssueId] = {};
        }
        votes[currentIssueId][myParticipant.id] = value;
        set({ votes });
      }
    } catch (error) {
      const appError = createError(
        ErrorType.VOTE_FAILED,
        "No se pudo registrar tu voto. Intenta nuevamente.",
        { originalError: error, value },
        () => get().selectEstimation(value) // Acción de recuperación: reintentar
      );
      errorStore.setError(appError);
      set({ error: appError.message });
    }
  },

  // Revelar estimaciones
  revealEstimations: async () => {
    const errorStore = useErrorStore.getState();
    const { roomId, sessionId, participants, currentIssueId } = get();
    
    if (!roomId || !sessionId) {
      const appError = createError(
        ErrorType.VALIDATION_ERROR,
        "No estás en una sala activa. Vuelve a unirte a la sala."
      );
      errorStore.setError(appError);
      set({ error: appError.message });
      return;
    }

    try {
      // Cambiar estado de revelación en la sesión
      const sessionRef = ref(realtimeDb, `rooms/${roomId}/sessions/${sessionId}`);
      await update(sessionRef, { reveal: true });
      
      // Mantener compatibilidad con la estructura anterior
      const roomRef = ref(realtimeDb, `rooms/${roomId}`);
      await update(roomRef, { reveal: true });

      // Calcular promedio
      const numericEstimations = participants
        .map((p) => p.estimation)
        .filter((val): val is number => typeof val === "number");

      let avg = "N/A";
      if (numericEstimations.length > 0) {
        const total = numericEstimations.reduce((sum, value) => sum + value, 0);
        avg = (total / numericEstimations.length).toFixed(2);
      }

      // Si hay un issue seleccionado, actualizar su promedio y estado
      if (currentIssueId) {
        const issueRef = ref(
          realtimeDb,
          `rooms/${roomId}/issues/${currentIssueId}`
        );
        await update(issueRef, {
          average: avg,
          status: 'estimated'
        });
      }
      
      // Actualizar estado local
      set({ reveal: true });
    } catch (error) {
      const appError = createError(
        ErrorType.UNKNOWN_ERROR,
        "Error al revelar estimaciones. Intenta nuevamente.",
        { originalError: error },
        () => get().revealEstimations() // Acción de recuperación: reintentar
      );
      errorStore.setError(appError);
      set({ error: appError.message });
    }
  },

  // Iniciar nueva votación
  startNewVote: async () => {
    const errorStore = useErrorStore.getState();
    const { roomId, sessionId, participants, currentIssueId, votes } = get();
    
    if (!roomId || !sessionId) {
      const appError = createError(
        ErrorType.VALIDATION_ERROR,
        "No estás en una sala activa. Vuelve a unirte a la sala."
      );
      errorStore.setError(appError);
      set({ error: appError.message });
      return;
    }

    try {
      // Resetear estimaciones de participantes (para compatibilidad)
      await Promise.all(
        participants.map(async (participant) => {
          const participantRef = ref(
            realtimeDb,
            `rooms/${roomId}/participants/${participant.id}`
          );
          await update(participantRef, { estimation: null });
        })
      );

      // Cambiar estado de revelación en la sesión
      const sessionRef = ref(realtimeDb, `rooms/${roomId}/sessions/${sessionId}`);
      await update(sessionRef, { reveal: false });
      
      // Mantener compatibilidad con la estructura anterior
      const roomRef = ref(realtimeDb, `rooms/${roomId}`);
      await update(roomRef, { reveal: false });
      
      // Si hay un issue seleccionado, limpiar sus votos y promedio
      if (currentIssueId) {
        // Limpiar votos locales para el issue actual
        const newVotes = { ...votes };
        if (newVotes[currentIssueId]) {
          delete newVotes[currentIssueId];
          set({ votes: newVotes });
        }
        
        // Limpiar promedio del issue actual
        const issueRef = ref(
          realtimeDb,
          `rooms/${roomId}/issues/${currentIssueId}`
        );
        await update(issueRef, { average: null });
      }
      
      // Actualizar estado local
      set({ reveal: false });
    } catch (error) {
      const appError = createError(
        ErrorType.UNKNOWN_ERROR,
        "Error al iniciar nueva votación. Intenta nuevamente.",
        { originalError: error },
        () => get().startNewVote() // Acción de recuperación: reintentar
      );
      errorStore.setError(appError);
      set({ error: appError.message });
    }
  },

  // Añadir un nuevo issue
  addIssue: async (key: string, summary: string) => {
    const errorStore = useErrorStore.getState();
    const { roomId } = get();
    
    if (!roomId) {
      const appError = createError(
        ErrorType.VALIDATION_ERROR,
        "No estás en una sala activa. Vuelve a unirte a la sala."
      );
      errorStore.setError(appError);
      set({ error: appError.message });
      return;
    }
    
    if (!key.trim() || !summary.trim()) {
      const appError = createError(
        ErrorType.VALIDATION_ERROR,
        "La clave y el resumen del issue son obligatorios."
      );
      errorStore.setError(appError);
      set({ error: appError.message });
      return;
    }

    try {
      const issuesRef = ref(realtimeDb, `rooms/${roomId}/issues`);
      const newIssueRef = push(issuesRef);
      const timestamp = Date.now();
      await update(newIssueRef, {
        key,
        summary,
        createdAt: timestamp,
        status: 'pending',
        average: null,
      });
    } catch (error) {
      const appError = createError(
        ErrorType.INVALID_DATA,
        "Error al añadir issue. Verifica los datos e intenta nuevamente.",
        { originalError: error, key, summary },
        () => get().addIssue(key, summary) // Acción de recuperación: reintentar
      );
      errorStore.setError(appError);
      set({ error: appError.message });
    }
  },

  // Seleccionar issue actual
  selectCurrentIssue: async (issueId: string) => {
    const errorStore = useErrorStore.getState();
    const { roomId, sessionId } = get();
    
    if (!roomId || !sessionId) {
      const appError = createError(
        ErrorType.VALIDATION_ERROR,
        "No estás en una sala activa. Vuelve a unirte a la sala."
      );
      errorStore.setError(appError);
      set({ error: appError.message });
      return;
    }

    try {
      // Actualizar el issue actual en la sesión
      const sessionRef = ref(realtimeDb, `rooms/${roomId}/sessions/${sessionId}`);
      await update(sessionRef, { currentIssueId: issueId });
      
      // Mantener compatibilidad con la estructura anterior
      const roomRef = ref(realtimeDb, `rooms/${roomId}`);
      await update(roomRef, { currentIssueId: issueId });
      
      // Actualizar estado local
      set({ currentIssueId: issueId });
    } catch (error) {
      const appError = createError(
        ErrorType.UNKNOWN_ERROR,
        "Error al seleccionar issue. Intenta nuevamente.",
        { originalError: error, issueId },
        () => get().selectCurrentIssue(issueId) // Acción de recuperación: reintentar
      );
      errorStore.setError(appError);
      set({ error: appError.message });
    }
  },

  // Utilidades para manejar estado
  setError: (error) => set({ error }),
  setLoading: (isLoading) => set({ isLoading }),
}));
