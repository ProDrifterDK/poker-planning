import React from 'react';
import { Typography, Container, Paper, Box, Breadcrumbs } from '@mui/material';
import NextMuiLink from '@/components/core/NextMuiLink';
import fs from 'fs';
import path from 'path';
import { marked } from 'marked';
import '../../../styles/docs.css';

// Función para leer y convertir el archivo Markdown a HTML
async function generateMarkdownContent() {
  try {
    const markdownPath = path.join(process.cwd(), 'docs', 'troubleshooting.md');
    const markdownContent = fs.readFileSync(markdownPath, 'utf8');
    return marked(markdownContent);
  } catch (error) {
    console.error('Error al leer el archivo Markdown:', error);
    return '<p>No se pudo cargar el contenido de solución de problemas.</p>';
  }
}

export default async function TroubleshootingPage() {
  const htmlContent = await generateMarkdownContent();

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box mb={4}>
        <Breadcrumbs aria-label="breadcrumb">
          <NextMuiLink href="/" color="inherit">
            Inicio
          </NextMuiLink>
          <NextMuiLink href="/docs" color="inherit">
            Documentación
          </NextMuiLink>
          <Typography color="text.primary">Solución de Problemas</Typography>
        </Breadcrumbs>
      </Box>

      <Typography variant="h4" component="h1" gutterBottom>
        Solución de Problemas
      </Typography>

      <Paper elevation={2} sx={{ p: 4, mt: 2 }}>
        <Box
          className="markdown-content"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
          sx={{
            color: 'text.primary', // Asegura que el texto use el color primario del tema
            '& h2': {
              fontSize: '1.5rem',
              fontWeight: 'bold',
              mt: 4,
              mb: 2,
              pb: 1,
              borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
              color: 'text.primary'
            },
            '& h3': {
              fontSize: '1.25rem',
              fontWeight: 'bold',
              mt: 3,
              mb: 1.5,
              color: 'text.primary'
            },
            '& p': {
              mb: 2,
              color: 'text.primary'
            },
            '& ul, & ol': {
              pl: 3,
              mb: 2
            },
            '& li': {
              mb: 1,
              color: 'text.primary'
            },
            '& a': {
              color: 'primary.main',
              textDecoration: 'underline'
            }
          }}
        />
      </Paper>
    </Container>
  );
}