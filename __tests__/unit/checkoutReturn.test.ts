import { getCheckoutSessionIdFromSearchParams } from '@/lib/checkoutReturn';

describe('checkout return parsing', () => {
  it('prefers first-party checkout session parameters', () => {
    const params = new URLSearchParams({
      session_id: 'cs_stripe',
      checkout_session_id: 'cs_legacy',
      subscription_id: 'I-PAYPAL',
    });

    expect(getCheckoutSessionIdFromSearchParams(params)).toBe('cs_stripe');
  });

  it('falls back to PayPal subscription_id on approval return redirects', () => {
    const params = new URLSearchParams({
      ba_token: 'BA-123',
      token: 'TOKEN-123',
      subscription_id: 'I-PAYPAL-SUBSCRIPTION',
    });

    expect(getCheckoutSessionIdFromSearchParams(params)).toBe('I-PAYPAL-SUBSCRIPTION');
  });

  it('returns null when no supported checkout identifier is present', () => {
    expect(getCheckoutSessionIdFromSearchParams(new URLSearchParams('provider=paypal'))).toBeNull();
  });
});
