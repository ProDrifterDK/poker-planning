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
import { getUserRole, initializeUserProfile } from '@/lib/roleService';
import { UserRole, Permission, hasPermission as checkPermission } from '@/types/roles';
import {
  updateUserProfileData,
  updateUserDisplayNameAndPhoto,
  updateUserEmail,
  updateNotificationPreferences,
  deleteUserAccount,
  type NotificationPreferences,
  type UserProfileData
} from '@/lib/userProfileService';

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
  userRole: UserRole | null;
  loading: boolean;
  error: string | null;
  
  // Funciones de autenticación
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogleProvider: () => Promise<void>;
  logout: () => Promise<void>;
  resetUserPassword: (email: string) => Promise<void>;
  
  // Funciones de perfil básicas
  updateProfile: (displayName: string, photoURL?: string) => Promise<void>;
  
  // Funciones de perfil extendidas
  updateUserData: (data: UserProfileData) => Promise<boolean>;
  updateUserEmail: (currentPassword: string, newEmail: string) => Promise<boolean>;
  updateNotificationPreferences: (preferences: NotificationPreferences) => Promise<boolean>;
  deleteAccount: (currentPassword: string) => Promise<boolean>;
  
  // Utilidades
  clearError: () => void;
  hasPermission: (permission: import('@/types/roles').Permission) => boolean;
  isModerator: () => boolean;
  isGuestUser: () => boolean;
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
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Función para cargar el rol del usuario
  const loadUserRole = async (user: User) => {
    try {
      const role = await getUserRole(user.uid);
      setUserRole(role);
    } catch (error) {
      console.error('Error al cargar el rol del usuario:', error);
      setUserRole(UserRole.PARTICIPANT); // Rol por defecto en caso de error
    }
  };

  // Solo ejecutar en el cliente
  useEffect(() => {
    setMounted(true);
    
    // Escuchar cambios en el estado de autenticación solo en el cliente
    if (isClient) {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        setCurrentUser(user);
        
        if (user) {
          // Inicializar o actualizar el perfil del usuario
          await initializeUserProfile(user);
          // Cargar el rol del usuario
          await loadUserRole(user);
        } else {
          setUserRole(null);
        }
        
        setLoading(false);
      });

      return unsubscribe;
    }
    
    // Si estamos en el servidor, simplemente marcar como no cargando
    setLoading(false);
    return undefined;
  }, []);

  // Verificar si el usuario tiene un permiso específico
  const hasPermission = (permission: Permission): boolean => {
    if (!userRole) return false;
    return checkPermission(userRole, permission);
  };

  // Verificar si el usuario es moderador
  const isModerator = (): boolean => {
    return userRole === UserRole.MODERATOR;
  };
  
  // Verificar si el usuario es un invitado
  const isGuestUser = (): boolean => {
    if (!currentUser) return false;
    // Verificamos si el usuario tiene photoURL igual a 'guest_user'
    return currentUser.photoURL === 'guest_user';
  };

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

  // Actualizar perfil básico
  const updateProfile = async (displayName: string, photoURL?: string) => {
    try {
      setLoading(true);
      setError(null);
      if (currentUser) {
        await updateUserDisplayNameAndPhoto(currentUser, displayName, photoURL);
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
  
  // Actualizar datos adicionales del perfil
  const updateUserData = async (data: UserProfileData) => {
    try {
      setLoading(true);
      setError(null);
      if (currentUser) {
        await updateUserProfileData(currentUser.uid, data);
        return true;
      } else {
        throw new Error('No hay usuario autenticado');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof FirebaseError
        ? getReadableErrorMessage(err)
        : err instanceof Error ? err.message : 'Error al actualizar datos del perfil';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Actualizar email del usuario
  const updateEmail = async (currentPassword: string, newEmail: string) => {
    try {
      setLoading(true);
      setError(null);
      await updateUserEmail(currentPassword, newEmail);
      return true;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar email';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Actualizar preferencias de notificación
  const updateNotificationPrefs = async (preferences: NotificationPreferences) => {
    try {
      setLoading(true);
      setError(null);
      if (currentUser) {
        await updateNotificationPreferences(currentUser.uid, preferences);
        return true;
      } else {
        throw new Error('No hay usuario autenticado');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar preferencias';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Eliminar cuenta de usuario
  const deleteAccount = async (currentPassword: string) => {
    try {
      setLoading(true);
      setError(null);
      await deleteUserAccount(currentPassword);
      return true;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar cuenta';
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
    userRole,
    loading,
    error,
    signUp,
    signIn,
    signInWithGoogleProvider,
    logout,
    resetUserPassword,
    updateProfile,
    updateUserData,
    updateUserEmail: updateEmail,
    updateNotificationPreferences: updateNotificationPrefs,
    deleteAccount,
    clearError,
    hasPermission,
    isModerator,
    isGuestUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};