import { NextResponse } from 'next/server';

const gone = () => NextResponse.json(
  { error: 'Legacy PayPal billing routes are disabled. Use the FastAPI billing backend.' },
  { status: 410 }
);

export async function POST() {
  return gone();
}
