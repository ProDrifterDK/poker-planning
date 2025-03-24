/**
 * Configuración y funciones para interactuar con la API de PayPal
 */

// Configuración de PayPal
export const PAYPAL_CONFIG = {
  clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
  clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
  environment: process.env.NODE_ENV === 'production' ? 'live' : 'sandbox',
  currency: 'USD',
  locale: 'es_CL', // Español (Chile)
  returnUrl: process.env.NEXT_PUBLIC_PAYPAL_RETURN_URL || 'http://localhost:3000/settings/subscription/success',
  cancelUrl: process.env.NEXT_PUBLIC_PAYPAL_CANCEL_URL || 'http://localhost:3000/settings/subscription/cancel',
  webhookId: process.env.PAYPAL_WEBHOOK_ID || '',
};

// Verificar que la configuración de PayPal es válida
export const isPaypalConfigValid = (): boolean => {
  return Boolean(
    PAYPAL_CONFIG.clientId &&
    PAYPAL_CONFIG.clientSecret &&
    PAYPAL_CONFIG.returnUrl &&
    PAYPAL_CONFIG.cancelUrl
  );
};

// Obtener token de acceso para la API de PayPal
export const getPaypalAccessToken = async (): Promise<string> => {
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
};

// Crear un plan de suscripción en PayPal
export const createPaypalPlan = async (
  name: string,
  description: string,
  price: number,
  interval: 'MONTH' | 'YEAR' = 'MONTH'
): Promise<string> => {
  try {
    const accessToken = await getPaypalAccessToken();
    
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
};

// Interfaces para los tipos de respuesta de PayPal
interface PayPalLink {
  href: string;
  rel: string;
  method: string;
}

interface PayPalSubscriptionResponse {
  id: string;
  status: string;
  links: PayPalLink[];
}

interface PayPalSubscriptionDetails {
  id: string;
  status: string;
  plan_id: string;
  start_date: string;
  billing_info: {
    next_billing_time: string;
    last_payment: {
      amount: {
        value: string;
      };
    };
  };
  subscriber: {
    email_address: string;
    name: {
      given_name: string;
      surname: string;
    };
  };
}

// Crear un acuerdo de suscripción en PayPal
export const createPaypalSubscription = async (
  planId: string,
  startDate: Date = new Date(Date.now() + 24 * 60 * 60 * 1000) // Comienza en 24 horas
): Promise<string> => {
  try {
    const accessToken = await getPaypalAccessToken();
    
    const agreementData = {
      name: 'Suscripción a Planning Poker Pro',
      description: 'Suscripción mensual a Planning Poker Pro',
      start_date: startDate.toISOString(),
      plan: {
        id: planId,
      },
      payer: {
        payment_method: 'paypal',
      },
    };

    const response = await fetch(`https://api.${PAYPAL_CONFIG.environment === 'live' ? 'paypal.com' : 'sandbox.paypal.com'}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(agreementData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error al crear suscripción en PayPal: ${errorData.message || 'Error desconocido'}`);
    }

    const data = await response.json() as PayPalSubscriptionResponse;
    return data.links.find((link) => link.rel === 'approval_url')?.href || '';
  } catch (error) {
    console.error('Error al crear suscripción en PayPal:', error);
    throw error;
  }
};

// Ejecutar un acuerdo de suscripción en PayPal
export const executePaypalSubscription = async (
  token: string
): Promise<{ subscriptionId: string; payerId: string }> => {
  try {
    const accessToken = await getPaypalAccessToken();
    
    const response = await fetch(`https://api.${PAYPAL_CONFIG.environment === 'live' ? 'paypal.com' : 'sandbox.paypal.com'}/v1/billing/subscriptions/${token}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error al ejecutar suscripción en PayPal: ${errorData.message || 'Error desconocido'}`);
    }

    const data = await response.json();
    return {
      subscriptionId: data.id,
      payerId: data.payer.payer_info.payer_id,
    };
  } catch (error) {
    console.error('Error al ejecutar suscripción en PayPal:', error);
    throw error;
  }
};

// Cancelar una suscripción en PayPal
export const cancelPaypalSubscription = async (
  subscriptionId: string,
  reason: string = 'Cancelado por el usuario'
): Promise<boolean> => {
  try {
    const accessToken = await getPaypalAccessToken();
    
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
};

// Obtener detalles de una suscripción en PayPal
export const getPaypalSubscriptionDetails = async (
  subscriptionId: string
): Promise<PayPalSubscriptionDetails> => {
  try {
    const accessToken = await getPaypalAccessToken();
    
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
};