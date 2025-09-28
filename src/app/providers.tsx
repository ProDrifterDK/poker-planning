'use client';

import { ReactNode, useEffect } from 'react';
import { ThemeProviderWrapper } from '../context/themeContext';
import { AuthProvider } from '../context/authContext';
import { LanguageProvider } from '../context/languageContext';
import ClientOnly from '@/components/ClientOnly';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n-client';
import AOS from 'aos';
import 'aos/dist/aos.css';

export default function Providers({
    children,
    lang
}: {
    children: ReactNode;
    lang?: string;
}) {
    // Inicializar i18n cuando el componente se monta
    useEffect(() => {
        // Obtener el idioma preferido del usuario desde la cookie
        const getCookie = (name: string) => {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop()?.split(';').shift();
            return null;
        };
        
        // Obtener el idioma del navegador
        const getNavigatorLanguage = () => {
            if (typeof window !== 'undefined') {
                const browserLang = window.navigator.language.split('-')[0];
                return ['es', 'en'].includes(browserLang) ? browserLang : null;
            }
            return null;
        };
        
        const localeCookie = getCookie('NEXT_LOCALE');
        const navigatorLang = getNavigatorLanguage();
        
        // Determinar qué idioma usar (orden de prioridad)
        let targetLang = i18n.language;
        
        // 1. Si hay una cookie, usarla primero
        if (localeCookie && ['es', 'en'].includes(localeCookie)) {
            targetLang = localeCookie;
        }
        // 2. Si no hay cookie pero hay un idioma en la URL, usarlo
        else if (lang && ['es', 'en'].includes(lang)) {
            targetLang = lang;
        }
        // 3. Si no hay cookie ni idioma en la URL, usar el idioma del navegador
        else if (navigatorLang) {
            targetLang = navigatorLang;
        }
        
        // Cambiar el idioma si es necesario
        if (i18n.language !== targetLang) {
            i18n.changeLanguage(targetLang);
        }
        
        // Guardar el idioma en una cookie para futuras visitas
        document.cookie = `NEXT_LOCALE=${targetLang}; path=/; max-age=31536000; SameSite=Lax`;
        
        // Si hay una discrepancia entre la URL y el idioma seleccionado, actualizar la URL sin recargar
        if (lang && lang !== targetLang && typeof window !== 'undefined') {
            const pathname = window.location.pathname;
            const segments = pathname.split('/');
            if (segments.length > 1) {
                segments[1] = targetLang;
                const newPath = segments.join('/');
                // Usar replaceState para evitar recargar la página
                window.history.replaceState(null, '', newPath);

                // Disparar un evento personalizado para notificar a los componentes que el idioma ha cambiado
                const event = new CustomEvent('languageChanged', { detail: { language: targetLang } });
                window.dispatchEvent(event);
            }
        }

        // Initialize AOS (Animate On Scroll)
        AOS.init({
            duration: 600,
            easing: 'ease-out-cubic',
            once: true,
            offset: 100,
            delay: 0,
        });
    }, [lang]);
    
    return (
        <I18nextProvider i18n={i18n}>
            <LanguageProvider>
                <ThemeProviderWrapper>
                    <ClientOnly>
                        <AuthProvider>
                            {children}
                        </AuthProvider>
                    </ClientOnly>
                </ThemeProviderWrapper>
            </LanguageProvider>
        </I18nextProvider>
    );
}
