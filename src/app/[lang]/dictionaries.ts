import 'server-only';

// Definir los idiomas soportados
const locales = ['es', 'en'] as const;
export type Locale = typeof locales[number];

// Definir la estructura del diccionario
export interface Dictionary {
  welcome?: string;
  description?: string;
  login?: string;
  signup?: string;
  startNow?: string;
  home?: string;
  features?: {
    title?: string;
    realtime?: string;
    realtimeDescription?: string;
    remote?: string;
    remoteDescription?: string;
    analytics?: string;
    analyticsDescription?: string;
  };
  cta?: {
    title?: string;
    description?: string;
    button?: string;
  };
  plans?: {
    title?: string;
    free?: string;
    freeDescription?: string;
    pro?: string;
    proDescription?: string;
    enterprise?: string;
    enterpriseDescription?: string;
    popular?: string;
    startFree?: string;
    choosePro?: string;
    chooseEnterprise?: string;
  };
  settings?: {
    title?: string;
    description?: string;
    configure?: string;
    comingSoon?: string;
  };
  [key: string]: unknown;
}

// Definir los diccionarios
const dictionaries = {
  es: {
    common: () => import('@/../../public/locales/es/common.json').then((module) => module.default),
    auth: () => import('@/../../public/locales/es/auth.json').then((module) => module.default),
    room: () => import('@/../../public/locales/es/room.json').then((module) => module.default),
    settings: () => import('@/../../public/locales/es/settings.json').then((module) => module.default),
  },
  en: {
    common: () => import('@/../../public/locales/en/common.json').then((module) => module.default),
    auth: () => import('@/../../public/locales/en/auth.json').then((module) => module.default),
    room: () => import('@/../../public/locales/en/room.json').then((module) => module.default),
    settings: () => import('@/../../public/locales/en/settings.json').then((module) => module.default),
  },
};

// Función para cargar un diccionario específico
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getDictionary(locale: Locale, namespace: 'common' | 'auth' | 'room' | 'settings' = 'common'): Promise<Record<string, unknown>> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await dictionaries[locale][namespace]() as Record<string, unknown>;
  } catch (error) {
    console.error(`Error loading dictionary for ${locale}/${namespace}:`, error);
    // Fallback al diccionario en inglés si el solicitado no está disponible
    if (locale !== 'en') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return await dictionaries.en[namespace]() as Record<string, unknown>;
    }
    return {};
  }
}

// Función para cargar todos los diccionarios para un idioma
export async function getAllDictionaries(locale: Locale) {
  const common = await getDictionary(locale, 'common');
  const auth = await getDictionary(locale, 'auth');
  const room = await getDictionary(locale, 'room');
  const settings = await getDictionary(locale, 'settings');

  return {
    common,
    auth,
    room,
    settings,
  };
}