/**
 * Implementación alternativa para PayPal usando la API REST directamente
 * Este archivo proporciona funciones para interactuar con la API de PayPal
 * sin depender del SDK oficial, que puede tener problemas de compatibilidad
 */

import { PAYPAL_CONFIG, logPayPalConfig } from './paypalConfig';

// Interfaces para los productos de PayPal
interface PayPalProduct {
  id: string;
  name: string;
  description?: string;
  type?: string;
  category?: string;
  create_time?: string;
  update_time?: string;
}

interface PayPalProductListResponse {
  products: PayPalProduct[];
  total_items: number;
  total_pages: number;
}

// Registrar la configuración de PayPal al cargar el módulo
if (typeof window !== 'undefined') {
  // Solo ejecutar en el cliente para evitar problemas con SSR
  logPayPalConfig();
}

/**
 * Crear o recuperar un producto en PayPal
 * En la API v2 de PayPal, necesitamos un producto antes de crear un plan de suscripción
 */
async function getOrCreateProduct(
  name: string,
  description: string,
  accessToken: string
): Promise<string> {
  try {
    console.log(`Buscando o creando producto: ${name}`);
    
    // Intentar crear un nuevo producto
    const productData = {
      name,
      description,
      type: 'SERVICE',
      category: 'SOFTWARE',
    };
    
    const response = await fetch(`https://api.${PAYPAL_CONFIG.environment === 'live' ? 'paypal.com' : 'sandbox.paypal.com'}/v1/catalogs/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'PayPal-Request-Id': `product-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`, // ID único para evitar duplicados
      },
      body: JSON.stringify(productData),
    });
    
    // Si la creación es exitosa, devolver el ID del producto
    if (response.ok) {
      const data = await response.json();
      console.log(`Producto creado con ID: ${data.id}`);
      return data.id;
    }
    
    // Si hay un error, podría ser porque el producto ya existe
    // En ese caso, intentamos buscar el producto por nombre
    console.warn('No se pudo crear el producto, intentando buscar uno existente...');
    
    const listResponse = await fetch(`https://api.${PAYPAL_CONFIG.environment === 'live' ? 'paypal.com' : 'sandbox.paypal.com'}/v1/catalogs/products?page_size=20`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    if (listResponse.ok) {
      const listData = await listResponse.json() as PayPalProductListResponse;
      
      // Buscar un producto con el mismo nombre
      const existingProduct = listData.products?.find((product: PayPalProduct) => product.name === name);
      
      if (existingProduct) {
        console.log(`Producto existente encontrado con ID: ${existingProduct.id}`);
        return existingProduct.id;
      }
    }
    
    // Si no se encuentra ningún producto, crear uno con un nombre único
    console.warn('No se encontró ningún producto existente, creando uno con nombre único...');
    
    const uniqueProductData = {
      name: `${name}-${Date.now()}`,
      description,
      type: 'SERVICE',
      category: 'SOFTWARE',
    };
    
    const uniqueResponse = await fetch(`https://api.${PAYPAL_CONFIG.environment === 'live' ? 'paypal.com' : 'sandbox.paypal.com'}/v1/catalogs/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'PayPal-Request-Id': `product-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
      },
      body: JSON.stringify(uniqueProductData),
    });
    
    if (uniqueResponse.ok) {
      const uniqueData = await uniqueResponse.json();
      console.log(`Producto único creado con ID: ${uniqueData.id}`);
      return uniqueData.id;
    }
    
    // Si todo falla, lanzar un error
    throw new Error('No se pudo crear o encontrar un producto en PayPal');
  } catch (error) {
    console.error('Error al crear o recuperar producto en PayPal:', error);
    throw error;
  }
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
 * Crear un plan de suscripción en PayPal usando planes predefinidos
 *
 * En lugar de crear planes dinámicamente, usamos planes predefinidos
 * que ya existen en PayPal o generamos IDs predecibles.
 */
