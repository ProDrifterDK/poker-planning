/**
 * Servicio para gestionar perfiles de usuario
 * 
 * Este servicio proporciona funciones para obtener y actualizar
 * información del perfil de usuario en Firestore.
 */

import { doc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { firestore, auth, updateUserProfile } from './firebaseConfig';
import { cancelSubscription } from './subscriptionService';
import { User, EmailAuthProvider, reauthenticateWithCredential, updateEmail, deleteUser } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Función para redimensionar una imagen
async function resizeImage(file: File, maxWidth: number = 300, maxHeight: number = 300): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    
    img.onload = () => {
      // Calcular las dimensiones manteniendo la proporción
      let width = img.width;
      let height = img.height;
      
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round(height * maxWidth / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round(width * maxHeight / height);
          height = maxHeight;
        }
      }
      
      // Crear un canvas para redimensionar la imagen
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      // Dibujar la imagen redimensionada
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('No se pudo crear el contexto del canvas'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convertir a formato de datos URL (base64)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.7); // Usar JPEG con 70% de calidad
      
      // Liberar el objeto URL
      URL.revokeObjectURL(img.src);
      
      resolve(dataUrl);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Error al cargar la imagen'));
    };
  });
}

// Colección de usuarios en Firestore
const USERS_COLLECTION = 'users';

// Interfaz para las preferencias de notificación
export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  roomInvites: boolean;
  weeklyDigest: boolean;
}

// Interfaz para los datos adicionales del perfil
export interface UserProfileData {
  phoneNumber?: string;
  jobTitle?: string;
  company?: string;
  notificationPreferences?: NotificationPreferences;
}

/**
 * Obtiene el perfil completo de un usuario
 */
export async function getUserProfile(userId: string) {
  try {
    const userDoc = await getDoc(doc(firestore, USERS_COLLECTION, userId));
    
    if (userDoc.exists()) {
      return userDoc.data();
    }
    
    return null;
  } catch (error) {
    console.error('Error al obtener el perfil de usuario:', error);
    throw new Error('No se pudo obtener el perfil de usuario');
  }
}

/**
 * Actualiza los campos adicionales del perfil de usuario
 */
export async function updateUserProfileData(userId: string, profileData: UserProfileData) {
  try {
    const userRef = doc(firestore, USERS_COLLECTION, userId);
    
    // Añadir timestamp de actualización
    const dataToUpdate = {
      ...profileData,
      updatedAt: new Date().toISOString()
    };
    
    await updateDoc(userRef, dataToUpdate);
    
    return true;
  } catch (error) {
    console.error('Error al actualizar el perfil de usuario:', error);
    throw new Error('No se pudo actualizar el perfil de usuario');
  }
}

/**
 * Actualiza el nombre y la foto del perfil de usuario
 * Esta función actualiza el nombre en Firebase Auth y todos los datos en Firestore
 */
