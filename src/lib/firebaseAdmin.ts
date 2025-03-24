import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Inicializar Firebase Admin SDK solo si no hay aplicaciones ya inicializadas
const adminApp = getApps().length === 0 
  ? initializeApp({
      credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    })
  : getApps()[0];

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
    const updateData: Record<string, unknown> = {
      status,
      updatedAt: new Date().toISOString()
    };
    
    if (reason) {
      updateData.cancelReason = reason;
      updateData.cancelDate = new Date().toISOString();
    }
    
    await firestoreAdmin.collection(SUBSCRIPTIONS_COLLECTION).doc(subscriptionId).update(updateData);
    console.log(`Suscripción ${subscriptionId} actualizada a estado ${status} usando Admin SDK`);
    return true;
  } catch (error) {
    console.error('Error al actualizar estado de suscripción con Admin SDK:', error);
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
    const snapshot = await firestoreAdmin
      .collection(SUBSCRIPTIONS_COLLECTION)
      .where('subscriptionId', '==', paypalSubscriptionId)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      console.warn(`No se encontró suscripción con ID de PayPal: ${paypalSubscriptionId}`);
      return null;
    }
    
    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      data: doc.data()
    };
  } catch (error) {
    console.error('Error al buscar suscripción por ID de PayPal:', error);
    return null;
  }
}