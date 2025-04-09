'use client';

import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import resourcesToBackend from 'i18next-resources-to-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import { i18n as i18nConfig } from '../next-i18next.config.js';

i18next
  .use(initReactI18next)
  .use(LanguageDetector)
  .use(resourcesToBackend((language: string, namespace: string) =>
    import(`../public/locales/${language}/${namespace}.json`)
  ))
  .init({
    fallbackLng: i18nConfig.defaultLocale,
    supportedLngs: i18nConfig.locales,
    defaultNS: 'common',
    detection: {
      order: ['navigator', 'cookie', 'path'],  // Priorizar el idioma del navegador
      caches: ['cookie'],
      lookupFromPathIndex: 0,
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18next;