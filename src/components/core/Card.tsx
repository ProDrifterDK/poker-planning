'use client';

import { SxProps, Typography, useTheme, useMediaQuery } from '@mui/material';
import { motion, easeOut } from 'framer-motion';
import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';

// Creamos versiones de motion de los componentes que necesitamos
const MotionBox = motion.create(Box);

interface CardProps {
    value?: number | string;
    selected: boolean;
    onClick: () => void;
    flipped: boolean; // Determina si la carta está volteada
    sx?: SxProps;
    noSelection: boolean; // Para manejar el estado de "sin carta seleccionada"
    showCorners?: boolean; // true/false para decidir si mostrar esquinas
    fontSize?: string | number; // <-- nuevo prop para tamaño de fuente
    reveal?: boolean; // Para saber si estamos en estado de revelación
}

export default function Card({
    value,
    selected,
    onClick,
    flipped,
    sx,
    noSelection,
    showCorners = true,
    fontSize = '2.5rem',
    reveal = false
}: CardProps) {
    const theme = useTheme();
    // Usamos useMediaQuery para detectar si estamos en un dispositivo móvil
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { t } = useTranslation('room');

    // Obtenemos la paleta custom de "card"
    const cardPalette = theme.palette.card || {};

    // Definimos las variantes de animación para diferentes estados
    const containerVariants = {
        initial: {
            opacity: 0,
            y: 20,
        },
        animate: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.3,
                ease: easeOut
            }
        },
        hover: {
            y: -10,
            transition: {
                duration: 0.2,
                ease: easeOut
            }
        },
        tap: {
            scale: 0.95,
            transition: {
                duration: 0.1
            }
        }
    };

    // Variantes para la carta interna
    const cardVariants = {
        flipped: { rotateY: 180 },
        unflipped: { rotateY: 0 }
    };

    // Variantes para la selección
    const selectionVariants = {
        selected: {
            scale: 1.05,
            boxShadow: theme.shadows[4],
            // No animamos borderWidth ya que no es animable
        },
        unselected: {
            scale: 1,
            boxShadow: theme.shadows[1],
            // No animamos borderWidth ya que no es animable
        }
    };

    return (
        <MotionBox
            onClick={onClick}
            initial="initial"
            animate="animate"
            whileHover="hover"
            whileTap="tap"
            variants={containerVariants}
            role="button"
            aria-pressed={selected}
            aria-label={value ? `Carta con valor ${value}` : 'Carta sin valor'}
            tabIndex={0}
            sx={{
                width: isMobile ? 70 : 100,
                height: isMobile ? 105 : 150,
                perspective: '1000px',
                cursor: 'pointer',
                ...sx, // sx del prop, sobrescribe lo anterior
            }}
        >
            <MotionBox
                animate={flipped ? "flipped" : "unflipped"}
                variants={cardVariants}
                transition={{ duration: 0.6, type: "spring", stiffness: 300, damping: 20 }}
                sx={{
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                    textAlign: 'center',
                    transformStyle: 'preserve-3d',
                }}
            >
                {/* Frente de la carta */}
                <MotionBox
                    animate={selected ? "selected" : "unselected"}
                    variants={selectionVariants}
                    transition={{ duration: 0.2 }}
                    sx={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        backfaceVisibility: 'hidden',
                        backgroundColor: noSelection
                            ? 'transparent' // Transparente cuando no hay selección
                            : reveal
                            ? theme.palette.background.paper // Blanco cuando se revelan las cartas
                            : cardPalette.defaultBg, // Color por defecto cuando está seleccionado pero no revelado

                        borderRadius: 2,  // 1 = 4px en MUI spacing
                        boxShadow: noSelection
                            ? 'none' // Sin sombra cuando no hay selección
                            : selected
                            ? cardPalette.boxShadowSelected
                            : cardPalette.boxShadow,

                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',

                        // Aplicamos el borde según el estado
                        border: noSelection
                            ? `2px dashed ${theme.palette.warning.main}` // Borde amarillento discontinuo cuando no hay selección
                            : selected
                            ? `3px solid ${cardPalette.borderSelected}`
                            : `1px solid ${cardPalette.border}`,
                    }}
                >
                    {(value !== undefined || (!noSelection && !reveal)) && (
                        <>
                            {/* Valor central */}
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 500,
                                    damping: 15
                                }}
                            >
                                <Typography
                                    // Usamos fontSize (prop) y color de la paleta
                                    sx={{
                                        fontWeight: 'bold',
                                        textAlign: 'center',
                                        fontFamily: 'serif',
                                        fontSize: isMobile ? `calc(${fontSize} * 0.7)` : fontSize,
                                        color: noSelection
                                            ? theme.palette.warning.main // Color amarillento cuando no hay selección
                                            : reveal
                                            ? theme.palette.text.primary // Color de texto normal cuando se revela
                                            : cardPalette.text || theme.palette.text.primary,
                                    }}
                                >
                                    {/* Mostrar "?" cuando está seleccionado pero no revelado, o el valor real cuando está revelado */}
                                    {reveal ? value : (!noSelection ? '?' : '')}
                                </Typography>
                            </motion.div>

                            {/* Muestra esquinas solo si showCorners === true y estamos revelando */}
                            {showCorners && reveal && value && (
                                <>
                                    {/* Decoración superior izquierda */}
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1, duration: 0.3 }}
                                        style={{
                                            position: 'absolute',
                                            top: isMobile ? 5 : 8,
                                            left: isMobile ? 5 : 8,
                                            fontSize: isMobile ? 10 : 14,
                                            fontWeight: 'bold',
                                            color: theme.palette.text.primary,
                                        }}
                                    >
                                        {value}
                                    </motion.div>

                                    {/* Decoración inferior derecha */}
                                    <motion.div
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1, duration: 0.3 }}
                                        style={{
                                            position: 'absolute',
                                            bottom: isMobile ? 5 : 8,
                                            right: isMobile ? 5 : 8,
                                            fontSize: isMobile ? 10 : 14,
                                            fontWeight: 'bold',
                                            color: theme.palette.text.primary,
                                            transform: 'rotate(180deg)',
                                        }}
                                    >
                                        {value}
                                    </motion.div>
                                </>
                            )}
                            
                            {/* Mostrar texto de placeholder cuando no hay selección */}
                            {noSelection && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0.5 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <Typography
                                        sx={{
                                            fontSize: isMobile ? '0.7rem' : '0.875rem',
                                            color: theme.palette.warning.main,
                                            opacity: 0.7,
                                        }}
                                    >
                                        {t('cards.noSelection') || 'No vote'}
                                    </Typography>
                                </motion.div>
                            )}
                        </>
                    )}
                </MotionBox>

                {/* Reverso de la carta */}
                <MotionBox
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    sx={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        backfaceVisibility: 'hidden',
                        backgroundColor: 'transparent',
                        borderRadius: 2,
                        boxShadow: cardPalette.boxShadow,
                        transform: 'rotateY(180deg)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        color: theme.palette.primary.contrastText,
                        fontWeight: 'bold',
                        fontSize: '18px',
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{
                            delay: 0.3,
                            type: "spring",
                            stiffness: 400,
                            damping: 10
                        }}
                        aria-hidden="false"
                        role="img"
                        aria-label={t('cards.backOfCard')}
                        style={{
                            position: 'relative',
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        {/* Logo SVG como imagen a pantalla completa */}
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            padding: '0' // Eliminamos el padding para que ocupe todo el espacio
                        }}>
                            <Image
                                src="/images/logo/logo.svg"
                                alt="Planning Poker Pro Logo"
                                fill
                                style={{
                                    objectFit: 'fill',
                                    width: '100%',
                                    height: '100%'
                                }}
                                priority
                            />
                        </div>
                        {/* Texto oculto para lectores de pantalla */}
                        <span className="sr-only" style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', borderWidth: 0 }}>
                            {t('cards.backOfCard')}
                        </span>
                    </motion.div>
                </MotionBox>
            </MotionBox>
        </MotionBox>
    );
}
