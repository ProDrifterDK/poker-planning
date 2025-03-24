import React, { useState } from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  Button, 
  Chip, 
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress
} from '@mui/material';
import { UserSubscription, SubscriptionPlan, SUBSCRIPTION_PLANS } from '@/types/subscription';
import { useSubscriptionStore } from '@/store/subscriptionStore';

interface CurrentSubscriptionProps {
  subscription: UserSubscription;
}

export default function CurrentSubscription({ subscription }: CurrentSubscriptionProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  const { cancelCurrentSubscription } = useSubscriptionStore();
  
  // Formatear fechas
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Traducir estado de suscripción
  const translateStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      'active': 'Activo',
      'cancelled': 'Cancelado',
      'expired': 'Expirado',
      'pending': 'Pendiente',
      'suspended': 'Suspendido'
    };
    
    return statusMap[status.toLowerCase()] || status;
  };
  
  // Obtener detalles del plan
  const planDetails = SUBSCRIPTION_PLANS[subscription.plan];
  
  // Calcular días restantes
  const calculateRemainingDays = () => {
    const endDate = new Date(subscription.endDate);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };
  
  const remainingDays = calculateRemainingDays();
  
  // Manejar cancelación de suscripción
  const handleCancelSubscription = async () => {
    setProcessing(true);
    setConfirmOpen(false);
    
    try {
      await cancelCurrentSubscription();
    } catch (error) {
      console.error('Error al cancelar suscripción:', error);
    } finally {
      setProcessing(false);
    }
  };
  
  return (
    <>
      <Paper sx={{ p: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Box display="flex" alignItems="center" mb={2}>
              <Typography variant="h6" component="h3">
                Plan {planDetails.name}
              </Typography>
              <Chip
                label={translateStatus(subscription.status)}
                color={subscription.status === 'active' ? 'success' : 'default'}
                size="small"
                sx={{ ml: 2 }}
              />
            </Box>
            
            <Typography variant="body1" paragraph>
              <strong>Precio:</strong> {planDetails.price === 0 ? 'Gratis' : `$${planDetails.price.toFixed(2)}/mes`}
            </Typography>
            
            {/* Mostrar detalles adicionales solo para planes de pago */}
            {subscription.plan !== SubscriptionPlan.FREE && (
              <>
                <Typography variant="body1" paragraph>
                  <strong>Fecha de inicio:</strong> {formatDate(subscription.startDate)}
                </Typography>
                
                <Typography variant="body1" paragraph>
                  <strong>Fecha de renovación:</strong> {formatDate(subscription.endDate)}
                </Typography>
                
                <Typography variant="body1" paragraph>
                  <strong>Renovación automática:</strong> {subscription.autoRenew ? 'Activada' : 'Desactivada'}
                </Typography>
                
                <Typography variant="body1" paragraph>
                  <strong>Método de pago:</strong> {subscription.paymentMethod === 'paypal' ? 'PayPal' : 'Tarjeta de crédito'}
                </Typography>
              </>
            )}
          </Grid>
          
          <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            {subscription.plan !== SubscriptionPlan.FREE && (
              <>
                <Typography variant="h5" color="primary" gutterBottom>
                  {remainingDays} días restantes
                </Typography>
                
                <Button 
                  variant="outlined" 
                  color="error"
                  onClick={() => setConfirmOpen(true)}
                  disabled={processing}
                  sx={{ mt: 2 }}
                >
                  {processing ? <CircularProgress size={24} /> : 'Cancelar suscripción'}
                </Button>
              </>
            )}
          </Grid>
        </Grid>
      </Paper>
      
      {/* Diálogo de confirmación para cancelar suscripción */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
      >
        <DialogTitle>Confirmar cancelación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas cancelar tu suscripción? 
            Perderás acceso a todas las funciones premium al final del período actual.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} color="primary">
            Volver
          </Button>
          <Button onClick={handleCancelSubscription} color="error">
            Cancelar suscripción
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}