import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { match } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';

// Lista de idiomas soportados
const locales = ['es', 'en'];
// No definimos un defaultLocale fijo para permitir la detección automática

// Lista de rutas que no necesitan internacionalización
const publicPaths = ['/_next/', '/api/', '/favicon.ico', '/images/', '/locales/', '/subscription-status.html'];

// Lista de rutas que deben ser redirigidas a la versión localizada
const localizedRoutes = ['/terms', '/privacy-policy', '/room', '/settings', '/auth'];

/**
 * Obtiene el idioma preferido del usuario
 */
function getLocale(request: NextRequest): string {
  // Intentar obtener el idioma de la cookie - prioridad máxima
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  if (cookieLocale && locales.includes(cookieLocale)) {
    return cookieLocale;
  }
  
  // Obtener el idioma del encabezado Accept-Language
  const acceptLanguage = request.headers.get('accept-language') || '';
  const headers = { 'accept-language': acceptLanguage };
  const languages = new Negotiator({ headers }).languages();
  
  try {
    // Usar el primer idioma soportado que coincida con las preferencias del navegador
    return match(languages, locales, locales[0]);
  } catch (error) {
    // Si hay algún error, usar el primer idioma de la lista como fallback
    return locales[0];
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Verificar si la ruta es pública
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));
  if (isPublicPath) {
    return NextResponse.next();
  }
  
  // Manejar archivos HTML de suscripción de PayPal
  if (pathname.includes('paypal-') && pathname.endsWith('.html')) {
    const locale = getLocale(request);
    
    // Si el archivo ya tiene un sufijo de idioma, no hacer nada
    if (pathname.includes('-en.html') || pathname.includes('-es.html')) {
      return NextResponse.next();
    }
    
    // Redirigir al archivo con el sufijo de idioma correcto
    const newPath = pathname.replace('.html', `-${locale}.html`);
    request.nextUrl.pathname = newPath;
    return NextResponse.redirect(request.nextUrl);
  }
  
  // Verificar si ya hay un idioma en la URL
  const pathnameHasLocale = locales.some(
    locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );
  
  // Si ya hay un idioma en la URL, no hacer nada
  if (pathnameHasLocale) {
    return NextResponse.next();
  }
  
  // Verificar si hay un encabezado especial que indica que estamos cambiando de idioma
  const isLanguageChange = request.headers.get('X-Language-Change') === 'true';
  if (isLanguageChange) {
    // Si estamos cambiando de idioma, no redirigir
    return NextResponse.next();
  }
  
  // Verificar si la ruta actual debe ser redirigida a la versión localizada
  const shouldLocalize = localizedRoutes.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  );
  
  // Obtener el idioma preferido del usuario
  const locale = getLocale(request);
  
  // Crear nueva URL con el idioma
  request.nextUrl.pathname = `/${locale}${pathname}`;
  
  // Redirigir a la nueva URL
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: [
    // Excluir archivos estáticos
    '/((?!_next/static|_next/image).*)',
  ],
};