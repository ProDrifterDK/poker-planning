"use client";

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, AlertTitle, Box, IconButton, Typography, List, ListItem } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import WarningIcon from '@mui/icons-material/Warning';

/**
 * Componente que muestra una advertencia cuando se detecta un bloqueador de anuncios
 * que podría estar interfiriendo con la funcionalidad de la aplicación.
 */
const AdBlockerWarning: React.FC = () => {
  const [isAdBlockerDetected, setIsAdBlockerDetected] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const { t } = useTranslation('common');

  useEffect(() => {
    // Verificar si hay errores recientes relacionados con bloqueadores de anuncios
    const checkForAdBlocker = () => {
      const errorMessages = document.querySelectorAll('.MuiAlert-root');
      for (const element of errorMessages) {
        const text = element.textContent || '';
        if (text.includes('bloqueador de anuncios') ||
            text.includes('ERR_BLOCKED_BY') ||
            text.includes('network error')) {
          setIsAdBlockerDetected(true);
          return;
        }
      }
    };

    // Verificar al cargar y cada vez que haya cambios en el DOM
    checkForAdBlocker();
    
    // Crear un observador para detectar nuevos errores
    const observer = new MutationObserver(checkForAdBlocker);
    observer.observe(document.body, { childList: true, subtree: true });

    // También verificar si hay errores en la consola relacionados con bloqueadores
    const originalConsoleError = console.error;
    console.error = function(...args) {
      const errorString = args.join(' ');
      if (errorString.includes('ERR_BLOCKED_BY') ||
          errorString.includes('network error') ||
          errorString.includes('failed to fetch')) {
        setIsAdBlockerDetected(true);
      }
      originalConsoleError.apply(console, args);
    };

    return () => {
      observer.disconnect();
      console.error = originalConsoleError;
    };
  }, []);

  // No mostrar nada si no se detecta un bloqueador o si el usuario cerró la advertencia
  if (!isAdBlockerDetected || isDismissed) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: (theme) => theme.spacing(2),
        right: (theme) => theme.spacing(2),
        zIndex: (theme) => theme.zIndex.modal + 1,
        maxWidth: 400,
      }}
    >
      <Alert
        severity="warning"
        variant="filled"
        icon={<WarningIcon />}
        action={
          <IconButton
            aria-label="close"
            color="inherit"
            size="small"
            onClick={() => setIsDismissed(true)}
          >
            <CloseIcon fontSize="inherit" />
          </IconButton>
        }
        sx={{ borderRadius: (theme) => theme.shape.borderRadius }}
      >
        <AlertTitle>{t('adBlocker.detected')}</AlertTitle>
        <Typography variant="body2">
          {t('adBlocker.message')}
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          {t('adBlocker.forFullExperience')}
        </Typography>
        <List dense sx={{ pl: 2, mt: 0.5 }}>
          <ListItem sx={{ display: 'list-item', listStyleType: 'disc' }}>
            <Typography variant="body2">{t('adBlocker.disableForThisSite')}</Typography>
          </ListItem>
          <ListItem sx={{ display: 'list-item', listStyleType: 'disc' }}>
            <Typography variant="body2">{t('adBlocker.addException')}</Typography>
          </ListItem>
        </List>
      </Alert>
    </Box>
  );
};

export default AdBlockerWarning;