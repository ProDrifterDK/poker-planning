'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { Box } from '@mui/material';

/**
 * Componente para cambiar el idioma sin recargar la página
 * Este componente es una alternativa a LanguageSelector que evita la recarga de la página
 */
export default function ClientLanguageSwitch() {
  const pathname = usePathname();
  const { i18n } = useTranslation();
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
  
  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.9)', // Much whiter background
      padding: '4px 8px',
      borderRadius: '8px',
      border: '1px solid rgba(0, 0, 0, 0.1)', // Subtle border
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)', // Add a subtle shadow
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
          width={30} 
          height={30} 
          style={{ borderRadius: '2px' }}
        />
      </Box>
      
      {/* Custom Switch */}
      <Box
        sx={{
          position: 'relative',
          width: 40,
          height: 20,
          mx: 1,
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
            top: 2,
            left: isEnglish ? 22 : 2,
            width: 16,
            height: 16,
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
          width={30} 
          height={30} 
          style={{ borderRadius: '2px' }}
        />
      </Box>
    </Box>
  );
}