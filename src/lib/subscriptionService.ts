/**
 * Servicio para gestionar las suscripciones de los usuarios
 */
import { firestore, realtimeDb } from './firebaseConfig';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  Timestamp,
  addDoc
} from 'firebase/firestore';
import { ref, get } from 'firebase/database';
import {
  SubscriptionPlan,
  SubscriptionStatus,
  UserSubscription,
  PaymentHistory,
  PaymentMethod,
  SUBSCRIPTION_PLANS,
  PlanFeatures
} from '@/types/subscription';

/**
 * Función auxiliar para obtener la clave correcta para buscar en SUBSCRIPTION_PLANS
 *
 * @param plan - El plan de suscripción
 * @returns La clave correcta para buscar en SUBSCRIPTION_PLANS
 */
const getPlanLookupKey = (plan: SubscriptionPlan): string => {
  // Primero intentar con la clave simple
  let planLookupKey: string = plan as string;
  
  // Si no existe, intentar con la clave compuesta (plan-month)
  if (!SUBSCRIPTION_PLANS[planLookupKey]) {
    planLookupKey = `${plan}-month`;
  }
  
  // Si sigue sin existir, usar el plan FREE como fallback
  if (!SUBSCRIPTION_PLANS[planLookupKey]) {
    console.error(`Plan no encontrado: ${plan}, usando FREE como fallback`);
    planLookupKey = SubscriptionPlan.FREE;
  }
  
  return planLookupKey;
};

// Colecciones en Firestore
const SUBSCRIPTIONS_COLLECTION = 'subscriptions';
const PAYMENTS_COLLECTION = 'payments';
const USERS_COLLECTION = 'users';

/**
 * Obtener la suscripción activa de un usuario
 */
export async function getUserSubscription(userId: string): Promise<UserSubscription | null> {
  try {
    // Buscar suscripciones activas del usuario
    const subscriptionsRef = collection(firestore, SUBSCRIPTIONS_COLLECTION);
    const q = query(
      subscriptionsRef, 
      where('userId', '==', userId),
      where('status', '==', SubscriptionStatus.ACTIVE)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      // El usuario no tiene suscripción activa
      return null;
    }
    
    // Devolver la primera suscripción activa encontrada
    const subscriptionDoc = querySnapshot.docs[0];
    return {
      id: subscriptionDoc.id,
      ...subscriptionDoc.data()
    } as UserSubscription;
  } catch (error) {
    console.error('Error al obtener suscripción del usuario:', error);
    throw error;
  }
}

/**
 * Crear una nueva suscripción para un usuario
 */
export async function createSubscription(
  userId: string,
  plan: SubscriptionPlan,
  paymentMethod: PaymentMethod,
  paymentId?: string,
  subscriptionId?: string
): Promise<UserSubscription> {
  try {
    // Verificar si el usuario ya tiene una suscripción activa
    const existingSubscription = await getUserSubscription(userId);
    
    if (existingSubscription) {
      // Si ya tiene una suscripción activa, cancelarla primero
      await cancelSubscription(existingSubscription.id, 'Upgraded to new plan');
    }
    
    // Calcular fecha de inicio y fin
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // Suscripción mensual
    
    // Crear nueva suscripción
    const newSubscription: Omit<UserSubscription, 'id'> = {
      userId,
      plan,
      status: SubscriptionStatus.ACTIVE,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      autoRenew: true,
      paymentMethod
    };
    
    // Agregar campos opcionales solo si tienen valor
    if (paymentId) {
      newSubscription.paymentId = paymentId;
    }
    
    if (subscriptionId) {
      newSubscription.subscriptionId = subscriptionId;
    }
    
    // Guardar en Firestore
    const subscriptionsRef = collection(firestore, SUBSCRIPTIONS_COLLECTION);
    const docRef = await addDoc(subscriptionsRef, newSubscription);
    
    // Actualizar el plan del usuario
    const userRef = doc(firestore, USERS_COLLECTION, userId);
    await updateDoc(userRef, { 
      subscriptionPlan: plan,
      subscriptionId: docRef.id
    });
    
    // Registrar el pago si corresponde
    if (paymentId) {
      // Obtener la clave correcta para buscar en SUBSCRIPTION_PLANS
      const planLookupKey = getPlanLookupKey(plan);
      
      await addPaymentRecord(
        userId,
        docRef.id,
        SUBSCRIPTION_PLANS[planLookupKey].price,
        'USD',
        paymentMethod,
        paymentId
      );
    }
    
    return {
      id: docRef.id,
      ...newSubscription
    };
  } catch (error) {
    console.error('Error al crear suscripción:', error);
    throw error;
  }
}

