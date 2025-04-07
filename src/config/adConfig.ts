/**
 * Configuración para la gestión de anuncios en la aplicación
 */

/**
 * Lista de páginas donde no se deben mostrar anuncios
 */
export const NO_ADS_PAGES = [
  '/auth/signin',
  '/auth/signup',
  '/auth/reset-password',
  '/auth/forgot-password',
  '/settings',
  '/settings/profile',
  '/settings/subscription',
  '/settings/subscription/cancel',
  '/room/join',
  '/404',
  '/500',
  '/error'
];

/**
 * Determina si se deben mostrar anuncios en una página específica
 *
 * @param pathname - La ruta de la página actual
 * @returns true si se deben mostrar anuncios, false en caso contrario
 */
export function shouldShowAdsOnPage(pathname: string): boolean {
  // Solo mostrar anuncios en la página de inicio
  return pathname === '/' || pathname === '/home';
}

/**
 * Altura mínima de contenido (en píxeles) para mostrar anuncios
 * Esto ayuda a asegurar que solo se muestren anuncios en páginas con suficiente contenido
 */
export const MIN_CONTENT_HEIGHT_FOR_ADS = 500;

/**
 * Número mínimo de participantes en una sala para mostrar anuncios
 * Esto ayuda a asegurar que solo se muestren anuncios en salas activas
 */
export const MIN_PARTICIPANTS_FOR_ADS = 2;