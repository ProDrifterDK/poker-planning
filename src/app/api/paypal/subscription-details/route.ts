import { NextRequest, NextResponse } from 'next/server';

/**
 * API route para simular la obtención de detalles de suscripciones en PayPal
 *
 * Esta ruta simula el proceso de obtención de detalles de suscripciones sin hacer llamadas reales a PayPal.
 * Es útil para pruebas y desarrollo cuando no se tienen los permisos necesarios.
 *
 * Puede funcionar de dos formas:
 * 1. Si se proporciona un subscription_id en la URL, devuelve los detalles de esa suscripción específica.
 * 2. Si no se proporciona un subscription_id, intenta obtener los detalles de la suscripción del usuario autenticado.
 */
export async function GET(req: NextRequest) {
  try {
    // Obtener el ID de suscripción de los parámetros de la URL
    const url = new URL(req.url);
    const subscriptionId = url.searchParams.get('subscription_id');
    
    // Si no hay un ID de suscripción en la URL, intentar obtener la suscripción del usuario actual
    // En una implementación real, esto implicaría verificar la autenticación y obtener el ID de suscripción del usuario
    // Para esta simulación, simplemente usaremos un ID predeterminado o el último ID de suscripción procesado
    const effectiveSubscriptionId = subscriptionId || 'I-6EFD92GS06Y2'; // ID de la imagen de ejemplo
    
    console.log(`Simulando obtención de detalles de suscripción: ${effectiveSubscriptionId}`);
    
    // Simular un retraso para que parezca que estamos haciendo una llamada a la API
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Crear detalles de suscripción simulados
    const subscriptionDetails = {
      id: effectiveSubscriptionId,
      status: 'ACTIVE',
      plan_id: effectiveSubscriptionId.startsWith('I-6EFD') ? 'P-42S738476L718491KM7RRM3Y' : 'P-SIMULATED-PLAN-ID',
      start_date: new Date().toISOString(),
      billing_info: {
        next_billing_time: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 días después
        last_payment: {
          amount: {
            value: effectiveSubscriptionId.startsWith('I-6EFD') ? '9.99' : '29.99'
          }
        }
      },
      subscriber: {
        email_address: 'usuario@example.com',
        name: {
          given_name: 'Usuario',
          surname: 'Ejemplo'
        }
      }
    };
    
    console.log(`Detalles de suscripción simulados: ${JSON.stringify(subscriptionDetails, null, 2)}`);
    
    // Devolver los detalles de la suscripción
    return NextResponse.json(subscriptionDetails);
  } catch (error) {
    console.error('Error al obtener detalles de suscripción en PayPal:', error);
    return NextResponse.json(
      { error: 'Error al obtener detalles de suscripción en PayPal' },
      { status: 500 }
    );
  }
}