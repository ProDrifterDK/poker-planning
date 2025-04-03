import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Box,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { PlanDetails, SubscriptionPlan } from '@/types/subscription';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import PayPalSubscriptionButton from './PayPalSubscriptionButton';
import PayPalTest from './PayPalTest';

interface PlanCardProps {
  plan: PlanDetails;
  isCurrentPlan: boolean;
  userId: string;
}

export default function PlanCard({ plan, isCurrentPlan, userId }: PlanCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showPayPalButton, setShowPayPalButton] = useState(false);

  const { subscribeToPlan, cancelCurrentSubscription, fetchUserSubscription } = useSubscriptionStore();

  // Manejar suscripción a un plan
  const handleSubscribe = async () => {
    setProcessing(true);

    try {
      // Si es el plan actual, no hacer nada
      if (isCurrentPlan) {
        return;
      }

      // Si es plan gratuito, confirmar downgrade
      if (plan.id === SubscriptionPlan.FREE && !isCurrentPlan) {
        setConfirmOpen(true);
        setProcessing(false);
        return;
      }

      // Para planes de pago, mostrar el botón de PayPal
      setShowPayPalButton(true);
      setProcessing(false);
    } catch (error) {
      console.error('Error al suscribirse:', error);
      setProcessing(false);
    }
  };

  // Manejar éxito de suscripción con PayPal
  const handlePayPalSuccess = async (subscriptionId: string) => {
    setProcessing(true);
    try {
      // Crear suscripción en nuestra base de datos
      await subscribeToPlan(userId, plan.id, subscriptionId);
      // Redirigir a la página de éxito con indicador de que viene del SDK de PayPal
      window.location.href = `/settings/subscription/success?subscription_id=${subscriptionId}&plan_name=${plan.name}&plan_price=${plan.price}&plan_interval=MONTH&from_paypal_sdk=true`;
    } catch (error) {
      console.error('Error al procesar suscripción de PayPal:', error);
      setProcessing(false);
      setShowPayPalButton(false);
    }
  };

  // Manejar downgrade a plan gratuito
  const handleDowngradeConfirm = async () => {
    setProcessing(true);
    setConfirmOpen(false);

    try {
      // Suscribirse directamente al plan gratuito
      await subscribeToPlan(userId, SubscriptionPlan.FREE);
      
      // Forzar una recarga de la suscripción para actualizar la interfaz
      await fetchUserSubscription(userId);
      
      console.log('Suscripción actualizada a plan gratuito');
    } catch (error) {
      console.error('Error al hacer downgrade:', error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          border: isCurrentPlan ? '2px solid' : 'none',
          borderColor: isCurrentPlan ? 'primary.main' : 'transparent',
          position: 'relative'
        }}
      >
        {isCurrentPlan && (
          <Chip
            label="Plan Actual"
            color="primary"
            sx={{
              position: 'absolute',
              top: 10,
              right: 10
            }}
          />
        )}

        <CardContent sx={{ flexGrow: 1 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            {plan.name}
          </Typography>

          <Typography variant="body2" color="text.secondary" paragraph>
            {plan.description}
          </Typography>

          <Typography variant="h4" color="primary" gutterBottom>
            {plan.price === 0 ? 'Gratis' : `$${plan.price.toFixed(2)}/mes`}
          </Typography>

          <List dense>
            <ListItem>
              <ListItemIcon>
                <CheckIcon color="success" />
              </ListItemIcon>
              <ListItemText
                primary={`Hasta ${plan.features.maxParticipants} participantes por sala`}
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <CheckIcon color="success" />
              </ListItemIcon>
              <ListItemText
                primary={`${plan.features.maxActiveRooms} ${plan.features.maxActiveRooms === 1 ? 'sala activa' : 'salas activas'}`}
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                {plan.features.exportData ? <CheckIcon color="success" /> : <CloseIcon color="error" />}
              </ListItemIcon>
              <ListItemText primary="Exportación de datos" />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                {plan.features.advancedStats ? <CheckIcon color="success" /> : <CloseIcon color="error" />}
              </ListItemIcon>
              <ListItemText primary="Estadísticas avanzadas" />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                {plan.features.timer ? <CheckIcon color="success" /> : <CloseIcon color="error" />}
              </ListItemIcon>
              <ListItemText primary="Temporizador para votaciones" />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                {plan.features.fullHistory ? <CheckIcon color="success" /> : <CloseIcon color="error" />}
              </ListItemIcon>
              <ListItemText primary="Historial completo" />
            </ListItem>

            {plan.id === SubscriptionPlan.ENTERPRISE && (
              <>
                <ListItem>
                  <ListItemIcon>
                    <CheckIcon color="success" />
                  </ListItemIcon>
                  <ListItemText primary="Integraciones con Jira, Trello, GitHub" />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <CheckIcon color="success" />
                  </ListItemIcon>
                  <ListItemText primary="Personalización de marca" />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <CheckIcon color="success" />
                  </ListItemIcon>
                  <ListItemText primary="Soporte prioritario" />
                </ListItem>
              </>
            )}
          </List>
        </CardContent>

        <CardActions>
          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', p: 1, flexDirection: 'column' }}>
            {showPayPalButton && plan.price > 0 ? (
              // Mostrar botón de PayPal para suscripción directa
              <Box sx={{ width: '100%', mb: 2 }}>
                <Box sx={{ mb: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    href={plan.id === SubscriptionPlan.PRO
                      ? '/paypal-pro-subscription.html'
                      : '/paypal-enterprise-subscription.html'}
                    target="_blank"
                    fullWidth
                  >
                    Pagar con PayPal
                  </Button>
                </Box>

                <Button
                  variant="text"
                  color="primary"
                  onClick={() => setShowPayPalButton(false)}
                  fullWidth
                >
                  Cancelar
                </Button>
              </Box>
            ) : (
              // Mostrar botón normal
              <Button
                variant={isCurrentPlan ? "outlined" : "contained"}
                color={isCurrentPlan ? "primary" : "primary"}
                fullWidth
                onClick={handleSubscribe}
                disabled={processing || isCurrentPlan}
              >
                {processing ? (
                  <CircularProgress size={24} />
                ) : isCurrentPlan ? (
                  'Plan Actual'
                ) : plan.price === 0 ? (
                  'Usar Plan Gratuito'
                ) : (
                  'Suscribirse'
                )}
              </Button>
            )}
          </Box>
        </CardActions>
      </Card>

      {/* Diálogo de confirmación para downgrade */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
      >
        <DialogTitle>Confirmar cambio a plan gratuito</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Al cambiar a un plan gratuito, perderás acceso a todas las funciones premium inmediatamente.
            ¿Estás seguro de que deseas continuar?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} color="primary">
            Cancelar
          </Button>
          <Button onClick={handleDowngradeConfirm} color="error">
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}