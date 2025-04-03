import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ref, onValue, update, push, get as firebaseGet } from "firebase/database";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { realtimeDb, firestore } from "@/lib/firebaseConfig";
import { Participant } from "@/types/room";
import { useErrorStore, ErrorType, createError } from "@/store/errorStore";
import { useSubscriptionStore } from "@/store/subscriptionStore";
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
  timerEnabled?: boolean;
  timerDuration?: number;
  timerStartedAt?: number;
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
  roomTitle: string | null; // Título de la sala
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

  // Estado del temporizador
  timerEnabled: boolean;
  timerDuration: number;
  timerStartedAt: number | null;
  timerRemaining: number | null;
}

interface RoomActions {
  // Acciones para la sala
  createRoom: (seriesKey: string, title?: string) => Promise<string>;
  joinRoomWithName: (roomId: string, name: string) => Promise<void>;
  leaveRoom: () => void;

  // Acciones para votación
  selectEstimation: (value: number | string) => Promise<void>;
  revealEstimations: () => Promise<void>;
  startNewVote: () => Promise<void>;

  // Acciones para issues
  addIssue: (key: string, summary: string) => Promise<void>;
  selectCurrentIssue: (issueId: string) => Promise<void>;

  // Acciones para temporizador
  setTimerEnabled: (enabled: boolean) => Promise<void>;
  setTimerDuration: (duration: number) => Promise<void>;
  startTimer: () => Promise<void>;
  stopTimer: () => Promise<void>;
  resetTimer: () => Promise<void>;

  // Acciones para estado
  setError: (error: string | null) => void;
  setLoading: (isLoading: boolean) => void;
}

// Valores iniciales
const initialState: RoomState = {
  roomId: null,
  roomTitle: null,
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
  timerEnabled: false,
  timerDuration: 60, // 60 segundos por defecto
  timerStartedAt: null,
  timerRemaining: null,
};

// Definición de series de estimación
const seriesList: Record<string, (string | number)[]> = {
  fibonacci: [1, 2, 3, 5, 8, 13, 21, "?", "∞", "☕"],
  tshirt: ["XS", "S", "M", "L", "XL", "XXL", "?", "∞", "☕"],
  powers2: [1, 2, 4, 8, 16, 32, "?", "∞", "☕"],
  days: ["1d", "2d", "3d", "5d", "8d", "?", "∞", "☕"],
};

