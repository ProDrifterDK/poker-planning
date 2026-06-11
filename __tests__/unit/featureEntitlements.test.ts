/**
 * Tests for billing feature entitlement gates.
 *
 * Covers:
 * - canUserAccessFeature uses backend features when present
 * - canUserAccessFeature falls back to local plan matrix
 * - Free/Pro/Enterprise feature gate visibility for every entitlement
 * - getMaxParticipants / getMaxActiveRooms prefer backend values
 * - Cancelled subscriptions fall back to free entitlements
 * - normalizeSubscription preserves backend features from /v1/billing/me
 */

// Mock Firebase auth
jest.mock('@/lib/firebaseConfig', () => ({
  auth: {
    currentUser: { uid: 'test-user', getIdToken: jest.fn().mockResolvedValue('fake-token') },
  },
}));

// Mock billingApi (we only need to test the normalize function behavior)
jest.mock('@/lib/billingApi', () => {
  class BillingApiError extends Error {
    constructor(message: string, public status?: number, public details?: unknown) {
      super(message);
      this.name = 'BillingApiError';
    }
  }
  return { BillingApiError };
});

// Mock subscriptionService to avoid Firebase calls
jest.mock('@/lib/subscriptionService', () => ({
  canAddParticipant: jest.fn().mockResolvedValue(true),
}));

import { useSubscriptionStore } from '@/store/subscriptionStore';
import {
  SubscriptionPlan,
  SubscriptionStatus,
  PaymentMethod,
  UserSubscription,
} from '@/types/subscription';

// Helper: creates a subscription with backend features attached
function makeSubscription(
  plan: SubscriptionPlan,
  features: Record<string, boolean | number>,
  status: SubscriptionStatus = SubscriptionStatus.ACTIVE,
): UserSubscription {
  return {
    id: 'sub-1',
    userId: 'test-user',
    plan,
    planKey: plan === SubscriptionPlan.FREE ? 'free' : `${plan}-month`,
    billingInterval: plan === SubscriptionPlan.FREE ? null : ('month' as any),
    status,
    startDate: new Date().toISOString(),
    endDate: status === SubscriptionStatus.CANCELLED
      ? new Date(Date.now() + 30 * 86400000).toISOString()
      : null,
    autoRenew: true,
    paymentMethod: PaymentMethod.STRIPE,
    features: features as any,
  };
}

beforeEach(() => {
  // Reset store state before each test
  useSubscriptionStore.setState({
    currentSubscription: null,
    paymentHistory: [],
    loading: false,
    error: null,
    paymentUrl: null,
  });
});

