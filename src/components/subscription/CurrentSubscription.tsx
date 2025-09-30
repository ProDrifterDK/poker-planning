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
import { UserSubscription, SubscriptionPlan, getLocalizedSubscriptionPlans } from '@/types/subscription';
import { getPlanLookupKey } from '@/utils/planUtils';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useTranslation } from 'react-i18next';
import { useParams } from 'next/navigation';

interface CurrentSubscriptionProps {
  subscription: UserSubscription;
}

export default function CurrentSubscription({ subscription }: CurrentSubscriptionProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const { t } = useTranslation('common');
  const params = useParams();
  const { lang } = params as { lang: string };
  
  const { cancelCurrentSubscription } = useSubscriptionStore();
  const localizedPlans = getLocalizedSubscriptionPlans(lang as string);
  
  // Formatear fechas
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(lang === 'es' ? 'es-CL' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Traducir estado de suscripción
  const translateStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      'active': t('subscription.statusActive', 'Activo'),
      'cancelled': t('subscription.statusCancelled', 'Cancelado'),
      'expired': t('subscription.statusExpired', 'Expirado'),
      'pending': t('subscription.statusPending', 'Pendiente'),
      'suspended': t('subscription.statusSuspended', 'Suspendido')
    };
    
    return statusMap[status.toLowerCase()] || status;
  };
  
  // Obtener detalles del plan
  const planLookupKey = getPlanLookupKey(subscription.plan);
  const planDetails = localizedPlans[planLookupKey];
  
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
      console.error(t('subscription.cancelError', 'Error al cancelar suscripción:'), error);
    } finally {
      setProcessing(false);
    }
  };
  
  return (
    <>
      <Paper sx={{ p: 3, backgroundColor: 'background.paper' }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Box display="flex" alignItems="center" mb={2}>
              <Typography variant="h6" component="h3">
                {t('subscription.planPrefix', 'Plan')} {planDetails.name}
              </Typography>
              <Chip
                label={translateStatus(subscription.status)}
                color={subscription.status === 'active' ? 'success' : 'default'}
                size="small"
                sx={{ ml: 2 }}
              />
            </Box>
            
            <Typography variant="body1" paragraph>
              <strong>{t('subscription.price', 'Precio')}:</strong> {planDetails.price === 0
                ? t('subscription.free', 'Gratis')
                : t('subscription.pricePerMonth', '${{price}}/mes', { price: planDetails.price.toFixed(2) })}
            </Typography>
            
            {/* Mostrar detalles adicionales solo para planes de pago */}
            {subscription.plan !== SubscriptionPlan.FREE && (
              <>
                <Typography variant="body1" paragraph>
                  <strong>{t('subscription.startDate', 'Fecha de inicio')}:</strong> {formatDate(subscription.startDate)}
                </Typography>
                
                <Typography variant="body1" paragraph>
                  <strong>{t('subscription.renewalDate', 'Fecha de renovación')}:</strong> {formatDate(subscription.endDate)}
                </Typography>
                
                <Typography variant="body1" paragraph>
                  <strong>{t('subscription.autoRenewal', 'Renovación automática')}:</strong> {subscription.autoRenew
                    ? t('subscription.enabled', 'Activada')
                    : t('subscription.disabled', 'Desactivada')}
                </Typography>
                
                <Typography variant="body1" paragraph>
                  <strong>{t('subscription.paymentMethod', 'Método de pago')}:</strong> {subscription.paymentMethod === 'paypal'
                    ? 'PayPal'
                    : t('subscription.creditCard', 'Tarjeta de crédito')}
                </Typography>
              </>
            )}
          </Grid>
          
          <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            {subscription.plan !== SubscriptionPlan.FREE && (
              <>
                <Typography variant="h5" color="primary" gutterBottom>
                  {t('subscription.daysRemaining', '{{days}} días restantes', { days: remainingDays })}
                </Typography>
                
                <Button 
                  variant="outlined" 
                  color="error"
                  onClick={() => setConfirmOpen(true)}
                  disabled={processing}
                  sx={{ mt: 2 }}
                >
                  {processing ? <CircularProgress size={24} /> : t('subscription.cancelSubscription', 'Cancelar suscripción')}
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
        <DialogTitle>{t('subscription.confirmCancellation', 'Confirmar cancelación')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('subscription.cancellationWarning', '¿Estás seguro de que deseas cancelar tu suscripción? Perderás acceso a todas las funciones premium al final del período actual.')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} color="primary">
            {t('subscription.back', 'Volver')}
          </Button>
          <Button onClick={handleCancelSubscription} color="error">
            {t('subscription.cancelSubscription', 'Cancelar suscripción')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}