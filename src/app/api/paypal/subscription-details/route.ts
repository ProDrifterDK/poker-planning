import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { error: 'Legacy PayPal billing routes are disabled. Use the FastAPI billing backend.' },
    { status: 410 }
  );
}
