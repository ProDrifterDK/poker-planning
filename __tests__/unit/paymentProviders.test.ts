import { PaymentProvider } from '@/types/subscription';

function loadPaymentProviders(env: Record<string, string | undefined> = {}) {
  jest.resetModules();
  delete process.env.NEXT_PUBLIC_PAYPAL_ENABLED;
  Object.entries(env).forEach(([key, value]) => {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  });

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('@/config/paymentProviders') as typeof import('@/config/paymentProviders');
}

describe('payment provider availability', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('keeps PayPal disabled by default', () => {
    const { PAYMENT_PROVIDERS, ENABLED_PAYMENT_PROVIDERS, HAS_MULTIPLE_PROVIDERS } =
      loadPaymentProviders();

    expect(PAYMENT_PROVIDERS[PaymentProvider.PAYPAL].enabled).toBe(false);
    expect(ENABLED_PAYMENT_PROVIDERS).toEqual([PaymentProvider.STRIPE]);
    expect(HAS_MULTIPLE_PROVIDERS).toBe(false);
  });

  it('enables PayPal with only NEXT_PUBLIC_PAYPAL_ENABLED because checkout is backend redirected', () => {
    const { PAYMENT_PROVIDERS, ENABLED_PAYMENT_PROVIDERS, HAS_MULTIPLE_PROVIDERS } =
      loadPaymentProviders({ NEXT_PUBLIC_PAYPAL_ENABLED: 'true' });

    expect(PAYMENT_PROVIDERS[PaymentProvider.PAYPAL]).toEqual({ enabled: true });
    expect(ENABLED_PAYMENT_PROVIDERS).toEqual([
      PaymentProvider.STRIPE,
      PaymentProvider.PAYPAL,
    ]);
    expect(HAS_MULTIPLE_PROVIDERS).toBe(true);
  });
});