/**
 * Cancelar una suscripción
 */
export async function cancelSubscription(
  subscriptionId: string,
  reason: string = 'Cancelled by user'
): Promise<boolean> {
  try {
    const subscriptionRef = doc(firestore, SUBSCRIPTIONS_COLLECTION, subscriptionId);
    const subscriptionDoc = await getDoc(subscriptionRef);
    
    if (!subscriptionDoc.exists()) {
      throw new Error(`Suscripción no encontrada: ${subscriptionId}`);
    }
    
    const subscription = subscriptionDoc.data() as Omit<UserSubscription, 'id'>;
    
    // Actualizar estado de la suscripción pero mantener el plan activo hasta la fecha de finalización
    await updateDoc(subscriptionRef, {
      status: SubscriptionStatus.CANCELLED,
      cancelReason: reason,
      cancelDate: new Date().toISOString(),
      autoRenew: false // Asegurarse de que no se renueve automáticamente
    });
    
    // No actualizar el plan del usuario a FREE inmediatamente
    // El usuario seguirá teniendo acceso a las características premium hasta la fecha de finalización
    
    return true;
  } catch (error) {
    console.error('Error al cancelar suscripción:', error);
    throw error;
  }
}

/**
 * Verificar si un usuario tiene acceso a una característica premium
 */
export async function hasFeatureAccess(
  userId: string,
  feature: keyof PlanFeatures
): Promise<boolean> {
  try {
    // Obtener la suscripción del usuario
    const subscription = await getUserSubscription(userId);
    
    // Si no tiene suscripción, usar plan FREE
    if (!subscription) {
      return SUBSCRIPTION_PLANS[SubscriptionPlan.FREE].features[feature] === true;
    }
    
    // Verificar si la suscripción está cancelada pero aún dentro del período de facturación
    if (subscription.status === SubscriptionStatus.CANCELLED) {
      // Verificar si la fecha de finalización aún no ha llegado
      const endDate = new Date(subscription.endDate);
      const now = new Date();
      
      // Si la fecha de finalización ya pasó, usar plan FREE
      if (endDate < now) {
        return SUBSCRIPTION_PLANS[SubscriptionPlan.FREE].features[feature] === true;
      }
      
      // Si aún no ha llegado la fecha de finalización, seguir usando el plan actual
      console.log(`Suscripción cancelada pero aún activa hasta ${endDate.toLocaleDateString()}`);
    }
    
    // Usar el plan actual
    const plan = subscription.plan;
    
    // Obtener la clave correcta para buscar en SUBSCRIPTION_PLANS
    const planLookupKey = getPlanLookupKey(plan);
    
    // Verificar si el plan tiene acceso a la característica
    const featureValue = SUBSCRIPTION_PLANS[planLookupKey].features[feature];
    
    // Si es un booleano, devolverlo directamente
    if (typeof featureValue === 'boolean') {
      return featureValue;
    }
    
    // Si es un número, verificar si es mayor que 0
    if (typeof featureValue === 'number') {
      return featureValue > 0;
    }
    
    // Por defecto, denegar acceso
    return false;
  } catch (error) {
    console.error('Error al verificar acceso a característica:', error);
    // En caso de error, denegar acceso por seguridad
    return false;
  }
}

