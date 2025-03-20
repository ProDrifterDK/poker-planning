'use client';

import { ReactNode } from 'react';
import { ThemeProviderWrapper } from '../context/themeContext';
import { AuthProvider } from '../context/authContext';
import ClientOnly from '@/components/ClientOnly';

export default function Providers({ children }: { children: ReactNode }) {
    return (
        <ThemeProviderWrapper>
            <ClientOnly>
                <AuthProvider>
                    {children}
                </AuthProvider>
            </ClientOnly>
        </ThemeProviderWrapper>
    );
}