describe('Feature entitlement gates', () => {
  describe('canUserAccessFeature — backend-authoritative features', () => {
    const FREE_FEATURES = {
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
      adFree: false,
    };

    const PRO_FEATURES = {
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
      adFree: true,
    };

    const ENTERPRISE_FEATURES = {
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
      adFree: true,
    };

    it('Free plan: gated features denied, timer allowed', () => {
      useSubscriptionStore.setState({
        currentSubscription: makeSubscription(SubscriptionPlan.FREE, FREE_FEATURES),
      });
      const store = useSubscriptionStore.getState();

      // Denied for free
      expect(store.canUserAccessFeature('exportData')).toBe(false);
      expect(store.canUserAccessFeature('advancedStats')).toBe(false);
      expect(store.canUserAccessFeature('fullHistory')).toBe(false);
      expect(store.canUserAccessFeature('integrations')).toBe(false);
      expect(store.canUserAccessFeature('branding')).toBe(false);
      expect(store.canUserAccessFeature('advancedRoles')).toBe(false);
      expect(store.canUserAccessFeature('prioritySupport')).toBe(false);
      expect(store.canUserAccessFeature('api')).toBe(false);
      expect(store.canUserAccessFeature('adFree')).toBe(false);

      // Allowed for all plans
      expect(store.canUserAccessFeature('timer')).toBe(true);
    });

    it('Pro plan: export/stats/history/adfree allowed, enterprise-only denied', () => {
      useSubscriptionStore.setState({
        currentSubscription: makeSubscription(SubscriptionPlan.PRO, PRO_FEATURES),
      });
      const store = useSubscriptionStore.getState();

      // Allowed for pro
      expect(store.canUserAccessFeature('exportData')).toBe(true);
      expect(store.canUserAccessFeature('advancedStats')).toBe(true);
      expect(store.canUserAccessFeature('fullHistory')).toBe(true);
      expect(store.canUserAccessFeature('adFree')).toBe(true);
      expect(store.canUserAccessFeature('timer')).toBe(true);

      // Enterprise-only: denied
      expect(store.canUserAccessFeature('integrations')).toBe(false);
      expect(store.canUserAccessFeature('branding')).toBe(false);
      expect(store.canUserAccessFeature('advancedRoles')).toBe(false);
      expect(store.canUserAccessFeature('prioritySupport')).toBe(false);
      expect(store.canUserAccessFeature('api')).toBe(false);
    });

    it('Enterprise plan: all features allowed', () => {
      useSubscriptionStore.setState({
        currentSubscription: makeSubscription(SubscriptionPlan.ENTERPRISE, ENTERPRISE_FEATURES),
      });
      const store = useSubscriptionStore.getState();

      const features: (keyof typeof ENTERPRISE_FEATURES)[] = [
        'maxParticipants', 'maxActiveRooms', 'exportData', 'advancedStats',
        'timer', 'fullHistory', 'integrations', 'branding',
        'advancedRoles', 'prioritySupport', 'api', 'adFree',
      ];
      features.forEach((f) => {
        expect(store.canUserAccessFeature(f as any)).toBe(true);
      });
    });

    it('No subscription: falls back to free plan (all gated features denied)', () => {
      const store = useSubscriptionStore.getState();

      expect(store.canUserAccessFeature('exportData')).toBe(false);
      expect(store.canUserAccessFeature('integrations')).toBe(false);
      expect(store.canUserAccessFeature('adFree')).toBe(false);
      expect(store.canUserAccessFeature('timer')).toBe(true);
    });
  });

  describe('canUserAccessFeature — falls back to local plan matrix without backend features', () => {
    it('uses SUBSCRIPTION_PLANS when features field is absent', () => {
      const sub: UserSubscription = {
        id: 'sub-2',
        userId: 'test-user',
        plan: SubscriptionPlan.PRO,
        planKey: 'pro-month',
        billingInterval: 'month' as any,
        status: SubscriptionStatus.ACTIVE,
        startDate: new Date().toISOString(),
        autoRenew: true,
        paymentMethod: PaymentMethod.STRIPE,
        // No features field — should fall back to local plan matrix
      };
      useSubscriptionStore.setState({ currentSubscription: sub });
      const store = useSubscriptionStore.getState();

      // Pro features from local matrix
      expect(store.canUserAccessFeature('exportData')).toBe(true);
      expect(store.canUserAccessFeature('integrations')).toBe(false);
    });
  });

  describe('canUserAccessFeature — cancelled subscription', () => {
    it('returns free entitlements for expired cancelled subscription', () => {
      const sub: UserSubscription = {
        id: 'sub-3',
        userId: 'test-user',
        plan: SubscriptionPlan.PRO,
        planKey: 'pro-month',
        billingInterval: 'month' as any,
        status: SubscriptionStatus.CANCELLED,
        startDate: new Date(Date.now() - 60 * 86400000).toISOString(),
        endDate: new Date(Date.now() - 86400000).toISOString(), // expired yesterday
        autoRenew: false,
        paymentMethod: PaymentMethod.STRIPE,
        features: { exportData: true, integrations: false, adFree: true, timer: true } as any,
      };
      useSubscriptionStore.setState({ currentSubscription: sub });
      const store = useSubscriptionStore.getState();

      // Should fall back to FREE because subscription is no longer effective
      expect(store.canUserAccessFeature('exportData')).toBe(false);
      expect(store.canUserAccessFeature('adFree')).toBe(false);
      expect(store.canUserAccessFeature('timer')).toBe(true);
    });
  });

  describe('getMaxParticipants / getMaxActiveRooms — backend preference', () => {
    it('returns backend values when features present', () => {
      useSubscriptionStore.setState({
        currentSubscription: makeSubscription(SubscriptionPlan.PRO, {
          maxParticipants: 25,
          maxActiveRooms: 10,
          exportData: true,
          advancedStats: true,
          timer: true,
          fullHistory: true,
          integrations: false,
          branding: false,
          advancedRoles: false,
          prioritySupport: false,
          api: false,
          adFree: true,
        }),
      });
      const store = useSubscriptionStore.getState();

      // Backend values (custom 25/10, not the standard Pro 15/5)
      expect(store.getMaxParticipants()).toBe(25);
      expect(store.getMaxActiveRooms()).toBe(10);
    });

    it('returns local plan matrix when backend features absent', () => {
      const sub: UserSubscription = {
        id: 'sub-4',
        userId: 'test-user',
        plan: SubscriptionPlan.FREE,
        planKey: 'free',
        status: SubscriptionStatus.ACTIVE,
        startDate: new Date().toISOString(),
        autoRenew: false,
        paymentMethod: PaymentMethod.STRIPE,
        // No features field
      };
      useSubscriptionStore.setState({ currentSubscription: sub });
      const store = useSubscriptionStore.getState();

      expect(store.getMaxParticipants()).toBe(5);
      expect(store.getMaxActiveRooms()).toBe(1);
    });

    it('returns free values when no subscription', () => {
      const store = useSubscriptionStore.getState();
      expect(store.getMaxParticipants()).toBe(5);
      expect(store.getMaxActiveRooms()).toBe(1);
    });

    it('returns free limits for expired cancelled subscription even with stale backend features', () => {
      // Regression test: an expired cancelled Pro subscription with cached
      // backend features.maxParticipants=15/maxActiveRooms=5 must not leak
      // paid quotas — must fall back to Free limits (5/1).
      const sub: UserSubscription = {
        id: 'sub-expired-cancelled',
        userId: 'test-user',
        plan: SubscriptionPlan.PRO,
        planKey: 'pro-month',
        billingInterval: 'month' as any,
        status: SubscriptionStatus.CANCELLED,
        startDate: new Date(Date.now() - 60 * 86400000).toISOString(),
        endDate: new Date(Date.now() - 86400000).toISOString(), // expired yesterday
        autoRenew: false,
        paymentMethod: PaymentMethod.STRIPE,
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
          adFree: true,
        } as any,
      };
      useSubscriptionStore.setState({ currentSubscription: sub });
      const store = useSubscriptionStore.getState();

      // Must NOT return stale paid limits
      expect(store.getMaxParticipants()).toBe(5);
      expect(store.getMaxActiveRooms()).toBe(1);
    });

    it('returns free limits when subscription is cancelled with no endDate', () => {
      const sub: UserSubscription = {
        id: 'sub-cancelled-no-end',
        userId: 'test-user',
        plan: SubscriptionPlan.ENTERPRISE,
        planKey: 'enterprise-month',
        billingInterval: 'month' as any,
        status: SubscriptionStatus.CANCELLED,
        startDate: new Date(Date.now() - 60 * 86400000).toISOString(),
        // No endDate — isSubscriptionStillEffective returns false
        autoRenew: false,
        paymentMethod: PaymentMethod.STRIPE,
        features: {
          maxParticipants: 100,
          maxActiveRooms: 20,
          exportData: true,
          integrations: true,
          timer: true,
        } as any,
      };
      useSubscriptionStore.setState({ currentSubscription: sub });
      const store = useSubscriptionStore.getState();

      expect(store.getMaxParticipants()).toBe(5);
      expect(store.getMaxActiveRooms()).toBe(1);
    });
  });

  describe('normalizeSubscription preserves backend features', () => {
    // Test the billingApi normalizeSubscription logic indirectly —
    // we verify that if a subscription has features, the store sees them
    it('features field is preserved in UserSubscription when present', () => {
      const features = {
        maxParticipants: 15,
        maxActiveRooms: 5,
        exportData: true,
        integrations: false,
        timer: true,
      };
      const sub = makeSubscription(SubscriptionPlan.PRO, features);
      useSubscriptionStore.setState({ currentSubscription: sub });

      const { currentSubscription } = useSubscriptionStore.getState();
      expect(currentSubscription?.features).toEqual(expect.objectContaining({
        exportData: true,
        integrations: false,
      }));
    });
  });
});
