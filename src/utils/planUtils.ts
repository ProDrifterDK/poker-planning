/**
 * Utilidades para trabajar con planes de suscripción
 */
import { SubscriptionPlan, SUBSCRIPTION_PLANS } from '@/types/subscription';

/**
 * Función auxiliar para obtener la clave correcta para buscar en SUBSCRIPTION_PLANS
 * 
 * @param plan - El plan de suscripción
 * @returns La clave correcta para buscar en SUBSCRIPTION_PLANS
 */
export const getPlanLookupKey = (plan: SubscriptionPlan): string => {
  // Primero intentar con la clave simple
  let planLookupKey: string = plan as string;
  
  // Si no existe, intentar con la clave compuesta (plan-month)
  if (!SUBSCRIPTION_PLANS[planLookupKey]) {
    planLookupKey = `${plan}-month`;
  }
  
  // Si sigue sin existir, usar el plan FREE como fallback
  if (!SUBSCRIPTION_PLANS[planLookupKey]) {
    console.error(`Plan no encontrado: ${plan}, usando FREE como fallback`);
    planLookupKey = SubscriptionPlan.FREE;
  }
  
  return planLookupKey;
};