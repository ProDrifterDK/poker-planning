'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { Box, useMediaQuery, useTheme as useMuiTheme } from '@mui/material';
import { useThemeMode } from '@/context/themeContext';

interface ClientLanguageSwitchProps {
  variant?: 'default' | 'menu';
  onLanguageChange?: () => void;
}

/**
 * Componente para cambiar el idioma sin recargar la página
 * Este componente es una alternativa a LanguageSelector que evita la recarga de la página
 * @param variant - 'default' para el header, 'menu' para el menú dropdown
 * @param onLanguageChange - Callback opcional que se ejecuta después de cambiar el idioma
 */
export default function ClientLanguageSwitch({
  variant = 'default',
  onLanguageChange
}: ClientLanguageSwitchProps) {
  const pathname = usePathname();
  const { i18n } = useTranslation();
  const { mode } = useThemeMode(); // Obtener el tema actual
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);
  
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
    
    console.log(`Changing language to ${newLocale} from ${i18n.language}`);
    
    // Cambiar el idioma en i18next
    i18n.changeLanguage(newLocale);
    
    // Guardar la preferencia en una cookie
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    
    // Guardar también en localStorage para mayor compatibilidad
    localStorage.setItem('i18nextLng', newLocale);
    
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
          
          console.log(`Updating URL from ${pathname} to ${newPath}`);
          
          // Usar window.history.replaceState para cambiar la URL sin recargar la página
          window.history.replaceState({ locale: newLocale }, '', newPath);
        } else {
          // Si no hay segmento de idioma, simplemente añadirlo
          const newPath = `/${newLocale}${pathname}`;
          console.log(`Updating URL from ${pathname} to ${newPath}`);
          window.history.replaceState({ locale: newLocale }, '', newPath);
        }
      } catch (error) {
        console.error('Error al actualizar la URL:', error);
      }
    }
    
    // Desbloquear cambios después de un tiempo
    setTimeout(() => {
      setIsChangingLanguage(false);
      
      // Llamar al callback si está definido
      if (onLanguageChange) {
        onLanguageChange();
      }
    }, 500);
  };
  
  // Manejar el cambio del switch
  const handleSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newLocale = event.target.checked ? 'en' : 'es';
    changeLanguage(newLocale);
  };
  
  const isEnglish = i18n.language === 'en';
  
  // Custom switch track colors
  const trackColor = isEnglish ? '#004489' : '#e4312b';
  const thumbColor = isEnglish ? '#dc002e' : '#ffdf00';
  
  // Si es la variante de menú, mostrar un diseño diferente
  if (variant === 'menu') {
    return (
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        gap: 1,
        py: 1
      }}>
        <Box
          onClick={() => changeLanguage('es')}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            px: 2,
            py: 1,
            borderRadius: 1,
            cursor: 'pointer',
            bgcolor: !isEnglish ? 'action.selected' : 'transparent',
            '&:hover': {
              bgcolor: !isEnglish ? 'action.selected' : 'action.hover',
            }
          }}
        >
          <Image
            src="/images/icons/spain-flag.webp"
            alt="Español"
            width={24}
            height={24}
            style={{ borderRadius: '2px' }}
          />
          <Box component="span" sx={{ flexGrow: 1 }}>Español</Box>
        </Box>
        
        <Box
          onClick={() => changeLanguage('en')}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            px: 2,
            py: 1,
            borderRadius: 1,
            cursor: 'pointer',
            bgcolor: isEnglish ? 'action.selected' : 'transparent',
            '&:hover': {
              bgcolor: isEnglish ? 'action.selected' : 'action.hover',
            }
          }}
        >
          <Image
            src="/images/icons/britain-flag.webp"
            alt="English"
            width={24}
            height={24}
            style={{ borderRadius: '2px' }}
          />
          <Box component="span" sx={{ flexGrow: 1 }}>English</Box>
        </Box>
      </Box>
    );
  }
  
  // Variante por defecto (para el header)
  return (
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      gap: isMobile ? 0.5 : 1,
      backgroundColor: mode === 'dark'
        ? 'rgba(30, 30, 30, 0.9)' // Fondo oscuro para tema oscuro
        : 'rgba(255, 255, 255, 0.9)', // Fondo claro para tema claro
      padding: isMobile ? '2px 4px' : '4px 8px',
      borderRadius: '8px',
      border: mode === 'dark'
        ? '1px solid rgba(255, 255, 255, 0.1)' // Borde sutil para tema oscuro
        : '1px solid rgba(0, 0, 0, 0.1)', // Borde sutil para tema claro
      boxShadow: mode === 'dark'
        ? '0 2px 4px rgba(0, 0, 0, 0.3)' // Sombra más pronunciada para tema oscuro
        : '0 2px 4px rgba(0, 0, 0, 0.1)', // Sombra sutil para tema claro
    }}>
      <Box
        sx={{
          opacity: isEnglish ? 0.5 : 1,
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Image
          src="/images/icons/spain-flag.webp"
          alt="Español"
          width={isMobile ? 20 : 30}
          height={isMobile ? 20 : 30}
          style={{ borderRadius: '2px' }}
        />
      </Box>
      
      {/* Custom Switch */}
      <Box
        sx={{
          position: 'relative',
          width: isMobile ? 30 : 40,
          height: isMobile ? 16 : 20,
          mx: isMobile ? 0.5 : 1,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: trackColor,
            borderRadius: 10,
            transition: 'all 0.3s',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: isMobile ? 1 : 2,
            left: isEnglish
              ? (isMobile ? 16 : 22)
              : (isMobile ? 1 : 2),
            width: isMobile ? 14 : 16,
            height: isMobile ? 14 : 16,
            backgroundColor: thumbColor,
            borderRadius: '50%',
            transition: 'all 0.3s',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          }}
        />
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
      </Box>
      
      <Box
        sx={{
          opacity: isEnglish ? 1 : 0.5,
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Image
          src="/images/icons/britain-flag.webp"
          alt="English"
          width={isMobile ? 20 : 30}
          height={isMobile ? 20 : 30}
          style={{ borderRadius: '2px' }}
        />
      </Box>
    </Box>
  );
}