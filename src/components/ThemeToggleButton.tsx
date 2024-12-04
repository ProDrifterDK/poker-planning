'use client';

import { IconButton, Tooltip } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { useThemeMode } from '../context/themeContext';

export default function ThemeToggleButton() {
    const { toggleTheme, mode } = useThemeMode();

    return (
        <Tooltip title={`Cambiar a ${mode === 'light' ? 'tema oscuro' : 'tema claro'}`}>
            <IconButton color="inherit" onClick={toggleTheme}>
                {mode === 'light' ? <Brightness4 /> : <Brightness7 />}
            </IconButton>
        </Tooltip>
    );
}
