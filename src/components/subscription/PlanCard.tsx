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
import { useTranslation } from 'react-i18next';
import { useParams } from 'next/navigation';

interface PlanCardProps {
  plan: PlanDetails;
  planKey?: string;
  isCurrentPlan: boolean;
  userId: string;
}

export default function PlanCard({ plan: initialPlan, planKey, isCurrentPlan, userId }: PlanCardProps) {
  const theme = useTheme();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const { t, i18n } = useTranslation('common');
  const params = useParams();
  const [currentLang, setCurrentLang] = useState(params.lang as string);
  const [plan, setPlan] = useState(initialPlan);
  const { subscribeToPlan, fetchUserSubscription } = useSubscriptionStore();

  useEffect(() => {
    const handleLanguageChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.language) {
        const newLang = customEvent.detail.language;
        setCurrentLang(newLang);
        if (planKey) {
          const localizedPlans = getLocalizedSubscriptionPlans(newLang);
          if (localizedPlans[planKey]) {
            setPlan(localizedPlans[planKey]);
          }
        }
      }
    };

    window.addEventListener('languageChanged', handleLanguageChange);
    return () => window.removeEventListener('languageChanged', handleLanguageChange);
  }, [planKey]);

  useEffect(() => {
    if (i18n.language !== currentLang) {
      setCurrentLang(i18n.language);
      if (planKey) {
        const localizedPlans = getLocalizedSubscriptionPlans(i18n.language);
        if (localizedPlans[planKey]) {
          setPlan(localizedPlans[planKey]);
        }
      }
    }
  }, [i18n.language, currentLang, planKey]);

  const handleSubscribe = async () => {
    if (isCurrentPlan) return;

    if (plan.id === SubscriptionPlan.FREE) {
      setConfirmOpen(true);
      return;
    }

    setProcessing(true);
    try {
      const checkoutUrl = await subscribeToPlan(userId, plan.id, plan.billingInterval);
      if (checkoutUrl) {
        window.location.assign(checkoutUrl);
      }
    } catch (error) {
      console.error('Error al suscribirse:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleDowngradeConfirm = async () => {
    setProcessing(true);
    setConfirmOpen(false);
    try {
      await subscribeToPlan(userId, SubscriptionPlan.FREE);
      await fetchUserSubscription(userId);
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
            sx={{ position: 'absolute', top: theme.spacing(1.25), right: theme.spacing(1.25) }}
          />
        )}

        <CardContent sx={{ flexGrow: 1 }}>
          <Typography variant="h5" component="h2" gutterBottom>{plan.name}</Typography>
          <Typography variant="body2" color="text.secondary" paragraph>{plan.description}</Typography>
          <Typography variant="h4" color="primary" gutterBottom>
            {plan.price === 0
              ? t('subscription.free', 'Gratis')
              : plan.billingInterval === BillingInterval.MONTH
                ? t('subscription.pricePerMonth', '${{price}}/mes', { price: plan.price.toFixed(2) })
                : t('subscription.pricePerYear', '${{price}}/año', { price: plan.price.toFixed(2) })}
          </Typography>

          <List dense>
            <ListItem>
              <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
              <ListItemText primary={t('subscription.maxParticipantsPerRoom', 'Hasta {{count}} participantes por sala', { count: plan.features.maxParticipants })} />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
              <ListItemText primary={t('subscription.activeRooms', '{{count}} {{roomText}}', {
                count: plan.features.maxActiveRooms,
                roomText: plan.features.maxActiveRooms === 1
                  ? t('subscription.singleRoom', 'sala activa')
                  : t('subscription.multipleRooms', 'salas activas')
              })} />
            </ListItem>
            <ListItem>
              <ListItemIcon>{plan.features.exportData ? <CheckIcon color="success" /> : <CloseIcon color="error" />}</ListItemIcon>
              <ListItemText primary={t('subscription.dataExport', 'Exportación de datos')} />
            </ListItem>
            <ListItem>
              <ListItemIcon>{plan.features.advancedStats ? <CheckIcon color="success" /> : <CloseIcon color="error" />}</ListItemIcon>
              <ListItemText primary={t('subscription.advancedStats', 'Estadísticas avanzadas')} />
            </ListItem>
            <ListItem>
              <ListItemIcon>{plan.features.timer ? <CheckIcon color="success" /> : <CloseIcon color="error" />}</ListItemIcon>
              <ListItemText primary={t('subscription.votingTimer', 'Temporizador para votaciones')} />
            </ListItem>
            <ListItem>
              <ListItemIcon>{plan.features.fullHistory ? <CheckIcon color="success" /> : <CloseIcon color="error" />}</ListItemIcon>
              <ListItemText primary={t('subscription.fullHistory', 'Historial completo')} />
            </ListItem>
            {plan.id === SubscriptionPlan.ENTERPRISE && (
              <>
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                  <ListItemText primary={t('subscription.integrations', 'Integraciones con Jira, Trello, GitHub')} />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                  <ListItemText primary={t('subscription.branding', 'Personalización de marca')} />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                  <ListItemText primary={t('subscription.advancedRoles', 'Roles avanzados')} />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                  <ListItemText primary={t('subscription.prioritySupport', 'Soporte prioritario')} />
                </ListItem>
              </>
            )}
          </List>
        </CardContent>

        <CardActions>
          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', p: 1, flexDirection: 'column' }}>
            <Button
              variant={isCurrentPlan ? 'outlined' : 'contained'}
              color="primary"
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
          </Box>
        </CardActions>
      </Card>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
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
