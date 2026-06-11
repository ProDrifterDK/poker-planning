export function getCheckoutSessionIdFromSearchParams(
  searchParams: Pick<URLSearchParams, 'get'>
): string | null {
  return (
    searchParams.get('session_id') ||
    searchParams.get('checkout_session_id') ||
    searchParams.get('subscription_id')
  );
}
