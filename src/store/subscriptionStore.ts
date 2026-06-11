/**
 * Store para gestionar el estado de las suscripciones.
 *
 * Billing authority now lives in the FastAPI backend. This store is only a UI/cache layer.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  BillingInterval,
  PlanFeatures,
  PaymentHistory,
  PaymentProvider,
  SUBSCRIPTION_PLANS,
  SubscriptionPlan,
  SubscriptionStatus,
  UserSubscription
} from '@/types/subscription';
import { canAddParticipant } from '@/lib/subscriptionService';
import { billingApi, type ConfirmCheckoutResult } from '@/lib/billingApi';

const getPlanLookupKey = (
  plan: SubscriptionPlan,
  billingInterval?: BillingInterval | null
): string => {
  if (plan === SubscriptionPlan.FREE) {
    return SubscriptionPlan.FREE;
  }

  const interval = billingInterval || BillingInterval.MONTH;
  const key = `${plan}-${interval}`;
  return SUBSCRIPTION_PLANS[key] ? key : `${plan}-${BillingInterval.MONTH}`;
};

const isSubscriptionStillEffective = (subscription: UserSubscription): boolean => {
  if (subscription.status !== SubscriptionStatus.CANCELLED) {
    return true;
  }

  if (!subscription.endDate) {
    return false;
  }

  return new Date(subscription.endDate) >= new Date();
};

interface SubscriptionState {
  currentSubscription: UserSubscription | null;
  paymentHistory: PaymentHistory[];
  loading: boolean;
  error: string | null;
  paymentUrl: string | null;

  fetchUserSubscription: (userId?: string) => Promise<UserSubscription | null>;
  fetchPaymentHistory: (userId?: string) => Promise<void>;
  subscribeToPlan: (
    userId: string,
    plan: SubscriptionPlan,
    billingInterval?: BillingInterval,
    provider?: PaymentProvider
  ) => Promise<string>;
  cancelCurrentSubscription: (reason?: string) => Promise<boolean>;
  executeSubscription: (token: string, userId?: string, plan?: SubscriptionPlan) => Promise<void>;
  confirmCheckoutSession: (sessionId: string, provider?: string) => Promise<ConfirmCheckoutResult | null>;
  clearSubscription: () => void;
  clearError: () => void;

  canUserAccessFeature: (feature: keyof PlanFeatures) => boolean;
  canUserCreateRoom: () => boolean;
  canRoomAddParticipant: (roomId: string) => Promise<boolean>;
  getCurrentPlan: () => SubscriptionPlan;
  getMaxParticipants: () => number;
  getMaxActiveRooms: () => number;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      currentSubscription: null,
      paymentHistory: [],
      loading: false,
      error: null,
      paymentUrl: null,

      fetchUserSubscription: async () => {
        try {
          set({ loading: true, error: null });
          const subscription = await billingApi.getCurrentSubscription();
          set({ currentSubscription: subscription, loading: false });
          return subscription;
        } catch (error) {
          console.error('Error al obtener suscripción:', error);
          set({
            error: error instanceof Error ? error.message : 'Error desconocido al obtener suscripción',
            loading: false,
          });
          return null;
        }
      },

      fetchPaymentHistory: async () => {
        try {
          set({ loading: true, error: null });
          const history = await billingApi.getPaymentHistory();
          set({ paymentHistory: history, loading: false });
        } catch (error) {
          console.error('Error al obtener historial de pagos:', error);
          set({
            error: error instanceof Error ? error.message : 'Error desconocido al obtener historial de pagos',
            loading: false,
          });
        }
      },

      subscribeToPlan: async (_userId, plan, billingInterval = BillingInterval.MONTH, provider = PaymentProvider.STRIPE) => {
        try {
          set({ loading: true, error: null, paymentUrl: null });

          if (plan === SubscriptionPlan.FREE) {
            const subscription = await billingApi.cancelCurrentSubscription('Downgraded to free plan');
            set({ currentSubscription: subscription, loading: false });
            return '';
          }

          const checkout = await billingApi.createCheckoutSession({
            plan,
            billingInterval,
            provider,
            locale: typeof window !== 'undefined'
              ? window.location.pathname.split('/')[1] || 'es'
              : 'es',
          });
          set({ paymentUrl: checkout.checkoutUrl, loading: false });
          return checkout.checkoutUrl;
        } catch (error) {
          console.error('Error al suscribirse al plan:', error);
          set({
            error: error instanceof Error ? error.message : 'Error desconocido al suscribirse al plan',
            loading: false,
          });
          return '';
        }
      },

      cancelCurrentSubscription: async (reason?: string) => {
        try {
          set({ loading: true, error: null });
          const subscription = await billingApi.cancelCurrentSubscription(reason || 'Cancelado por el usuario');
          set({ currentSubscription: subscription, loading: false });
          return true;
        } catch (error) {
          console.error('Error al cancelar suscripción:', error);
          set({
            error: error instanceof Error ? error.message : 'Error desconocido al cancelar suscripción',
            loading: false,
          });
          return false;
        }
      },

      executeSubscription: async (token: string) => {
        await get().confirmCheckoutSession(token);
      },

      confirmCheckoutSession: async (sessionId: string, provider?: string) => {
        try {
          set({ loading: true, error: null });
          const result = await billingApi.confirmCheckoutSession(sessionId, provider);

          // Only update the cached subscription when the backend says the
          // payment was actually confirmed (active/completed). A "pending"
          // status means the provider hasn't yet approved the subscription —
          // we must not overwrite the local subscription with the free-plan
          // placeholder the backend returns in that case.
          if (result.status && result.status !== 'pending' && result.subscription) {
            set({ currentSubscription: result.subscription, loading: false, paymentUrl: null });
          } else {
            set({ loading: false });
          }
          return result;
        } catch (error) {
          console.error('Error al confirmar checkout:', error);
          set({
            error: error instanceof Error ? error.message : 'Error desconocido al confirmar checkout',
            loading: false,
          });
          return null;
        }
      },

      clearSubscription: () => set({ currentSubscription: null, paymentHistory: [], paymentUrl: null }),
      clearError: () => set({ error: null }),

      canUserAccessFeature: (feature) => {
        const { currentSubscription } = get();
        if (!currentSubscription || !isSubscriptionStillEffective(currentSubscription)) {
          return SUBSCRIPTION_PLANS[SubscriptionPlan.FREE].features[feature] === true;
        }

        // Prefer backend-authoritative features when available
        if (currentSubscription.features && feature in currentSubscription.features) {
          const backendValue = currentSubscription.features[feature];
          if (typeof backendValue === 'boolean') return backendValue;
          if (typeof backendValue === 'number') return backendValue > 0;
        }

        // Fall back to local plan matrix
        const planLookupKey = getPlanLookupKey(
          currentSubscription.plan,
          currentSubscription.billingInterval
        );
        const featureValue = SUBSCRIPTION_PLANS[planLookupKey].features[feature];
        return typeof featureValue === 'boolean' ? featureValue : featureValue > 0;
      },

      canUserCreateRoom: () => {
        const { currentSubscription } = get();
        if (!currentSubscription || !isSubscriptionStillEffective(currentSubscription)) {
          return false;
        }

        const planLookupKey = getPlanLookupKey(
          currentSubscription.plan,
          currentSubscription.billingInterval
        );
        const maxRooms = SUBSCRIPTION_PLANS[planLookupKey].features.maxActiveRooms;

        if (currentSubscription.plan === SubscriptionPlan.FREE && typeof window !== 'undefined') {
          const storageData = localStorage.getItem('poker-planning-storage');
          if (storageData) {
            try {
              const state = JSON.parse(storageData).state;
              if (state?.roomId) {
                return false;
              }
            } catch (error) {
              console.error('Error al verificar sesión persistente:', error);
            }
          }
        }

        return maxRooms > 0;
      },

      canRoomAddParticipant: async (roomId: string) => {
        try {
          return await canAddParticipant(roomId);
        } catch (error) {
          console.error('Error al verificar si puede añadir participante:', error);
          return true;
        }
      },

      getCurrentPlan: () => {
        const { currentSubscription } = get();
        if (!currentSubscription || !isSubscriptionStillEffective(currentSubscription)) {
          return SubscriptionPlan.FREE;
        }
        return currentSubscription.plan;
      },

      getMaxParticipants: () => {
        const { currentSubscription } = get();
        const stillEffective = currentSubscription && isSubscriptionStillEffective(currentSubscription);
        const plan = stillEffective
          ? currentSubscription.plan
          : SubscriptionPlan.FREE;
        const billingInterval = currentSubscription?.billingInterval;
        // Only apply backend-authoritative limits when subscription is still effective;
        // otherwise stale backend features from an expired/cancelled sub would leak paid quotas
        if (stillEffective && currentSubscription.features?.maxParticipants != null) {
          return currentSubscription.features.maxParticipants;
        }
        return SUBSCRIPTION_PLANS[getPlanLookupKey(plan, billingInterval)].features.maxParticipants;
      },

      getMaxActiveRooms: () => {
        const { currentSubscription } = get();
        const stillEffective = currentSubscription && isSubscriptionStillEffective(currentSubscription);
        const plan = stillEffective
          ? currentSubscription.plan
          : SubscriptionPlan.FREE;
        const billingInterval = currentSubscription?.billingInterval;
        // Only apply backend-authoritative limits when subscription is still effective;
        // otherwise stale backend features from an expired/cancelled sub would leak paid quotas
        if (stillEffective && currentSubscription.features?.maxActiveRooms != null) {
          return currentSubscription.features.maxActiveRooms;
        }
        return SUBSCRIPTION_PLANS[getPlanLookupKey(plan, billingInterval)].features.maxActiveRooms;
      },
    }),
    {
      name: 'poker-planning-subscription',
      partialize: (state) => ({
        paymentHistory: state.paymentHistory,
      }),
    }
  )
);
