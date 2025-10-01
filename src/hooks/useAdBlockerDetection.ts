import { useState, useEffect } from 'react';

/**
 * A robust, hybrid ad blocker detection hook.
 * It combines a network probe and a DOM baiting probe for maximum accuracy.
 * @returns {boolean} - True if an ad blocker is detected, otherwise false.
 */
export const useAdBlockerDetection = (): boolean => {
  const [adBlockerDetected, setAdBlockerDetected] = useState(false);

  useEffect(() => {
    let detectionMade = false;

    const updateDetectionState = () => {
      if (!detectionMade) {
        setAdBlockerDetected(true);
        detectionMade = true;
      }
    };

    // --- Network Probe ---
    const checkNetwork = async () => {
      try {
        await fetch('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js', {
          method: 'HEAD',
          mode: 'cors', // Use default 'cors' mode to ensure promise rejection on block
        });
      } catch (error) {
        console.warn('Ad blocker detected (Network Probe).', error);
        updateDetectionState();
      }
    };

    // --- DOM Probe (Bait) ---
    const checkDOM = () => {
      const bait = document.createElement('div');
      bait.className = 'ad-box text-ad pub_300x250 banner_ad';
      bait.setAttribute('aria-hidden', 'true');
      bait.style.position = 'absolute';
      bait.style.left = '-9999px';
      bait.style.height = '1px';
      document.body.appendChild(bait);

      // Use requestAnimationFrame for a more efficient check
      requestAnimationFrame(() => {
        if (bait.offsetHeight === 0) {
          console.warn('Ad blocker detected (DOM Probe).');
          updateDetectionState();
        }
        if (document.body.contains(bait)) {
          document.body.removeChild(bait);
        }
      });
    };

    // Run both checks
    checkNetwork();
    checkDOM();

  }, []); // Empty dependency array ensures this runs only once.

  return adBlockerDetected;
};