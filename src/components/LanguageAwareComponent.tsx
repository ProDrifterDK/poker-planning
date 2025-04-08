'use client';

import React, { ReactNode, useState, useEffect } from 'react';
import { useLanguage } from '@/context/languageContext';

interface LanguageAwareComponentProps {
  children: ReactNode;
  render?: (language: string) => ReactNode;
}

/**
 * Componente que se vuelve a renderizar cuando cambia el idioma
 * Puede usarse de dos formas:
 * 1. Como un wrapper alrededor de componentes que necesitan actualizarse cuando cambia el idioma
 * 2. Con una función render que recibe el idioma actual y devuelve el contenido a renderizar
 */
export default function LanguageAwareComponent({ children, render }: LanguageAwareComponentProps) {
  const { language } = useLanguage();
  const [, setRenderKey] = useState(0);

  // Forzar re-renderizado cuando cambia el idioma
  useEffect(() => {
    setRenderKey(prev => prev + 1);
  }, [language]);

  // Si se proporciona una función render, usarla para renderizar el contenido
  if (render) {
    return <>{render(language)}</>;
  }

  // De lo contrario, simplemente renderizar los children
  return <>{children}</>;
}