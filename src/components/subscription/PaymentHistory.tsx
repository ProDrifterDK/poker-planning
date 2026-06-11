"use client";

import React from 'react';
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  useMediaQuery,
  useTheme,
  Box,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import { PaymentHistory as PaymentHistoryType } from '@/types/subscription';
import { getCheckoutTranslations } from '@/types/checkoutTranslations';

interface PaymentHistoryProps {
  payments: PaymentHistoryType[];
  lang?: string;
}

export default function PaymentHistory({ payments, lang = 'es' }: PaymentHistoryProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const t = getCheckoutTranslations(lang);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(lang === 'es' ? 'es-CL' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatPaymentMethod = (method: string) => {
    const methods: Record<string, Record<string, string>> = {
      paypal: { en: 'PayPal', es: 'PayPal' },
      stripe: { en: 'Card (Stripe)', es: 'Tarjeta (Stripe)' },
      credit_card: { en: 'Credit Card', es: 'Tarjeta de crédito' },
    };
    return methods[method]?.[lang] ?? method;
  };

  const formatStatus = (status: string) => {
    const statuses: Record<string, Record<string, string>> = {
      completed: { en: 'Completed', es: 'Completado' },
      pending: { en: 'Pending', es: 'Pendiente' },
      failed: { en: 'Failed', es: 'Fallido' },
    };
    return statuses[status]?.[lang] ?? status;
  };

  const sortedPayments = [...payments].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  if (sortedPayments.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
        {lang === 'es' ? 'No hay pagos registrados.' : 'No payments recorded.'}
      </Typography>
    );
  }

  // Mobile: card layout
  if (isMobile) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {sortedPayments.map((payment) => (
          <Card key={payment.id} variant="outlined">
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" fontWeight="bold">
                  ${payment.amount.toFixed(2)} {payment.currency}
                </Typography>
                <Chip
                  label={formatStatus(payment.status)}
                  color={
                    payment.status === 'completed' ? 'success' :
                    payment.status === 'pending' ? 'warning' : 'error'
                  }
                  size="small"
                />
              </Box>
              <Typography variant="caption" color="text.secondary" display="block">
                {formatDate(payment.date)}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                {formatPaymentMethod(payment.paymentMethod)}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                ID: {payment.transactionId.substring(0, 16)}...
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  }

  // Desktop: table layout
  const headers = {
    date: lang === 'es' ? 'Fecha' : 'Date',
    amount: lang === 'es' ? 'Monto' : 'Amount',
    method: lang === 'es' ? 'Método de pago' : 'Payment Method',
    status: lang === 'es' ? 'Estado' : 'Status',
    transaction: lang === 'es' ? 'ID de transacción' : 'Transaction ID',
  };

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{headers.date}</TableCell>
            <TableCell>{headers.amount}</TableCell>
            <TableCell>{headers.method}</TableCell>
            <TableCell>{headers.status}</TableCell>
            <TableCell>{headers.transaction}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedPayments.map((payment) => (
            <TableRow key={payment.id} hover>
              <TableCell>{formatDate(payment.date)}</TableCell>
              <TableCell>
                <Typography variant="body2" fontWeight="bold">
                  ${payment.amount.toFixed(2)} {payment.currency}
                </Typography>
              </TableCell>
              <TableCell>{formatPaymentMethod(payment.paymentMethod)}</TableCell>
              <TableCell>
                <Chip
                  label={formatStatus(payment.status)}
                  color={
                    payment.status === 'completed' ? 'success' :
                    payment.status === 'pending' ? 'warning' : 'error'
                  }
                  size="small"
                />
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                  {payment.transactionId.substring(0, 16)}...
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
