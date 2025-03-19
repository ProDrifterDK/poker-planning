"use client";

import React from 'react';
import {
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    Typography,
    IconButton,
    Fade
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useOnboardingStore, OnboardingStep } from '@/store/onboardingStore';

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
        <Fade in={isActive}>
            <Card
                sx={{
                    position: 'fixed',
                    zIndex: 1500,
                    width: 320,
                    maxWidth: '90vw',
                    boxShadow: 3,
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                }}
            >
                <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="h6" component="h2">
                            {currentStepConfig.title}
                        </Typography>
                        <IconButton
                            size="small"
                            onClick={handleSkipClick}
                            aria-label="Cerrar tutorial"
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>

                    <Typography variant="body2" color="text.secondary">
                        {currentStepConfig.description}
                    </Typography>
                </CardContent>

                <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={handlePreviousClick}
                        disabled={isFirstStep}
                        size="small"
                    >
                        Anterior
                    </Button>

                    {isLastStep ? (
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleCompleteClick}
                            size="small"
                        >
                            Finalizar
                        </Button>
                    ) : (
                        <Button
                            endIcon={<ArrowForwardIcon />}
                            variant="contained"
                            color="primary"
                            onClick={handleNextClick}
                            size="small"
                        >
                            {isFirstStep ? 'Comenzar' : 'Siguiente'}
                        </Button>
                    )}
                </CardActions>
            </Card>
        </Fade>
    );
};

export default BasicOnboardingTooltip;