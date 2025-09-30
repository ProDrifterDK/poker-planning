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
  Chip
} from '@mui/material';
import { PaymentHistory as PaymentHistoryType } from '@/types/subscription';

interface PaymentHistoryProps {
  payments: PaymentHistoryType[];
}

export default function PaymentHistory({ payments }: PaymentHistoryProps) {
  // Formatear fechas
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Formatear método de pago
  const formatPaymentMethod = (method: string) => {
    switch (method) {
      case 'paypal':
        return 'PayPal';
      case 'credit_card':
        return 'Tarjeta de crédito';
      default:
        return method;
    }
  };
  
  // Ordenar pagos por fecha (más reciente primero)
  const sortedPayments = [...payments].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
  
  return (
    <TableContainer component={Paper} sx={{ backgroundColor: 'background.paper' }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Fecha</TableCell>
            <TableCell>Monto</TableCell>
            <TableCell>Método de pago</TableCell>
            <TableCell>Estado</TableCell>
            <TableCell>ID de transacción</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedPayments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell>{formatDate(payment.date)}</TableCell>
              <TableCell>{`${payment.amount.toFixed(2)} ${payment.currency}`}</TableCell>
              <TableCell>{formatPaymentMethod(payment.paymentMethod)}</TableCell>
              <TableCell>
                <Chip 
                  label={payment.status} 
                  color={
                    payment.status === 'completed' ? 'success' : 
                    payment.status === 'pending' ? 'warning' : 'error'
                  }
                  size="small"
                />
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {payment.transactionId.substring(0, 12)}...
                </Typography>
              </TableCell>
            </TableRow>
          ))}
          
          {sortedPayments.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} align="center">
                <Typography variant="body1" sx={{ py: 2 }}>
                  No hay pagos registrados.
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}