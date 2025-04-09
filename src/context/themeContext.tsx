'use client';

import { createContext, useState, useMemo, useContext, ReactNode } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { lightTheme, darkTheme } from '../styles/theme';

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

    const theme = useMemo(() => (mode === 'light' ? lightTheme : darkTheme), [mode]);

    return (
        <ThemeContext.Provider value={{ toggleTheme, mode }}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                {children}
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
