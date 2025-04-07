"use client";

import { useEffect, useRef, useState } from 'react';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { Box, Paper, Typography } from '@mui/material';
import { usePathname } from 'next/navigation';
import { shouldShowAdsOnPage, MIN_CONTENT_HEIGHT_FOR_ADS } from '@/config/adConfig';
// AdSense types are defined in src/types/adsense.d.ts

interface SidebarAdvertisementProps {
  slot: string;
  className?: string;
  minContentHeight?: number;
  contentRef?: React.RefObject<HTMLElement>;
}

/**
 * SidebarAdvertisement component that displays Google AdSense ads in the sidebar
 * only for free users and only on pages with sufficient content
 *
 * @param slot - The AdSense ad slot ID
 * @param className - Additional CSS class name
 * @param minContentHeight - Minimum height of content required to show ads
 * @param contentRef - Reference to the content element to measure its height
 */
export default function SidebarAdvertisement({
  slot,
  className,
  minContentHeight = MIN_CONTENT_HEIGHT_FOR_ADS,
  contentRef
}: SidebarAdvertisementProps) {
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
          
          console.log('Sidebar ad loaded for slot:', slot);
        } else {
          console.log('Sidebar ad already initialized for slot:', slot);
        }
        setAdLoaded(true);
      } catch (error) {
        console.error('Error loading sidebar advertisement:', error);
      }
    }
  }, [isVisible, isAdFree, shouldShowAds, hasEnoughContent, slot, adLoaded]);
  
  // Don't render anything for users with ad-free feature or on pages where ads shouldn't be shown
  if (isAdFree || !shouldShowAds || !hasEnoughContent) {
    return null;
  }
  
  return (
    <Paper
      elevation={0}
      ref={adRef}
      className={`sidebar-ad-container ${className || ''}`}
      sx={{
        width: { xs: '100%', md: '300px' },
        maxWidth: '100vw', // Prevent overflow beyond viewport
        height: { xs: '300px', md: '600px' }, // Shorter on mobile
        overflow: 'hidden',
        backgroundColor: 'background.paper',
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
        padding: 1,
        position: 'relative',
        display: { xs: 'none', md: 'block' }, // Hide on mobile
        marginBottom: 2,
        boxSizing: 'border-box' // Include padding in width calculation
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
          fontSize: '0.6rem'
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
        data-ad-format="vertical"
        data-full-width-responsive="false"
      />
    </Paper>
  );
}