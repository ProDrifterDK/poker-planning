"use client";

import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardActionArea,
  CardContent,
  Radio,
  Chip,
  useTheme,
  Button,
  CircularProgress,
} from '@mui/material';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import { PaymentProvider, BillingInterval, SubscriptionPlan, SUBSCRIPTION_PLANS } from '@/types/subscription';
import { getCheckoutTranslations } from '@/types/checkoutTranslations';
import { ENABLED_PAYMENT_PROVIDERS } from '@/config/paymentProviders';

interface PaymentProviderSelectorProps {
  selectedProvider: PaymentProvider;
  onProviderChange: (provider: PaymentProvider) => void;
  onProceed: () => void;
  plan: SubscriptionPlan;
  interval: BillingInterval;
  loading?: boolean;
  lang?: string;
}

export default function PaymentProviderSelector({
  selectedProvider,
  onProviderChange,
  onProceed,
  plan,
  interval,
  loading = false,
  lang = 'en',
}: PaymentProviderSelectorProps) {
  const theme = useTheme();
  const t = getCheckoutTranslations(lang);

  const planKey = plan === SubscriptionPlan.FREE
    ? SubscriptionPlan.FREE
    : `${plan}-${interval}`;
  const price = SUBSCRIPTION_PLANS[planKey]?.price ?? 0;
  const planName = SUBSCRIPTION_PLANS[planKey]?.name ?? plan;

  const allProviders = [
    {
      id: PaymentProvider.STRIPE,
      label: t.provider.stripe,
      description: t.provider.stripeDescription,
      icon: <CreditCardIcon sx={{ fontSize: 40 }} />,
      badge: t.provider.cardAccepted,
    },
    {
      id: PaymentProvider.PAYPAL,
      label: t.provider.paypal,
      description: t.provider.paypalDescription,
      icon: (
        <Box
          component="span"
          sx={{
            fontSize: 28,
            fontWeight: 'bold',
            color: '#003087',
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          PP
        </Box>
      ),
      badge: 'PayPal',
    },
  ];

  // Only render providers whose backend adapter is deployed and enabled.
  // See src/config/paymentProviders.ts — PayPal is gated until
  // billing.paypal-checkout-on-railway ships a real adapter.
  const providers = allProviders.filter((p) =>
    ENABLED_PAYMENT_PROVIDERS.includes(p.id)
  );

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto' }}>
      {/* Order Summary */}
      <Box
        sx={{
          mb: 3,
          p: 2,
          borderRadius: 2,
          bgcolor: theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.05)'
            : 'rgba(0, 0, 0, 0.02)',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              {lang === 'es' ? 'Resumen del pedido' : 'Order Summary'}
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              {planName} — ${price}
              <Typography component="span" variant="caption" color="text.secondary">
                {interval === BillingInterval.MONTH ? t.comparison.perMonth : t.comparison.perYear}
              </Typography>
            </Typography>
          </Box>
        </Box>
      </Box>

      <Typography variant="h6" gutterBottom>
        {t.provider.title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {t.provider.subtitle}
      </Typography>

      {/* Provider cards */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
        {providers.map((provider) => {
          const isSelected = selectedProvider === provider.id;
          return (
            <Card
              key={provider.id}
              variant="outlined"
              sx={{
                border: isSelected
                  ? `2px solid ${theme.palette.primary.main}`
                  : '1px solid',
                borderColor: isSelected ? theme.palette.primary.main : 'divider',
                transition: 'border-color 0.2s',
              }}
            >
              <CardActionArea
                onClick={() => onProviderChange(provider.id)}
                sx={{ p: 0 }}
              >
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, '&:last-child': { pb: 2 } }}>
                  <Radio
                    checked={isSelected}
                    value={provider.id}
                    name="payment-provider"
                    sx={{ p: 0 }}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48 }}>
                    {provider.icon}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body1" fontWeight="bold">
                      {provider.label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {provider.description}
                    </Typography>
                  </Box>
                  <Chip label={provider.badge} size="small" variant="outlined" />
                </CardContent>
              </CardActionArea>
            </Card>
          );
        })}
      </Box>

      {/* Security note */}
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', textAlign: 'center', mb: 2 }}
      >
        🔒 {selectedProvider === PaymentProvider.STRIPE ? t.provider.securePayment : t.provider.subtitle}
      </Typography>

      {/* Proceed button */}
      <Button
        variant="contained"
        fullWidth
        size="large"
        onClick={onProceed}
        disabled={loading}
        sx={{ py: 1.5, fontSize: '1rem', textTransform: 'none', fontWeight: 'bold' }}
      >
        {loading ? (
          <CircularProgress size={24} color="inherit" />
        ) : (
          t.provider.proceedToCheckout
        )}
      </Button>
    </Box>
  );
}
