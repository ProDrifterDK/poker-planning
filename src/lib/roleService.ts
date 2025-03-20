import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { firestore } from './firebaseConfig';
import { UserRole } from '@/types/roles';
import { User } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';

// Colección de usuarios en Firestore
const USERS_COLLECTION = 'users';

/**
 * Obtiene el rol de un usuario desde Firestore
 * Si hay errores de permisos, devuelve el rol de participante por defecto
 */
export async function getUserRole(userId: string): Promise<UserRole> {
  try {
    const userDoc = await getDoc(doc(firestore, USERS_COLLECTION, userId));
    
    if (userDoc.exists() && userDoc.data().role) {
      return userDoc.data().role as UserRole;
    }
    
    // Si el usuario no tiene un rol asignado, intentar asignarle el rol de participante por defecto
    try {
      await setUserRole(userId, UserRole.PARTICIPANT);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (setRoleError) {
      // Ignorar errores de permisos al asignar rol
      console.warn('No se pudo asignar el rol de participante. Posiblemente permisos insuficientes.');
    }
    return UserRole.PARTICIPANT;
  } catch (error) {
    console.warn('Error al obtener el rol del usuario:', error);
    return UserRole.PARTICIPANT; // Rol por defecto en caso de error
  }
}

/**
 * Establece el rol de un usuario en Firestore
 * Maneja errores de permisos y proporciona mensajes de error más descriptivos
 */
export async function setUserRole(userId: string, role: UserRole): Promise<void> {
  try {
    const userRef = doc(firestore, USERS_COLLECTION, userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      // Actualizar el documento existente
      await updateDoc(userRef, { role });
    } else {
      // Crear un nuevo documento
      await setDoc(userRef, {
        role,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  } catch (error: unknown) {
    if (error instanceof FirebaseError && error.code === 'permission-denied') {
      console.error('Error de permisos al establecer el rol del usuario. Verifica las reglas de seguridad de Firestore.');
      throw new Error('No tienes permisos para cambiar roles. Por favor, contacta al administrador.');
    } else {
      console.error('Error al establecer el rol del usuario:', error);
      throw new Error('Error al cambiar el rol. Inténtalo de nuevo más tarde.');
    }
  }
}

/**
 * Inicializa o actualiza el perfil de usuario en Firestore
 * Maneja errores de permisos de manera silenciosa para no interrumpir la experiencia del usuario
 */
export async function initializeUserProfile(user: User): Promise<void> {
  try {
    const userRef = doc(firestore, USERS_COLLECTION, user.uid);
    const userDoc = await getDoc(userRef);
    
    const userData = {
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      lastLogin: new Date().toISOString(),
    };
    
    if (userDoc.exists()) {
      // Actualizar el documento existente
      try {
        await updateDoc(userRef, userData);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (updateError) {
        // Ignorar errores de permisos al actualizar
        console.warn('No se pudo actualizar el perfil de usuario. Posiblemente permisos insuficientes.');
      }
    } else {
      // Crear un nuevo documento con rol de participante por defecto
      try {
        await setDoc(userRef, {
          ...userData,
          role: UserRole.PARTICIPANT,
          createdAt: new Date().toISOString(),
        });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (setError) {
        // Ignorar errores de permisos al crear
        console.warn('No se pudo crear el perfil de usuario. Posiblemente permisos insuficientes.');
      }
    }
  } catch (error) {
    // Registrar el error pero no propagarlo para evitar interrumpir la experiencia del usuario
    console.warn('Error al inicializar el perfil de usuario:', error);
    // No lanzamos el error: throw error;
  }
}

/**
 * Verifica si un usuario es moderador
 */
export function isModerator(role: UserRole | null): boolean {
  return role === UserRole.MODERATOR;
}

/**
 * Verifica si un usuario es participante
 */
export function isParticipant(role: UserRole | null): boolean {
  return role === UserRole.PARTICIPANT;
}