'use client';

import { SxProps, Typography, useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import { Box } from '@mui/material';

// Creamos versiones de motion de los componentes que necesitamos
const MotionBox = motion(Box);

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
            borderWidth: 3
        },
        unselected: {
            scale: 1,
            boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.1)",
            borderWidth: 1
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
            sx={{
                width: 100,
                height: 150,
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
                                        fontSize: fontSize,
                                        color: cardPalette.text,
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
                                            top: 8,
                                            left: 8,
                                            fontSize: 14,
                                            fontWeight: 'bold',
                                            color: cardPalette.text,
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
                                            bottom: 8,
                                            right: 8,
                                            fontSize: 14,
                                            fontWeight: 'bold',
                                            color: cardPalette.text,
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
                    >
                        PPP
                    </motion.div>
                </MotionBox>
            </MotionBox>
        </MotionBox>
    );
}
