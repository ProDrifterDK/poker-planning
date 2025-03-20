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
  currentParticipantId: string | null; // ID del participante actual
  
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
  currentParticipantId: null,
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
      
      // Generar un ID de participante para el creador de la sala
      const participantId = Math.random().toString(36).substring(7);
      localStorage.setItem(`participant_id_${roomId}`, participantId);
      
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
      
      // Añadir al creador como primer participante
      const participantRef = ref(realtimeDb, `rooms/${roomId}/participants/${participantId}`);
      await update(participantRef, {
        name: "Moderador", // Nombre por defecto para el creador
        joinedAt: timestamp,
        active: true,
        role: UserRole.MODERATOR, // El creador es moderador por defecto
        participantId
      });
      
      // Limpiar el estado anterior y establecer el nuevo estado
      set({
        ...initialState,
        roomId,
        sessionId,
        currentParticipantId: participantId,
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
      
      // Obtener metadatos de la sala
      const roomMetadata = roomSnapshot.val();
      const seriesKey = roomMetadata.seriesKey || 'fibonacci';
      const seriesValues = roomMetadata.seriesValues || seriesList[seriesKey];
      
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
      
      // Generar un ID de participante único y guardarlo en localStorage
      let participantId = localStorage.getItem(`participant_id_${roomId}`);
      let isNewParticipant = false;
      
      if (!participantId) {
        participantId = Math.random().toString(36).substring(7);
        localStorage.setItem(`participant_id_${roomId}`, participantId);
        isNewParticipant = true;
      }
      
      // Verificar si el participante ya existe en la sala
      const participantsSnapshot = await firebaseGet(ref(realtimeDb, `rooms/${roomId}/participants/${participantId}`));
      
      // Añadir o actualizar participante
      const participantRef = ref(realtimeDb, `rooms/${roomId}/participants/${participantId}`);
      
      if (isNewParticipant || !participantsSnapshot.exists()) {
        await update(participantRef, {
          name,
          joinedAt: Date.now(),
          active: true,
          role: UserRole.PARTICIPANT, // Asignar rol de participante por defecto
          participantId // Guardar el ID para referencia
        });
      } else {
        // Si el participante ya existe, solo actualizar su estado a activo
        await update(participantRef, {
          active: true,
          lastActive: Date.now()
        });
      }
      
      // Guardar el ID del participante en el estado local
      set({
        currentParticipantId: participantId,
        seriesKey,
        estimationOptions: seriesValues
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
    const { roomId, sessionId, reveal, participants, currentIssueId, currentParticipantId } = get();
    
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

    // Verificar que tenemos un ID de participante
    if (!currentParticipantId) {
      const appError = createError(
        ErrorType.VALIDATION_ERROR,
        "No se pudo identificar tu participante. Vuelve a unirte a la sala."
      );
      errorStore.setError(appError);
      set({ error: appError.message });
      return;
    }

    // Encontrar al participante actual usando el ID almacenado
    const myParticipant = participants.find(p => p.id === currentParticipantId);
    if (!myParticipant) {
      const appError = createError(
        ErrorType.VALIDATION_ERROR,
        "No se pudo encontrar tu participante en la sala. Vuelve a unirte a la sala."
      );
      errorStore.setError(appError);
      set({ error: appError.message });
      return;
    }
    
    // Actualizar el estado local inmediatamente para mejorar la experiencia del usuario
    // Esto permite que la UI responda incluso si las operaciones de Firebase fallan
    const updatedParticipants = participants.map(p =>
      p.id === myParticipant.id ? { ...p, estimation: value } : p
    );
    set({ participants: updatedParticipants });
    
    // Si hay un issue seleccionado, actualizar los votos locales
    if (currentIssueId) {
      const votes = { ...get().votes };
      if (!votes[currentIssueId]) {
        votes[currentIssueId] = {};
      }
      votes[currentIssueId][myParticipant.id] = value;
      set({ votes });
    }
    
    try {
      // Crear un array de promesas para todas las operaciones de Firebase
      const updatePromises = [];
      
      // 1. Guardar la estimación en el participante para compatibilidad
      try {
        const participantRef = ref(
          realtimeDb,
          `rooms/${roomId}/participants/${myParticipant.id}`
        );
        const participantPromise = update(participantRef, { estimation: value })
          .catch(err => {
            console.warn(`No se pudo actualizar la estimación del participante ${myParticipant.id}:`, err);
          });
        updatePromises.push(participantPromise);
      } catch (err) {
        console.warn("Error al preparar actualización de participante:", err);
      }
      
      // 2. Si hay un issue seleccionado, guardar el voto en la nueva estructura
      if (currentIssueId) {
        try {
          const voteRef = ref(
            realtimeDb,
            `votes/${roomId}/${sessionId}/${currentIssueId}/${myParticipant.id}`
          );
          const votePromise = update(voteRef, {
            value,
            timestamp: Date.now()
          }).catch(err => {
            console.warn(`No se pudo guardar el voto para el issue ${currentIssueId}:`, err);
          });
          updatePromises.push(votePromise);
        } catch (err) {
          console.warn("Error al preparar guardado de voto:", err);
        }
      }
      
      // Esperar a que todas las promesas se resuelvan, pero no fallar si alguna falla
      await Promise.allSettled(updatePromises);
      
      console.log("Estimación seleccionada correctamente");
    } catch (error) {
      console.error("Error al seleccionar estimación:", error);
      
      // Crear un mensaje de error más descriptivo basado en el tipo de error
      let errorMessage = "No se pudo registrar tu voto. Intenta nuevamente.";
      
      // Detectar si el error es por un bloqueador de anuncios
      if (error instanceof Error &&
          (error.message.includes("ERR_BLOCKED_BY") ||
           error.message.includes("network error") ||
           error.message.includes("failed to fetch"))) {
        errorMessage = "Parece que un bloqueador de anuncios está impidiendo la comunicación con el servidor. " +
                      "Tu voto se ha registrado localmente, pero no se sincronizará con otros usuarios. " +
                      "Desactiva el bloqueador de anuncios para esta página o añade una excepción.";
      }
      
      const appError = createError(
        ErrorType.VOTE_FAILED,
        errorMessage,
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
    const { roomId, sessionId, participants, currentIssueId, issues } = get();
    
    if (!roomId || !sessionId) {
      const appError = createError(
        ErrorType.VALIDATION_ERROR,
        "No estás en una sala activa. Vuelve a unirte a la sala."
      );
      errorStore.setError(appError);
      set({ error: appError.message });
      return;
    }

    // Actualizar estado local inmediatamente para mejorar la experiencia del usuario
    set({ reveal: true });

    // Calcular promedio
    const numericEstimations = participants
      .map((p) => p.estimation)
      .filter((val): val is number => typeof val === "number");

    let avg = "N/A";
    if (numericEstimations.length > 0) {
      const total = numericEstimations.reduce((sum, value) => sum + value, 0);
      avg = (total / numericEstimations.length).toFixed(2);
    }

    // Actualizar el issue localmente si existe
    if (currentIssueId) {
      const updatedIssues = issues.map(issue =>
        issue.id === currentIssueId
          ? { ...issue, average: avg, status: 'estimated' as const }
          : issue
      );
      set({ issues: updatedIssues });
    }

    try {
      // Crear un array de promesas para todas las operaciones de Firebase
      const updatePromises = [];
      
      // 1. Cambiar estado de revelación en la sesión
      try {
        const sessionRef = ref(realtimeDb, `rooms/${roomId}/sessions/${sessionId}`);
        const sessionPromise = update(sessionRef, { reveal: true })
          .catch(err => {
            console.warn("No se pudo actualizar la sesión:", err);
          });
        updatePromises.push(sessionPromise);
      } catch (err) {
        console.warn("Error al preparar actualización de sesión:", err);
      }
      
      // 2. Mantener compatibilidad con la estructura anterior
      try {
        const roomRef = ref(realtimeDb, `rooms/${roomId}`);
        const roomPromise = update(roomRef, { reveal: true })
          .catch(err => {
            console.warn("No se pudo actualizar la sala:", err);
          });
        updatePromises.push(roomPromise);
      } catch (err) {
        console.warn("Error al preparar actualización de sala:", err);
      }

      // 3. Si hay un issue seleccionado, actualizar su promedio y estado
      if (currentIssueId) {
        try {
          const issueRef = ref(
            realtimeDb,
            `rooms/${roomId}/issues/${currentIssueId}`
          );
          const issuePromise = update(issueRef, {
            average: avg,
            status: 'estimated'
          }).catch(err => {
            console.warn(`No se pudo actualizar el issue ${currentIssueId}:`, err);
          });
          updatePromises.push(issuePromise);
        } catch (err) {
          console.warn(`Error al preparar actualización de issue ${currentIssueId}:`, err);
        }
      }
      
      // Esperar a que todas las promesas se resuelvan, pero no fallar si alguna falla
      await Promise.allSettled(updatePromises);
      
      console.log("Estimaciones reveladas correctamente");
    } catch (error) {
      console.error("Error al revelar estimaciones:", error);
      
      // Crear un mensaje de error más descriptivo basado en el tipo de error
      let errorMessage = "Error al revelar estimaciones. Intenta nuevamente.";
      
      // Detectar si el error es por un bloqueador de anuncios
      if (error instanceof Error &&
          (error.message.includes("ERR_BLOCKED_BY") ||
           error.message.includes("network error") ||
           error.message.includes("failed to fetch"))) {
        errorMessage = "Parece que un bloqueador de anuncios está impidiendo la comunicación con el servidor. " +
                      "Las estimaciones se han revelado localmente, pero no se sincronizarán con otros usuarios. " +
                      "Desactiva el bloqueador de anuncios para esta página o añade una excepción.";
      }
      
      const appError = createError(
        ErrorType.UNKNOWN_ERROR,
        errorMessage,
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

    // Actualizar estado local inmediatamente para mejorar la experiencia del usuario
    // Esto permite que la UI responda incluso si las operaciones de Firebase fallan
    set({ reveal: false });

    try {
      // Crear un array de promesas para todas las operaciones de Firebase
      const updatePromises = [];
      
      // 1. Resetear estimaciones de participantes (para compatibilidad)
      // Modificamos para manejar cada participante individualmente y no fallar si uno falla
      for (const participant of participants) {
        try {
          const participantRef = ref(
            realtimeDb,
            `rooms/${roomId}/participants/${participant.id}`
          );
          const updatePromise = update(participantRef, { estimation: null })
            .catch(err => {
              console.warn(`No se pudo actualizar el participante ${participant.id}:`, err);
              // No propagamos el error para que otras operaciones puedan continuar
            });
          updatePromises.push(updatePromise);
        } catch (err) {
          console.warn(`Error al preparar actualización para participante ${participant.id}:`, err);
        }
      }

      // 2. Cambiar estado de revelación en la sesión
      try {
        const sessionRef = ref(realtimeDb, `rooms/${roomId}/sessions/${sessionId}`);
        const sessionPromise = update(sessionRef, { reveal: false })
          .catch(err => {
            console.warn("No se pudo actualizar la sesión:", err);
          });
        updatePromises.push(sessionPromise);
      } catch (err) {
        console.warn("Error al preparar actualización de sesión:", err);
      }
      
      // 3. Mantener compatibilidad con la estructura anterior
      try {
        const roomRef = ref(realtimeDb, `rooms/${roomId}`);
        const roomPromise = update(roomRef, { reveal: false })
          .catch(err => {
            console.warn("No se pudo actualizar la sala:", err);
          });
        updatePromises.push(roomPromise);
      } catch (err) {
        console.warn("Error al preparar actualización de sala:", err);
      }
      
      // 4. Si hay un issue seleccionado, limpiar sus votos y promedio
      if (currentIssueId) {
        // Limpiar votos locales para el issue actual
        const newVotes = { ...votes };
        if (newVotes[currentIssueId]) {
          delete newVotes[currentIssueId];
          set({ votes: newVotes });
        }
        
        // Limpiar promedio del issue actual
        try {
          const issueRef = ref(
            realtimeDb,
            `rooms/${roomId}/issues/${currentIssueId}`
          );
          const issuePromise = update(issueRef, { average: null })
            .catch(err => {
              console.warn(`No se pudo actualizar el issue ${currentIssueId}:`, err);
            });
          updatePromises.push(issuePromise);
        } catch (err) {
          console.warn(`Error al preparar actualización de issue ${currentIssueId}:`, err);
        }
      }
      
      // Esperar a que todas las promesas se resuelvan, pero no fallar si alguna falla
      await Promise.allSettled(updatePromises);
      
      // Actualizar los participantes localmente para asegurarnos de que las estimaciones se resetean
      // incluso si las operaciones de Firebase fallaron
      const updatedParticipants = participants.map(p => ({
        ...p,
        estimation: undefined // Usar undefined en lugar de null para cumplir con el tipo Participant
      }));
      set({ participants: updatedParticipants });
      
      console.log("Nueva votación iniciada correctamente");
    } catch (error) {
      console.error("Error al iniciar nueva votación:", error);
      
      // Crear un mensaje de error más descriptivo basado en el tipo de error
      let errorMessage = "Error al iniciar nueva votación. Intenta nuevamente.";
      
      // Detectar si el error es por un bloqueador de anuncios
      if (error instanceof Error &&
          (error.message.includes("ERR_BLOCKED_BY") ||
           error.message.includes("network error") ||
           error.message.includes("failed to fetch"))) {
        errorMessage = "Parece que un bloqueador de anuncios está impidiendo la comunicación con el servidor. " +
                      "Desactiva el bloqueador de anuncios para esta página o añade una excepción.";
      }
      
      const appError = createError(
        ErrorType.UNKNOWN_ERROR,
        errorMessage,
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
