"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User,
  onAuthStateChanged
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import {
  auth,
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  logOut,
  resetPassword,
  updateUserProfile
} from '@/lib/firebaseConfig';

// Variable para detectar si estamos en el cliente
const isClient = typeof window !== 'undefined';

// Función para traducir los códigos de error de Firebase a mensajes más amigables
const getReadableErrorMessage = (error: FirebaseError): string => {
  const errorCode = error.code;
  
  // Mapeo de códigos de error a mensajes amigables
  const errorMessages: Record<string, string> = {
    // Errores de autenticación con email/contraseña
    'auth/invalid-credential': 'Las credenciales son incorrectas',
    'auth/user-not-found': 'No existe una cuenta con este correo electrónico',
    'auth/wrong-password': 'La contraseña es incorrecta',
    'auth/invalid-email': 'El formato del correo electrónico no es válido',
    'auth/email-already-in-use': 'Este correo electrónico ya está en uso',
    'auth/weak-password': 'La contraseña es demasiado débil. Debe tener al menos 6 caracteres',
    'auth/user-disabled': 'Esta cuenta ha sido deshabilitada',
    'auth/requires-recent-login': 'Por seguridad, debes volver a iniciar sesión antes de realizar esta acción',
    
    // Errores de restablecimiento de contraseña
    'auth/expired-action-code': 'El enlace ha expirado. Por favor, solicita un nuevo enlace',
    'auth/invalid-action-code': 'El enlace no es válido. Es posible que ya haya sido utilizado',
    
    // Errores de autenticación con proveedores (Google, etc.)
    'auth/account-exists-with-different-credential': 'Ya existe una cuenta con este correo electrónico. Intenta iniciar sesión con otro método',
    'auth/popup-closed-by-user': 'El proceso de inicio de sesión fue cancelado',
    'auth/cancelled-popup-request': 'El proceso de inicio de sesión fue cancelado',
    'auth/popup-blocked': 'El navegador bloqueó la ventana emergente. Por favor, permite ventanas emergentes para este sitio',
    
    // Errores generales
    'auth/network-request-failed': 'Error de conexión. Verifica tu conexión a internet',
    'auth/too-many-requests': 'Demasiados intentos fallidos. Por favor, intenta más tarde',
    'auth/internal-error': 'Error interno. Por favor, intenta más tarde',
  };
  
  // Devolver el mensaje personalizado o un mensaje genérico si no hay mapeo
  return errorMessages[errorCode] || `Error de autenticación: ${error.message}`;
};

// Definir la interfaz para el contexto
interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogleProvider: () => Promise<void>;
  logout: () => Promise<void>;
  resetUserPassword: (email: string) => Promise<void>;
  updateProfile: (displayName: string, photoURL?: string) => Promise<void>;
  clearError: () => void;
}

// Crear el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook personalizado para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

// Proveedor del contexto
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Solo ejecutar en el cliente
  useEffect(() => {
    setMounted(true);
    
    // Escuchar cambios en el estado de autenticación solo en el cliente
    if (isClient) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setCurrentUser(user);
        setLoading(false);
      });

      return unsubscribe;
    }
    
    // Si estamos en el servidor, simplemente marcar como no cargando
    setLoading(false);
    return undefined;
  }, []);

  // No renderizar nada hasta que el componente esté montado en el cliente
  if (!mounted && isClient) {
    return null;
  }

  // Registrar un nuevo usuario
  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await signUpWithEmail(email, password);
      if (result.user) {
        await updateUserProfile(result.user, displayName);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof FirebaseError
        ? getReadableErrorMessage(err)
        : 'Error al registrar usuario';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Iniciar sesión con email y contraseña
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      await signInWithEmail(email, password);
    } catch (err: unknown) {
      const errorMessage = err instanceof FirebaseError
        ? getReadableErrorMessage(err)
        : 'Error al iniciar sesión';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Iniciar sesión con Google
  const signInWithGoogleProvider = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogle();
    } catch (err: unknown) {
      const errorMessage = err instanceof FirebaseError
        ? getReadableErrorMessage(err)
        : 'Error al iniciar sesión con Google';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Cerrar sesión
  const logout = async () => {
    try {
      setLoading(true);
      setError(null);
      await logOut();
    } catch (err: unknown) {
      const errorMessage = err instanceof FirebaseError
        ? getReadableErrorMessage(err)
        : 'Error al cerrar sesión';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Restablecer contraseña
  const resetUserPassword = async (email: string) => {
    try {
      setLoading(true);
      setError(null);
      await resetPassword(email);
    } catch (err: unknown) {
      const errorMessage = err instanceof FirebaseError
        ? getReadableErrorMessage(err)
        : 'Error al restablecer contraseña';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Actualizar perfil
  const updateProfile = async (displayName: string, photoURL?: string) => {
    try {
      setLoading(true);
      setError(null);
      if (currentUser) {
        await updateUserProfile(currentUser, displayName, photoURL);
      } else {
        throw new Error('No hay usuario autenticado');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof FirebaseError
        ? getReadableErrorMessage(err)
        : 'Error al actualizar perfil';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Limpiar errores
  const clearError = () => {
    setError(null);
  };

  const value = {
    currentUser,
    loading,
    error,
    signUp,
    signIn,
    signInWithGoogleProvider,
    logout,
    resetUserPassword,
    updateProfile,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};