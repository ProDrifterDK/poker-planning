"use client";

import React, { useState, useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { useTranslation } from 'react-i18next';
import { Alert, AlertTitle, Box, IconButton, Typography, List, ListItem } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import WarningIcon from '@mui/icons-material/Warning';

const StyledBox = styled(Box)``;

/**
 * Componente que muestra una advertencia cuando se detecta un bloqueador de anuncios
 * que podría estar interfiriendo con la funcionalidad de la aplicación.
 */
const AdBlockerWarning: React.FC = () => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const { t } = useTranslation('common');
  const baitRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // We need to append the bait to the body to ensure it's
    // evaluated by ad blockers.
    const baitElement = document.createElement('div');
    baitElement.className = 'adsbox'; // Common class for ad blockers to target
    Object.assign(baitElement.style, {
      position: 'absolute',
      height: '1px',
      width: '1px',
      top: '-1px',
      left: '-1px',
      pointerEvents: 'none',
      opacity: '0',
    });
    document.body.appendChild(baitElement);
    baitRef.current = baitElement;

    const timer = setTimeout(() => {
      if (baitRef.current && baitRef.current.offsetHeight === 0) {
        setShowWarning(true);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (baitRef.current) {
        document.body.removeChild(baitRef.current);
      }
    };
  }, []);

  if (isDismissed || !showWarning) {
    return null;
  }

  return (
    <StyledBox
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
    </StyledBox>
  );
};

export default AdBlockerWarning;