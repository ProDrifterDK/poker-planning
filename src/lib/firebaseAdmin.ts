import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Función para obtener la clave privada correctamente formateada para Vercel
function getPrivateKey(): string {
  // En Vercel, las variables de entorno con saltos de línea se manejan de forma especial
  // Vercel automáticamente convierte los saltos de línea en la interfaz de usuario a \n en el código
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  
  if (!privateKey) {
    console.error('FIREBASE_ADMIN_PRIVATE_KEY no está definida en las variables de entorno');
    return '';
  }
  
  try {
    // Vercel: Si la clave está entre comillas dobles y contiene \n, reemplazarlos por saltos de línea reales
    if (privateKey.startsWith('"') && privateKey.endsWith('"') && privateKey.includes('\\n')) {
      // Eliminar las comillas dobles del principio y del final y reemplazar \n por saltos de línea reales
      return privateKey.slice(1, -1).replace(/\\n/g, '\n');
    }
    
    // Si la clave ya tiene saltos de línea reales, usarla directamente
    if (privateKey.includes('-----BEGIN PRIVATE KEY-----\n')) {
      return privateKey;
    }
    
    // Si la clave tiene \n como texto, reemplazarlos por saltos de línea reales
    if (privateKey.includes('\\n')) {
      return privateKey.replace(/\\n/g, '\n');
    }
    
    // Si la clave no tiene saltos de línea, agregarlos en los lugares correctos
    if (privateKey.includes('-----BEGIN PRIVATE KEY-----') && !privateKey.includes('\n')) {
      return privateKey
        .replace('-----BEGIN PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----\n')
        .replace('-----END PRIVATE KEY-----', '\n-----END PRIVATE KEY-----\n');
    }
    
    // Si ninguno de los formatos anteriores funciona, devolver la clave tal como está
    console.log('Usando formato de clave privada sin procesar');
    return privateKey;
  } catch (error) {
    console.error('Error al procesar la clave privada:', error);
    return '';
  }
}

// Inicializar Firebase Admin SDK solo si no hay aplicaciones ya inicializadas
let adminApp;

