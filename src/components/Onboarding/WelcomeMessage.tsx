"use client";

import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Fade,
  IconButton,
  useTheme
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useOnboardingStore } from '@/store/onboardingStore';

interface WelcomeMessageProps {
  showDelay?: number;
  autoHide?: boolean;
  autoHideDuration?: number;
}

const WelcomeMessage: React.FC<WelcomeMessageProps> = ({
  showDelay = 1000,
  autoHide = false,
  autoHideDuration = 10000,
}) => {
  const theme = useTheme();
  const { hasCompletedOnboarding, startOnboarding, resetOnboarding } = useOnboardingStore();
  const [visible, setVisible] = useState(false);
  
  // Mostrar el mensaje después de un delay
  useEffect(() => {
    // No mostrar si el usuario ya completó el tutorial
    if (hasCompletedOnboarding) return;
    
    const timer = setTimeout(() => {
      setVisible(true);
    }, showDelay);
    
    // Si autoHide es true, ocultar después de autoHideDuration
    let hideTimer: NodeJS.Timeout | null = null;
    if (autoHide) {
      hideTimer = setTimeout(() => {
        setVisible(false);
      }, showDelay + autoHideDuration);
    }
    
    return () => {
      clearTimeout(timer);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [showDelay, autoHide, autoHideDuration, hasCompletedOnboarding]);
  
  const handleClose = () => {
    setVisible(false);
  };
  
  const handleStartTutorial = () => {
    // Primero resetear el estado del tutorial
    // No necesitamos mantener el estado de completado porque este componente
    // solo se muestra cuando hasCompletedOnboarding es false
    resetOnboarding(false);
    // Luego iniciar el tutorial después de un breve retraso
    setTimeout(() => {
      startOnboarding();
      setVisible(false);
    }, 50);
  };
  
  return (
    <Fade in={visible}>
      <Paper
        elevation={3}
        sx={{
          position: 'fixed',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          width: { xs: '90%', sm: 450 },
          p: 3,
          borderRadius: 2,
          zIndex: 1000,
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Typography variant="h6" component="h2" gutterBottom>
            ¡Bienvenido a Planning Poker Pro!
          </Typography>
          <IconButton 
            size="small" 
            onClick={handleClose}
            aria-label="Cerrar mensaje"
            sx={{ mt: -1, mr: -1 }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        
        <Typography variant="body2" paragraph>
          Parece que es tu primera vez aquí. ¿Te gustaría un recorrido rápido por las principales funcionalidades?
        </Typography>
        
        <Box display="flex" justifyContent="flex-end" gap={1} mt={2}>
          <Button 
            variant="text" 
            color="inherit" 
            onClick={handleClose}
            size="small"
          >
            Ahora no
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleStartTutorial}
            size="small"
          >
            Iniciar tutorial
          </Button>
        </Box>
      </Paper>
    </Fade>
  );
};

export default WelcomeMessage;