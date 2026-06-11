"use client";

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Alert,
  useTheme,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import HourglassIcon from '@mui/icons-material/HourglassTop';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import {
  SubscriptionPlan,
  SubscriptionStatus,
  UserSubscription,
  SUBSCRIPTION_PLANS,
  BillingInterval,
  ExtendedSubscriptionStatus,
} from '@/types/subscription';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { billingApi } from '@/lib/billingApi';
import { getCheckoutTranslations } from '@/types/checkoutTranslations';

interface ManageSubscriptionProps {
  subscription: UserSubscription;
  onChangePlan: () => void;
  lang?: string;
}

function getStatusColor(status: string): 'success' | 'warning' | 'error' | 'info' | 'default' {
  switch (status) {
    case 'active':
    case ExtendedSubscriptionStatus.ACTIVE:
      return 'success';
    case 'past_due':
    case ExtendedSubscriptionStatus.PAST_DUE:
    case 'pending':
    case ExtendedSubscriptionStatus.PENDING:
      return 'warning';
    case 'cancelled':
    case ExtendedSubscriptionStatus.CANCELLED:
    case 'failed':
    case ExtendedSubscriptionStatus.FAILED:
      return 'error';
    case 'cancel_at_period_end':
    case ExtendedSubscriptionStatus.CANCEL_AT_PERIOD_END:
    case 'incomplete':
    case ExtendedSubscriptionStatus.INCOMPLETE:
      return 'info';
    default:
      return 'default';
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'active':
    case ExtendedSubscriptionStatus.ACTIVE:
      return <CheckCircleIcon color="success" />;
    case 'past_due':
    case ExtendedSubscriptionStatus.PAST_DUE:
    case 'pending':
    case ExtendedSubscriptionStatus.PENDING:
      return <HourglassIcon color="warning" />;
    case 'failed':
    case ExtendedSubscriptionStatus.FAILED:
    case 'cancelled':
    case ExtendedSubscriptionStatus.CANCELLED:
      return <ErrorIcon color="error" />;
    default:
      return <WarningIcon color="info" />;
  }
}

function getStatusLabel(status: string, lang: string): string {
  const labels: Record<string, Record<string, string>> = {
    active: { en: 'Active', es: 'Activa' },
    past_due: { en: 'Past Due', es: 'Pago Atrasado' },
    cancelled: { en: 'Cancelled', es: 'Cancelada' },
    cancel_at_period_end: { en: 'Cancels at Period End', es: 'Se cancela al fin de período' },
    incomplete: { en: 'Incomplete', es: 'Incompleta' },
    expired: { en: 'Expired', es: 'Expirada' },
    pending: { en: 'Pending', es: 'Pendiente' },
    failed: { en: 'Failed', es: 'Fallida' },
    trialing: { en: 'Trialing', es: 'Prueba' },
  };
  return labels[status]?.[lang] ?? status;
}

