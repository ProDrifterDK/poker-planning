import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Legacy PayPal webhook disabled. Stripe webhooks are handled by the FastAPI billing backend.' },
    { status: 410 }
  );
}
