"use client";

import React from "react";
import {
    Button,
    IconButton,
    Tooltip,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { useOnboardingStore } from "@/store/onboardingStore";
import { useTranslation } from "react-i18next";

interface OnboardingButtonProps {
    variant?: "icon" | "text";
    color?: "primary" | "secondary" | "info" | "inherit";
    size?: "small" | "medium" | "large";
    showTooltip?: boolean;
}

const OnboardingButton: React.FC<OnboardingButtonProps> = ({
    variant = "icon",
    color = "primary",
    size = "medium",
    showTooltip = true,
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const { startOnboarding, resetOnboarding, hasCompletedOnboarding } = useOnboardingStore();
    const { t } = useTranslation('common');

    // Función para reiniciar el tutorial
    const handleStartTutorial = () => {
        // Primero resetear el estado del tutorial, pero mantener el estado de completado
        // para evitar que se muestre el mensaje de bienvenida
        resetOnboarding(true);
        // Luego iniciar el tutorial después de un breve retraso
        setTimeout(() => {
            startOnboarding();
        }, 50);
    };

    // Si el usuario ya completó el tutorial y estamos en móvil, no mostrar el botón
    // para ahorrar espacio en pantallas pequeñas
    if (hasCompletedOnboarding && isMobile && variant === "icon") {
        return null;
    }

    // Determinar el texto del botón
    const buttonText = hasCompletedOnboarding
        ? t('tutorial.viewAgain', 'Ver tutorial de nuevo')
        : t('tutorial.interactive', 'Tutorial interactivo');

    // Renderizar un botón de icono o un botón de texto según la variante
    if (variant === "icon") {
        const button = (
            <IconButton
                color={color}
                size={size}
                onClick={handleStartTutorial}
                aria-label={buttonText}
                sx={{
                    textTransform: "none",
                    animation: hasCompletedOnboarding ? "none" : "pulse 2s infinite",
                    "@keyframes pulse": {
                        "0%": { boxShadow: `0 0 0 0 ${alpha(theme.palette.primary.main, 0.4)}` },
                        "70%": { boxShadow: `0 0 0 10px ${alpha(theme.palette.primary.main, 0)}` },
                        "100%": { boxShadow: `0 0 0 0 ${alpha(theme.palette.primary.main, 0)}` },
                    },
                }}
            >
                <HelpOutlineIcon />
            </IconButton>
        );

        return showTooltip ? (
            <Tooltip title={buttonText}>{button}</Tooltip>
        ) : (
            button
        );
    }

    // Botón de texto
    return (
        <Button
            variant="outlined"
            color={color}
            size={size}
            onClick={handleStartTutorial}
            startIcon={<HelpOutlineIcon />}
            sx={{ textTransform: "none" }}
        >
            {buttonText}
        </Button>
    );
};

export default OnboardingButton;
