import { ReactNode } from 'react';

// Este layout proporciona la estructura HTML básica requerida
// La estructura HTML completa para rutas con idioma se define en src/app/[lang]/layout.tsx
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
