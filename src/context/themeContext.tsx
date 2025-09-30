'use client';

import { createContext, useState, useMemo, useContext, ReactNode } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { ThemeProvider as EmotionThemeProvider } from '@emotion/react';
import CssBaseline from '@mui/material/CssBaseline';
import { lightTheme, darkTheme, lightEmotionTheme, darkEmotionTheme } from '../styles/theme';
import { EmotionTheme } from '../types/theme';

// Extend the Emotion theme interface
declare module '@emotion/react' {
  export interface Theme extends EmotionTheme {
    colors: EmotionTheme['colors'];
    typography: EmotionTheme['typography'];
    spacing: EmotionTheme['spacing'];
    borderRadius: EmotionTheme['borderRadius'];
    shadows: EmotionTheme['shadows'];
  }
}

type ThemeContextType = {
    toggleTheme: () => void;
    mode: 'light' | 'dark';
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProviderWrapper = ({ children }: { children: ReactNode }) => {
    // Inicializar el tema desde localStorage o usar 'light' como valor predeterminado
    const [mode, setMode] = useState<'light' | 'dark'>(() => {
        // Solo ejecutar en el cliente
        if (typeof window !== 'undefined') {
            const savedTheme = localStorage.getItem('theme-mode');
            return (savedTheme === 'dark' || savedTheme === 'light') ? savedTheme : 'light';
        }
        return 'light';
    });

    const toggleTheme = () => {
        setMode((prevMode) => {
            const newMode = prevMode === 'light' ? 'dark' : 'light';
            // Guardar en localStorage
            if (typeof window !== 'undefined') {
                localStorage.setItem('theme-mode', newMode);
            }
            return newMode;
        });
    };

    const muiTheme = useMemo(() => (mode === 'light' ? lightTheme : darkTheme), [mode]);
    const emotionTheme = useMemo(() => (mode === 'light' ? lightEmotionTheme : darkEmotionTheme), [mode]);

    return (
        <ThemeContext.Provider value={{ toggleTheme, mode }}>
            <ThemeProvider theme={muiTheme}>
                <EmotionThemeProvider theme={emotionTheme}>
                    <CssBaseline />
                    {children}
                </EmotionThemeProvider>
            </ThemeProvider>
        </ThemeContext.Provider>
    );
};

export const useThemeMode = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useThemeMode debe ser usado dentro de ThemeProviderWrapper');
    }
    return context;
};
