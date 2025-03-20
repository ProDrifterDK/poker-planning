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
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 30,
            duration: 0.3
          }}
          elevation={3}
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            width: { xs: '90%', sm: 400 },
            p: 3,
            borderRadius: 2,
            zIndex: 1000,
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: theme.shadows[5],
          }}
        >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <Typography
              variant="h6"
              component="h2"
              sx={{
                fontWeight: 'bold',
                color: theme.palette.primary.main
              }}
            >
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
              sx={{
                color: theme.palette.grey[500],
                '&:hover': {
                  color: theme.palette.primary.main,
                  backgroundColor: theme.palette.grey[100]
                }
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </motion.div>
        </Box>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <Typography
            variant="body1"
            paragraph
            sx={{
              color: theme.palette.text.secondary,
              lineHeight: 1.6,
              mb: 3
            }}
          >
            Parece que es tu primera vez aquí. ¿Te gustaría un recorrido rápido por las principales funcionalidades?
          </Typography>
        </motion.div>
        
        <Box display="flex" justifyContent="space-between" gap={2} mt={3}>
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Button
              variant="outlined"
              color="inherit"
              onClick={handleClose}
              size="medium"
              fullWidth
              sx={{
                borderRadius: 1.5,
                textTransform: 'none',
                fontWeight: 'medium',
                px: 2
              }}
            >
              Ahora no
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 500 }}
          >
            <Button
              variant="contained"
              color="primary"
              onClick={handleStartTutorial}
              size="medium"
              fullWidth
              sx={{
                borderRadius: 1.5,
                textTransform: 'none',
                fontWeight: 'bold',
                px: 2,
                boxShadow: 2
              }}
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