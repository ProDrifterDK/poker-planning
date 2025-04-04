import '../styles/globals.css';
import { ReactNode } from 'react';
import Providers from './providers';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ErrorDisplay from '../components/ErrorDisplay';
import { OnboardingTooltip } from '../components/Onboarding';
import AdBlockerWarning from '../components/AdBlockerWarning';
import Script from 'next/script';

export const metadata = {
  title: 'Poker Planning Pro',
  description: 'Planificación ágil con Poker Planning',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Google AdSense Meta Tag Verification */}
        <meta name="google-adsense-account" content="ca-pub-2748434968594141" />
        
        {/* Google AdSense Script - Next.js version */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2748434968594141"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        
        {/* Google AdSense Script - Raw HTML version for verification */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (adsbygoogle = window.adsbygoogle || []).push({});
            `
          }}
        />
        
        {/* Google AdSense Verification Script - Exact format */}
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2748434968594141" crossOrigin="anonymous"></script>
      </head>
      <body>
        <Providers>
          <>
            <Header />
            <main style={{ flex: 1 }}>
              {children}
              <ErrorDisplay />
              <OnboardingTooltip />
              <AdBlockerWarning />
            </main>
            <Footer />
          </>
        </Providers>
      </body>
    </html>
  );
}
