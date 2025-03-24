/**
 * Implementación alternativa para PayPal usando la API REST directamente
 * Este archivo proporciona funciones para interactuar con la API de PayPal
 * sin depender del SDK oficial, que puede tener problemas de compatibilidad
 */

import { PAYPAL_CONFIG, logPayPalConfig } from './paypalConfig';

// Registrar la configuración de PayPal al cargar el módulo
if (typeof window !== 'undefined') {
  // Solo ejecutar en el cliente para evitar problemas con SSR
  logPayPalConfig();
}

// Interfaces para los tipos de respuesta de PayPal
export interface PayPalLink {
  href: string;
  rel: string;
  method: string;
}

export interface PayPalSubscriptionResponse {
  id: string;
  status: string;
  links: PayPalLink[];
}

export interface PayPalSubscriptionDetails {
  id: string;
  status: string;
  plan_id: string;
  start_date: string;
  billing_info?: {
    next_billing_time?: string;
    last_payment?: {
      amount?: {
        value: string;
      };
    };
  };
  subscriber?: {
    email_address?: string;
    name?: {
      given_name?: string;
      surname?: string;
    };
  };
}

/**
 * Obtener token de acceso para la API de PayPal
 */
async function getAccessToken(): Promise<string> {
  try {
    const auth = Buffer.from(`${PAYPAL_CONFIG.clientId}:${PAYPAL_CONFIG.clientSecret}`).toString('base64');
    const response = await fetch(`https://api.${PAYPAL_CONFIG.environment === 'live' ? 'paypal.com' : 'sandbox.paypal.com'}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`,
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error al obtener token de PayPal: ${errorData.error_description || 'Error desconocido'}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error al obtener token de PayPal:', error);
    throw error;
  }
}

/**
 * Crear un plan de suscripción en PayPal
 */
export async function createSubscriptionPlan(
  name: string,
  description: string,
  price: number,
  interval: 'MONTH' | 'YEAR' = 'MONTH'
): Promise<string> {
  try {
    const accessToken = await getAccessToken();
    
    const planData = {
      name,
      description,
      type: 'RECURRING',
      payment_definitions: [
        {
          name: `Regular payment for ${name}`,
          type: 'REGULAR',
          frequency: interval,
          frequency_interval: '1',
          amount: {
            currency: PAYPAL_CONFIG.currency,
            value: price.toFixed(2),
          },
          cycles: '0', // Infinito
        },
      ],
      merchant_preferences: {
        setup_fee: {
          currency: PAYPAL_CONFIG.currency,
          value: '0',
        },
        return_url: PAYPAL_CONFIG.returnUrl,
        cancel_url: PAYPAL_CONFIG.cancelUrl,
        auto_bill_amount: 'YES',
        initial_fail_amount_action: 'CONTINUE',
        max_fail_attempts: '3',
      },
    };

    const response = await fetch(`https://api.${PAYPAL_CONFIG.environment === 'live' ? 'paypal.com' : 'sandbox.paypal.com'}/v1/billing/plans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(planData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error al crear plan en PayPal: ${errorData.message || 'Error desconocido'}`);
    }

    const data = await response.json();
    return data.id;
  } catch (error) {
    console.error('Error al crear plan en PayPal:', error);
    throw error;
  }
}

/**
 * Crear una suscripción en PayPal
 */
export async function createSubscription(
  planId: string,
  returnUrl: string = PAYPAL_CONFIG.returnUrl,
  cancelUrl: string = PAYPAL_CONFIG.cancelUrl
): Promise<string> {
  try {
    const accessToken = await getAccessToken();
    
    const subscriptionData = {
      plan_id: planId,
      application_context: {
        brand_name: 'Planning Poker Pro',
        locale: PAYPAL_CONFIG.locale,
        shipping_preference: 'NO_SHIPPING',
        user_action: 'SUBSCRIBE_NOW',
        payment_method: {
          payer_selected: 'PAYPAL',
          payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED'
        },
        return_url: returnUrl,
        cancel_url: cancelUrl
      }
    };

    const response = await fetch(`https://api.${PAYPAL_CONFIG.environment === 'live' ? 'paypal.com' : 'sandbox.paypal.com'}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(subscriptionData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error al crear suscripción en PayPal: ${errorData.message || 'Error desconocido'}`);
    }

    const data = await response.json() as PayPalSubscriptionResponse;
    const approvalLink = data.links.find(link => link.rel === 'approve');
    
    return approvalLink?.href || '';
  } catch (error) {
    console.error('Error al crear suscripción en PayPal:', error);
    throw error;
  }
}

/**
 * Ejecutar una suscripción después de la aprobación del usuario
 */
export async function executeSubscription(
  subscriptionId: string
): Promise<PayPalSubscriptionDetails> {
  try {
    const accessToken = await getAccessToken();
    
    const response = await fetch(`https://api.${PAYPAL_CONFIG.environment === 'live' ? 'paypal.com' : 'sandbox.paypal.com'}/v1/billing/subscriptions/${subscriptionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error al ejecutar suscripción en PayPal: ${errorData.message || 'Error desconocido'}`);
    }

    return await response.json() as PayPalSubscriptionDetails;
  } catch (error) {
    console.error('Error al ejecutar suscripción en PayPal:', error);
    throw error;
  }
}

/**
 * Cancelar una suscripción
 */
export async function cancelSubscription(
  subscriptionId: string,
  reason: string = 'Cancelado por el usuario'
): Promise<boolean> {
  try {
    const accessToken = await getAccessToken();
    
    const response = await fetch(`https://api.${PAYPAL_CONFIG.environment === 'live' ? 'paypal.com' : 'sandbox.paypal.com'}/v1/billing/subscriptions/${subscriptionId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error al cancelar suscripción en PayPal: ${errorData.message || 'Error desconocido'}`);
    }

    return true;
  } catch (error) {
    console.error('Error al cancelar suscripción en PayPal:', error);
    throw error;
  }
}

/**
 * Obtener detalles de una suscripción
 */
export async function getSubscriptionDetails(
  subscriptionId: string
): Promise<PayPalSubscriptionDetails> {
  try {
    const accessToken = await getAccessToken();
    
    const response = await fetch(`https://api.${PAYPAL_CONFIG.environment === 'live' ? 'paypal.com' : 'sandbox.paypal.com'}/v1/billing/subscriptions/${subscriptionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error al obtener detalles de suscripción en PayPal: ${errorData.message || 'Error desconocido'}`);
    }

    return await response.json() as PayPalSubscriptionDetails;
  } catch (error) {
    console.error('Error al obtener detalles de suscripción en PayPal:', error);
    throw error;
  }
}