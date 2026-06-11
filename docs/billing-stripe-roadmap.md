# Poker Planning billing, hardening, and Resyst subdomain roadmap

## Current state verified

- Frontend is a Next.js 16 application deployed on Vercel.
- The former billing implementation was PayPal-oriented and browser/client-authoritative in critical places.
- Legacy PayPal API routes now return HTTP 410 and are no longer used by the subscription UI.
- Static PayPal checkout/status pages and frontend PayPal SDK components have been removed; old static URLs redirect to the localized subscription UI.
- A FastAPI billing backend on Railway owns Stripe + PayPal checkout, subscription state, webhook processing, and entitlement reads.
- Frontend reads subscription state from the backend through `NEXT_PUBLIC_BILLING_API_BASE_URL`.

## Implemented multi-provider architecture

### Backend authority

The backend is the source of truth for billing:

- `GET /v1/billing/me`
  - Authenticated by Firebase ID token.
  - Returns the current effective subscription and payment history.
  - New users get an effective free entitlement without the browser creating billing documents.

- `GET /v1/billing/plans`
  - Public plan catalogue for UI and tests.

- `POST /v1/billing/checkout-sessions`
  - Authenticated.
  - Accepts a server-known `planKey` only.
  - Derives `firebase_uid` from the bearer token, not from client-supplied user IDs.
  - Creates Stripe Checkout Sessions or PayPal approval flows through provider adapters.
  - Accepts explicit provider selection from the frontend when both Stripe and PayPal are enabled.
  - Uses fake provider only for local/test mode.

- `POST /v1/billing/checkout-sessions/{session_id}/confirm`
  - Authenticated, owner-scoped confirmation path for local fake-provider E2E.
  - Real Stripe production should rely on signed webhooks as the durable authority.

- `POST /v1/billing/subscription/me/cancel`
  - Authenticated, server-authoritative cancellation path.

- `POST /v1/rooms`
  - Authenticated, backend-authoritative room creation path.
  - Enforces active-room limits from the effective billing entitlement before projecting room metadata/session/participant state into Firebase.
  - Firebase Realtime Database and Firestore rules deny direct client room metadata/session/participant/document creation so quota enforcement cannot be bypassed with client writes.

- `POST /v1/webhooks/stripe` and `POST /v1/webhooks/paypal`
  - Verify provider signatures in non-local environments (`STRIPE_WEBHOOK_SECRET`, `PAYPAL_WEBHOOK_ID` + PayPal transmission headers).
  - Store webhook event IDs for idempotency.
  - Update subscription and payment records server-side only.

### Persistence model

The backend keeps separate tables for:

- `billing_customers`
- `billing_subscriptions`
- `billing_payments`
- `billing_events`
- `checkout_sessions`

For production, use Postgres on Railway. SQLite is only for local/test.

## Frontend changes

- Added `src/lib/billingApi.ts`.
- Reworked `src/store/subscriptionStore.ts` into a UI/cache layer instead of a billing writer.
- Reworked `PlanCard` to redirect to backend-created checkout sessions.
- Reworked subscription success page to confirm backend sessions and refresh subscription state.
- Updated `UserSubscription` type with `planKey`, `billingInterval`, provider IDs, and nullable `endDate`.
- Disabled legacy PayPal API routes with explicit HTTP 410 responses.
- Removed obsolete `src/lib/paypalSdk.ts`, `src/lib/paypalConfig.ts`, PayPal button/test components, PayPal browser type declarations, and static `public/paypal-*.html` / `public/subscription-status.html` pages.
- Updated middleware so old static PayPal/status URLs redirect to the localized subscription settings page instead of serving browser-authoritative checkout/status pages.
- Added `.env.example` for frontend billing/Firebase envs.
- Updated lint script away from removed `next lint` command.

## Deployment plan: `planning.resyst.cl`

Preferred public subdomain: `planning.resyst.cl`.

### DNS / Vercel

1. In Vercel, add domain `planning.resyst.cl` to the frontend project.
2. In the `resyst.cl` DNS zone, create:
   - Type: `CNAME`
   - Name: `planning`
   - Target: Vercel's assigned CNAME target for the project.
3. Wait for Vercel certificate provisioning.
4. Set frontend env:
   - `NEXT_PUBLIC_BILLING_API_BASE_URL=https://<billing-backend-domain>`
   - `NEXT_PUBLIC_PAYPAL_ENABLED=true` only after Railway PayPal checkout + webhook config is deployed; no `NEXT_PUBLIC_PAYPAL_CLIENT_ID` is required by the active flow.

### Billing backend

Recommended backend host: Railway service under the same repository or a separate `poker-planning-billing` service.

Required backend env:

- `APP_ENV=production`
- `BILLING_PROVIDER=stripe` or `paypal` as the default provider; the frontend can pass an explicit provider when both are exposed.
- `DATABASE_URL=<postgres-url>`
- `FRONTEND_BASE_URL=https://planning.resyst.cl`
- `FRONTEND_ORIGINS=https://planning.resyst.cl,https://<vercel-preview-domain-if-needed>`
- `FIREBASE_PROJECT_ID=<project-id>`
- `FIREBASE_SERVICE_ACCOUNT_JSON_B64=<base64-service-account-json>` or `FIREBASE_SERVICE_ACCOUNT_JSON=<service-account-json>`
- `FIREBASE_DATABASE_URL=<realtime-database-url>` (required for backend room creation to project authorized rooms into Realtime Database)
- `E2E_TEST_MODE=false`

