"use client";

import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { useTranslation } from 'react-i18next';
import { Alert, AlertTitle, Box, IconButton, Typography, List, ListItem } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import WarningIcon from '@mui/icons-material/Warning';

const StyledBox = styled(Box)``;

/**
 * A robust component that displays a warning when an ad blocker is detected.
 * It uses the network request probe method for reliable detection.
 */
const AdBlockerWarning: React.FC = () => {
  const [adBlockerDetected, setAdBlockerDetected] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const { t } = useTranslation('common');

  useEffect(() => {
    // This function performs the network request probe.
    const checkAdBlocker = async () => {
      const adUrl = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
      
      try {
        // We use 'HEAD' for efficiency and 'no-cors' to avoid CORS issues.
        await fetch(new Request(adUrl, {
          method: 'HEAD',
          mode: 'no-cors',
        }));
        // If the request succeeds, no ad blocker is active.
        // The state remains false.
      } catch (error) {
        // If the request fails, it's highly likely an ad blocker is active.
        console.warn('Ad blocker detected.', error);
        setAdBlockerDetected(true);
      }
    };

    // Run the check only once when the component mounts.
    checkAdBlocker();
  }, []); // Empty dependency array ensures this runs only once.

  if (isDismissed || !adBlockerDetected) {
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