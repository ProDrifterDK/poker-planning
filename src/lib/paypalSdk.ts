/**
 * Implementación de PayPal usando el SDK oficial
 * Este archivo proporciona funciones para interactuar con la API de PayPal
 * utilizando el SDK oficial de PayPal para Node.js
 */

import { PAYPAL_CONFIG, logPayPalConfig } from './paypalConfig';

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

// Registrar la configuración de PayPal al cargar el módulo
if (typeof window !== 'undefined') {
  // Solo ejecutar en el cliente para evitar problemas con SSR
  logPayPalConfig();
}

// Mapeo de planes internos a IDs de planes reales de PayPal
// Estos IDs fueron creados con el script scripts/create-paypal-plans.js
const PAYPAL_PLAN_IDS: Record<string, string> = {
  // Plan Pro
  'pro-month': 'P-9A328530RT196135VM7YIXKQ',     // Pro Plan - Monthly - $9.99
  'pro-year': 'P-6SB704566L0364918M7YIXKY',      // Pro Plan - Annual - $99.99
  
  // Plan Enterprise
  'enterprise-month': 'P-5V974677RP9328647M7YIXKY',  // Enterprise Plan - Monthly - $29.99
  'enterprise-year': 'P-8CL99754V12387622M7YIXLA',   // Enterprise Plan - Annual - $299.99
};

/**
 * Obtener el ID de un plan de PayPal
 *
 * Esta función devuelve el ID de un plan de PayPal basado en el nombre y el intervalo.
 * Los planes deben estar previamente creados en el Dashboard de PayPal.
 */
export async function getPayPalPlanId(
  name: string,
  interval: 'MONTH' | 'YEAR' = 'MONTH'
): Promise<string> {
  try {
    const normalizedName = name.toLowerCase().replace(/\s+/g, '-');
    const normalizedInterval = interval.toLowerCase();
    const key = `${normalizedName}-${normalizedInterval}`;
    
    console.log(`Buscando plan PayPal con clave: ${key}`);
    
    const planId = PAYPAL_PLAN_IDS[key];
    
    if (!planId) {
      throw new Error(`No se encontró un plan_id para ${key}. Verifica que el plan exista en PayPal.`);
    }
    
    console.log(`ID del plan PayPal encontrado: ${planId}`);
    
    return planId;
  } catch (error) {
    console.error('Error al obtener ID de plan de PayPal:', error);
    throw error;
  }
}

/**
 * Crear una suscripción en PayPal usando la API interna
 *
 * Esta función llama a nuestra API interna que maneja la creación de suscripciones en PayPal.
 * La API interna puede usar el SDK oficial de PayPal o simular el proceso según sea necesario.
 */
export async function createSubscription(
  planId: string,
  returnUrl: string = PAYPAL_CONFIG.returnUrl,
  cancelUrl: string = PAYPAL_CONFIG.cancelUrl
): Promise<string> {
  try {
    console.log(`Creando suscripción para plan: ${planId}`);
    
    // Extraer información del planId (formato: nombre-precio-intervalo-timestamp)
    const planParts = planId.split('-');
    const planName = planParts[0].charAt(0).toUpperCase() + planParts[0].slice(1); // Capitalizar
    const planPrice = parseFloat(planParts[1]) || 9.99; // Valor predeterminado si no se puede parsear
    const planInterval = planParts[2]?.toUpperCase() || 'MONTH'; // Valor predeterminado si no existe
    
    console.log(`Plan: ${planName}, Precio: ${planPrice}, Intervalo: ${planInterval}`);
    
    // Llamar a nuestra API interna para crear la suscripción
    const response = await fetch('/api/paypal/create-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        planName,
        planPrice,
        planInterval,
        returnUrl,
        cancelUrl,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error al crear suscripción: ${errorData.error || 'Error desconocido'}`);
    }
    
    const data = await response.json();
    console.log(`Suscripción creada con ID: ${data.subscriptionId}`);
    console.log(`URL de aprobación: ${data.approvalUrl}`);
    
    return data.approvalUrl;
  } catch (error) {
    console.error('Error al crear suscripción en PayPal:', error);
    throw error;
  }
}

/**
 * Ejecutar una suscripción después de la aprobación del usuario
 *
 * Esta función llama a nuestra API interna que maneja la ejecución de suscripciones en PayPal.
 */
export async function executeSubscription(
  subscriptionId: string,
  userId?: string,
  plan?: string
): Promise<PayPalSubscriptionDetails> {
  try {
    console.log(`Ejecutando suscripción: ${subscriptionId} para usuario: ${userId || 'anónimo'} con plan: ${plan || 'no especificado'}`);
    
    // Llamar a nuestra API interna para ejecutar la suscripción
    const response = await fetch('/api/paypal/execute-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscriptionId,
        userId,
        plan
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error al ejecutar suscripción: ${errorData.error || 'Error desconocido'}`);
    }
    
    const data = await response.json() as PayPalSubscriptionDetails;
    console.log(`Suscripción ejecutada: ${JSON.stringify(data, null, 2)}`);
    
    return data;
  } catch (error) {
    console.error('Error al ejecutar suscripción en PayPal:', error);
    throw error;
  }
}

/**
 * Obtener detalles de una suscripción
 *
 * Esta función llama a nuestra API interna que maneja la obtención de detalles de suscripciones en PayPal.
 */
export async function getSubscriptionDetails(
  subscriptionId: string
): Promise<PayPalSubscriptionDetails> {
  try {
    console.log(`Obteniendo detalles de suscripción: ${subscriptionId}`);
    
    // Llamar a nuestra API interna para obtener los detalles de la suscripción
    const response = await fetch(`/api/paypal/subscription-details?subscription_id=${encodeURIComponent(subscriptionId)}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error al obtener detalles de suscripción: ${errorData.error || 'Error desconocido'}`);
    }
    
    const data = await response.json() as PayPalSubscriptionDetails;
    console.log(`Detalles de suscripción obtenidos: ${JSON.stringify(data, null, 2)}`);
    
    return data;
  } catch (error) {
    console.error('Error al obtener detalles de suscripción en PayPal:', error);
    throw error;
  }
}

/**
 * Cancelar una suscripción
 *
 * Esta función llama a nuestra API interna que maneja la cancelación de suscripciones en PayPal.
 */
export async function cancelSubscription(
  subscriptionId: string,
  reason: string = 'Cancelado por el usuario'
): Promise<boolean> {
  try {
    console.log(`Cancelando suscripción: ${subscriptionId}`);
    console.log(`Razón: ${reason}`);
    
    // Llamar a nuestra API interna para cancelar la suscripción
    const response = await fetch('/api/paypal/cancel-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscriptionId,
        reason,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error al cancelar suscripción: ${errorData.error || 'Error desconocido'}`);
    }
    
    const data = await response.json();
    console.log(`Suscripción cancelada: ${subscriptionId}`);
    
    return data.success;
  } catch (error) {
    console.error('Error al cancelar suscripción en PayPal:', error);
    throw error;
  }
}