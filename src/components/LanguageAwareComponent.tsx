'use client';

import React, { ReactNode, useState, useEffect } from 'react';
import { useLanguage } from '@/context/languageContext';
import { useTranslation } from 'react-i18next';

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
  const [renderKey, setRenderKey] = useState(0);
  const { i18n } = useTranslation();
  const lastLanguageRef = React.useRef(i18n.language);

  // Usar un solo efecto para manejar todos los cambios de idioma
  useEffect(() => {
    // Evitar actualizaciones duplicadas
    if (lastLanguageRef.current !== i18n.language) {
      lastLanguageRef.current = i18n.language;
      setRenderKey(prev => prev + 1);
    }
  }, [i18n.language, language]);

  // Si se proporciona una función render, usarla para renderizar el contenido
  if (render) {
    return <>{render(language)}</>;
  }

  // De lo contrario, simplemente renderizar los children
  return <>{children}</>;
}