/**
 * Type definitions for Google AdSense
 */

declare global {
  interface Window {
    adsbygoogle: {
      push: (params: object) => void;
    }[];
  }
}

export {};