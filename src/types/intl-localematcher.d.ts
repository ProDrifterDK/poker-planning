declare module '@formatjs/intl-localematcher' {
  export function match(
    requestedLocales: string[],
    availableLocales: string[],
    defaultLocale: string,
    options?: {
      algorithm?: 'lookup' | 'best fit';
      localeMatcher?: 'lookup' | 'best fit';
    }
  ): string;
}