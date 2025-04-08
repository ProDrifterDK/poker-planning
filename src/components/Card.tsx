'use client';

import { SxProps, Typography, useTheme, useMediaQuery } from '@mui/material';
import { motion } from 'framer-motion';
import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';

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
}

export default function Card({
    value,
    selected,
    onClick,
    flipped,
    sx,
    noSelection,
    showCorners = true,
    fontSize = '2.5rem'
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
                ease: "easeOut"
            }
        },
        hover: {
            y: -10,
            transition: {
                duration: 0.2,
                ease: "easeOut"
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
            boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.2)",
            // No animamos borderWidth ya que no es animable
        },
        unselected: {
            scale: 1,
            boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.1)",
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
                            ? cardPalette.noSelectionBg
                            : cardPalette.defaultBg,

                        borderRadius: 2,  // 1 = 4px en MUI spacing
                        boxShadow: selected
                            ? cardPalette.boxShadowSelected
                            : cardPalette.boxShadow,

                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',

                        // Aplicamos el borde directamente sin animarlo
                        border: selected
                            ? `3px solid ${cardPalette.borderSelected}`
                            : `1px solid ${cardPalette.border}`,
                    }}
                >
                    {value !== undefined && (
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
                                        color: cardPalette.text || '#000000', // Asegurar alto contraste
                                    }}
                                >
                                    {value}
                                </Typography>
                            </motion.div>

                            {/* Muestra esquinas solo si showCorners === true */}
                            {showCorners && (
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
                                            color: cardPalette.text || '#000000', // Asegurar alto contraste
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
                                            color: cardPalette.text || '#000000', // Asegurar alto contraste
                                            transform: 'rotate(180deg)',
                                        }}
                                    >
                                        {value}
                                    </motion.div>
                                </>
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
                        backgroundColor: theme.palette.primary.main,
                        borderRadius: 2,
                        boxShadow: cardPalette.boxShadow,
                        transform: 'rotateY(180deg)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        color: '#ffffff',
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
                    >
                        PPP
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
