import { NextRequest, NextResponse } from 'next/server';
import { findSubscriptionByPayPalIdAdmin, updateSubscriptionStatusAdmin } from '@/lib/firebaseAdmin';

/**
 * Endpoint para recibir webhooks de PayPal
 * URL: /api/webhooks/paypal
 */
export async function POST(request: NextRequest) {
  try {
    // Obtener el evento de PayPal
    const event = await request.json();
    
    console.log('Webhook de PayPal recibido:', event.event_type);
    
    // Verificar la autenticidad del webhook (implementación simplificada)
    // En producción, debes verificar la firma del webhook
    
    // Procesar el evento según su tipo
    switch (event.event_type) {
      case 'BILLING.SUBSCRIPTION.CREATED':
        // Manejar creación de suscripción
        console.log('Suscripción creada:', event.resource.id);
        // Nota: La creación de suscripciones generalmente se maneja en el flujo de checkout,
        // pero podemos verificar y actualizar si es necesario
        const createdSubscription = await findSubscriptionByPayPalIdAdmin(event.resource.id);
        if (createdSubscription) {
          await updateSubscriptionStatusAdmin(createdSubscription.id, 'active', 'Created by PayPal webhook');
        }
        break;
        
      case 'BILLING.SUBSCRIPTION.UPDATED':
        // Manejar actualización de suscripción
        console.log('Suscripción actualizada:', event.resource.id);
        const updatedSubscription = await findSubscriptionByPayPalIdAdmin(event.resource.id);
        if (updatedSubscription) {
          await updateSubscriptionStatusAdmin(updatedSubscription.id, 'active', 'Updated by PayPal webhook');
        }
        break;
        
      case 'BILLING.SUBSCRIPTION.CANCELLED':
        // Manejar cancelación de suscripción
        console.log('Suscripción cancelada:', event.resource.id);
        const cancelledSubscription = await findSubscriptionByPayPalIdAdmin(event.resource.id);
        if (cancelledSubscription) {
          await updateSubscriptionStatusAdmin(cancelledSubscription.id, 'cancelled', 'Cancelled by PayPal webhook');
        }
        break;
        
      case 'BILLING.SUBSCRIPTION.SUSPENDED':
        // Manejar suspensión de suscripción
        console.log('Suscripción suspendida:', event.resource.id);
        const suspendedSubscription = await findSubscriptionByPayPalIdAdmin(event.resource.id);
        if (suspendedSubscription) {
          await updateSubscriptionStatusAdmin(suspendedSubscription.id, 'expired', 'Suspended by PayPal webhook');
        }
        break;
        
      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
        // Manejar fallo de pago
        console.log('Pago fallido para suscripción:', event.resource.id);
        const failedSubscription = await findSubscriptionByPayPalIdAdmin(event.resource.id);
        if (failedSubscription) {
          await updateSubscriptionStatusAdmin(failedSubscription.id, 'failed', 'Payment failed');
        }
        break;
        
      case 'PAYMENT.SALE.COMPLETED':
        // Manejar pago completado
        console.log('Pago completado:', event.resource.id);
        break;
        
      default:
        console.log('Evento no manejado:', event.event_type);
    }
    
    // Responder a PayPal con éxito
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Error al procesar webhook de PayPal:', error);
    return NextResponse.json({ error: 'Error al procesar webhook' }, { status: 500 });
  }
}