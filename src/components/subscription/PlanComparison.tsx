"use client";

import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  Divider,
  useMediaQuery,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import StarIcon from '@mui/icons-material/Star';
import {
  BillingInterval,
  PlanDetails,
  SubscriptionPlan,
  SubscriptionStatus,
  UserSubscription,
  SUBSCRIPTION_PLANS,
} from '@/types/subscription';
import { getCheckoutTranslations } from '@/types/checkoutTranslations';

interface PlanComparisonProps {
  interval: BillingInterval;
  currentSubscription: UserSubscription | null;
  onSelectPlan: (plan: SubscriptionPlan, interval: BillingInterval) => void;
  lang?: string;
}

function getPlanKey(plan: SubscriptionPlan, interval: BillingInterval): string {
  if (plan === SubscriptionPlan.FREE) return SubscriptionPlan.FREE;
  return `${plan}-${interval}`;
}

function getPlanPrice(plan: SubscriptionPlan, interval: BillingInterval): number {
  const key = getPlanKey(plan, interval);
  return SUBSCRIPTION_PLANS[key]?.price ?? 0;
}

export default function PlanComparison({
  interval,
  currentSubscription,
  onSelectPlan,
  lang = 'en',
}: PlanComparisonProps) {
  const theme = useTheme();
  const t = getCheckoutTranslations(lang);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const currentPlan = currentSubscription?.plan;
  const currentInterval = currentSubscription?.billingInterval;
  const isActive = currentSubscription?.status === SubscriptionStatus.ACTIVE;

  const getButtonLabel = (plan: SubscriptionPlan): string => {
    if (plan === currentPlan && isActive && currentInterval === interval) {
      return t.comparison.currentPlan;
    }
    if (!currentPlan || currentPlan === SubscriptionPlan.FREE) {
      return plan === SubscriptionPlan.FREE ? t.comparison.currentPlan : t.comparison.select;
    }
    // User has a paid plan
    const planOrder = { [SubscriptionPlan.FREE]: 0, [SubscriptionPlan.PRO]: 1, [SubscriptionPlan.ENTERPRISE]: 2 };
    if (planOrder[plan] > planOrder[currentPlan!]) return t.comparison.upgrade;
    if (planOrder[plan] < planOrder[currentPlan!]) return t.comparison.downgrade;
    return currentInterval !== interval ? t.comparison.changePlan : t.comparison.currentPlan;
  };

  const isCurrentPlan = (plan: SubscriptionPlan): boolean => {
    return plan === currentPlan && isActive && currentInterval === interval;
  };

  const isButtonDisabled = (plan: SubscriptionPlan): boolean => {
    return isCurrentPlan(plan);
  };

  // Feature rows for comparison
  const features = [
    { key: 'participants', label: t.comparison.participants, getValue: (p: SubscriptionPlan) => {
      const pk = getPlanKey(p, interval);
      const val = SUBSCRIPTION_PLANS[pk]?.features.maxParticipants ?? 5;
      return String(val);
    }},
    { key: 'rooms', label: t.comparison.maxRooms.replace('{count}', ''), getValue: (p: SubscriptionPlan) => {
      const pk = getPlanKey(p, interval);
      const val = SUBSCRIPTION_PLANS[pk]?.features.maxActiveRooms ?? 1;
      return String(val);
    }},
    { key: 'timer', label: t.comparison.timer, getValue: (p: SubscriptionPlan) => {
      const pk = getPlanKey(p, interval);
      return SUBSCRIPTION_PLANS[pk]?.features.timer ? '✓' : '✗';
    }},
    { key: 'exportData', label: t.comparison.exportData, getValue: (p: SubscriptionPlan) => {
      const pk = getPlanKey(p, interval);
      return SUBSCRIPTION_PLANS[pk]?.features.exportData ? '✓' : '✗';
    }},
    { key: 'advancedStats', label: t.comparison.advancedStats, getValue: (p: SubscriptionPlan) => {
      const pk = getPlanKey(p, interval);
      return SUBSCRIPTION_PLANS[pk]?.features.advancedStats ? '✓' : '✗';
    }},
    { key: 'fullHistory', label: t.comparison.fullHistory, getValue: (p: SubscriptionPlan) => {
      const pk = getPlanKey(p, interval);
      return SUBSCRIPTION_PLANS[pk]?.features.fullHistory ? '✓' : '✗';
    }},
    { key: 'adFree', label: t.comparison.adFree, getValue: (p: SubscriptionPlan) => {
      const pk = getPlanKey(p, interval);
      return SUBSCRIPTION_PLANS[pk]?.features.adFree ? '✓' : '✗';
    }},
    { key: 'integrations', label: t.comparison.integrations, getValue: (p: SubscriptionPlan) => {
      const pk = getPlanKey(p, interval);
      return SUBSCRIPTION_PLANS[pk]?.features.integrations ? '✓' : '✗';
    }},
    { key: 'branding', label: t.comparison.branding, getValue: (p: SubscriptionPlan) => {
      const pk = getPlanKey(p, interval);
      return SUBSCRIPTION_PLANS[pk]?.features.branding ? '✓' : '✗';
    }},
    { key: 'advancedRoles', label: t.comparison.advancedRoles, getValue: (p: SubscriptionPlan) => {
      const pk = getPlanKey(p, interval);
      return SUBSCRIPTION_PLANS[pk]?.features.advancedRoles ? '✓' : '✗';
    }},
    { key: 'prioritySupport', label: t.comparison.prioritySupport, getValue: (p: SubscriptionPlan) => {
      const pk = getPlanKey(p, interval);
      return SUBSCRIPTION_PLANS[pk]?.features.prioritySupport ? '✓' : '✗';
    }},
    { key: 'api', label: t.comparison.api, getValue: (p: SubscriptionPlan) => {
      const pk = getPlanKey(p, interval);
      return SUBSCRIPTION_PLANS[pk]?.features.api ? '✓' : '✗';
    }},
  ];

  const plans: SubscriptionPlan[] = [SubscriptionPlan.FREE, SubscriptionPlan.PRO, SubscriptionPlan.ENTERPRISE];
  const planLabels: Record<SubscriptionPlan, string> = {
    [SubscriptionPlan.FREE]: t.comparison.free,
    [SubscriptionPlan.PRO]: t.comparison.pro,
    [SubscriptionPlan.ENTERPRISE]: t.comparison.enterprise,
  };

  // Card-based layout for mobile
  if (isMobile) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {plans.map((plan) => {
          const price = getPlanPrice(plan, interval);
          const current = isCurrentPlan(plan);
          const isPro = plan === SubscriptionPlan.PRO;
          return (
            <Card
              key={plan}
              sx={{
                position: 'relative',
                border: isPro ? `2px solid ${theme.palette.primary.main}` : '1px solid',
                borderColor: isPro ? theme.palette.primary.main : 'divider',
                transform: isPro ? 'scale(1.02)' : 'none',
              }}
            >
              {isPro && (
                <Chip
                  icon={<StarIcon sx={{ fontSize: 14 }} />}
                  label={t.comparison.mostPopular}
                  size="small"
                  color="primary"
                  sx={{ position: 'absolute', top: -12, right: 16 }}
                />
              )}
              <CardContent sx={{ pb: 1 }}>
                <Typography variant="h6" gutterBottom>
                  {planLabels[plan]}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                  <Typography variant="h4" fontWeight="bold">
                    ${price}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {interval === BillingInterval.MONTH ? t.comparison.perMonth : t.comparison.perYear}
                  </Typography>
                </Box>
                <Divider sx={{ my: 2 }} />
                <List dense>
                  {features.map((f) => {
                    const val = f.getValue(plan);
                    const isCheck = val === '✓';
                    const isCross = val === '✗';
                    return (
                      <ListItem key={f.key} disablePadding sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          {isCheck ? (
                            <CheckCircleIcon color="success" fontSize="small" />
                          ) : isCross ? (
                            <CancelIcon color="disabled" fontSize="small" />
                          ) : null}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            isCheck || isCross ? (
                              <Typography variant="body2">{f.label}</Typography>
                            ) : (
                              <Typography variant="body2">{f.label}: <strong>{val}</strong></Typography>
                            )
                          }
                        />
                      </ListItem>
                    );
                  })}
                </List>
              </CardContent>
              <CardActions sx={{ px: 2, pb: 2 }}>
                <Button
                  fullWidth
                  variant={current ? 'outlined' : 'contained'}
                  disabled={isButtonDisabled(plan)}
                  onClick={() => onSelectPlan(plan, interval)}
                  color={isPro ? 'primary' : 'inherit'}
                >
                  {getButtonLabel(plan)}
                </Button>
              </CardActions>
            </Card>
          );
        })}
      </Box>
    );
  }

  // Table-based layout for desktop
  return (
    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold', width: '30%' }}>
              {t.comparison.feature}
            </TableCell>
            {plans.map((plan) => {
              const isPro = plan === SubscriptionPlan.PRO;
              return (
                <TableCell
                  key={plan}
                  align="center"
                  sx={{
                    fontWeight: 'bold',
                    bgcolor: isPro
                      ? theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.08)' : 'rgba(99, 102, 241, 0.04)'
                      : 'inherit',
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {planLabels[plan]}
                    </Typography>
                    {isPro && (
                      <Chip
                        icon={<StarIcon sx={{ fontSize: 12 }} />}
                        label={t.comparison.mostPopular}
                        size="small"
                        color="primary"
                        sx={{ height: 20, fontSize: '0.65rem' }}
                      />
                    )}
                  </Box>
                </TableCell>
              );
            })}
            <TableCell align="center" sx={{ width: '20%' }} />
          </TableRow>
        </TableHead>
        <TableBody>
          {/* Price row */}
          <TableRow>
            <TableCell sx={{ fontWeight: 500 }}>
              {lang === 'es' ? 'Precio' : 'Price'}
            </TableCell>
            {plans.map((plan) => {
              const price = getPlanPrice(plan, interval);
              const isPro = plan === SubscriptionPlan.PRO;
              return (
                <TableCell
                  key={plan}
                  align="center"
                  sx={{
                    bgcolor: isPro
                      ? theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.08)' : 'rgba(99, 102, 241, 0.04)'
                      : 'inherit',
                  }}
                >
                  <Typography variant="h6" fontWeight="bold">
                    ${price}
                    <Typography component="span" variant="caption" color="text.secondary">
                      {interval === BillingInterval.MONTH ? t.comparison.perMonth : t.comparison.perYear}
                    </Typography>
                  </Typography>
                </TableCell>
              );
            })}
            <TableCell />
          </TableRow>

          {/* Feature rows */}
          {features.map((f) => (
            <TableRow key={f.key} hover>
              <TableCell>{f.label}</TableCell>
              {plans.map((plan) => {
                const val = f.getValue(plan);
                const isCheck = val === '✓';
                const isCross = val === '✗';
                const isPro = plan === SubscriptionPlan.PRO;
                return (
                  <TableCell
                    key={plan}
                    align="center"
                    sx={{
                      bgcolor: isPro
                        ? theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.08)' : 'rgba(99, 102, 241, 0.04)'
                        : 'inherit',
                    }}
                  >
                    {isCheck ? (
                      <CheckCircleIcon color="success" fontSize="small" />
                    ) : isCross ? (
                      <CancelIcon color="disabled" fontSize="small" />
                    ) : (
                      <Typography variant="body2" fontWeight="bold">{val}</Typography>
                    )}
                  </TableCell>
                );
              })}
              <TableCell />
            </TableRow>
          ))}

          {/* Action row */}
          <TableRow>
            <TableCell />
            {plans.map((plan) => {
              const current = isCurrentPlan(plan);
              const isPro = plan === SubscriptionPlan.PRO;
              return (
                <TableCell
                  key={plan}
                  align="center"
                  sx={{
                    py: 2,
                    bgcolor: isPro
                      ? theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.08)' : 'rgba(99, 102, 241, 0.04)'
                      : 'inherit',
                  }}
                >
                  <Button
                    variant={current ? 'outlined' : isPro ? 'contained' : 'outlined'}
                    disabled={isButtonDisabled(plan)}
                    onClick={() => onSelectPlan(plan, interval)}
                    size="small"
                    fullWidth
                  >
                    {getButtonLabel(plan)}
                  </Button>
                </TableCell>
              );
            })}
            <TableCell />
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
}
