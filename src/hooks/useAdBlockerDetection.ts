import { useState, useEffect } from 'react';

/**
 * A custom hook to detect the presence of an ad blocker.
 * It uses a network request probe to check if a common ad script is blocked.
 * @returns {boolean} - True if an ad blocker is detected, false otherwise.
 */
export const useAdBlockerDetection = (): boolean => {
  const [adBlockerDetected, setAdBlockerDetected] = useState(false);

  useEffect(() => {
    // This function performs the network request probe.
    const checkAdBlocker = async () => {
      const adUrl = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
      
      try {
        // We use 'HEAD' for efficiency and 'no-cors' to avoid CORS issues.
        await fetch(new Request(adUrl, {
          method: 'HEAD',
          mode: 'no-cors',
        }));
        // If the request succeeds, no ad blocker is active.
        // The state remains false.
      } catch (error) {
        // If the request fails, it's highly likely an ad blocker is active.
        console.warn('Ad blocker detected.', error);
        setAdBlockerDetected(true);
      }
    };

    // Run the check only once when the component mounts.
    checkAdBlocker();
  }, []); // Empty dependency array ensures this runs only once.

  return adBlockerDetected;
};