/**
 * Tipos para el sistema de suscripciones
 */

// Planes disponibles
export enum SubscriptionPlan {
  FREE = 'free',
  PRO = 'pro',
  ENTERPRISE = 'enterprise'
}

// Características de cada plan
export interface PlanFeatures {
  maxParticipants: number;
  maxActiveRooms: number;
  exportData: boolean;
  advancedStats: boolean;
  timer: boolean;
  fullHistory: boolean;
  integrations: boolean;
  branding: boolean;
  advancedRoles: boolean;
  prioritySupport: boolean;
  api: boolean;
}

// Detalles de cada plan
export interface PlanDetails {
  id: SubscriptionPlan;
  name: string;
  price: number; // Precio mensual en USD
  features: PlanFeatures;
  description: string;
}

// Estado de la suscripción
export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  PENDING = 'pending',
  FAILED = 'failed'
}

// Método de pago
export enum PaymentMethod {
  PAYPAL = 'paypal',
  CREDIT_CARD = 'credit_card'
}

// Información de la suscripción del usuario
export interface UserSubscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  autoRenew: boolean;
  paymentMethod: PaymentMethod;
  paymentId?: string; // ID de la transacción en PayPal
  subscriptionId?: string; // ID de la suscripción en PayPal
}

// Historial de pagos
export interface PaymentHistory {
  id: string;
  userId: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  date: string; // ISO date string
  status: 'completed' | 'pending' | 'failed';
  paymentMethod: PaymentMethod;
  transactionId: string; // ID de la transacción en PayPal
}

// Definición de los planes disponibles
export const SUBSCRIPTION_PLANS: Record<SubscriptionPlan, PlanDetails> = {
  [SubscriptionPlan.FREE]: {
    id: SubscriptionPlan.FREE,
    name: 'Free',
    price: 0,
    description: 'Para equipos pequeños y uso personal',
    features: {
      maxParticipants: 5,
      maxActiveRooms: 1,
      exportData: false,
      advancedStats: false,
      timer: true,
      fullHistory: false,
      integrations: false,
      branding: false,
      advancedRoles: false,
      prioritySupport: false,
      api: false
    }
  },
  [SubscriptionPlan.PRO]: {
    id: SubscriptionPlan.PRO,
    name: 'Pro',
    price: 9.99,
    description: 'Para equipos profesionales',
    features: {
      maxParticipants: 15,
      maxActiveRooms: 5,
      exportData: true,
      advancedStats: true,
      timer: true,
      fullHistory: true,
      integrations: false,
      branding: false,
      advancedRoles: false,
      prioritySupport: false,
      api: false
    }
  },
  [SubscriptionPlan.ENTERPRISE]: {
    id: SubscriptionPlan.ENTERPRISE,
    name: 'Enterprise',
    price: 29.99,
    description: 'Para grandes organizaciones',
    features: {
      maxParticipants: 100,
      maxActiveRooms: 20,
      exportData: true,
      advancedStats: true,
      timer: true,
      fullHistory: true,
      integrations: true,
      branding: true,
      advancedRoles: true,
      prioritySupport: true,
      api: true
    }
  }
};