try {
  if (getApps().length === 0) {
    const privateKey = getPrivateKey();
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
    
    // Verificar que todas las variables necesarias estén definidas
    if (!privateKey) {
      throw new Error('FIREBASE_ADMIN_PRIVATE_KEY no está definida o tiene un formato incorrecto');
    }
    
    if (!projectId) {
      throw new Error('NEXT_PUBLIC_FIREBASE_PROJECT_ID no está definida');
    }
    
    if (!clientEmail) {
      throw new Error('FIREBASE_ADMIN_CLIENT_EMAIL no está definida');
    }
    
    console.log('Inicializando Firebase Admin SDK...');
    
    // Crear las credenciales
    const credentials = {
      projectId,
      clientEmail,
      privateKey,
    };
    
    // Inicializar la aplicación
    adminApp = initializeApp({
      credential: cert(credentials),
      databaseURL,
    });
    
    console.log('Firebase Admin SDK inicializado correctamente');
  } else {
    console.log('Usando instancia existente de Firebase Admin SDK');
    adminApp = getApps()[0];
  }
} catch (error) {
  console.error('Error al inicializar Firebase Admin SDK:', error);
  
  // Registrar más detalles sobre el error
  if (error instanceof Error) {
    console.error('Mensaje de error:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Si el error está relacionado con la clave privada, mostrar más información
    if (error.message.includes('private key')) {
      const privateKey = getPrivateKey();
      console.error('Formato de la clave privada:');
      console.error(`- Longitud: ${privateKey.length}`);
      console.error(`- Contiene "BEGIN PRIVATE KEY": ${privateKey.includes('BEGIN PRIVATE KEY')}`);
      console.error(`- Contiene "END PRIVATE KEY": ${privateKey.includes('END PRIVATE KEY')}`);
      console.error(`- Contiene saltos de línea: ${privateKey.includes('\n')}`);
      console.error(`- Contiene \\n: ${privateKey.includes('\\n')}`);
    }
  }
  
  throw error;
}

// Exportar Firestore Admin
export const firestoreAdmin = getFirestore(adminApp);

// Colecciones en Firestore
export const SUBSCRIPTIONS_COLLECTION = 'subscriptions';
export const PAYMENTS_COLLECTION = 'payments';
export const USERS_COLLECTION = 'users';

/**
 * Actualiza el estado de una suscripción usando Firebase Admin SDK (omite las reglas de seguridad)
 * @param subscriptionId ID de la suscripción en Firestore
 * @param status Nuevo estado de la suscripción
 * @param reason Razón del cambio de estado (opcional)
 */
export async function updateSubscriptionStatusAdmin(
  subscriptionId: string,
  status: string,
  reason?: string
): Promise<boolean> {
  try {
    console.log(`Actualizando suscripción ${subscriptionId} a estado ${status}...`);
    
    // Verificar primero si el documento existe
    const docRef = firestoreAdmin.collection(SUBSCRIPTIONS_COLLECTION).doc(subscriptionId);
    const docSnapshot = await docRef.get();
    
    if (!docSnapshot.exists) {
      console.error(`Error: La suscripción ${subscriptionId} no existe`);
      return false;
    }
    
    const updateData: Record<string, unknown> = {
      status,
      updatedAt: new Date().toISOString()
    };
    
    if (reason) {
      updateData.cancelReason = reason;
      updateData.cancelDate = new Date().toISOString();
    }
    
    await docRef.update(updateData);
    console.log(`Suscripción ${subscriptionId} actualizada a estado ${status} usando Admin SDK`);
    return true;
  } catch (error) {
    console.error('Error al actualizar estado de suscripción con Admin SDK:', error);
    
    // Registrar más detalles sobre el error
    if (error instanceof Error) {
      console.error('Mensaje de error:', error.message);
      console.error('Stack trace:', error.stack);
    }
    
    return false;
  }
}

/**
 * Busca una suscripción por su ID de PayPal usando Firebase Admin SDK
 * @param paypalSubscriptionId ID de la suscripción en PayPal
 * @returns El ID del documento en Firestore y los datos de la suscripción, o null si no se encuentra
 */
export async function findSubscriptionByPayPalIdAdmin(paypalSubscriptionId: string): Promise<{id: string, data: Record<string, unknown>} | null> {
  try {
    console.log(`Buscando suscripción con ID de PayPal: ${paypalSubscriptionId}`);
    
    const snapshot = await firestoreAdmin
      .collection(SUBSCRIPTIONS_COLLECTION)
      .where('subscriptionId', '==', paypalSubscriptionId)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      console.warn(`No se encontró suscripción con ID de PayPal: ${paypalSubscriptionId}`);
      
      // Intentar buscar por otros campos como alternativa
      console.log('Intentando buscar por paymentId como alternativa...');
      const altSnapshot = await firestoreAdmin
        .collection(SUBSCRIPTIONS_COLLECTION)
        .where('paymentId', '==', paypalSubscriptionId)
        .limit(1)
        .get();
      
      if (altSnapshot.empty) {
        console.warn('No se encontró suscripción por paymentId tampoco');
        return null;
      }
      
      const altDoc = altSnapshot.docs[0];
      console.log(`Suscripción encontrada por paymentId: ${altDoc.id}`);
      return {
        id: altDoc.id,
        data: altDoc.data() as Record<string, unknown>
      };
    }
    
    const doc = snapshot.docs[0];
    console.log(`Suscripción encontrada: ${doc.id}`);
    return {
      id: doc.id,
      data: doc.data() as Record<string, unknown>
    };
  } catch (error) {
    console.error('Error al buscar suscripción por ID de PayPal:', error);
    
    // Registrar más detalles sobre el error
    if (error instanceof Error) {
      console.error('Mensaje de error:', error.message);
      console.error('Stack trace:', error.stack);
    }
    
    return null;
  }
}