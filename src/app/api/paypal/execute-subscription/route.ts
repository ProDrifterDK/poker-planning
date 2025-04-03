import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '@/lib/firebaseConfig';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { SubscriptionPlan, SubscriptionStatus, PaymentMethod, SUBSCRIPTION_PLANS } from '@/types/subscription';

// Colecciones en Firestore
const SUBSCRIPTIONS_COLLECTION = 'subscriptions';
const USERS_COLLECTION = 'users';
const PAYMENTS_COLLECTION = 'payments';

/**
 * API route para simular la ejecución de suscripciones en PayPal
 *
 * Esta ruta simula el proceso de ejecución de suscripciones sin hacer llamadas reales a PayPal.
 * Es útil para pruebas y desarrollo cuando no se tienen los permisos necesarios.
 */
export async function POST(req: NextRequest) {
  try {
    // Obtener los datos de la solicitud
    const data = await req.json();
    const { subscriptionId, userId, plan } = data;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Falta el ID de suscripción' },
        { status: 400 }
      );
    }

    console.log(`Simulando ejecución de suscripción: ${subscriptionId} para usuario: ${userId || 'anónimo'} con plan: ${plan || 'no especificado'}`);
    
    // Simular un retraso para que parezca que estamos haciendo una llamada a la API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Determinar el plan basado en el parámetro o el ID de suscripción
    let effectivePlan = plan;
    
    console.log(`Plan recibido: ${plan}`);
    
    if (!effectivePlan) {
      console.log(`Plan no especificado, determinando por ID de suscripción: ${subscriptionId}`);
      
      // Si el ID comienza con I-6EFD o I-64B, es un plan Pro
      if (subscriptionId.startsWith('I-6EFD') || subscriptionId.startsWith('I-64B')) {
        effectivePlan = SubscriptionPlan.PRO;
      }
      // Si el ID comienza con I-0PR o I-5J0, es un plan Enterprise
      else if (subscriptionId.startsWith('I-0PR') || subscriptionId.startsWith('I-5J0')) {
        effectivePlan = SubscriptionPlan.ENTERPRISE;
      }
      // Por defecto, usar Pro
      else {
        effectivePlan = SubscriptionPlan.PRO;
      }
    } else if (effectivePlan.toLowerCase() === 'enterprise') {
      // Asegurarse de que el plan 'enterprise' se mapee correctamente a la enumeración
      effectivePlan = SubscriptionPlan.ENTERPRISE;
    } else if (effectivePlan.toLowerCase() === 'pro') {
      // Asegurarse de que el plan 'pro' se mapee correctamente a la enumeración
      effectivePlan = SubscriptionPlan.PRO;
    }
    
    console.log(`Plan efectivo determinado: ${effectivePlan}`);
    
    // Crear detalles de suscripción simulados
    const subscriptionDetails = {
      id: subscriptionId,
      status: 'ACTIVE',
      plan_id: effectivePlan === SubscriptionPlan.PRO ? 'P-42S738476L718491KM7RRM3Y' : 'P-0PR63221X9356841PM7RRM4A',
      start_date: new Date().toISOString(),
      billing_info: {
        next_billing_time: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 días después
        last_payment: {
          amount: {
            value: effectivePlan === SubscriptionPlan.PRO ? '9.99' : '29.99'
          }
        }
      },
      subscriber: {
        email_address: 'usuario@example.com',
        name: {
          given_name: 'Usuario',
          surname: 'Ejemplo'
        }
      }
    };
    
    // Si se proporciona un userId, actualizar la suscripción en la base de datos
    if (userId) {
      try {
        // Verificar si el usuario existe
        const userRef = doc(firestore, USERS_COLLECTION, userId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          // Buscar suscripciones activas del usuario
          const subscriptionsRef = collection(firestore, SUBSCRIPTIONS_COLLECTION);
          const q = query(
            subscriptionsRef,
            where('userId', '==', userId),
            where('status', '==', SubscriptionStatus.ACTIVE)
          );
          
          const querySnapshot = await getDocs(q);
          
          // Si hay suscripciones activas, cancelarlas
          for (const doc of querySnapshot.docs) {
            await updateDoc(doc.ref, {
              status: SubscriptionStatus.CANCELLED,
              cancelledAt: new Date().toISOString(),
              cancelReason: 'Upgraded to new plan'
            });
          }
          
          // Crear nueva suscripción
          const startDate = new Date();
          const endDate = new Date();
          endDate.setMonth(endDate.getMonth() + 1); // Suscripción mensual
          
          const newSubscription = {
            userId,
            plan: effectivePlan,
            status: SubscriptionStatus.ACTIVE,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            autoRenew: true,
            paymentMethod: PaymentMethod.PAYPAL,
            paymentId: subscriptionId,
            subscriptionId: subscriptionId,
            createdAt: serverTimestamp()
          };
          
          // Guardar en Firestore
          const newSubscriptionRef = await addDoc(collection(firestore, SUBSCRIPTIONS_COLLECTION), newSubscription);
          
          // Actualizar el plan del usuario
          await updateDoc(userRef, {
            subscriptionPlan: effectivePlan,
            subscriptionId: newSubscriptionRef.id
          });
          
          console.log(`Suscripción actualizada en la base de datos: ${newSubscriptionRef.id}`);
        } else {
          console.log(`Usuario ${userId} no encontrado en la base de datos`);
        }
      } catch (dbError) {
        console.error('Error al actualizar la base de datos:', dbError);
        // No lanzar el error para que la API siga funcionando
      }
    }
    
    console.log(`Suscripción simulada ejecutada: ${JSON.stringify(subscriptionDetails, null, 2)}`);
    
    // Devolver los detalles de la suscripción
    return NextResponse.json(subscriptionDetails);
  } catch (error) {
    console.error('Error al ejecutar suscripción en PayPal:', error);
    return NextResponse.json(
      { error: 'Error al ejecutar suscripción en PayPal' },
      { status: 500 }
    );
  }
}