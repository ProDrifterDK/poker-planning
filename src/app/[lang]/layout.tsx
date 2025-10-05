import '../../styles/globals.css';
import { ReactNode } from 'react';
import Providers from '../providers';
import Header from '../../components/core/Header';
import Footer from '../../components/core/Footer';
import ErrorDisplay from '../../components/core/ErrorDisplay';
import { OnboardingTooltip } from '../../components/Onboarding';
import AdBlockerWarning from '@/features/ads/AdBlockerWarning';
import OnboardingWrapper from '../../components/Onboarding/OnboardingWrapper';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return {
    title: 'Poker Planning Pro',
    description: lang === 'es'
      ? 'Planificación ágil con Poker Planning'
      : 'Agile planning with Poker Planning',
  };
}

export async function generateStaticParams() {
  return [{ lang: 'es' }, { lang: 'en' }];
}

export default async function RootLayout({
  children,
  params
}: {
  children: ReactNode,
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params;
  
  return (
    <html lang={lang}>
      <head>
        {/* Google AdSense Meta Tag Verification */}
        <meta name="google-adsense-account" content="ca-pub-2748434968594141" />
        
        {/* Google AdSense Script - Standard script tag to avoid data-nscript warning */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2748434968594141"
          crossOrigin="anonymous"
        />
      </head>
      <body suppressHydrationWarning={true}>
        <Providers lang={lang}>
          <>
            <Header />
            <main style={{ flex: 1 }}>
              {children}
              <ErrorDisplay />
              <OnboardingWrapper>
                <OnboardingTooltip />
              </OnboardingWrapper>
              <AdBlockerWarning />
            </main>
            <Footer />
          </>
        </Providers>
      </body>
    </html>
  );
}