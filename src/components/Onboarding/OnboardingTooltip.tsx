"use client";

import React from 'react';
import {
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    Typography,
    IconButton
} from '@mui/material';
import { motion } from 'framer-motion';
import { AnimatePresence } from 'framer-motion';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useOnboardingStore, OnboardingStep } from '@/store/onboardingStore';

// Componentes de motion
const MotionCard = motion.create(Card);

// Un componente básico para el tutorial interactivo sin manipulación del DOM
const BasicOnboardingTooltip: React.FC = () => {
    const {
        isActive,
        currentStep,
        steps,
        nextStep,
        previousStep,
        skipOnboarding,
        completeOnboarding
    } = useOnboardingStore();

    // Si no está activo o no hay paso actual, no mostrar nada
    if (!isActive || !currentStep) {
        return null;
    }

    const currentStepConfig = steps[currentStep];
    const isFirstStep = currentStep === OnboardingStep.WELCOME;
    const isLastStep = currentStep === OnboardingStep.COMPLETED;

    // Función para manejar el clic en el botón siguiente
    const handleNextClick = () => {
        // Usar setTimeout para evitar problemas de sincronización
        setTimeout(() => {
            nextStep();
        }, 50);
    };

    // Función para manejar el clic en el botón anterior
    const handlePreviousClick = () => {
        // Usar setTimeout para evitar problemas de sincronización
        setTimeout(() => {
            previousStep();
        }, 50);
    };

    // Función para manejar el clic en el botón de cerrar
    const handleSkipClick = () => {
        // Usar setTimeout para evitar problemas de sincronización
        setTimeout(() => {
            skipOnboarding();
        }, 50);
    };

    // Función para manejar el clic en el botón de finalizar
    const handleCompleteClick = () => {
        // Usar setTimeout para evitar problemas de sincronización
        setTimeout(() => {
            completeOnboarding();
        }, 50);
    };

    return (
        <AnimatePresence>
            {isActive && (
                <MotionCard
                    initial={{ opacity: 0, scale: 0.8, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 20 }}
                    transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 25
                    }}
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
                    }}
                >
                <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1, duration: 0.3 }}
                        >
                            <Typography variant="h6" component="h2">
                                {currentStepConfig.title}
                            </Typography>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, rotate: -90 }}
                            animate={{ opacity: 1, rotate: 0 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            whileHover={{ rotate: 90, scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <IconButton
                                size="small"
                                onClick={handleSkipClick}
                                aria-label="Cerrar tutorial"
                            >
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </motion.div>
                    </Box>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.3 }}
                    >
                        <Typography variant="body2" color="text.secondary">
                            {currentStepConfig.description}
                        </Typography>
                    </motion.div>
                </CardContent>

                <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                    <motion.div
                        whileHover={{ x: -3 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Button
                            startIcon={<ArrowBackIcon />}
                            onClick={handlePreviousClick}
                            disabled={isFirstStep}
                            size="small"
                        >
                            Anterior
                        </Button>
                    </motion.div>

                    {isLastStep ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1, type: "spring" }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleCompleteClick}
                                size="small"
                            >
                                Finalizar
                            </Button>
                        </motion.div>
                    ) : (
                        <motion.div
                            whileHover={{ x: 3 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Button
                                endIcon={<ArrowForwardIcon />}
                                variant="contained"
                                color="primary"
                                onClick={handleNextClick}
                                size="small"
                            >
                                {isFirstStep ? 'Comenzar' : 'Siguiente'}
                            </Button>
                        </motion.div>
                    )}
                </CardActions>
                </MotionCard>
            )}
        </AnimatePresence>
    );
};

export default BasicOnboardingTooltip;