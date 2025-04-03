import React, { useEffect, useRef } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { PAYPAL_CONFIG } from '@/lib/paypalConfig';
import { SubscriptionPlan, SUBSCRIPTION_PLANS } from '@/types/subscription';
// Los tipos ahora están definidos en src/types/paypal.d.ts

interface PayPalSubscriptionButtonProps {
  plan: SubscriptionPlan;
  onSuccess: (subscriptionId: string) => void;
  onError?: (error: Error) => void;
}

const PayPalSubscriptionButton: React.FC<PayPalSubscriptionButtonProps> = ({ 
  plan, 
  onSuccess,
  onError 
}) => {
  const paypalButtonRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  useEffect(() => {
    // Función para cargar el script de PayPal
    const loadPayPalScript = async () => {
      try {
        console.log('Iniciando carga del script de PayPal...');
        
        // Verificar si el contenedor existe
        if (!paypalButtonRef.current) {
          console.error('El contenedor para el botón de PayPal no existe');
          throw new Error('El contenedor para el botón de PayPal no existe');
        }
        
        // Limpiar cualquier script previo de PayPal
        const existingScript = document.querySelector('script[src*="paypal.com/sdk/js"]');
        if (existingScript) {
          console.log('Eliminando script de PayPal existente');
          document.body.removeChild(existingScript);
        }
        
        // Crear y cargar el nuevo script
        const script = document.createElement('script');
        // Asegurarse de que el clientId no esté vacío
        if (!PAYPAL_CONFIG.clientId) {
          throw new Error('PayPal Client ID no configurado');
        }
        
        console.log('Configurando script de PayPal con Client ID:', PAYPAL_CONFIG.clientId);
        
        // Configurar el script con los parámetros necesarios
        script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CONFIG.clientId}&vault=true&intent=subscription&currency=USD`;
        script.async = true;
        
        // Promesa para esperar a que el script se cargue
        const scriptLoaded = new Promise<void>((resolve, reject) => {
          script.onload = () => {
            console.log('Script de PayPal cargado correctamente');
            resolve();
          };
          script.onerror = (e) => {
            console.error('Error al cargar el script de PayPal:', e);
            reject(new Error('Error al cargar el script de PayPal'));
          };
        });
        
        // Añadir el script al documento
        document.body.appendChild(script);
        
        // Esperar a que el script se cargue
        await scriptLoaded;
        
        // Añadir un pequeño retraso para asegurar que PayPal se inicialice completamente
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setLoading(false);
        
        // Verificar nuevamente si PayPal y el contenedor están disponibles
        if (!window.paypal) {
          console.error('PayPal no está disponible después de cargar el script');
          throw new Error('PayPal no está disponible después de cargar el script');
        }
        
        if (!paypalButtonRef.current) {
          console.error('El contenedor para el botón de PayPal no existe después de cargar el script');
          throw new Error('El contenedor para el botón de PayPal no existe después de cargar el script');
        }
        
        // Limpiar el contenedor antes de renderizar
        paypalButtonRef.current.innerHTML = '';
        
        console.log('Renderizando botón de PayPal...');
        
        // Renderizar el botón de PayPal
        window.paypal?.Buttons({
          style: {
            shape: 'rect',
            color: 'gold',
            layout: 'vertical',
            label: 'subscribe'
          },
          createSubscription: (data: unknown, actions: PayPalSubscriptionActions) => {
            console.log('Creando suscripción en PayPal para plan:', plan);
            
            // Usar los IDs de planes reales de PayPal
            const PAYPAL_PLAN_IDS: Record<string, string> = {
              [SubscriptionPlan.PRO]: 'P-42S738476L718491KM7RRM3Y',     // Pro Plan - Monthly - $9.99
              [SubscriptionPlan.ENTERPRISE]: 'P-0PR63221X9356841PM7RRM4A'  // Enterprise Plan - Monthly - $29.99
            };
            
            // Obtener el ID del plan correspondiente
            const planId = PAYPAL_PLAN_IDS[plan as string];
            
            if (!planId) {
              console.error(`No se encontró un plan_id para ${plan}`);
              throw new Error(`Plan no configurado: ${plan}`);
            }
            
            console.log(`Usando plan_id real: ${planId}`);
            
            return actions.subscription.create({
              'plan_id': planId,
              'application_context': {
                'shipping_preference': 'NO_SHIPPING',
                'user_action': 'SUBSCRIBE_NOW',
                'return_url': PAYPAL_CONFIG.returnUrl,
                'cancel_url': PAYPAL_CONFIG.cancelUrl
              }
            });
          },
          onApprove: (data: PayPalSubscriptionData) => {
            console.log('Suscripción aprobada:', data);
            // Llamar al callback de éxito con el ID de la suscripción
            onSuccess(data.subscriptionID);
          },
          onError: (err: Error) => {
            console.error('Error en PayPal:', err);
            setError('Error al procesar el pago con PayPal');
            if (onError) onError(err);
          },
          onCancel: () => {
            console.log('Suscripción cancelada por el usuario');
            setError('La suscripción fue cancelada');
          }
        } as PayPalSubscriptionButtonOptions).render(paypalButtonRef.current);
      } catch (error) {
        console.error('Error al configurar PayPal:', error);
        setLoading(false);
        setError(error instanceof Error ? error.message : 'Error al cargar el botón de PayPal');
        if (onError && error instanceof Error) onError(error);
      }
    };
    
    // Cargar el script de PayPal
    loadPayPalScript();
    
    // Limpiar cuando el componente se desmonte
    return () => {
      const existingScript = document.querySelector('script[src*="paypal.com/sdk/js"]');
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, [plan, onSuccess, onError]);
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 100 }}>
        <CircularProgress size={30} />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ textAlign: 'center', color: 'error.main', p: 2 }}>
        <Typography variant="body2">{error}</Typography>
      </Box>
    );
  }
  
  return <div ref={paypalButtonRef} />;
};

export default PayPalSubscriptionButton;