'use client';

import { IconButton, Tooltip } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { useThemeMode } from '../context/themeContext';
import { useTranslation } from 'react-i18next';

export default function ThemeToggleButton() {
    const { toggleTheme, mode } = useThemeMode();
    const { t } = useTranslation('common');

    return (
        <Tooltip title={t('theme.switchTo', {
            mode: mode === 'light'
                ? t('theme.dark')
                : t('theme.light')
        })}>
            <IconButton color="inherit" onClick={toggleTheme}>
                {mode === 'light' ? <Brightness4 /> : <Brightness7 />}
            </IconButton>
        </Tooltip>
    );
}
