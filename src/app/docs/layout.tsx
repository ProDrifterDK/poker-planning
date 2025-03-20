import React from 'react';
import { Container } from '@mui/material';
import '../../styles/docs.css';

export const metadata = {
  title: 'Documentación | Poker Planning',
  description: 'Documentación y guías para usar Poker Planning',
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      {children}
    </Container>
  );
}