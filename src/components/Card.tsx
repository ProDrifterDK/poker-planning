'use client';

import { Box, SxProps, Typography } from '@mui/material';

interface CardProps {
    value?: number | string;
    selected: boolean;
    onClick: () => void;
    flipped: boolean; // Determina si la carta está volteada
    sx?: SxProps;
    noSelection: boolean; // Para manejar el estado de "sin carta seleccionada"
}

export default function Card({
    value,
    selected,
    onClick,
    flipped,
    sx,
    noSelection,
}: CardProps) {
    return (
        <Box
            onClick={onClick}
            sx={{
                width: 100,
                height: 150,
                perspective: '1000px',
                cursor: 'pointer',
                ...sx,
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
                        backgroundColor: noSelection ? '#e0e0e0' : '#ffffff', // Gris si no hay selección
                        borderRadius: 5,
                        boxShadow: selected
                            ? '0px 4px 12px rgba(255, 152, 0, 0.7)'
                            : '0px 4px 8px rgba(0, 0, 0, 0.2)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: selected ? '3px solid #ff9800' : '1px solid #ccc',
                    }}
                >
                    {/* Decoración superior izquierda */}
                    {value !== undefined && (
                        <Box
                            sx={{
                                position: 'absolute',
                                top: 8,
                                left: 8,
                                fontSize: '14px',
                                fontWeight: 'bold',
                                color: '#555',
                            }}
                        >
                            {value}
                        </Box>
                    )}

                    {/* Valor central */}
                    {value !== undefined && (
                        <Typography
                            variant="h3"
                            sx={{
                                fontWeight: 'bold',
                                color: '#333',
                                textAlign: 'center',
                                fontFamily: 'serif',
                            }}
                        >
                            {value}
                        </Typography>
                    )}

                    {/* Decoración inferior derecha */}
                    {value !== undefined && (
                        <Box
                            sx={{
                                position: 'absolute',
                                bottom: 8,
                                right: 8,
                                fontSize: '14px',
                                fontWeight: 'bold',
                                color: '#555',
                                transform: 'rotate(180deg)',
                            }}
                        >
                            {value}
                        </Box>
                    )}
                </Box>

                {/* Reverso de la carta */}
                <Box
                    sx={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        backfaceVisibility: 'hidden',
                        backgroundColor: '#1976d2',
                        borderRadius: 5,
                        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
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