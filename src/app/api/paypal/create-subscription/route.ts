import { NextRequest, NextResponse } from 'next/server';
import { PAYPAL_CONFIG } from '@/lib/paypalConfig';

/**
 * API route para simular la creación de suscripciones en PayPal
 *
 * Esta ruta simula el proceso de creación de suscripciones sin hacer llamadas reales a PayPal.
 * Es útil para pruebas y desarrollo cuando no se tienen los permisos necesarios.
 */
export async function POST(req: NextRequest) {
  try {
    // Obtener los datos de la solicitud
    const data = await req.json();
    const { planName, planPrice, planInterval, returnUrl, cancelUrl } = data;

    if (!planName || !planPrice) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }

    console.log(`Simulando creación de suscripción para: ${planName}, ${planPrice}${PAYPAL_CONFIG.currency}/${planInterval || 'MONTH'}`);
    
    // Simular un retraso para que parezca que estamos haciendo una llamada a la API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generar un ID de suscripción simulado
    const subscriptionId = `SUB-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    console.log(`Suscripción simulada creada con ID: ${subscriptionId}`);
    
    // Construir una URL de aprobación simulada
    // Incluir información del plan y la suscripción en la URL para usarla en la página de éxito
    const actualReturnUrl = returnUrl || PAYPAL_CONFIG.returnUrl;
    
    // Normalizar el nombre del plan para que coincida con los tipos de SubscriptionPlan
    let normalizedPlanName = planName.toLowerCase();
    if (normalizedPlanName.includes('pro')) {
      normalizedPlanName = 'pro';
    } else if (normalizedPlanName.includes('enterprise')) {
      normalizedPlanName = 'enterprise';
    } else if (normalizedPlanName.includes('free')) {
      normalizedPlanName = 'free';
    }
    
    const approvalUrl = `${actualReturnUrl}?subscription_id=${subscriptionId}&plan_name=${encodeURIComponent(normalizedPlanName)}&plan_price=${planPrice}&plan_interval=${planInterval || 'MONTH'}`;
    
    console.log(`URL de aprobación simulada: ${approvalUrl}`);
    
    // Devolver el enlace de aprobación
    return NextResponse.json({
      approvalUrl,
      subscriptionId
    });
  } catch (error) {
    console.error('Error al crear suscripción en PayPal:', error);
    return NextResponse.json(
      { error: 'Error al crear suscripción en PayPal' },
      { status: 500 }
    );
  }
}