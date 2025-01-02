'use client';

import { Box, SxProps, Typography, useTheme } from '@mui/material';

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

    return (
        <Box
            onClick={onClick}
            sx={{
                width: 100,
                height: 150,
                perspective: '1000px',
                cursor: 'pointer',
                ...sx, // sx del prop, sobrescribe lo anterior
            }}
        >
            <Box
                sx={{
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                    textAlign: 'center',
                    transformStyle: 'preserve-3d',
                    transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    transition: 'transform 0.6s',
                }}
            >
                {/* Frente de la carta */}
                <Box
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

                            {/* Muestra esquinas solo si showCorners === true */}
                            {showCorners && (
                                <>
                                    {/* Decoración superior izquierda */}
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            top: 8,
                                            left: 8,
                                            fontSize: 14,
                                            fontWeight: 'bold',
                                            color: cardPalette.text,
                                        }}
                                    >
                                        {value}
                                    </Box>

                                    {/* Decoración inferior derecha */}
                                    <Box
                                        sx={{
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
                                    </Box>
                                </>
                            )}
                        </>
                    )}
                </Box>

                {/* Reverso de la carta */}
                <Box
                    sx={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        backfaceVisibility: 'hidden',
                        backgroundColor: theme.palette.primary.main,
                        borderRadius: 1,
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
                    PPP
                </Box>
            </Box>
        </Box>
    );
}
