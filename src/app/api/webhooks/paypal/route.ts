import { NextResponse } from 'next/server';

const LEGACY_PAYPAL_GONE_MESSAGE =
  'Legacy PayPal billing routes are disabled. Use the FastAPI billing backend on Railway for Stripe and PayPal checkout, subscription lifecycle, and webhooks.';

export async function POST() {
  return NextResponse.json(
    { error: LEGACY_PAYPAL_GONE_MESSAGE },
    { status: 410 }
  );
}