/**
 * Registrar un pago en el historial
 */
export async function addPaymentRecord(
  userId: string,
  subscriptionId: string,
  amount: number,
  currency: string,
  paymentMethod: PaymentMethod,
  transactionId: string
): Promise<PaymentHistory> {
  try {
    const payment: Omit<PaymentHistory, 'id'> = {
      userId,
      subscriptionId,
      amount,
      currency,
      date: new Date().toISOString(),
      status: 'completed',
      paymentMethod,
      transactionId
    };
    
    const paymentsRef = collection(firestore, PAYMENTS_COLLECTION);
    const docRef = await addDoc(paymentsRef, payment);
    
    return {
      id: docRef.id,
      ...payment
    };
  } catch (error) {
    console.error('Error al registrar pago:', error);
    throw error;
  }
}

/**
 * Obtener el historial de pagos de un usuario
 */
export async function getUserPaymentHistory(userId: string): Promise<PaymentHistory[]> {
  try {
    const paymentsRef = collection(firestore, PAYMENTS_COLLECTION);
    const q = query(paymentsRef, where('userId', '==', userId));
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as PaymentHistory[];
  } catch (error) {
    console.error('Error al obtener historial de pagos:', error);
    throw error;
  }
}

/**
 * Verificar si un usuario puede crear una sala (según su plan)
 */
export async function canCreateRoom(userId: string): Promise<boolean> {
  try {
    // Obtener la suscripción del usuario
    const subscription = await getUserSubscription(userId);
    
    // Si no tiene suscripción, usar plan FREE
    if (!subscription) {
      return SUBSCRIPTION_PLANS[SubscriptionPlan.FREE].features.maxActiveRooms > 0;
    }
    
    // Verificar si la suscripción está cancelada pero aún dentro del período de facturación
    if (subscription.status === SubscriptionStatus.CANCELLED) {
      // Verificar si la fecha de finalización aún no ha llegado
      const endDate = new Date(subscription.endDate);
      const now = new Date();
      
      // Si la fecha de finalización ya pasó, usar plan FREE
      if (endDate < now) {
        return SUBSCRIPTION_PLANS[SubscriptionPlan.FREE].features.maxActiveRooms > 0;
      }
      
      // Si aún no ha llegado la fecha de finalización, seguir usando el plan actual
      console.log(`Suscripción cancelada pero aún activa hasta ${endDate.toLocaleDateString()}`);
    }
    
    // Usar el plan actual
    const plan = subscription.plan;
    
    // Obtener la clave correcta para buscar en SUBSCRIPTION_PLANS
    const planLookupKey = getPlanLookupKey(plan);
    
    // Contar cuántas salas activas tiene el usuario
    const roomsRef = collection(firestore, 'rooms');
    const q = query(roomsRef, where('createdBy', '==', userId), where('active', '==', true));
    
    const querySnapshot = await getDocs(q);
    const activeRoomsCount = querySnapshot.size;
    
    // Verificar si puede crear más salas según su plan
    return activeRoomsCount < SUBSCRIPTION_PLANS[planLookupKey].features.maxActiveRooms;
  } catch (error) {
    console.error('Error al verificar si puede crear sala:', error);
    // En caso de error, permitir crear sala (mejor experiencia de usuario)
    return true;
  }
}

/**
 * Verificar si una sala puede tener más participantes (según el plan del creador)
 */