export async function createSubscriptionPlan(
  name: string,
  description: string,
  price: number,
  interval: 'MONTH' | 'YEAR' = 'MONTH'
): Promise<string> {
  try {
    console.log(`Obteniendo plan de suscripción para: ${name}, ${price}${PAYPAL_CONFIG.currency}/${interval.toLowerCase()}`);
    
    // En lugar de crear un plan en PayPal, generamos un ID predecible basado en el nombre y el precio
    // Esto evita tener que crear planes en PayPal, lo que requiere permisos adicionales
    const planId = `${name.toLowerCase().replace(/\s+/g, '-')}-${price}-${interval.toLowerCase()}`;
    
    console.log(`Usando plan ID: ${planId}`);
    
    // Simular una respuesta exitosa
    return planId;
  } catch (error) {
    console.error('Error al crear plan en PayPal:', error);
    throw error;
  }
}

/**
 * Crear una suscripción en PayPal con plan integrado
 */
export async function createSubscription(
  planId: string,
  returnUrl: string = PAYPAL_CONFIG.returnUrl,
  cancelUrl: string = PAYPAL_CONFIG.cancelUrl
): Promise<string> {
  try {
    console.log(`Creando suscripción para plan: ${planId}`);
    const accessToken = await getAccessToken();
    
    // Obtener detalles del plan para crear la suscripción
    // Extraer información del planId (formato: nombre-precio-intervalo)
    const planParts = planId.split('-');
    const planName = planParts[0].charAt(0).toUpperCase() + planParts[0].slice(1); // Capitalizar
    const planPrice = parseFloat(planParts[1]) || 9.99; // Valor predeterminado si no se puede parsear
    const planInterval = planParts[2]?.toUpperCase() || 'MONTH'; // Valor predeterminado si no existe
    
    // Crear una suscripción con el plan integrado
    const subscriptionData = {
      plan: {
        product: {
          name: `Planning Poker Pro - ${planName}`,
          description: `Plan ${planName} de Planning Poker Pro`
        },
        name: `${planName} Plan`,
        billing_cycles: [
          {
            frequency: {
              interval_unit: planInterval,
              interval_count: 1
            },
            tenure_type: 'REGULAR',
            sequence: 1,
            total_cycles: 0,
            pricing_scheme: {
              fixed_price: {
                value: planPrice.toFixed(2),
                currency_code: PAYPAL_CONFIG.currency
              }
            }
          }
        ],
        payment_preferences: {
          auto_bill_outstanding: true,
          setup_fee: {
            value: '0',
            currency_code: PAYPAL_CONFIG.currency
          },
          setup_fee_failure_action: 'CONTINUE',
          payment_failure_threshold: 3
        }
      },
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

    console.log('Enviando solicitud a PayPal para crear suscripción...');
    const response = await fetch(`https://api.${PAYPAL_CONFIG.environment === 'live' ? 'paypal.com' : 'sandbox.paypal.com'}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'PayPal-Request-Id': `subscription-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`, // ID único para evitar duplicados
      },
      body: JSON.stringify(subscriptionData),
    });

    // Registrar la respuesta completa para depuración
    let responseText;
    try {
      responseText = await response.text();
      console.log('Respuesta de PayPal:', responseText);
    } catch (e) {
      console.error('Error al leer la respuesta:', e);
      responseText = 'No se pudo leer la respuesta';
    }
    
    if (!response.ok) {
      let errorMessage = 'Error desconocido';
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorData.name || 'Error desconocido';
        console.error('Detalles del error:', JSON.stringify(errorData, null, 2));
      } catch (e) {
        console.error('No se pudo parsear la respuesta de error:', responseText);
      }
      throw new Error(`Error al crear suscripción en PayPal: ${errorMessage}`);
    }

    let data;
    try {
      data = JSON.parse(responseText) as PayPalSubscriptionResponse;
    } catch (e) {
      console.error('Error al parsear la respuesta:', e);
      throw new Error('No se pudo parsear la respuesta de PayPal');
    }
    
    const approvalLink = data.links.find(link => link.rel === 'approve');
    if (!approvalLink) {
      throw new Error('No se encontró el enlace de aprobación en la respuesta de PayPal');
    }
    
    console.log(`Enlace de aprobación generado: ${approvalLink.href}`);
    return approvalLink.href;
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