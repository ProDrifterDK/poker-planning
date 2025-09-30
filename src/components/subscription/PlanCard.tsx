import React, { useState, useEffect } from 'react';
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
  DialogActions,
  useTheme
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { PlanDetails, SubscriptionPlan, BillingInterval, getLocalizedSubscriptionPlans } from '@/types/subscription';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import PayPalSubscriptionButton from './PayPalSubscriptionButton';
import PayPalTest from './PayPalTest';
import { useTranslation } from 'react-i18next';
import { useParams } from 'next/navigation';
import { useThemeMode } from '@/context/themeContext';

interface PlanCardProps {
  plan: PlanDetails;
  planKey?: string; // Clave para identificar el plan (ej: "pro-month")
  isCurrentPlan: boolean;
  userId: string;
}

export default function PlanCard({ plan: initialPlan, planKey, isCurrentPlan, userId }: PlanCardProps) {
  const theme = useTheme();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showPayPalButton, setShowPayPalButton] = useState(false);
  const { t, i18n } = useTranslation('common');
  const params = useParams();
  const [currentLang, setCurrentLang] = useState(params.lang as string);
  const [plan, setPlan] = useState(initialPlan);
  const { mode } = useThemeMode(); // Obtener el tema actual
  
  // Escuchar cambios de idioma
  useEffect(() => {
    const handleLanguageChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.language) {
        const newLang = customEvent.detail.language;
        setCurrentLang(newLang);
        
        // Si tenemos una clave de plan, actualizar el plan con las traducciones correctas
        if (planKey) {
          const localizedPlans = getLocalizedSubscriptionPlans(newLang);
          if (localizedPlans[planKey]) {
            setPlan(localizedPlans[planKey]);
          }
        }
      }
    };

    window.addEventListener('languageChanged', handleLanguageChange);
    
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange);
    };
  }, [planKey]);
  
  // Actualizar el idioma cuando cambia i18n
  useEffect(() => {
    if (i18n.language !== currentLang) {
      setCurrentLang(i18n.language);
      
      // Si tenemos una clave de plan, actualizar el plan con las traducciones correctas
      if (planKey) {
        const localizedPlans = getLocalizedSubscriptionPlans(i18n.language);
        if (localizedPlans[planKey]) {
          setPlan(localizedPlans[planKey]);
        }
      }
    }
  }, [i18n.language, currentLang, planKey]);

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
      window.location.href = `/${currentLang}/settings/subscription/success?subscription_id=${subscriptionId}&plan_name=${plan.name}&plan_price=${plan.price}&plan_interval=${plan.billingInterval.toUpperCase()}&from_paypal_sdk=true`;
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
          border: isCurrentPlan ? `2px solid ${theme.palette.primary.main}` : 'none',
          borderColor: isCurrentPlan ? 'primary.main' : 'transparent',
          position: 'relative'
        }}
      >
        {isCurrentPlan && (
          <Chip
            label={t('subscription.currentPlan', 'Plan Actual')}
            color="primary"
            sx={{
              position: 'absolute',
              top: theme.spacing(1.25),
              right: theme.spacing(1.25)
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
            {plan.price === 0
              ? t('subscription.free', 'Gratis')
              : plan.billingInterval === BillingInterval.MONTH
                ? t('subscription.pricePerMonth', '${{price}}/mes', { price: plan.price.toFixed(2) })
                : t('subscription.pricePerYear', '${{price}}/año', { price: plan.price.toFixed(2) })
            }
          </Typography>

          <List dense>
            <ListItem>
              <ListItemIcon>
                <CheckIcon color="success" />
              </ListItemIcon>
              <ListItemText
                primary={t('subscription.maxParticipantsPerRoom', 'Hasta {{count}} participantes por sala', { count: plan.features.maxParticipants })}
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <CheckIcon color="success" />
              </ListItemIcon>
              <ListItemText
                primary={t('subscription.activeRooms', '{{count}} {{roomText}}', {
                  count: plan.features.maxActiveRooms,
                  roomText: plan.features.maxActiveRooms === 1
                    ? t('subscription.singleRoom', 'sala activa')
                    : t('subscription.multipleRooms', 'salas activas')
                })}
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                {plan.features.exportData ? <CheckIcon color="success" /> : <CloseIcon color="error" />}
              </ListItemIcon>
              <ListItemText primary={t('subscription.dataExport', 'Exportación de datos')} />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                {plan.features.advancedStats ? <CheckIcon color="success" /> : <CloseIcon color="error" />}
              </ListItemIcon>
              <ListItemText primary={t('subscription.advancedStats', 'Estadísticas avanzadas')} />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                {plan.features.timer ? <CheckIcon color="success" /> : <CloseIcon color="error" />}
              </ListItemIcon>
              <ListItemText primary={t('subscription.votingTimer', 'Temporizador para votaciones')} />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                {plan.features.fullHistory ? <CheckIcon color="success" /> : <CloseIcon color="error" />}
              </ListItemIcon>
              <ListItemText primary={t('subscription.fullHistory', 'Historial completo')} />
            </ListItem>

            {plan.id === SubscriptionPlan.ENTERPRISE && (
              <>
                <ListItem>
                  <ListItemIcon>
                    <CheckIcon color="success" />
                  </ListItemIcon>
                  <ListItemText primary={t('subscription.integrations', 'Integraciones con Jira, Trello, GitHub')} />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <CheckIcon color="success" />
                  </ListItemIcon>
                  <ListItemText primary={t('subscription.branding', 'Personalización de marca')} />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <CheckIcon color="success" />
                  </ListItemIcon>
                  <ListItemText primary={t('subscription.prioritySupport', 'Soporte prioritario')} />
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
                    href={
                      plan.id === SubscriptionPlan.PRO
                        ? plan.billingInterval === BillingInterval.MONTH
                          ? `/paypal-pro-subscription-${currentLang}${mode === 'dark' ? '-dark' : ''}.html`
                          : `/paypal-pro-annual-subscription-${currentLang}${mode === 'dark' ? '-dark' : ''}.html`
                        : plan.billingInterval === BillingInterval.MONTH
                          ? `/paypal-enterprise-subscription-${currentLang}${mode === 'dark' ? '-dark' : ''}.html`
                          : `/paypal-enterprise-annual-subscription-${currentLang}${mode === 'dark' ? '-dark' : ''}.html`
                    }
                    target="_blank"
                    fullWidth
                  >
                    {t('subscription.payWithPayPal', 'Pagar con PayPal')}
                  </Button>
                </Box>

                <Button
                  variant="text"
                  color="primary"
                  onClick={() => setShowPayPalButton(false)}
                  fullWidth
                >
                  {t('subscription.cancel', 'Cancelar')}
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
                  <CircularProgress size={theme.spacing(3)} />
                ) : isCurrentPlan ? (
                  t('subscription.currentPlan', 'Plan Actual')
                ) : plan.price === 0 ? (
                  t('subscription.useFreePlan', 'Usar Plan Gratuito')
                ) : (
                  t('subscription.subscribe', 'Suscribirse')
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
        <DialogTitle>{t('subscription.confirmDowngrade', 'Confirmar cambio a plan gratuito')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('subscription.downgradeWarning', 'Al cambiar a un plan gratuito, perderás acceso a todas las funciones premium inmediatamente. ¿Estás seguro de que deseas continuar?')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} color="primary">
            {t('subscription.cancel', 'Cancelar')}
          </Button>
          <Button onClick={handleDowngradeConfirm} color="error">
            {t('subscription.confirm', 'Confirmar')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}