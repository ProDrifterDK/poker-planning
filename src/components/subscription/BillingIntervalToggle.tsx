"use client";

import React from 'react';
import { Box, ToggleButton, ToggleButtonGroup, Typography, Chip, useTheme } from '@mui/material';
import { BillingInterval } from '@/types/subscription';
import { getCheckoutTranslations } from '@/types/checkoutTranslations';

interface BillingIntervalToggleProps {
  interval: BillingInterval;
  onChange: (interval: BillingInterval) => void;
  lang?: string;
}

export default function BillingIntervalToggle({
  interval,
  onChange,
  lang = 'en',
}: BillingIntervalToggleProps) {
  const theme = useTheme();
  const t = getCheckoutTranslations(lang);

  const handleChange = (
    _event: React.MouseEvent<HTMLElement>,
    newInterval: BillingInterval | null,
  ) => {
    if (newInterval !== null) {
      onChange(newInterval);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, my: 3 }}>
      <Typography variant="body2" color="text.secondary">
        {t.interval.label}
      </Typography>
      <ToggleButtonGroup
        value={interval}
        exclusive
        onChange={handleChange}
        aria-label={t.interval.label}
        sx={{
          '& .MuiToggleButton-root': {
            px: 4,
            py: 1.5,
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: '8px !important',
            border: '1px solid',
            borderColor: 'divider',
            '&.Mui-selected': {
              backgroundColor: theme.palette.mode === 'dark'
                ? 'rgba(99, 102, 241, 0.2)'
                : 'rgba(99, 102, 241, 0.08)',
              color: theme.palette.primary.main,
              borderColor: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark'
                  ? 'rgba(99, 102, 241, 0.3)'
                  : 'rgba(99, 102, 241, 0.12)',
              },
            },
          },
        }}
      >
        <ToggleButton value={BillingInterval.MONTH} aria-label={t.interval.monthly}>
          {t.interval.monthly}
        </ToggleButton>
        <ToggleButton value={BillingInterval.YEAR} aria-label={t.interval.yearly}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {t.interval.yearly}
            <Chip
              label={t.interval.yearlySavings}
              size="small"
              color="success"
              variant="outlined"
              sx={{ ml: 0.5, fontSize: '0.7rem', height: 20 }}
            />
          </Box>
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
}
