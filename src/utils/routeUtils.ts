/**
 * Utilidades para trabajar con rutas
 */

// Lista de idiomas soportados
const supportedLocales = ['es', 'en'];

/**
 * Función auxiliar para obtener la ruta con el idioma
 * 
 * @param route - La ruta a la que se quiere añadir el idioma
 * @returns La ruta con el idioma añadido
 */
export const getLocalizedRoute = (route: string): string => {
  // Intentar obtener el idioma de i18next primero (cliente)
  let lang = 'es'; // Valor por defecto
  
  if (typeof window !== 'undefined') {
    // Estamos en el cliente, podemos acceder a i18next
    const i18nLang = window.localStorage.getItem('i18nextLng');
    
    if (i18nLang && supportedLocales.includes(i18nLang)) {
      lang = i18nLang;
    } else {
      // Fallback a la URL si no hay idioma en i18next
      const urlLang = window.location.pathname.split('/')[1];
      if (supportedLocales.includes(urlLang)) {
        lang = urlLang;
      }
    }
  }
  
  return `/${lang}${route}`;
};