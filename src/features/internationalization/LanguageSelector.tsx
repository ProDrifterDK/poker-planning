'use client';

import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import styled from '@emotion/styled';
import { i18n } from '../../../next-i18next.config.js';
import { useState, useEffect } from 'react';
import { useTheme } from '@emotion/react';
import { darkEmotionTheme } from '@/styles/theme';

// Styled components using Sleek Innovator design system
const LanguageSelectorContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  background-color: ${props => props.theme.colors.background.paper};
  padding: 4px 8px;
  border-radius: ${(props) => props.theme.shape.borderRadius}px;
  border: 1px solid ${props => props.theme.colors.border.main};
  transition: all 0.3s ease;
`;

const FlagContainer = styled.div<{ $isActive: boolean }>`
  opacity: ${props => props.$isActive ? 1 : 0.5};
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const SwitchContainer = styled.div`
  position: relative;
  width: 40px;
  height: 20px;
  margin: 0 4px;
`;

const SwitchTrack = styled.div<{ $isEnglish: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${props =>
    props.$isEnglish
      ? props.theme.colors.border.main
      : props.theme.colors.primary.main
  };
  border-radius: 10px;
  transition: all 0.3s ease;
`;

const SwitchThumb = styled.div<{ $isEnglish: boolean }>`
  position: absolute;
  top: 2px;
  left: ${props => props.$isEnglish ? '22px' : '2px'};
  width: 16px;
  height: 16px;
  background-color: ${(props) =>
    props.$isEnglish
      ? props.theme.colors.primary.main
      : props.theme.colors.text.secondary};
  border-radius: 50%;
  transition: all 0.3s ease;
  box-shadow: ${props => props.theme.shadows.small};
`;
export default function LanguageSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const { i18n: i18nInstance } = useTranslation();
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);
  const theme = useTheme();
  
  // Efecto para evitar múltiples cambios de idioma simultáneos
  useEffect(() => {
    if (isChangingLanguage) {
      const timer = setTimeout(() => {
        setIsChangingLanguage(false);
      }, 1000); // Bloquear cambios adicionales por 1 segundo
      
      return () => clearTimeout(timer);
    }
  }, [isChangingLanguage]);

  const changeLanguage = (newLocale: string) => {
    // Evitar cambios múltiples rápidos
    if (isChangingLanguage) return;
    setIsChangingLanguage(true);
    
    // Cambiar el idioma en i18next
    i18nInstance.changeLanguage(newLocale);
    
    // Guardar la preferencia en una cookie
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    
    // Disparar un evento personalizado para notificar a los componentes que el idioma ha cambiado
    const event = new CustomEvent('languageChanged', { detail: { language: newLocale } });
    window.dispatchEvent(event);
    
    // Actualizar la URL para reflejar el nuevo idioma sin recargar la página
    if (pathname) {
      try {
        const segments = pathname.split('/');
        if (segments.length > 1) {
          // Reemplazar el segmento del idioma en la URL
          segments[1] = newLocale;
          const newPath = segments.join('/');
          
          // Usar window.history.replaceState para cambiar la URL sin recargar la página
          window.history.replaceState({ locale: newLocale }, '', newPath);
        } else {
          // Si no hay segmento de idioma, simplemente añadirlo
          window.history.replaceState({ locale: newLocale }, '', `/${newLocale}${pathname}`);
        }
      } catch (error) {
        console.error('Error al actualizar la URL:', error);
      }
    }
  };
  
  // Manejar el cambio del switch
  const handleSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newLocale = event.target.checked ? 'en' : 'es';
    changeLanguage(newLocale);
  };
  
  const isEnglish = i18nInstance.language === 'en';
  
  return (
    <LanguageSelectorContainer>
      <FlagContainer $isActive={!isEnglish}>
        <Image
          src="/images/icons/spain-flag.webp"
          alt="Español"
          width={24}
          height={24}
          style={{ borderRadius: `${theme.shape.borderRadius}px` }}
        />
      </FlagContainer>

      {/* Custom Switch */}
      <SwitchContainer>
        <SwitchTrack $isEnglish={isEnglish} />
        <SwitchThumb $isEnglish={isEnglish} />
        <input
          type="checkbox"
          checked={isEnglish}
          onChange={handleSwitchChange}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            opacity: 0,
            cursor: 'pointer',
            zIndex: 1,
          }}
        />
      </SwitchContainer>

      <FlagContainer $isActive={isEnglish}>
        <Image
          src="/images/icons/britain-flag.webp"
          alt="English"
          width={24}
          height={24}
          style={{ borderRadius: `${theme.shape.borderRadius}px` }}
        />
      </FlagContainer>
    </LanguageSelectorContainer>
  );
}