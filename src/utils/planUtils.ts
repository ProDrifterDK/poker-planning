/**
 * Utilidades para trabajar con planes de suscripción
 */
import { BillingInterval, SubscriptionPlan, SUBSCRIPTION_PLANS } from '@/types/subscription';

/**
 * Función auxiliar para obtener la clave correcta para buscar en SUBSCRIPTION_PLANS.
 * Preserva el intervalo cuando el backend lo entrega para distinguir Pro mensual/anual.
 */
export const getPlanLookupKey = (
  plan: SubscriptionPlan,
  billingInterval?: BillingInterval | null
): string => {
  if (plan === SubscriptionPlan.FREE) {
    return SubscriptionPlan.FREE;
  }

  const interval = billingInterval || BillingInterval.MONTH;
  const planLookupKey = `${plan}-${interval}`;

  if (SUBSCRIPTION_PLANS[planLookupKey]) {
    return planLookupKey;
  }

  const monthlyFallback = `${plan}-${BillingInterval.MONTH}`;
  if (SUBSCRIPTION_PLANS[monthlyFallback]) {
    return monthlyFallback;
  }

  console.error(`Plan no encontrado: ${plan}, usando FREE como fallback`);
  return SubscriptionPlan.FREE;
};
