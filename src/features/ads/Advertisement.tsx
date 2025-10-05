"use client";

import { useEffect, useRef, useState } from 'react';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { Box, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { usePathname } from 'next/navigation';
import { shouldShowAdsOnPage, MIN_CONTENT_HEIGHT_FOR_ADS } from '@/config/adConfig';
// AdSense types are defined in src/types/adsense.d.ts

interface AdvertisementProps {
  slot: string;
  format?: 'auto' | 'horizontal' | 'vertical' | 'rectangle';
  position?: 'top' | 'bottom' | 'sidebar';
  className?: string;
  minContentHeight?: number;
  contentRef?: React.RefObject<HTMLElement>;
}

/**
 * Advertisement component that displays Google AdSense ads only for free users
 * and only on pages with sufficient content
 *
 * @param slot - The AdSense ad slot ID
 * @param format - The ad format (auto, horizontal, vertical, rectangle)
 * @param position - The position of the ad (top, bottom, sidebar)
 * @param className - Additional CSS class name
 * @param minContentHeight - Minimum height of content required to show ads
 * @param contentRef - Reference to the content element to measure its height
 */
export default function Advertisement({
  slot,
  format = 'auto',
  position = 'top',
  className,
  minContentHeight = MIN_CONTENT_HEIGHT_FOR_ADS,
  contentRef
}: AdvertisementProps) {
  const { canUserAccessFeature } = useSubscriptionStore();
  const adRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [adLoaded, setAdLoaded] = useState(false);
  const [hasEnoughContent, setHasEnoughContent] = useState(false);
  const pathname = usePathname();
  
  // Check if user has ad-free feature
  const isAdFree = canUserAccessFeature('adFree');
  
  // Check if we should show ads on this page
  const shouldShowAds = shouldShowAdsOnPage(pathname);
  
  // Check if there's enough content to show ads
  useEffect(() => {
    // If we're on the homepage, always show ads regardless of content height
    if (pathname === '/' || pathname === '/home') {
      setHasEnoughContent(true);
      return;
    }
    
    // For other pages, check content height
    if (contentRef?.current) {
      const checkContentHeight = () => {
        const contentHeight = contentRef.current?.offsetHeight || 0;
        setHasEnoughContent(contentHeight >= minContentHeight);
      };
      
      // Check initially
      checkContentHeight();
      
      // And also after a short delay to account for dynamic content
      const timer = setTimeout(checkContentHeight, 1000);
      
      return () => clearTimeout(timer);
    } else {
      // If no content reference is provided, assume there's enough content
      setHasEnoughContent(true);
    }
  }, [contentRef, minContentHeight, pathname]);
  
  // Set up intersection observer for lazy loading
  useEffect(() => {
    if (!isAdFree && shouldShowAds && hasEnoughContent && adRef.current && !adLoaded) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            setIsVisible(true);
            // Once we've detected visibility, disconnect the observer
            observer.disconnect();
          }
        },
        { threshold: 0.1 } // Trigger when at least 10% of the ad is visible
      );
      
      observer.observe(adRef.current);
      
      return () => {
        observer.disconnect();
      };
    }
  }, [isAdFree, shouldShowAds, hasEnoughContent, adLoaded]);
  
  // Load the ad when it becomes visible
  useEffect(() => {
    // Only load ads when they're visible, on allowed pages, with enough content, and for users without ad-free feature
    if (isVisible && !isAdFree && shouldShowAds && hasEnoughContent && adRef.current && !adLoaded) {
      try {
        // Check if the ad element already has the data-ad-status attribute
        const adElement = adRef.current.querySelector('.adsbygoogle');
        if (adElement && !adElement.getAttribute('data-ad-status')) {
          // Create a new ad unit only if it hasn't been initialized yet
          const adsbygoogle = window.adsbygoogle || [];
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore - AdSense API doesn't match our type definitions perfectly
          adsbygoogle.push({});
          
          console.log('Ad loaded for slot:', slot);
        } else {
          console.log('Ad already initialized for slot:', slot);
        }
        setAdLoaded(true);
      } catch (error) {
        console.error('Error loading advertisement:', error);
      }
    }
  }, [isVisible, isAdFree, shouldShowAds, hasEnoughContent, slot, adLoaded]);
  
  // Don't render anything for users with ad-free feature or on pages where ads shouldn't be shown
  if (isAdFree || !shouldShowAds || !hasEnoughContent) {
    return null;
  }
  
  // Get position-specific styles
  const positionStyles = {
    top: {
      width: '100%',
      marginBottom: 2,
      display: 'flex',
      justifyContent: 'center',
    },
    bottom: {
      width: '100%',
      marginTop: 2,
      display: 'flex',
      justifyContent: 'center',
    },
    sidebar: {
      display: 'flex',
      flexDirection: 'column',
      marginLeft: { xs: 0, md: 2 },
      marginTop: { xs: 2, md: 0 },
    },
  };
  
  return (
    <Box
      ref={adRef}
      className={`ad-container ${className || ''}`}
      sx={{
        ...positionStyles[position],
        minHeight: {
          xs: format === 'horizontal' ? '50px' : format === 'vertical' ? '300px' : '200px',
          sm: format === 'horizontal' ? '90px' : format === 'vertical' ? '600px' : '250px'
        },
        maxHeight: {
          xs: format === 'horizontal' ? '100px' : format === 'vertical' ? '400px' : '300px',
          sm: 'none'
        },
        width: '100%', // Ensure it doesn't exceed container width
        maxWidth: '100vw', // Prevent overflow beyond viewport
        overflow: 'hidden',
        backgroundColor: 'background.paper',
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
        padding: 1,
        position: 'relative',
        boxSizing: 'border-box', // Include padding in width calculation
      }}
    >
      <Typography
        variant="caption"
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          backgroundColor: 'rgba(0,0,0,0.05)',
          px: 0.5,
          borderBottomRightRadius: 4,
          color: 'text.secondary',
          fontSize: '0.6rem',
        }}
      >
        Publicidad
      </Typography>
      
      <ins
        className="adsbygoogle"
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
        }}
        data-ad-client="ca-pub-2748434968594141"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </Box>
  );
}

// AdSense types are defined in src/types/adsense.d.ts