// Creación del store con persistencia
export const useRoomStore = create<RoomState & RoomActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Crear una nueva sala
      createRoom: async (seriesKey: string, title?: string) => {
        const errorStore = useErrorStore.getState();
        const subscriptionStore = useSubscriptionStore.getState();
        set({ isLoading: true, error: null });

        try {
          const roomId = Math.random().toString(36).substring(7);
          const sessionId = Math.random().toString(36).substring(7);
          const timestamp = Date.now();

          // Obtener el plan de suscripción del creador
          const creatorPlan = subscriptionStore.getCurrentPlan();
          
          // Obtener el ID del usuario actual
          let creatorId = 'anonymous';
          try {
            const authData = localStorage.getItem('poker-planning-auth');
            if (authData) {
              const { currentUser } = JSON.parse(authData);
              if (currentUser && currentUser.uid) {
                creatorId = currentUser.uid;
                console.log(`Creating room with creator ID: ${creatorId}`);
              }
            }
          } catch (error) {
            console.error('Error getting current user ID:', error);
          }

          // Generar un ID de participante para el creador de la sala
          const participantId = Math.random().toString(36).substring(7);
          localStorage.setItem(`participant_id_${roomId}`, participantId);

          // Crear metadatos de la sala en Realtime Database
          const roomMetadata = {
            createdAt: timestamp,
            seriesKey,
            seriesValues: seriesList[seriesKey],
            creatorId: creatorId,
            creatorPlan: creatorPlan, // Guardar el plan del creador
            title: title || `Sala ${roomId}` // Usar el título proporcionado o uno por defecto
          };
          
          console.log(`Storing room ${roomId} metadata in RTDB:`, roomMetadata);
          await update(ref(realtimeDb, `rooms/${roomId}/metadata`), roomMetadata);
          
          // También guardar en Firestore para asegurar consistencia
          try {
            const firestoreRoomData = {
              createdAt: timestamp,
              createdBy: creatorId,
              creatorId: creatorId, // Añadir también como creatorId para consistencia
              creatorPlan: creatorPlan, // Guardar el plan del creador
              title: title || `Sala ${roomId}`, // Usar el título proporcionado o uno por defecto
              active: true
            };
            
            const firestoreRoomRef = doc(firestore, 'rooms', roomId);
            await setDoc(firestoreRoomRef, firestoreRoomData);
            console.log(`Room ${roomId} metadata stored in Firestore:`, firestoreRoomData);
          } catch (firestoreError) {
            console.error('Error storing room metadata in Firestore:', firestoreError);
            // No propagamos el error para no interrumpir la creación de la sala
          }

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
          
          // Obtener el título de la sala
          const roomTitle = roomMetadata.title || `Sala ${roomId}`;

          // Verificar si la sala está marcada para eliminación o inactiva
          if (roomMetadata.markedForDeletion === true || roomMetadata.active === false) {
            const appError = createError(
              ErrorType.ROOM_NOT_FOUND,
              "Esta sala ha sido cerrada porque todos los participantes la abandonaron.",
              { roomId }
            );
            errorStore.setError(appError);
            set({ error: appError.message });
            throw new Error(appError.message);
          }
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
            estimationOptions: seriesValues,
            reveal: false // Asegurarse de que reveal sea false al unirse a una sala
          });

          // Configurar listeners para la sala
          const roomRef = ref(realtimeDb, `rooms/${roomId}`);
          // Guardar IDs y título
          set({ roomId, sessionId, roomTitle });
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
                  active?: boolean;
                };
                return {
                  id: key,
                  name: participant.name,
                  estimation: participant.estimation,
                  // Usar el rol del participante si existe, o asignar PARTICIPANT por defecto
                  role: (participant.role as UserRole) || UserRole.PARTICIPANT,
                  // Incluir el estado activo del participante
                  active: participant.active,
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
              // Si no hay sesión activa o es una nueva sesión, asegurarse de que reveal sea false
              if (!data.sessions || Object.keys(data.sessions).length === 0) {
                set({ reveal: false });
              } else {
                set({ reveal: data.reveal });
              }
            } else {
              // Si no hay un valor de reveal, establecerlo a false por defecto
              set({ reveal: false });
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

            // Actualizar datos del temporizador desde la sesión activa
            if (data.sessions && sessionId && data.sessions[sessionId]) {
              const activeSession = data.sessions[sessionId];

              // Actualizar timerEnabled
              if (typeof activeSession.timerEnabled === "boolean") {
                set({ timerEnabled: activeSession.timerEnabled });
              }

              // Actualizar timerDuration
              if (typeof activeSession.timerDuration === "number") {
                set({ timerDuration: activeSession.timerDuration });
              }

              // Actualizar timerStartedAt - siempre actualizar, incluso si es undefined
              set({ timerStartedAt: activeSession.timerStartedAt || null });
            }

            // También actualizar datos del temporizador desde la estructura antigua para compatibilidad

            if (typeof data.timerStartedAt === "number" || data.timerStartedAt === null) {
              set({ timerStartedAt: data.timerStartedAt });
            }

            if (typeof data.timerEnabled === "boolean") {
              set({ timerEnabled: data.timerEnabled });
            }

            if (typeof data.timerDuration === "number") {
              set({ timerDuration: data.timerDuration });
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
      leaveRoom: async () => {
        const errorStore = useErrorStore.getState();
        const { roomId, currentParticipantId, participants } = get();

        if (!roomId) {
          const appError = createError(
            ErrorType.VALIDATION_ERROR,
            "No estás en una sala activa."
          );
          errorStore.setError(appError);
          return;
        }

        try {
          // Marcar al participante como inactivo en Firebase
          if (currentParticipantId) {
            const participantRef = ref(realtimeDb, `rooms/${roomId}/participants/${currentParticipantId}`);
            await update(participantRef, {
              active: false,
              lastActive: Date.now(),
              estimation: null // Limpiar la estimación para que no afecte a la votación
            });

            // Verificar si este era el último participante activo
            // Filtrar los participantes activos, excluyendo al que acaba de salir
            const activeParticipants = participants.filter(
              p => p.active !== false && p.id !== currentParticipantId
            );

            // Si no quedan participantes activos, eliminar la sala
            if (activeParticipants.length === 0) {

              // Marcar la sala como inactiva para que pueda ser eliminada por un proceso de limpieza
              const roomRef = ref(realtimeDb, `rooms/${roomId}/metadata`);
              await update(roomRef, {
                active: false,
                lastActive: Date.now(),
                markedForDeletion: true
              });

              // También podríamos eliminar la sala directamente, pero es más seguro
              // marcarla para eliminación y tener un proceso separado que las elimine
              // después de un cierto tiempo (por ejemplo, 24 horas)
            }
          }

          // Limpiar el estado local
          set({ ...initialState });
          
          // Intentar marcar la sala como inactiva en Firestore
          // Nota: Esto puede fallar debido a permisos, pero no es crítico
          // ya que la sala se marca como inactiva en Realtime Database
          try {
            const firestoreRoomRef = doc(firestore, 'rooms', roomId);
            await updateDoc(firestoreRoomRef, {
              active: false,
              lastActive: Date.now()
            });
            console.log(`Room ${roomId} marked as inactive in Firestore`);
          } catch (firestoreError) {
            // No mostrar el error en consola para evitar ruido
            // Este error es esperado debido a las reglas de seguridad
            // y no afecta la funcionalidad principal
            console.log(`Note: Room ${roomId} could not be marked as inactive in Firestore due to permissions. This is expected behavior.`);
          }
        } catch (error) {
          console.error("Error al salir de la sala:", error);
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
        set({
          reveal: true,
          timerStartedAt: null // Detener el temporizador localmente cuando se revelan las estimaciones
        });

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
            const sessionPromise = update(sessionRef, {
              reveal: true,
              timerStartedAt: null // Detener el temporizador en Firebase cuando se revelan las estimaciones
            })
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
            const roomPromise = update(roomRef, {
              reveal: true,
              timerStartedAt: null // Detener el temporizador en la estructura antigua
            })
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
        set({
          reveal: false,
          timerStartedAt: null, // Resetear el temporizador
          timerRemaining: null
        });

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
            const sessionPromise = update(sessionRef, {
              reveal: false,
              timerStartedAt: null // Resetear el temporizador en Firebase
            })
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
            const roomPromise = update(roomRef, {
              reveal: false,
              timerStartedAt: null // Resetear el temporizador en la estructura antigua
            })
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

      // Acciones para temporizador
      setTimerEnabled: async (enabled) => {
        const { roomId, sessionId } = get();

        if (!roomId || !sessionId) {
          const appError = createError(
            ErrorType.VALIDATION_ERROR,
            "No estás en una sala activa. Vuelve a unirte a la sala."
          );
          useErrorStore.getState().setError(appError);
          set({ error: appError.message });
          return;
        }

        // Actualizar estado local
        set({ timerEnabled: enabled });

        try {
          // Actualizar en Firebase
          const sessionRef = ref(realtimeDb, `rooms/${roomId}/sessions/${sessionId}`);
          await update(sessionRef, { timerEnabled: enabled });

        } catch (error) {
          console.error("Error al actualizar estado del temporizador:", error);
          const appError = createError(
            ErrorType.UNKNOWN_ERROR,
            "Error al actualizar estado del temporizador.",
            { originalError: error },
            () => get().setTimerEnabled(enabled) // Acción de recuperación: reintentar
          );
          useErrorStore.getState().setError(appError);
          set({ error: appError.message });
        }
      },

      setTimerDuration: async (duration) => {
        const { roomId, sessionId } = get();

        if (!roomId || !sessionId) {
          const appError = createError(
            ErrorType.VALIDATION_ERROR,
            "No estás en una sala activa. Vuelve a unirte a la sala."
          );
          useErrorStore.getState().setError(appError);
          set({ error: appError.message });
          return;
        }

        if (duration < 10 || duration > 600) {
          const appError = createError(
            ErrorType.VALIDATION_ERROR,
            "La duración del temporizador debe estar entre 10 y 600 segundos."
          );
          useErrorStore.getState().setError(appError);
          set({ error: appError.message });
          return;
        }

        // Actualizar estado local
        set({ timerDuration: duration });

        try {
          // Actualizar en Firebase
          const sessionRef = ref(realtimeDb, `rooms/${roomId}/sessions/${sessionId}`);
          await update(sessionRef, { timerDuration: duration });

        } catch (error) {
          console.error("Error al actualizar duración del temporizador:", error);
          const appError = createError(
            ErrorType.UNKNOWN_ERROR,
            "Error al actualizar duración del temporizador.",
            { originalError: error },
            () => get().setTimerDuration(duration) // Acción de recuperación: reintentar
          );
          useErrorStore.getState().setError(appError);
          set({ error: appError.message });
        }
      },

      startTimer: async () => {
        const { roomId, sessionId, timerDuration, timerEnabled } = get();

        if (!roomId || !sessionId) {
          const appError = createError(
            ErrorType.VALIDATION_ERROR,
            "No estás en una sala activa. Vuelve a unirte a la sala."
          );
          useErrorStore.getState().setError(appError);
          set({ error: appError.message });
          return;
        }

        if (!timerEnabled) {
          const appError = createError(
            ErrorType.VALIDATION_ERROR,
            "El temporizador está deshabilitado."
          );
          useErrorStore.getState().setError(appError);
          set({ error: appError.message });
          return;
        }

        const now = Date.now();

        // Actualizar estado local
        set({
          timerStartedAt: now,
          timerRemaining: timerDuration * 1000 // Convertir a milisegundos
        });

        try {
          // Actualizar en Firebase
          const sessionRef = ref(realtimeDb, `rooms/${roomId}/sessions/${sessionId}`);
          await update(sessionRef, {
            timerStartedAt: now,
            reveal: false // Asegurarse de que las cartas no estén reveladas al iniciar el temporizador
          });

          // También actualizar el estado de revelación en la estructura antigua
          const roomRef = ref(realtimeDb, `rooms/${roomId}`);
          await update(roomRef, { reveal: false });

          // Resetear estimaciones de participantes
          const { participants } = get();
          for (const participant of participants) {
            const participantRef = ref(
              realtimeDb,
              `rooms/${roomId}/participants/${participant.id}`
            );
            await update(participantRef, { estimation: null });
          }

          // Actualizar los participantes localmente
          const updatedParticipants = participants.map(p => ({
            ...p,
            estimation: undefined
          }));
          set({ participants: updatedParticipants, reveal: false });

        } catch (error) {
          console.error("Error al iniciar temporizador:", error);
          const appError = createError(
            ErrorType.UNKNOWN_ERROR,
            "Error al iniciar temporizador.",
            { originalError: error },
            () => get().startTimer() // Acción de recuperación: reintentar
          );
          useErrorStore.getState().setError(appError);
          set({ error: appError.message });
        }
      },

      stopTimer: async () => {
        const { roomId, sessionId } = get();

        if (!roomId || !sessionId) {
          const appError = createError(
            ErrorType.VALIDATION_ERROR,
            "No estás en una sala activa. Vuelve a unirte a la sala."
          );
          useErrorStore.getState().setError(appError);
          set({ error: appError.message });
          return;
        }

        // Actualizar estado local
        set({ timerStartedAt: null, timerRemaining: null });

        try {
          // Actualizar en Firebase
          const sessionRef = ref(realtimeDb, `rooms/${roomId}/sessions/${sessionId}`);
          await update(sessionRef, { timerStartedAt: null });

        } catch (error) {
          console.error("Error al detener temporizador:", error);
          const appError = createError(
            ErrorType.UNKNOWN_ERROR,
            "Error al detener temporizador.",
            { originalError: error },
            () => get().stopTimer() // Acción de recuperación: reintentar
          );
          useErrorStore.getState().setError(appError);
          set({ error: appError.message });
        }
      },

      resetTimer: async () => {
        const { roomId, sessionId } = get();

        if (!roomId || !sessionId) {
          const appError = createError(
            ErrorType.VALIDATION_ERROR,
            "No estás en una sala activa. Vuelve a unirte a la sala."
          );
          useErrorStore.getState().setError(appError);
          set({ error: appError.message });
          return;
        }

        // Actualizar estado local
        set({ timerStartedAt: null, timerRemaining: null });

        try {
          // Actualizar en Firebase
          const sessionRef = ref(realtimeDb, `rooms/${roomId}/sessions/${sessionId}`);
          await update(sessionRef, { timerStartedAt: null });

        } catch (error) {
          console.error("Error al reiniciar temporizador:", error);
          const appError = createError(
            ErrorType.UNKNOWN_ERROR,
            "Error al reiniciar temporizador.",
            { originalError: error },
            () => get().resetTimer() // Acción de recuperación: reintentar
          );
          useErrorStore.getState().setError(appError);
          set({ error: appError.message });
        }
      },

      // Utilidades para manejar estado
      setError: (error) => set({ error }),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: "poker-planning-storage", // Nombre único para el almacenamiento en localStorage
      partialize: (state) => ({
        // Solo persistir estos campos
        roomId: state.roomId,
        sessionId: state.sessionId,
        currentParticipantId: state.currentParticipantId,
        seriesKey: state.seriesKey,
        estimationOptions: state.estimationOptions,
        currentIssueId: state.currentIssueId,
        reveal: state.reveal,
        timerEnabled: state.timerEnabled,
        timerDuration: state.timerDuration,
        timerStartedAt: state.timerStartedAt,
        timerRemaining: state.timerRemaining,
      }),
    }
  )
);
