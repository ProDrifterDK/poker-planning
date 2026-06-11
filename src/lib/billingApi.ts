import { auth } from '@/lib/firebaseConfig';
import {
  BillingInterval,
  PaymentHistory,
  PaymentMethod,
  SubscriptionPlan,
  SubscriptionStatus,
  UserSubscription
} from '@/types/subscription';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BILLING_API_BASE_URL ||
  process.env.NEXT_PUBLIC_BILLING_API_URL ||
  'http://localhost:8000';

const E2E_AUTH_TOKEN = process.env.NEXT_PUBLIC_BILLING_E2E_AUTH_TOKEN;

export class BillingApiError extends Error {
  constructor(message: string, public status?: number, public details?: unknown) {
    super(message);
    this.name = 'BillingApiError';
  }
}

interface ApiBillingSubscription {
  id: string;
  userId?: string | null;
  plan: SubscriptionPlan;
  planKey?: string;
  billingInterval?: BillingInterval | null;
  status: SubscriptionStatus | string;
  startDate?: string | null;
  endDate?: string | null;
  autoRenew?: boolean;
  paymentMethod?: PaymentMethod | string | null;
  paymentId?: string | null;
  subscriptionId?: string | null;
  providerSubscriptionId?: string | null;
  cancelAtPeriodEnd?: boolean;
}

interface BillingMeResponse {
  subscription: ApiBillingSubscription;
  payments?: PaymentHistory[];
}

export interface RoomLimitDetails {
  code: string;
  message: string;
  planKey?: string;
  plan?: string;
  limit?: number;
  currentUsage?: number;
  upgradeAvailable?: boolean;
  upgradePath?: string;
}

export interface CreateRoomResponse {
  roomId: string;
  sessionId: string;
  firebasePath: string;
  title: string;
  seriesKey: string;
  participant: {
    participantId: string;
    role: 'moderator' | 'participant';
    displayName: string;
  };
  limits: {
    planKey: string;
    plan: string;
    limit: number;
    currentUsage: number;
    upgradeAvailable: boolean;
    upgradePath: string;
  };
  metadata: Record<string, unknown>;
}

function normalizeApiBaseUrl(): string {
  return API_BASE_URL.replace(/\/$/, '');
}

async function getAuthToken(forceRefresh = false): Promise<string> {
  const currentUser = auth.currentUser;
  if (currentUser) {
    return currentUser.getIdToken(forceRefresh);
  }

  if (E2E_AUTH_TOKEN && process.env.NODE_ENV !== 'production') {
    return E2E_AUTH_TOKEN;
  }

  throw new BillingApiError('Usuario no autenticado', 401);
}

async function billingRequest<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const token = await getAuthToken(!retry);
  const response = await fetch(`${normalizeApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401 && retry && auth.currentUser) {
    return billingRequest<T>(path, init, false);
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = data?.detail;
    const message =
      typeof detail === 'string'
        ? detail
        : detail?.message || data?.error || 'Error de billing';
    throw new BillingApiError(message, response.status, data);
  }

  return data as T;
}

function normalizeSubscription(subscription: ApiBillingSubscription): UserSubscription {
  const now = new Date().toISOString();
  const isFree = subscription.plan === SubscriptionPlan.FREE;

  return {
    id: subscription.id,
    userId: subscription.userId || auth.currentUser?.uid || '',
    plan: subscription.plan,
    planKey: subscription.planKey,
    billingInterval: subscription.billingInterval ?? null,
    status: subscription.status as SubscriptionStatus,
    startDate: subscription.startDate || now,
    endDate: subscription.endDate || (isFree ? null : now),
    autoRenew: Boolean(subscription.autoRenew),
    paymentMethod: (subscription.paymentMethod as PaymentMethod) || PaymentMethod.STRIPE,
    paymentId: subscription.paymentId || subscription.providerSubscriptionId || undefined,
    subscriptionId: subscription.subscriptionId || subscription.providerSubscriptionId || undefined,
    providerSubscriptionId: subscription.providerSubscriptionId || subscription.subscriptionId || undefined,
    cancelAtPeriodEnd: Boolean(subscription.cancelAtPeriodEnd),
  };
}

export const billingApi = {
  async getCurrentSubscription(): Promise<UserSubscription> {
    const data = await billingRequest<BillingMeResponse>('/v1/billing/me');
    return normalizeSubscription(data.subscription);
  },

  async getPaymentHistory(): Promise<PaymentHistory[]> {
    const data = await billingRequest<BillingMeResponse>('/v1/billing/me');
    return data.payments || [];
  },

  async createRoom(input: {
    seriesKey: string;
    title?: string;
    displayName?: string;
  }): Promise<CreateRoomResponse> {
    return billingRequest<CreateRoomResponse>(
      '/v1/rooms',
      {
        method: 'POST',
        body: JSON.stringify({
          seriesKey: input.seriesKey,
          title: input.title,
          displayName: input.displayName,
        }),
      }
    );
  },

  async closeRoom(roomId: string): Promise<{ roomId: string; status: string }> {
    return billingRequest<{ roomId: string; status: string }>(
      `/v1/rooms/${encodeURIComponent(roomId)}/close`,
      { method: 'POST' }
    );
  },

  async createCheckoutSession(input: {
    plan: SubscriptionPlan.PRO | SubscriptionPlan.ENTERPRISE;
    billingInterval: BillingInterval;
    locale: string;
  }): Promise<{ checkoutUrl: string; checkoutSessionId: string }> {
    const planKey = `${input.plan}-${input.billingInterval}`;
    return billingRequest<{ checkoutUrl: string; checkoutSessionId: string }>(
      '/v1/billing/checkout-sessions',
      {
        method: 'POST',
        body: JSON.stringify({ planKey, locale: input.locale === 'en' ? 'en' : 'es' }),
      }
    );
  },

  async confirmCheckoutSession(sessionId: string): Promise<UserSubscription> {
    const data = await billingRequest<{ subscription: ApiBillingSubscription }>(
      `/v1/billing/checkout-sessions/${encodeURIComponent(sessionId)}/confirm`,
      { method: 'POST' }
    );
    return normalizeSubscription(data.subscription);
  },

  async cancelCurrentSubscription(reason?: string): Promise<UserSubscription> {
    const data = await billingRequest<{ subscription: ApiBillingSubscription }>(
      '/v1/billing/subscription/me/cancel',
      {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }
    );
    return normalizeSubscription(data.subscription);
  },
};
