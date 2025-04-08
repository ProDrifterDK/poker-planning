'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CircularProgress, Box } from '@mui/material';

// This is a redirect page that will redirect to the localized version
export default function PrivacyPolicyRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Get the browser language or default to 'en'
    const getBrowserLanguage = () => {
      if (typeof window !== 'undefined') {
        const browserLang = window.navigator.language.split('-')[0];
        return ['es', 'en'].includes(browserLang) ? browserLang : 'en';
      }
      return 'en';
    };

    // Get the language from cookie if available
    const getCookie = (name: string) => {
      if (typeof document !== 'undefined') {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
      }
      return null;
    };

    // Determine which language to use
    const cookieLang = getCookie('NEXT_LOCALE');
    const lang = cookieLang || getBrowserLanguage();

    // Redirect to the localized version
    router.replace(`/${lang}/privacy-policy`);
  }, [router]);

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
      }}
    >
      <CircularProgress />
    </Box>
  );
}