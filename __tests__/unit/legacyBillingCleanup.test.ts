import * as fs from 'fs';
import * as path from 'path';

const projectRoot = path.resolve(__dirname, '../..');

function loadNextBillingModules() {
  const fetchPolyfill = require('node-fetch');
  global.Request = fetchPolyfill.Request;
  const TestResponse = class extends fetchPolyfill.Response {
    static json(data: unknown, init?: ResponseInit) {
      return new fetchPolyfill.Response(JSON.stringify(data), {
        ...init,
        headers: {
          'content-type': 'application/json',
          ...(init?.headers || {}),
        },
      });
    }
  };
  global.Response = TestResponse as typeof Response;
  global.Headers = fetchPolyfill.Headers;

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { proxy } = require('../../src/proxy');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const createRoute = require('@/app/api/paypal/create-subscription/route');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const executeRoute = require('@/app/api/paypal/execute-subscription/route');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const detailsRoute = require('@/app/api/paypal/subscription-details/route');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const cancelRoute = require('@/app/api/paypal/cancel-subscription/route');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const webhookRoute = require('@/app/api/webhooks/paypal/route');

  return { proxy, createRoute, executeRoute, detailsRoute, cancelRoute, webhookRoute };
}

function makeRequest(pathname: string, locale = 'en') {
  const url = new URL(`https://example.test${pathname}`);
  const nextUrl = Object.assign(url, {
    clone: () => new URL(url.toString()),
  });
  return {
    nextUrl,
    cookies: {
      get: (name: string) => (name === 'NEXT_LOCALE' ? { value: locale } : undefined),
    },
    headers: new Headers(),
  };
}

describe('legacy billing cleanup', () => {
  it('does not ship obsolete client-side PayPal SDK/components/static checkout pages', () => {
    const removedFiles = [
      'src/lib/paypalSdk.ts',
      'src/lib/paypalConfig.ts',
      'src/components/subscription/PayPalSubscriptionButton.tsx',
      'src/components/subscription/PayPalTest.tsx',
      'src/types/paypal.d.ts',
      'public/subscription-status.html',
    ];

    for (const relativePath of removedFiles) {
      expect(fs.existsSync(path.join(projectRoot, relativePath))).toBe(false);
    }

    const publicFiles = fs.readdirSync(path.join(projectRoot, 'public'));
    expect(publicFiles.filter((name) => /^paypal-.*\.html$/.test(name))).toEqual([]);
  });

  it('keeps legacy PayPal Next.js API routes as explicit Railway-backend compatibility tombstones', async () => {
    const { createRoute, executeRoute, detailsRoute, cancelRoute, webhookRoute } = loadNextBillingModules();
    const responses = await Promise.all([
      createRoute.POST(),
      executeRoute.POST(),
      detailsRoute.GET(),
      cancelRoute.POST(),
      webhookRoute.POST(),
    ]);

    for (const response of responses) {
      expect(response.status).toBe(410);
      const body = await response.json();
      expect(body.error).toContain('Legacy PayPal billing routes are disabled');
      expect(body.error).toContain('FastAPI billing backend on Railway');
      expect(body.error).toContain('Stripe and PayPal');
    }
  });

  it('redirects old static billing compatibility URLs through the Next 16 proxy convention', () => {
    expect(fs.existsSync(path.join(projectRoot, 'middleware.ts'))).toBe(false);
    expect(fs.existsSync(path.join(projectRoot, 'src/proxy.ts'))).toBe(true);

    const { proxy } = loadNextBillingModules();

    const paypalRedirect = proxy(makeRequest('/paypal-pro-subscription-en.html', 'en') as never);
    expect(paypalRedirect?.status).toBe(307);
    expect(paypalRedirect?.headers.get('location')).toBe('https://example.test/en/settings/subscription');

    const statusRedirect = proxy(makeRequest('/subscription-status.html', 'es') as never);
    expect(statusRedirect?.status).toBe(307);
    expect(statusRedirect?.headers.get('location')).toBe('https://example.test/es/settings/subscription');
  });

  it('does not import the legacy Firestore subscription service in the subscription UI store', () => {
    const storeSource = fs.readFileSync(path.join(projectRoot, 'src/store/subscriptionStore.ts'), 'utf8');
    expect(storeSource).not.toContain('@/lib/subscriptionService');
    expect(storeSource).toContain('backend-authoritative admission');
  });
});
