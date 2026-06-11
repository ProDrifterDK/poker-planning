/**
 * Payment provider feature flags.
 *
 * Centralises which checkout providers the frontend exposes to users.
 * A provider should only be enabled when the Railway backend is configured
 * for that provider. PayPal checkout is a backend-created approval redirect,
 * so the browser does not need a PayPal client ID.
 *
 * PayPal remains DISABLED by default until NEXT_PUBLIC_PAYPAL_ENABLED=true is
 * set after backend/Railway configuration. The fallback checkout path MUST NOT
 * activate paid subscriptions without provider-side approval.
 */

import { PaymentProvider } from '@/types/subscription';

export interface ProviderAvailability {
  enabled: boolean;
  /** Human-readable reason when disabled (shown to devs / logged). */
  disabledReason?: string;
}

function isPayPalEnabled(): ProviderAvailability {
  const explicitFlag = process.env.NEXT_PUBLIC_PAYPAL_ENABLED;
  // Honour an explicit "true" — anything else (unset / "false" / "") = disabled.
  // PayPal checkout is now a backend-created approval redirect, so the browser
  // no longer needs a PayPal client ID to expose the provider choice.
  if (explicitFlag === 'true') {
    return { enabled: true };
  }

  return {
    enabled: false,
    disabledReason:
      'PayPal checkout is disabled. Set NEXT_PUBLIC_PAYPAL_ENABLED=true after the Railway PayPal adapter is configured.',
  };
}

export const PAYMENT_PROVIDERS: Record<PaymentProvider, ProviderAvailability> = {
  [PaymentProvider.STRIPE]: { enabled: true },
  [PaymentProvider.PAYPAL]: isPayPalEnabled(),
};

/** Providers the UI should offer to the user, in display order. */
export const ENABLED_PAYMENT_PROVIDERS: PaymentProvider[] = (
  Object.keys(PAYMENT_PROVIDERS) as PaymentProvider[]
).filter((p) => PAYMENT_PROVIDERS[p].enabled);

/** True when more than one provider is available, so the selector step is meaningful. */
export const HAS_MULTIPLE_PROVIDERS: boolean = ENABLED_PAYMENT_PROVIDERS.length > 1;

/** The default provider used when the selector step is skipped (first enabled one). */
export const DEFAULT_PAYMENT_PROVIDER: PaymentProvider =
  ENABLED_PAYMENT_PROVIDERS[0] ?? PaymentProvider.STRIPE;

/**
 * Runtime guard: throws if a caller attempts to use a disabled provider.
 * Use this in billingApi before sending checkout requests.
 */
export function assertProviderEnabled(provider: PaymentProvider): void {
  const cfg = PAYMENT_PROVIDERS[provider];
  if (!cfg?.enabled) {
    throw new Error(
      `Payment provider "${provider}" is not available: ${cfg?.disabledReason ?? 'disabled'}`
    );
  }
}