Stripe provider env when `BILLING_PROVIDER=stripe`:

- `STRIPE_SECRET_KEY=sk_...` or a restricted `rk_...` key with the required Checkout/Billing permissions
- `STRIPE_WEBHOOK_SECRET=whsec_...`
- `STRIPE_PRICE_PRO_MONTH=price_...`
- `STRIPE_PRICE_PRO_YEAR=price_...`
- `STRIPE_PRICE_ENTERPRISE_MONTH=price_...`
- `STRIPE_PRICE_ENTERPRISE_YEAR=price_...`

PayPal provider env when PayPal is available:

- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_ENVIRONMENT=sandbox|live` (`live` required in production)
- `PAYPAL_WEBHOOK_ID`
- `PAYPAL_PLAN_PRO_MONTH`
- `PAYPAL_PLAN_PRO_YEAR`
- `PAYPAL_PLAN_ENTERPRISE_MONTH`
- `PAYPAL_PLAN_ENTERPRISE_YEAR`

### Stripe dashboard

1. Create Products/Prices for:
   - Pro monthly
   - Pro yearly
   - Enterprise monthly
   - Enterprise yearly
2. Configure webhook endpoint:
   - URL: `https://<billing-backend-domain>/v1/webhooks/stripe`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
3. Copy webhook signing secret to Railway.

Future payment-history enhancement: add `invoice.payment_succeeded` / `invoice.payment_failed` handlers and tests before subscribing those events in Stripe.

### PayPal dashboard

1. Create subscription plans matching the backend plan keys (`pro-month`, `pro-year`, `enterprise-month`, `enterprise-year`).
2. Configure webhook endpoint:
   - URL: `https://<billing-backend-domain>/v1/webhooks/paypal`
   - Events: subscription activation/cancellation/suspension and subscription/payment completion/failure/denial.
3. Copy the PayPal webhook ID and plan IDs into Railway; redeploy before setting `NEXT_PUBLIC_PAYPAL_ENABLED=true` on Vercel.

## Testing roadmap

### Current verified proof

- Backend pytest suite covers auth requirement, plan catalogue, owner-scoped checkout confirmation, cancellation, signed webhook rejection, unsigned local webhook idempotency, and no client-supplied user ID authority.
- Frontend typecheck passes.
- Frontend production build passes with dummy Firebase envs and billing API env.
- ESLint runs through the new script with warnings only.

### Remaining E2E work

1. Add Cypress path for local fake billing:
   - Start FastAPI backend with `BILLING_PROVIDER=fake`, `E2E_TEST_MODE=true`.
   - Start Next frontend with `NEXT_PUBLIC_BILLING_API_BASE_URL=http://localhost:8000` and a test Firebase auth fixture/token strategy.
   - Visit subscription page.
   - Select Pro monthly.
   - Assert redirect to fake checkout success URL.
   - Assert success page confirms backend session.
   - Assert UI displays Pro monthly entitlement.

2. Add Stripe test-mode integration smoke:
   - Create Checkout Session with test price ID.
   - Use Stripe CLI or test webhook fixture to send signed `checkout.session.completed`.
   - Assert `/v1/billing/me` reflects backend-updated entitlement.

3. Keep existing room-creation/joining/voting Cypress tests, but make them explicit about free-plan limits vs paid-plan limits.

## Dependency and security cleanup backlog

### Done in this pass

- Removed deprecated `@paypal/checkout-server-sdk` and its type package from Node dependencies.
- Removed frontend reliance on client-side subscription document creation.
- Removed public PayPal return/cancel URL usage from active subscription flow.
- Removed remaining frontend PayPal SDK/static HTML artifacts and redirected legacy static URLs to the subscription UI.
- Added backend webhook idempotency and signature verification path.

### Still open

`npm audit` still reports 19 vulnerabilities:

- 1 high: `tmp`, via Cypress chain.
- 17 moderate: mostly Cypress, Firebase Admin/Google Cloud, Next/PostCSS/styled-components, UUID/qs/ws chains.
- 1 low: `@tootallnate/once`.

Most fix paths are semver-major or require careful validation:

- Cypress 14 -> 15 major.
- firebase-admin 13 -> 14 major.
- Next/PostCSS advisory report is noisy because npm suggests an invalid-looking downgrade path (`next@9.3.3`); handle manually by tracking Next 16 patch releases and lockfile resolution.

Recommended next cleanup branch:

1. Upgrade Cypress to latest major and run Cypress smoke tests.
2. Upgrade firebase-admin to 14 in frontend/server-side legacy code or remove unused `src/lib/firebaseAdmin.ts` if no longer needed.
3. Decide whether account-deletion subscription cancellation should call only the FastAPI backend or keep the current best-effort legacy Firestore cleanup while historical migration finishes.
4. Fix pre-existing Jest suite drift (OnboardingTooltip, Card, RoomStore) separately from billing.

## Operational risks

- Browser-stored integration tokens remain a production risk outside billing scope. Move third-party tokens out of localStorage into backend-managed encrypted storage before serious public launch.
- Existing Jest failures are not caused by the billing rewrite, but they block a fully green frontend unit suite.
- The repo has a parent `/home/prodrifterdk/package-lock.json`; Next 16 warns that it may infer the wrong workspace root during build. Set `turbopack.root` or remove the parent lockfile if safe.
