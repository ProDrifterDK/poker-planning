'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

// Definir el tipo para el contexto
interface LanguageContextType {
  language: string;
  changeLanguage: (newLanguage: string) => void;
}

// Crear el contexto
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Hook personalizado para usar el contexto
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Proveedor del contexto
export function LanguageProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const [language, setLanguage] = useState(i18n.language);

  // Función para cambiar el idioma
  const changeLanguage = (newLanguage: string) => {
    i18n.changeLanguage(newLanguage);
    setLanguage(newLanguage);
  };

  // Escuchar cambios de idioma desde otros componentes
  useEffect(() => {
    const handleLanguageChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.language) {
        setLanguage(customEvent.detail.language);
      }
    };

    window.addEventListener('languageChanged', handleLanguageChange);
    
    // También escuchar cambios directamente desde i18n
    const handleI18nLanguageChange = () => {
      setLanguage(i18n.language);
    };
    
    i18n.on('languageChanged', handleI18nLanguageChange);

    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange);
      i18n.off('languageChanged', handleI18nLanguageChange);
    };
  }, [i18n]);

  return (
    <LanguageContext.Provider value={{ language, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}