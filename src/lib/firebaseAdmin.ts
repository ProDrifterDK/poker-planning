import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Función para obtener la clave privada correctamente formateada
function getPrivateKey(): string {
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  
  if (!privateKey) {
    console.error('FIREBASE_ADMIN_PRIVATE_KEY no está definida en las variables de entorno');
    return '';
  }
  
  // La clave ya está correctamente formateada en .env.local, no necesitamos reemplazar nada
  return privateKey;
}

// Inicializar Firebase Admin SDK solo si no hay aplicaciones ya inicializadas
let adminApp;

try {
  if (getApps().length === 0) {
    const privateKey = getPrivateKey();
    
    if (!privateKey) {
      throw new Error('No se pudo obtener la clave privada para Firebase Admin SDK');
    }
    
    console.log('Inicializando Firebase Admin SDK...');
    
    adminApp = initializeApp({
      credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL || '',
        privateKey: privateKey,
      }),
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    });
  } else {
    adminApp = getApps()[0];
  }
} catch (error) {
  console.error('Error al inicializar Firebase Admin SDK:', error);
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