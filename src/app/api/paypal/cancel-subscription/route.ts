import { NextRequest, NextResponse } from 'next/server';

/**
 * API route para simular la cancelación de suscripciones en PayPal
 * 
 * Esta ruta simula el proceso de cancelación de suscripciones sin hacer llamadas reales a PayPal.
 * Es útil para pruebas y desarrollo cuando no se tienen los permisos necesarios.
 */
export async function POST(req: NextRequest) {
  try {
    // Obtener los datos de la solicitud
    const data = await req.json();
    const { subscriptionId, reason } = data;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Falta el ID de suscripción' },
        { status: 400 }
      );
    }

    console.log(`Simulando cancelación de suscripción: ${subscriptionId}`);
    console.log(`Razón: ${reason || 'No especificada'}`);
    
    // Simular un retraso para que parezca que estamos haciendo una llamada a la API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log(`Suscripción simulada cancelada: ${subscriptionId}`);
    
    // Devolver éxito
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al cancelar suscripción en PayPal:', error);
    return NextResponse.json(
      { error: 'Error al cancelar suscripción en PayPal' },
      { status: 500 }
    );
  }
}