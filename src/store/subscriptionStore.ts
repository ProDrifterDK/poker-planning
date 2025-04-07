/**
 * Store para gestionar el estado de las suscripciones
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  SubscriptionPlan,
  UserSubscription,
  PaymentHistory,
  SUBSCRIPTION_PLANS,
  SubscriptionStatus,
  PlanFeatures
} from '@/types/subscription';
import {
  getUserSubscription,
  createSubscription,
  cancelSubscription,
  getUserPaymentHistory,
  hasFeatureAccess,
  canCreateRoom,
  canAddParticipant
} from '@/lib/subscriptionService';
import {
  getPayPalPlanId,
  createSubscription as createPaypalSubscription,
  executeSubscription as executePaypalSubscription,
  cancelSubscription as cancelPaypalSubscription
} from '@/lib/paypalSdk';
import { PaymentMethod } from '@/types/subscription';

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

// Tipos para el store
interface SubscriptionState {
  // Estado
  currentSubscription: UserSubscription | null;
  paymentHistory: PaymentHistory[];
  loading: boolean;
  error: string | null;
  paymentUrl: string | null;
  
  // Acciones
  fetchUserSubscription: (userId: string) => Promise<UserSubscription | null>;
  fetchPaymentHistory: (userId: string) => Promise<void>;
  subscribeToPlan: (userId: string, plan: SubscriptionPlan, subscriptionId?: string) => Promise<string>;
  cancelCurrentSubscription: (reason?: string) => Promise<boolean>;
  executeSubscription: (token: string, userId: string, plan?: SubscriptionPlan) => Promise<void>;
  clearError: () => void;
  
  // Utilidades
  canUserAccessFeature: (feature: keyof PlanFeatures) => boolean;
  canUserCreateRoom: () => boolean;
  canRoomAddParticipant: (roomId: string) => Promise<boolean>;
  getCurrentPlan: () => SubscriptionPlan;
}

// Crear el store
export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      currentSubscription: null,
      paymentHistory: [],
      loading: false,
      error: null,
      paymentUrl: null,
      
      // Obtener la suscripción del usuario
      fetchUserSubscription: async (userId: string) => {
        try {
          set({ loading: true, error: null });
          
          // Forzar una consulta fresca a la base de datos
          const subscription = await getUserSubscription(userId);
          
          // Actualizar el estado con la suscripción obtenida
          set({ currentSubscription: subscription, loading: false });
          
          // Forzar una actualización del localStorage
          localStorage.removeItem('poker-planning-subscription');
          
          return subscription;
        } catch (error) {
          console.error('Error al obtener suscripción:', error);
          set({
            error: error instanceof Error ? error.message : 'Error desconocido al obtener suscripción',
            loading: false
          });
          return null;
        }
      },
      
      // Obtener el historial de pagos
      fetchPaymentHistory: async (userId: string) => {
        try {
          set({ loading: true, error: null });
          const history = await getUserPaymentHistory(userId);
          set({ paymentHistory: history, loading: false });
        } catch (error) {
          console.error('Error al obtener historial de pagos:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Error desconocido al obtener historial de pagos', 
            loading: false 
          });
        }
      },
      // Suscribirse a un plan
      subscribeToPlan: async (userId: string, plan: SubscriptionPlan, subscriptionId?: string) => {
        try {
          set({ loading: true, error: null, paymentUrl: null });
          
          // Si es plan FREE, crear suscripción directamente
          if (plan === SubscriptionPlan.FREE) {
            await createSubscription(userId, plan, PaymentMethod.PAYPAL);
            set({ loading: false });
            return '';
          }
          
          // Si se proporciona un ID de suscripción (desde PayPal JS SDK)
          if (subscriptionId) {
            console.log(`Creando suscripción con ID de PayPal: ${subscriptionId}`);
            // Crear suscripción en nuestra base de datos con el ID proporcionado
            await createSubscription(
              userId,
              plan,
              PaymentMethod.PAYPAL,
              subscriptionId, // ID de pago
              subscriptionId  // ID de suscripción
            );
            set({ loading: false });
            return '';
          }
          
          // Para planes de pago sin ID de suscripción, obtener el ID del plan en PayPal
          const planLookupKey = getPlanLookupKey(plan);
          const planDetails = SUBSCRIPTION_PLANS[planLookupKey];
          const interval = 'MONTH'; // Por defecto mensual, podría ser un parámetro adicional
          const paypalPlanId = await getPayPalPlanId(
            plan, // Usar el enum del plan directamente
            interval
          );
          
          // Crear suscripción en PayPal
          const approvalUrl = await createPaypalSubscription(paypalPlanId);
          
          set({ paymentUrl: approvalUrl, loading: false });
          return approvalUrl;
          return approvalUrl;
        } catch (error) {
          console.error('Error al suscribirse al plan:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Error desconocido al suscribirse al plan', 
            loading: false 
          });
          return '';
        }
      },
      
      // Cancelar suscripción actual
      cancelCurrentSubscription: async (reason?: string) => {
        const { currentSubscription } = get();
        
        if (!currentSubscription) {
          set({ error: 'No hay suscripción activa para cancelar' });
          return false;
        }
        
        try {
          set({ loading: true, error: null });
          
          // Si tiene ID de suscripción en PayPal, cancelarla allí también
          if (currentSubscription.subscriptionId) {
            await cancelPaypalSubscription(
              currentSubscription.subscriptionId,
              reason || 'Cancelado por el usuario'
            );
          }
          // Cancelar en nuestra base de datos
          await cancelSubscription(
            currentSubscription.id,
            reason || 'Cancelado por el usuario'
          );
          
          // Obtener el ID del usuario
          const userId = currentSubscription.userId;
          
          // Crear una nueva suscripción gratuita en la base de datos
          console.log('Creando nueva suscripción gratuita en la base de datos');
          const newSubscription = await createSubscription(
            userId,
            SubscriptionPlan.FREE,
            PaymentMethod.PAYPAL
          );
          
          // Actualizar el estado local con la nueva suscripción
          set({
            currentSubscription: newSubscription,
            loading: false
          });
          
          // Recargar la suscripción del usuario para asegurarnos de tener los datos actualizados
          await get().fetchUserSubscription(userId);
          
          return true;
        } catch (error) {
          console.error('Error al cancelar suscripción:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Error desconocido al cancelar suscripción', 
            loading: false 
          });
          return false;
        }
      },
      
      // Ejecutar suscripción después de aprobación de PayPal
      executeSubscription: async (token: string, userId: string, plan?: SubscriptionPlan) => {
        try {
          set({ loading: true, error: null });
          
          // Ejecutar suscripción en PayPal
          const subscriptionDetails = await executePaypalSubscription(token, userId, plan);
          
          // Usar el plan proporcionado o determinar el plan basado en los detalles
          let subscriptionPlan = plan;
          
          // Asegurarse de que el plan sea una enumeración válida
          if (typeof subscriptionPlan === 'string') {
            if (subscriptionPlan.toLowerCase() === 'enterprise') {
              subscriptionPlan = SubscriptionPlan.ENTERPRISE;
            } else if (subscriptionPlan.toLowerCase() === 'pro') {
              subscriptionPlan = SubscriptionPlan.PRO;
            } else if (subscriptionPlan.toLowerCase() === 'free') {
              subscriptionPlan = SubscriptionPlan.FREE;
            }
          }
          
          // Si aún no tenemos un plan válido, usar PRO por defecto
          if (!subscriptionPlan) {
            subscriptionPlan = SubscriptionPlan.PRO;
          }
          
          console.log(`Ejecutando suscripción con plan: ${subscriptionPlan}`);
          
          // Obtener la clave correcta para buscar en SUBSCRIPTION_PLANS
          const planLookupKey = getPlanLookupKey(subscriptionPlan);
          
          // Si el plan no existe, actualizar subscriptionPlan a FREE
          if (planLookupKey === SubscriptionPlan.FREE && subscriptionPlan !== SubscriptionPlan.FREE) {
            subscriptionPlan = SubscriptionPlan.FREE;
          }
          
          console.log(`Clave de plan determinada: ${planLookupKey}`);
          
          // Crear suscripción en nuestra base de datos
          const subscription = await createSubscription(
            userId,
            subscriptionPlan as SubscriptionPlan, // Asegurar que se trata como SubscriptionPlan
            PaymentMethod.PAYPAL,
            subscriptionDetails.id, // Usar el ID de la suscripción como paymentId
            subscriptionDetails.id  // Usar el ID de la suscripción como subscriptionId
          );
          
          console.log(`Suscripción creada en la base de datos:`, subscription);
          
          // Actualizar el estado con la nueva suscripción
          set({
            currentSubscription: subscription,
            loading: false,
            paymentUrl: null
          });
          
          // Forzar una actualización del localStorage
          localStorage.removeItem('poker-planning-subscription');
          
          // Forzar una recarga de la suscripción para asegurarnos de tener los datos actualizados
          await get().fetchUserSubscription(userId);
          
          console.log(`Estado actualizado con la nueva suscripción`);
        } catch (error) {
          console.error('Error al ejecutar suscripción:', error);
          set({
            error: error instanceof Error ? error.message : 'Error desconocido al ejecutar suscripción',
            loading: false
          });
        }
      },
      
      // Limpiar error
      clearError: () => set({ error: null }),
      
      // Verificar si el usuario puede acceder a una característica
      canUserAccessFeature: (feature) => {
        const { currentSubscription } = get();
        const plan = currentSubscription?.plan || SubscriptionPlan.FREE;
        
        // Obtener la clave correcta para buscar en SUBSCRIPTION_PLANS
        const planLookupKey = getPlanLookupKey(plan);
        
        const featureValue = SUBSCRIPTION_PLANS[planLookupKey].features[feature];
        
        if (typeof featureValue === 'boolean') {
          return featureValue;
        }
        
        if (typeof featureValue === 'number') {
          return featureValue > 0;
        }
        
        return false;
      },
      
      // Verificar si el usuario puede crear una sala
      canUserCreateRoom: () => {
        const { currentSubscription } = get();
        const plan = currentSubscription?.plan || SubscriptionPlan.FREE;
        
        // Obtener la clave correcta para buscar en SUBSCRIPTION_PLANS
        const planLookupKey = getPlanLookupKey(plan);
        
        const maxRooms = SUBSCRIPTION_PLANS[planLookupKey].features.maxActiveRooms;
        
        // Si el usuario es Free y tiene una sesión activa en localStorage, no permitir crear más salas
        if (plan === SubscriptionPlan.FREE) {
          // Verificar si hay una sesión activa en localStorage
          const storageData = localStorage.getItem('poker-planning-storage');
          if (storageData) {
            try {
              const sessionData = JSON.parse(storageData);
              const state = sessionData.state;
              
              if (state && state.roomId) {
                console.log(`Usuario Free con sala activa: ${state.roomId}`);
                return false; // No permitir crear más salas
              }
            } catch (error) {
              console.error('Error al verificar sesión persistente:', error);
            }
          }
        }
        
        // Para usuarios Pro y Enterprise, permitir crear hasta el máximo de salas
        return maxRooms > 0;
      },
      
      // Verificar si una sala puede añadir más participantes
      canRoomAddParticipant: async (roomId: string) => {
        try {
          return await canAddParticipant(roomId);
        } catch (error) {
          console.error('Error al verificar si puede añadir participante:', error);
          return true; // Por defecto, permitir
        }
      },
      
      // Obtener el plan actual
      getCurrentPlan: () => {
        const { currentSubscription } = get();
        return currentSubscription?.plan || SubscriptionPlan.FREE;
      },
      
      // Obtener el número máximo de participantes permitidos para el plan actual
      getMaxParticipants: () => {
        const { currentSubscription } = get();
        const plan = currentSubscription?.plan || SubscriptionPlan.FREE;
        
        // Obtener la clave correcta para buscar en SUBSCRIPTION_PLANS
        const planLookupKey = getPlanLookupKey(plan);
        
        return SUBSCRIPTION_PLANS[planLookupKey].features.maxParticipants;
      },
      
      // Obtener el número máximo de salas activas permitidas para el plan actual
      getMaxActiveRooms: () => {
        const { currentSubscription } = get();
        const plan = currentSubscription?.plan || SubscriptionPlan.FREE;
        
        // Obtener la clave correcta para buscar en SUBSCRIPTION_PLANS
        const planLookupKey = getPlanLookupKey(plan);
        
        return SUBSCRIPTION_PLANS[planLookupKey].features.maxActiveRooms;
      }
    }),
    {
      name: 'poker-planning-subscription',
      partialize: (state) => ({
        currentSubscription: state.currentSubscription,
        paymentHistory: state.paymentHistory
      })
    }
  )
);