export async function updateUserDisplayNameAndPhoto(user: User, displayName: string, photoURL?: string) {
  try {
    // Verificar si la URL de la foto es una cadena base64 larga
    const isBase64Image = photoURL && photoURL.startsWith('data:image/');
    
    // Actualizar en Firebase Auth (solo el nombre, no la foto si es base64)
    if (isBase64Image) {
      console.log('updateUserDisplayNameAndPhoto: Detectada imagen base64, actualizando solo el nombre en Firebase Auth');
      // Solo actualizar el nombre en Firebase Auth para evitar el error de URL demasiado larga
      await updateUserProfile(user, displayName);
    } else {
      // Si no es base64, actualizar tanto el nombre como la foto en Firebase Auth
      await updateUserProfile(user, displayName, photoURL);
    }
    
    // Actualizar en Firestore (tanto el nombre como la foto)
    const userRef = doc(firestore, USERS_COLLECTION, user.uid);
    await updateDoc(userRef, {
      displayName,
      photoURL: photoURL || user.photoURL,
      updatedAt: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Error al actualizar el nombre y foto del usuario:', error);
    throw new Error('No se pudo actualizar el perfil');
  }
}

/**
 * Actualiza el correo electrónico del usuario
 * Requiere reautenticación por seguridad
 */
export async function updateUserEmail(currentPassword: string, newEmail: string) {
  try {
    const user = auth.currentUser;
    
    if (!user || !user.email) {
      throw new Error('No hay usuario autenticado o no tiene email');
    }
    
    // Reautenticar al usuario
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    
    // Actualizar email en Firebase Auth
    await updateEmail(user, newEmail);
    
    // Actualizar email en Firestore
    const userRef = doc(firestore, USERS_COLLECTION, user.uid);
    await updateDoc(userRef, {
      email: newEmail,
      updatedAt: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Error al actualizar el email del usuario:', error);
    
    // Proporcionar mensajes de error más específicos
    if (error instanceof Error) {
      if (error.message.includes('auth/wrong-password')) {
        throw new Error('La contraseña actual es incorrecta');
      } else if (error.message.includes('auth/email-already-in-use')) {
        throw new Error('Este correo electrónico ya está en uso');
      } else if (error.message.includes('auth/requires-recent-login')) {
        throw new Error('Por seguridad, debes volver a iniciar sesión antes de cambiar tu email');
      }
    }
    
    throw new Error('No se pudo actualizar el correo electrónico');
  }
}

/**
 * Actualiza las preferencias de notificación del usuario
 */
export async function updateNotificationPreferences(userId: string, preferences: NotificationPreferences) {
  try {
    const userRef = doc(firestore, USERS_COLLECTION, userId);
    
    await updateDoc(userRef, {
      notificationPreferences: preferences,
      updatedAt: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Error al actualizar preferencias de notificación:', error);
    throw new Error('No se pudieron actualizar las preferencias de notificación');
  }
}

/**
 * Actualiza la imagen de perfil del usuario solo en Firestore
 * Redimensiona la imagen y la convierte a base64 para evitar problemas de tamaño
 */
export async function uploadProfileImage(userId: string, file: File): Promise<string> {
  try {
    console.log('Iniciando proceso de subida de imagen para usuario:', userId);
    
    // Verificar que el usuario existe
    const userRef = doc(firestore, USERS_COLLECTION, userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('El usuario no existe en Firestore');
    }
    
    // Redimensionar la imagen antes de guardarla
    console.log('Redimensionando imagen...');
    const resizedImageDataUrl = await resizeImage(file, 300, 300);
    console.log('Imagen redimensionada correctamente, longitud:', resizedImageDataUrl.length);
    
    // Actualizar directamente en Firestore
    try {
      console.log('Guardando imagen en Firestore...');
      await updateDoc(userRef, {
        photoURL: resizedImageDataUrl,
        updatedAt: new Date().toISOString()
      });
      
      console.log('Imagen guardada en Firestore correctamente');
      
      // Verificar que se guardó correctamente
      const updatedDoc = await getDoc(userRef);
      const updatedData = updatedDoc.data();
      
      if (updatedData && updatedData.photoURL) {
        console.log('Verificación: photoURL guardado correctamente, longitud:',
          updatedData.photoURL.length);
        return resizedImageDataUrl;
      } else {
        console.error('Verificación falló: photoURL no se guardó correctamente');
        throw new Error('La imagen no se guardó correctamente');
      }
    } catch (updateError) {
      console.error('Error al actualizar documento en Firestore:', updateError);
      throw new Error('Error al guardar la imagen en la base de datos');
    }
  } catch (error) {
    console.error('Error al procesar imagen de perfil:', error);
    throw new Error('No se pudo procesar la imagen de perfil');
  }
}

/**
 * Elimina la cuenta del usuario
 * Requiere reautenticación por seguridad
 */
export async function deleteUserAccount(currentPassword: string) {
  try {
    const user = auth.currentUser;
    
    if (!user || !user.email) {
      throw new Error('No hay usuario autenticado o no tiene email');
    }
    
    // Reautenticar al usuario
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    
    // Buscar y cancelar suscripciones activas
    const subscriptionsRef = collection(firestore, 'subscriptions');
    const q = query(
      subscriptionsRef,
      where('userId', '==', user.uid),
      where('status', '==', 'active')
    );
    
    const querySnapshot = await getDocs(q);
    
    // Cancelar cada suscripción activa
    for (const doc of querySnapshot.docs) {
      const subscriptionData = doc.data();
      console.log(`Cancelando suscripción ${doc.id} para usuario ${user.uid}`);
      
      try {
        // Cancelar la suscripción en PayPal y en nuestra base de datos
        await cancelSubscription(doc.id, 'Cuenta eliminada por el usuario');
      } catch (subscriptionError) {
        console.error('Error al cancelar suscripción:', subscriptionError);
        // Continuar con el proceso de eliminación incluso si falla la cancelación de la suscripción
      }
    }
    
    // Eliminar documento en Firestore
    const userRef = doc(firestore, USERS_COLLECTION, user.uid);
    await deleteDoc(userRef);
    
    // Eliminar usuario en Firebase Auth
    await deleteUser(user);
    
    return true;
  } catch (error) {
    console.error('Error al eliminar la cuenta de usuario:', error);
    
    // Proporcionar mensajes de error más específicos
    if (error instanceof Error) {
      if (error.message.includes('auth/wrong-password')) {
        throw new Error('La contraseña es incorrecta');
      } else if (error.message.includes('auth/requires-recent-login')) {
        throw new Error('Por seguridad, debes volver a iniciar sesión antes de eliminar tu cuenta');
      }
    }
    
    throw new Error('No se pudo eliminar la cuenta');
  }
}