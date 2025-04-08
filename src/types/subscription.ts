/**
 * Types for the subscription system
 *
 * This file defines the types and constants for the subscription system.
 * The text content is internationalized using the subscriptionTranslations.ts file.
 */

import { getSubscriptionTranslations } from './subscriptionTranslations';

// Default to English translations for type definitions
const enTranslations = getSubscriptionTranslations('en');

// Available plans
export enum SubscriptionPlan {
  FREE = 'free',
  PRO = 'pro',
  ENTERPRISE = 'enterprise'
}

// Billing intervals
export enum BillingInterval {
  MONTH = 'month',
  YEAR = 'year'
}

// Features for each plan
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
  adFree: boolean; // Feature to indicate if the plan shows no ads
}

// Details for each plan
export interface PlanDetails {
  id: SubscriptionPlan;
  name: string;
  price: number; // Price in USD
  billingInterval: BillingInterval; // Billing interval (monthly or yearly)
  features: PlanFeatures;
  description: string;
}

// Subscription status
export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  PENDING = 'pending',
  FAILED = 'failed'
}

// Payment method
export enum PaymentMethod {
  PAYPAL = 'paypal',
  CREDIT_CARD = 'credit_card'
}

// User subscription information
export interface UserSubscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  autoRenew: boolean;
  paymentMethod: PaymentMethod;
  paymentId?: string; // Payment ID in PayPal
  subscriptionId?: string; // Subscription ID in PayPal
}

// Payment history
export interface PaymentHistory {
  id: string;
  userId: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  date: string; // ISO date string
  status: 'completed' | 'pending' | 'failed';
  paymentMethod: PaymentMethod;
  transactionId: string; // Transaction ID in PayPal
}

// Definition of available plans
export const SUBSCRIPTION_PLANS = {
  // Planes mensuales
  [SubscriptionPlan.FREE]: {
    id: SubscriptionPlan.FREE,
    name: enTranslations.free.name,
    price: 0,
    billingInterval: BillingInterval.MONTH,
    description: enTranslations.free.description,
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
      api: false,
      adFree: false // Free users see ads
    }
  },
  [SubscriptionPlan.PRO + '-' + BillingInterval.MONTH]: {
    id: SubscriptionPlan.PRO,
    name: enTranslations.proMonthly.name,
    price: 9.99,
    billingInterval: BillingInterval.MONTH,
    description: enTranslations.proMonthly.description,
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
      api: false,
      adFree: true // Pro users don't see ads
    }
  },
  [SubscriptionPlan.ENTERPRISE + '-' + BillingInterval.MONTH]: {
    id: SubscriptionPlan.ENTERPRISE,
    name: enTranslations.enterpriseMonthly.name,
    price: 29.99,
    billingInterval: BillingInterval.MONTH,
    description: enTranslations.enterpriseMonthly.description,
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
      api: true,
      adFree: true // Enterprise users don't see ads
    }
  },
  
  // Planes anuales
  [SubscriptionPlan.PRO + '-' + BillingInterval.YEAR]: {
    id: SubscriptionPlan.PRO,
    name: enTranslations.proYearly.name,
    price: 99.99,
    billingInterval: BillingInterval.YEAR,
    description: enTranslations.proYearly.description,
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
      api: false,
      adFree: true // Pro users don't see ads
    }
  },
  [SubscriptionPlan.ENTERPRISE + '-' + BillingInterval.YEAR]: {
    id: SubscriptionPlan.ENTERPRISE,
    name: enTranslations.enterpriseYearly.name,
    price: 299.99,
    billingInterval: BillingInterval.YEAR,
    description: enTranslations.enterpriseYearly.description,
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
      api: true,
      adFree: true // Enterprise users don't see ads
    }
  }
} as Record<string, PlanDetails>;

/**
 * Get plan details with translations for a specific language
 * @param lang Language code ('en' or 'es')
 * @returns Plan details with translations for the specified language
 */
export function getLocalizedSubscriptionPlans(lang: string): Record<string, PlanDetails> {
  const translations = getSubscriptionTranslations(lang);
  
  return {
    [SubscriptionPlan.FREE]: {
      ...SUBSCRIPTION_PLANS[SubscriptionPlan.FREE],
      name: translations.free.name,
      description: translations.free.description
    },
    [SubscriptionPlan.PRO + '-' + BillingInterval.MONTH]: {
      ...SUBSCRIPTION_PLANS[SubscriptionPlan.PRO + '-' + BillingInterval.MONTH],
      name: translations.proMonthly.name,
      description: translations.proMonthly.description
    },
    [SubscriptionPlan.ENTERPRISE + '-' + BillingInterval.MONTH]: {
      ...SUBSCRIPTION_PLANS[SubscriptionPlan.ENTERPRISE + '-' + BillingInterval.MONTH],
      name: translations.enterpriseMonthly.name,
      description: translations.enterpriseMonthly.description
    },
    [SubscriptionPlan.PRO + '-' + BillingInterval.YEAR]: {
      ...SUBSCRIPTION_PLANS[SubscriptionPlan.PRO + '-' + BillingInterval.YEAR],
      name: translations.proYearly.name,
      description: translations.proYearly.description
    },
    [SubscriptionPlan.ENTERPRISE + '-' + BillingInterval.YEAR]: {
      ...SUBSCRIPTION_PLANS[SubscriptionPlan.ENTERPRISE + '-' + BillingInterval.YEAR],
      name: translations.enterpriseYearly.name,
      description: translations.enterpriseYearly.description
    }
  };
}