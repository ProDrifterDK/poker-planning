const supportedLocales = ['es', 'en'];

export const getLocalizedRoute = (route: string): string => {
  let lang = 'es';
  
  if (typeof window !== 'undefined') {
    const i18nLang = window.localStorage.getItem('i18nextLng');
    if (i18nLang && supportedLocales.includes(i18nLang)) {
      lang = i18nLang;
    } else {
      const urlLang = window.location.pathname.split('/')[1];
      if (supportedLocales.includes(urlLang)) {
        lang = urlLang;
      }
    }
  }
  
  return `/${lang}${route}`;
};