export async function canAddParticipant(roomId: string): Promise<boolean> {
  try {
    console.log(`Checking if room ${roomId} can add more participants`);
    let plan = SubscriptionPlan.FREE;
    let creatorId = '';
    
    // Primero intentar obtener el plan del creador desde la Realtime Database
    try {
      const rtdbRoomRef = ref(realtimeDb, `rooms/${roomId}/metadata`);
      const rtdbSnapshot = await get(rtdbRoomRef);
      
      if (rtdbSnapshot.exists()) {
        const rtdbRoomData = rtdbSnapshot.val();
        console.log('Room data from RTDB:', rtdbRoomData);
        
        if (rtdbRoomData.creatorPlan) {
          console.log(`Found creator plan in RTDB: ${rtdbRoomData.creatorPlan}`);
          plan = rtdbRoomData.creatorPlan;
        }
        
        if (rtdbRoomData.createdBy || rtdbRoomData.creatorId) {
          creatorId = rtdbRoomData.createdBy || rtdbRoomData.creatorId;
        }
      }
    } catch (rtdbError) {
      console.error('Error checking RTDB for room data:', rtdbError);
    }
    
    // Si no se encontró en RTDB, intentar con Firestore
    if (plan === SubscriptionPlan.FREE || !creatorId) {
      try {
        // Obtener información de la sala desde Firestore
        const roomRef = doc(firestore, 'rooms', roomId);
        const roomDoc = await getDoc(roomRef);
        
        if (roomDoc.exists()) {
          const roomData = roomDoc.data();
          console.log('Room data from Firestore:', roomData);
          
          // Verificar si el plan del creador está almacenado en los metadatos de la sala
          if (roomData.creatorPlan) {
            console.log(`Found creator plan in Firestore: ${roomData.creatorPlan}`);
            plan = roomData.creatorPlan;
          }
          
          // Obtener el ID del creador si no lo tenemos aún
          if (!creatorId) {
            creatorId = roomData.createdBy || roomData.creatorId;
          }
        }
      } catch (firestoreError) {
        console.error('Error checking Firestore for room data:', firestoreError);
      }
    }
    
    // Si tenemos el ID del creador, verificar su suscripción actual
    if (creatorId) {
      try {
        console.log(`Looking up creator (${creatorId}) subscription`);
        // Obtener la suscripción del creador
        const subscription = await getUserSubscription(creatorId);
        
        // Si tiene una suscripción, verificar su estado
        if (subscription) {
          console.log(`Found creator subscription: ${subscription.plan}, status: ${subscription.status}`);
          
          // Si la suscripción está cancelada, verificar si aún está dentro del período de facturación
          if (subscription.status === SubscriptionStatus.CANCELLED) {
            const endDate = new Date(subscription.endDate);
            const now = new Date();
            
            if (endDate > now) {
              // Si aún no ha llegado la fecha de finalización, seguir usando el plan actual
              console.log(`Subscription cancelled but still active until ${endDate.toLocaleDateString()}`);
              plan = subscription.plan;
            } else {
              // Si la fecha de finalización ya pasó, usar plan FREE
              console.log(`Subscription cancelled and expired on ${endDate.toLocaleDateString()}`);
              plan = SubscriptionPlan.FREE;
            }
          } else {
            // Si la suscripción está activa, usar su plan
            plan = subscription.plan;
          }
        } else {
          console.log('No subscription found for creator, using FREE plan');
        }
      } catch (error) {
        console.error('Error looking up creator subscription:', error);
      }
    }
    
    // Contar participantes actuales
    const participantsRef = collection(firestore, `rooms/${roomId}/participants`);
    const querySnapshot = await getDocs(participantsRef);
    const participantsCount = querySnapshot.size;
    
    // Obtener la clave correcta para buscar en SUBSCRIPTION_PLANS
    const planLookupKey = getPlanLookupKey(plan);
    
    console.log(`Room has ${participantsCount} participants, max allowed for ${plan} plan is ${SUBSCRIPTION_PLANS[planLookupKey].features.maxParticipants}`);
    
    // Verificar si puede añadir más participantes según su plan
    return participantsCount < SUBSCRIPTION_PLANS[planLookupKey].features.maxParticipants;
  } catch (error) {
    console.error('Error al verificar si puede añadir participante:', error);
    // En caso de error, permitir añadir participante (mejor experiencia de usuario)
    return true;
  }
}

/**
 * Crear una suscripción gratuita por defecto para un nuevo usuario
 * Esta función se llama cuando se crea un nuevo usuario
 */
