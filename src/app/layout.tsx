import '../styles/globals.css';
import { ReactNode } from 'react';
import Providers from './providers';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ErrorDisplay from '../components/ErrorDisplay';
import { OnboardingTooltip } from '../components/Onboarding';

export const metadata = {
  title: 'Poker Planning',
  description: 'Planificación ágil con Poker Planning',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <>
            <Header />
            <main style={{ flex: 1 }}>
              {children}
              <ErrorDisplay />
              <OnboardingTooltip />
            </main>
            <Footer />
          </>
        </Providers>
      </body>
    </html>
  );
}
