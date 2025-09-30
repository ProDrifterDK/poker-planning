import { create } from "zustand";

// Tipos de errores
export enum ErrorType {
  // Errores de red
  NETWORK_ERROR = "NETWORK_ERROR",
  SERVER_ERROR = "SERVER_ERROR",
  TIMEOUT_ERROR = "TIMEOUT_ERROR",
  
  // Errores de autenticación
  AUTH_ERROR = "AUTH_ERROR",
  UNAUTHORIZED = "UNAUTHORIZED",
  
  // Errores de datos
  DATA_NOT_FOUND = "DATA_NOT_FOUND",
  INVALID_DATA = "INVALID_DATA",
  
  // Errores de la aplicación
  ROOM_NOT_FOUND = "ROOM_NOT_FOUND",
  ROOM_CREATION_FAILED = "ROOM_CREATION_FAILED",
  JOIN_ROOM_FAILED = "JOIN_ROOM_FAILED",
  VOTE_FAILED = "VOTE_FAILED",
  UPDATE_FAILED = "UPDATE_FAILED",
  
  // Errores de suscripción
  SUBSCRIPTION_LIMIT_REACHED = "SUBSCRIPTION_LIMIT_REACHED",
  
  // Errores de validación
  VALIDATION_ERROR = "VALIDATION_ERROR",
  
  // Errores genéricos
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

// Interfaz para el error
export interface AppError {
  type: ErrorType;
  message: string;
  timestamp: number;
  details?: unknown;
  recoveryAction?: () => void;
}

// Interfaz para el store
interface ErrorState {
  // Estado
  currentError: AppError | null;
  errorHistory: AppError[];
  
  // Acciones
  setError: (error: AppError) => void;
  clearError: () => void;
  addRecoveryAction: (action: () => void) => void;
}

// Mensajes de error predefinidos
export const errorMessages: Record<ErrorType, string> = {
  [ErrorType.NETWORK_ERROR]: "Error de conexión. Verifica tu conexión a internet.",
  [ErrorType.SERVER_ERROR]: "Error en el servidor. Intenta nuevamente más tarde.",
  [ErrorType.TIMEOUT_ERROR]: "La operación ha tardado demasiado tiempo. Intenta nuevamente.",
  
  [ErrorType.AUTH_ERROR]: "Error de autenticación. Inicia sesión nuevamente.",
  [ErrorType.UNAUTHORIZED]: "No tienes permisos para realizar esta acción.",
  
  [ErrorType.DATA_NOT_FOUND]: "No se encontraron los datos solicitados.",
  [ErrorType.INVALID_DATA]: "Los datos proporcionados no son válidos.",
  
  [ErrorType.ROOM_NOT_FOUND]: "La sala no existe o ha sido eliminada.",
  [ErrorType.ROOM_CREATION_FAILED]: "No se pudo crear la sala. Intenta nuevamente.",
  [ErrorType.JOIN_ROOM_FAILED]: "No se pudo unir a la sala. Verifica el código e intenta nuevamente.",
  [ErrorType.VOTE_FAILED]: "No se pudo registrar tu voto. Intenta nuevamente.",
  [ErrorType.UPDATE_FAILED]: "No se pudo actualizar el estado. Intenta nuevamente.",
  
  [ErrorType.SUBSCRIPTION_LIMIT_REACHED]: "Has alcanzado el límite de tu plan actual. Actualiza tu suscripción para continuar.",
  
  [ErrorType.VALIDATION_ERROR]: "Por favor verifica los datos ingresados.",
  
  [ErrorType.UNKNOWN_ERROR]: "Ha ocurrido un error inesperado. Intenta nuevamente.",
};

// Creación del store
export const useErrorStore = create<ErrorState>((set, get) => ({
  currentError: null,
  errorHistory: [],
  
  setError: (error: AppError) => {
    // Añadir timestamp si no tiene
    if (!error.timestamp) {
      error.timestamp = Date.now();
    }
    
    // Añadir mensaje predefinido si no tiene
    if (!error.message && error.type) {
      error.message = errorMessages[error.type] || errorMessages[ErrorType.UNKNOWN_ERROR];
    }
    
    set({ 
      currentError: error,
      errorHistory: [...get().errorHistory, error]
    });
    
    // Log del error para debugging
    console.error("Error:", error.type, error.message, error.details);
  },
  
  clearError: () => set({ currentError: null }),
  
  addRecoveryAction: (action: () => void) => {
    const currentError = get().currentError;
    if (currentError) {
      set({ 
        currentError: { 
          ...currentError, 
          recoveryAction: action 
        } 
      });
    }
  },
}));

// Función helper para crear errores
export const createError = (
  type: ErrorType, 
  message?: string, 
  details?: unknown,
  recoveryAction?: () => void
): AppError => ({
  type,
  message: message || errorMessages[type],
  timestamp: Date.now(),
  details,
  recoveryAction,
});

// Función para manejar errores de Firebase
// Interfaz para errores de Firebase
interface FirebaseError {
  code?: string;
  message?: string;
  [key: string]: unknown;
}

// Verificar si un objeto es un error de Firebase
const isFirebaseError = (error: unknown): error is FirebaseError => {
  return typeof error === 'object' &&
         error !== null &&
         ('code' in error || 'message' in error);
};

export const handleFirebaseError = (error: unknown): AppError => {
  // Extraer el código de error de Firebase
  let errorCode = 'unknown';
  let errorMessage = '';
  
  if (isFirebaseError(error)) {
    errorCode = error.code || 'unknown';
    errorMessage = error.message || '';
  }
  
  // Mapear códigos de error de Firebase a nuestros tipos
  let errorType = ErrorType.UNKNOWN_ERROR;
  
  if (errorCode.includes('network')) {
    errorType = ErrorType.NETWORK_ERROR;
  } else if (errorCode.includes('permission-denied') || errorCode.includes('unauthorized')) {
    errorType = ErrorType.UNAUTHORIZED;
  } else if (errorCode.includes('not-found')) {
    errorType = ErrorType.DATA_NOT_FOUND;
  } else if (errorCode.includes('invalid')) {
    errorType = ErrorType.INVALID_DATA;
  } else if (errorCode.includes('timeout')) {
    errorType = ErrorType.TIMEOUT_ERROR;
  } else if (errorCode.includes('server')) {
    errorType = ErrorType.SERVER_ERROR;
  }
  
  return createError(
    errorType,
    errorMessage || errorMessages[errorType],
    { originalError: error, code: errorCode }
  );
};