export async function createDefaultFreeSubscription(userId: string): Promise<UserSubscription | null> {
  try {
    // Verificar si el usuario ya tiene una suscripción
    const existingSubscription = await getUserSubscription(userId);
    
    // Si ya tiene una suscripción, no hacer nada
    if (existingSubscription) {
      return existingSubscription;
    }
    
    // Crear una suscripción gratuita
    const subscription = await createSubscription(
      userId,
      SubscriptionPlan.FREE,
      PaymentMethod.PAYPAL // Valor por defecto, no se usa realmente para el plan gratuito
    );
    
    console.log(`Suscripción gratuita creada para el usuario ${userId}`);
    return subscription;
  } catch (error) {
    console.error('Error al crear suscripción gratuita por defecto:', error);
    // No propagamos el error para evitar interrumpir el flujo de registro
    return null;
  }
}

/**
 * Actualizar el estado de una suscripción basado en eventos de webhook de PayPal
 * @param paypalSubscriptionId ID de la suscripción de PayPal
 * @param status Nuevo estado de la suscripción
 * @param isWebhook Indica si la actualización proviene de un webhook (por defecto true)
 */
export async function updateSubscriptionStatus(
  paypalSubscriptionId: string,
  status: 'active' | 'cancelled' | 'expired' | 'pending' | 'failed',
  isWebhook: boolean = true
): Promise<boolean> {
  try {
    // Buscar la suscripción por el ID de PayPal
    const subscriptionsRef = collection(firestore, SUBSCRIPTIONS_COLLECTION);
    const q = query(subscriptionsRef, where('subscriptionId', '==', paypalSubscriptionId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.warn(`No se encontró suscripción con ID de PayPal: ${paypalSubscriptionId}`);
      return false;
    }
    
    // Obtener la primera suscripción que coincida
    const subscriptionDoc = querySnapshot.docs[0];
    const subscriptionId = subscriptionDoc.id;
    const subscription = subscriptionDoc.data() as Omit<UserSubscription, 'id'>;
    
    // Actualizar el estado de la suscripción
    const subscriptionRef = doc(firestore, SUBSCRIPTIONS_COLLECTION, subscriptionId);
    
    if (status === 'cancelled') {
      if (isWebhook) {
        // Si es un webhook, solo actualizar el documento de la suscripción
        // para evitar problemas de permisos al intentar actualizar el documento del usuario
        await updateDoc(subscriptionRef, {
          status: SubscriptionStatus.CANCELLED,
          cancelReason: 'Cancelled by PayPal webhook',
          cancelDate: new Date().toISOString(),
          autoRenew: false // Asegurarse de que no se renueve automáticamente
        });
        
        console.log(`Suscripción ${subscriptionId} cancelada por webhook de PayPal, pero se mantiene activa hasta ${subscription.endDate}`);
        return true;
      } else {
        // Si no es un webhook, usar la función existente que también actualiza el documento del usuario
        return await cancelSubscription(subscriptionId, 'Cancelled by PayPal webhook');
      }
    } else {
      // Para otros estados, actualizar directamente
      let newStatus: SubscriptionStatus;
      
      switch (status) {
        case 'active':
          newStatus = SubscriptionStatus.ACTIVE;
          break;
        case 'expired':
          newStatus = SubscriptionStatus.EXPIRED;
          break;
        case 'pending':
          newStatus = SubscriptionStatus.PENDING;
          break;
        case 'failed':
          newStatus = SubscriptionStatus.FAILED;
          break;
        default:
          newStatus = SubscriptionStatus.ACTIVE;
      }
      
      await updateDoc(subscriptionRef, {
        status: newStatus,
        lastUpdated: new Date().toISOString()
      });
      
      console.log(`Suscripción ${subscriptionId} actualizada a estado: ${newStatus}`);
      return true;
    }
  } catch (error) {
    console.error('Error al actualizar estado de suscripción:', error);
    return false;
  }
}