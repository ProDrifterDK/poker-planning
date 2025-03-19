"use client";

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  IconButton,
  useTheme
} from '@mui/material';
import { motion } from 'framer-motion';
import { AnimatePresence } from 'framer-motion';
import CloseIcon from '@mui/icons-material/Close';
import { useOnboardingStore } from '@/store/onboardingStore';

// Componente de motion para Paper
const MotionPaper = motion.create(Paper);

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
    <AnimatePresence>
      {visible && (
        <MotionPaper
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 25
          }}
          elevation={3}
          sx={{
            position: 'fixed',
            zIndex: 1500,
            width: 320,
            maxWidth: '90vw',
            boxShadow: 3,
            // Centrado absoluto usando inset y margin auto
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            margin: 'auto',
            height: 'fit-content',
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <Typography variant="h6" component="h2" gutterBottom>
              ¡Bienvenido a Planning Poker Pro!
            </Typography>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, rotate: -90 }}
            animate={{ opacity: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <IconButton
              size="small"
              onClick={handleClose}
              aria-label="Cerrar mensaje"
              sx={{ mt: -1, mr: -1 }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </motion.div>
        </Box>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Typography variant="body2" paragraph>
            Parece que es tu primera vez aquí. ¿Te gustaría un recorrido rápido por las principales funcionalidades?
          </Typography>
        </motion.div>
        
        <Box display="flex" justifyContent="flex-end" gap={1} mt={2}>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="text"
              color="inherit"
              onClick={handleClose}
              size="small"
            >
              Ahora no
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 500 }}
          >
            <Button
              variant="contained"
              color="primary"
              onClick={handleStartTutorial}
              size="small"
            >
              Iniciar tutorial
            </Button>
          </motion.div>
        </Box>
      </MotionPaper>
      )}
    </AnimatePresence>
  );
};

export default WelcomeMessage;