import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { PAYPAL_CONFIG } from '@/lib/paypalConfig';

const PayPalTest: React.FC = () => {
  const paypalButtonRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Función para cargar el script de PayPal
    const loadPayPalScript = async () => {
      try {
        console.log('Cargando script de PayPal para prueba...');
        console.log('Client ID:', PAYPAL_CONFIG.clientId);
        
        // Limpiar cualquier script previo de PayPal
        const existingScript = document.querySelector('script[src*="paypal.com/sdk/js"]');
        if (existingScript) {
          document.body.removeChild(existingScript);
        }
        
        // Crear y cargar el nuevo script
        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CONFIG.clientId}&currency=USD`;
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
        setLoading(false);
        
        // Añadir un pequeño retraso para asegurar que el DOM esté listo
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('Verificando contenedor PayPal:', paypalButtonRef.current ? 'Existe' : 'No existe');
        
        // Renderizar el botón de PayPal
        if (window.paypal && paypalButtonRef.current) {
          // Limpiar el contenedor antes de renderizar
          paypalButtonRef.current.innerHTML = '';
          
          console.log('Renderizando botón de PayPal básico...');
          
          try {
            // Renderizar un botón de PayPal básico
            window.paypal.Buttons({
              // Configuración básica para un botón de pago simple
              createOrder: function(data, actions) {
                console.log('Creando orden de prueba...');
                return actions.order.create({
                  purchase_units: [{
                    amount: {
                      value: '0.01'
                    }
                  }]
                });
              },
              onApprove: function(data, actions) {
                console.log('Orden aprobada:', data);
                return actions.order.capture().then(function(details) {
                  console.log('Captura completada:', details);
                  alert('Transacción completada por ' + details.payer.name.given_name);
                });
              },
              onError: function(err) {
                console.error('Error en PayPal:', err);
                setError('Error al procesar el pago con PayPal');
              }
            }).render(paypalButtonRef.current);
          } catch (renderError) {
            console.error('Error al renderizar botón de PayPal:', renderError);
            setError('Error al renderizar botón de PayPal: ' + (renderError instanceof Error ? renderError.message : String(renderError)));
          }
        } else {
          throw new Error('PayPal no está disponible o el contenedor no existe');
        }
      } catch (error) {
        console.error('Error al configurar PayPal:', error);
        setLoading(false);
        setError(error instanceof Error ? error.message : 'Error al cargar el botón de PayPal');
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
  }, []);
  
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
  
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Prueba de PayPal</Typography>
      <div ref={paypalButtonRef} />
    </Box>
  );
};

export default PayPalTest;