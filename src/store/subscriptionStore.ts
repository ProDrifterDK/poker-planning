/**
 * Store para gestionar el estado de las suscripciones
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  SubscriptionPlan, 
  UserSubscription, 
  PaymentHistory,
  SUBSCRIPTION_PLANS
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
  createSubscriptionPlan,
  createSubscription as createPaypalSubscription,
  executeSubscription as executePaypalSubscription,
  cancelSubscription as cancelPaypalSubscription
} from '@/lib/paypalSdk';
import { PaymentMethod } from '@/types/subscription';

// Tipos para el store
interface SubscriptionState {
  // Estado
  currentSubscription: UserSubscription | null;
  paymentHistory: PaymentHistory[];
  loading: boolean;
  error: string | null;
  paymentUrl: string | null;
  
  // Acciones
  fetchUserSubscription: (userId: string) => Promise<void>;
  fetchPaymentHistory: (userId: string) => Promise<void>;
  subscribeToPlan: (userId: string, plan: SubscriptionPlan) => Promise<string>;
  cancelCurrentSubscription: (reason?: string) => Promise<boolean>;
  executeSubscription: (token: string, userId: string) => Promise<void>;
  clearError: () => void;
  
  // Utilidades
  canUserAccessFeature: (feature: keyof typeof SUBSCRIPTION_PLANS[SubscriptionPlan]['features']) => boolean;
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
          const subscription = await getUserSubscription(userId);
          set({ currentSubscription: subscription, loading: false });
        } catch (error) {
          console.error('Error al obtener suscripción:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Error desconocido al obtener suscripción', 
            loading: false 
          });
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
      subscribeToPlan: async (userId: string, plan: SubscriptionPlan) => {
        try {
          set({ loading: true, error: null, paymentUrl: null });
          
          // Si es plan FREE, crear suscripción directamente
          if (plan === SubscriptionPlan.FREE) {
            await createSubscription(userId, plan, PaymentMethod.PAYPAL);
            set({ loading: false });
            return '';
          }
          
          // Para planes de pago, crear plan en PayPal
          const planDetails = SUBSCRIPTION_PLANS[plan];
          const paypalPlanId = await createSubscriptionPlan(
            planDetails.name,
            planDetails.description,
            planDetails.price
          );
          
          // Crear suscripción en PayPal
          const approvalUrl = await createPaypalSubscription(paypalPlanId);
          
          set({ paymentUrl: approvalUrl, loading: false });
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
          
          set({ 
            currentSubscription: null, 
            loading: false 
          });
          
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
      executeSubscription: async (token: string, userId: string) => {
        try {
          set({ loading: true, error: null });
          
          // Ejecutar suscripción en PayPal
          const subscriptionDetails = await executePaypalSubscription(token);
          
          // Determinar el plan basado en el precio
          // Esto es una simplificación, en un sistema real deberíamos almacenar
          // la relación entre el plan de PayPal y nuestro plan
          const plan = SubscriptionPlan.PRO;
          
          // Crear suscripción en nuestra base de datos
          const subscription = await createSubscription(
            userId,
            plan,
            PaymentMethod.PAYPAL,
            subscriptionDetails.id, // Usar el ID de la suscripción como paymentId
            subscriptionDetails.id  // Usar el ID de la suscripción como subscriptionId
          );
          
          set({ 
            currentSubscription: subscription, 
            loading: false,
            paymentUrl: null
          });
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
        
        const featureValue = SUBSCRIPTION_PLANS[plan].features[feature];
        
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
        // Esta es una versión simplificada que solo verifica el plan
        // La versión completa debería verificar también el número de salas activas
        const { currentSubscription } = get();
        const plan = currentSubscription?.plan || SubscriptionPlan.FREE;
        
        return SUBSCRIPTION_PLANS[plan].features.maxActiveRooms > 0;
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