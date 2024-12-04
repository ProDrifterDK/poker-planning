'use client';

import { ReactNode } from 'react';
import { ThemeProviderWrapper } from '../context/themeContext';

export default function Providers({ children }: { children: ReactNode }) {
    return (
        <ThemeProviderWrapper>
            {children}
        </ThemeProviderWrapper>
    );
}
