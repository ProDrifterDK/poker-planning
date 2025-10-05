"use client";

import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Snackbar, Button, Box, Typography, Link } from "@mui/material";
import { useErrorStore, ErrorType } from "@/store/errorStore";
import NextLink from 'next/link';

interface ErrorDisplayProps {
  // Si se proporciona, solo mostrará errores de estos tipos
  filterTypes?: ErrorType[];
  // Si es true, mostrará el error en un Snackbar, de lo contrario, en un Alert
  useSnackbar?: boolean;
  // Duración del Snackbar en ms (por defecto 6000ms)
  duration?: number;
  // Si es true, mostrará un botón para la acción de recuperación
  showRecoveryButton?: boolean;
  // Texto del botón de recuperación
  recoveryButtonText?: string;
  // Si es true, mostrará detalles adicionales del error (útil para desarrollo)
  showDetails?: boolean;
}

export default function ErrorDisplay({
  filterTypes,
  useSnackbar = true,
  duration = 6000,
  showRecoveryButton = true,
  recoveryButtonText,
  showDetails = false,
}: ErrorDisplayProps) {
  const { currentError, clearError } = useErrorStore();
  const { t } = useTranslation('common');
  
  // Si no se proporciona un texto para el botón de recuperación, usar el valor por defecto traducido
  const defaultRecoveryButtonText = t('errors.retry');
  const finalRecoveryButtonText = recoveryButtonText || defaultRecoveryButtonText;

  // Limpiar el error cuando el componente se desmonte
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  // Si no hay error o el error no está en los tipos filtrados, no mostrar nada
  if (!currentError) return null;
  if (filterTypes && !filterTypes.includes(currentError.type)) return null;

  // Función para detectar si el error está relacionado con bloqueadores de anuncios
  const isAdBlockerRelatedError = () => {
    if (!currentError) return false;
    
    // Verificar el mensaje de error
    if (currentError.message.includes('bloqueador de anuncios') ||
        currentError.message.includes('ERR_BLOCKED_BY')) {
      return true;
    }
    
    // Verificar los detalles del error
    if (currentError.details) {
      const detailsStr = typeof currentError.details === 'object'
        ? JSON.stringify(currentError.details)
        : String(currentError.details);
      
      if (detailsStr.includes('ERR_BLOCKED_BY') ||
          detailsStr.includes('network error') ||
          detailsStr.includes('failed to fetch')) {
        return true;
      }
    }
    
    return false;
  };

  // Contenido del error
  const errorContent = (
    <React.Fragment>
      <Typography variant="body1" fontWeight="bold">
        {currentError.message}
      </Typography>

      {showDetails && currentError.details !== undefined && currentError.details !== null && (
        <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
          {typeof currentError.details === 'object'
            ? JSON.stringify(currentError.details)
            : String(currentError.details)}
        </Typography>
      )}

      {/* Mostrar enlace a la documentación si el error está relacionado con bloqueadores de anuncios */}
      {isAdBlockerRelatedError() && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2">
            {t('errors.checkOur')}{' '}
            <Link component={NextLink} href="/docs/troubleshooting" color="primary" underline="always">
              {t('errors.troubleshootingGuide')}
            </Link>
            {' '}{t('errors.toSolveThisProblem')}.
          </Typography>
        </Box>
      )}

      {showRecoveryButton && currentError.recoveryAction && (
        <Button
          onClick={() => {
            currentError.recoveryAction?.();
            clearError();
          }}
          size="small"
          sx={{ mt: 1 }}
        >
          {finalRecoveryButtonText}
        </Button>
      )}
    </React.Fragment>
  );

  // Si se usa Snackbar, envolver el contenido en un Snackbar
  if (useSnackbar) {
    return (
      <Snackbar
        open={!!currentError}
        autoHideDuration={duration}
        onClose={() => clearError()}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={getSeverity(currentError.type)}
          onClose={() => clearError()}
          sx={{ width: "100%" }}
        >
          {errorContent}
        </Alert>
      </Snackbar>
    );
  }

  // Si no se usa Snackbar, mostrar un Alert normal
  return (
    <Box sx={{ mb: 2, width: "100%" }}>
      <Alert
        severity={getSeverity(currentError.type)}
        onClose={() => clearError()}
      >
        {errorContent}
      </Alert>
    </Box>
  );
}

// Función para determinar la severidad del Alert según el tipo de error
function getSeverity(errorType: ErrorType): "error" | "warning" | "info" | "success" {
  switch (errorType) {
    case ErrorType.NETWORK_ERROR:
    case ErrorType.SERVER_ERROR:
    case ErrorType.AUTH_ERROR:
    case ErrorType.UNAUTHORIZED:
    case ErrorType.ROOM_NOT_FOUND:
    case ErrorType.ROOM_CREATION_FAILED:
    case ErrorType.UNKNOWN_ERROR:
      return "error";

    case ErrorType.TIMEOUT_ERROR:
    case ErrorType.JOIN_ROOM_FAILED:
    case ErrorType.VOTE_FAILED:
      return "warning";

    case ErrorType.DATA_NOT_FOUND:
    case ErrorType.INVALID_DATA:
    case ErrorType.VALIDATION_ERROR:
      return "info";

    default:
      return "error";
  }
}