export default function ManageSubscription({
  subscription,
  onChangePlan,
  lang = 'en',
}: ManageSubscriptionProps) {
  const theme = useTheme();
  const t = getCheckoutTranslations(lang);

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const { cancelCurrentSubscription, fetchUserSubscription } = useSubscriptionStore();

  // Plan info
  const planKey = subscription.plan === SubscriptionPlan.FREE
    ? SubscriptionPlan.FREE
    : `${subscription.plan}-${subscription.billingInterval ?? BillingInterval.MONTH}`;
  const planDetails = SUBSCRIPTION_PLANS[planKey];
  const planName = planDetails?.name ?? subscription.plan;
  const price = planDetails?.price ?? 0;

  const isCancelled = subscription.status === SubscriptionStatus.CANCELLED;
  const isCancelAtPeriodEnd = subscription.cancelAtPeriodEnd === true;
  const isFailed = subscription.status === SubscriptionStatus.FAILED;
  const isPastDue = (subscription.status as string) === 'past_due';

  // Format dates
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString(lang === 'es' ? 'es-CL' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Cancel handler
  const handleCancel = async () => {
    setCancelLoading(true);
    setCancelError(null);
    try {
      const success = await cancelCurrentSubscription(cancelReason || undefined);
      if (success) {
        setCancelSuccess(true);
        await fetchUserSubscription();
      } else {
        setCancelError(lang === 'es'
          ? 'No se pudo cancelar la suscripción'
          : 'Could not cancel subscription');
      }
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setCancelLoading(false);
    }
  };

  // Open customer portal
  const handleOpenPortal = async () => {
    setPortalLoading(true);
    try {
      const result = await billingApi.createPortalSession();
      if (result.url) {
        window.open(result.url, '_blank');
      }
    } catch (err) {
      console.error('Portal error:', err);
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <Box>
      {/* Status banner for non-active states */}
      {isCancelAtPeriodEnd && (
        <Alert severity="info" sx={{ mb: 3 }} icon={<HourglassIcon />}>
          <Typography variant="body2" fontWeight="bold">{t.manage.cancelAtPeriodEnd}</Typography>
          <Typography variant="body2">{t.manage.cancelAtPeriodEndMessage}</Typography>
        </Alert>
      )}
      {isPastDue && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2" fontWeight="bold">
            {lang === 'es' ? 'Pago Atrasado' : 'Past Due'}
          </Typography>
          <Typography variant="body2">
            {lang === 'es'
              ? 'Tu último pago no se procesó correctamente. Actualiza tu método de pago para evitar la interrupción del servicio.'
              : 'Your last payment was not processed successfully. Update your payment method to avoid service interruption.'}
          </Typography>
        </Alert>
      )}
      {isFailed && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body2" fontWeight="bold">
            {lang === 'es' ? 'Pago Fallido' : 'Payment Failed'}
          </Typography>
          <Typography variant="body2">
            {lang === 'es'
              ? 'Tu suscripción está inactiva debido a un pago fallido. Actualiza tu método de pago para reactivarla.'
              : 'Your subscription is inactive due to a failed payment. Update your payment method to reactivate.'}
          </Typography>
        </Alert>
      )}

      {/* Current plan card */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="overline" color="text.secondary">
                {t.manage.currentPlan}
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                {planName}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                ${price}
                {subscription.billingInterval === BillingInterval.YEAR
                  ? t.comparison.perYear
                  : t.comparison.perMonth}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {getStatusIcon(subscription.status)}
              <Chip
                label={getStatusLabel(subscription.status, lang)}
                color={getStatusColor(subscription.status)}
                size="small"
              />
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                <CalendarTodayIcon sx={{ fontSize: 14 }} />
                {lang === 'es' ? 'Inicio' : 'Start Date'}
              </Typography>
              <Typography variant="body2">{formatDate(subscription.startDate)}</Typography>
            </Box>
            {subscription.endDate && (
              <Box>
                <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                  <CalendarTodayIcon sx={{ fontSize: 14 }} />
                  {isCancelAtPeriodEnd
                    ? (lang === 'es' ? 'Fin programado' : 'Ends on')
                    : t.manage.nextBilling}
                </Typography>
                <Typography variant="body2">{formatDate(subscription.endDate)}</Typography>
              </Box>
            )}
            <Box>
              <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                <CreditCardIcon sx={{ fontSize: 14 }} />
                {lang === 'es' ? 'Método de pago' : 'Payment Method'}
              </Typography>
              <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                {subscription.paymentMethod}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {!isCancelled && subscription.plan !== SubscriptionPlan.FREE && (
          <>
            <Button
              variant="contained"
              onClick={onChangePlan}
              sx={{ textTransform: 'none' }}
            >
              {t.manage.changePlan}
            </Button>

            <Tooltip title={lang === 'es' ? 'Abrir portal de facturación de Stripe' : 'Open Stripe billing portal'}>
              <Button
                variant="outlined"
                onClick={handleOpenPortal}
                disabled={portalLoading}
                endIcon={portalLoading ? <CircularProgress size={16} /> : <OpenInNewIcon />}
                sx={{ textTransform: 'none' }}
              >
                {t.manage.portalButton}
              </Button>
            </Tooltip>

            {!isCancelAtPeriodEnd && !isPastDue && (
              <Button
                variant="outlined"
                color="error"
                onClick={() => setCancelDialogOpen(true)}
                sx={{ textTransform: 'none' }}
              >
                {t.manage.cancelSubscription}
              </Button>
            )}
          </>
        )}
      </Box>

      {/* Cancel confirmation dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => { setCancelDialogOpen(false); setCancelError(null); setCancelSuccess(false); }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t.manage.cancelSubscription}</DialogTitle>
        <DialogContent>
          {cancelSuccess ? (
            <Alert severity="success" sx={{ mt: 1 }}>
              {lang === 'es'
                ? 'Tu suscripción ha sido cancelada. Mantendrás acceso hasta el final del período actual.'
                : 'Your subscription has been canceled. You\'ll retain access until the end of the current period.'}
            </Alert>
          ) : (
            <>
              <DialogContentText sx={{ mb: 2 }}>
                {t.manage.cancelConfirm}
              </DialogContentText>
              <TextField
                fullWidth
                multiline
                rows={2}
                label={t.manage.cancelReason}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                sx={{ mt: 1 }}
              />
              {cancelError && (
                <Alert severity="error" sx={{ mt: 2 }}>{cancelError}</Alert>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          {cancelSuccess ? (
            <Button
              onClick={() => { setCancelDialogOpen(false); setCancelSuccess(false); setCancelReason(''); }}
              variant="contained"
            >
              {t.general.close}
            </Button>
          ) : (
            <>
              <Button
                onClick={() => { setCancelDialogOpen(false); setCancelError(null); }}
                disabled={cancelLoading}
              >
                {t.general.cancel}
              </Button>
              <Button
                onClick={handleCancel}
                color="error"
                variant="contained"
                disabled={cancelLoading}
              >
                {cancelLoading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  t.manage.cancelSubscription
                )}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
