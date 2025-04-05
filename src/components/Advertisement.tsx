"use client";

import { useEffect, useRef, useState } from 'react';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { Box, Typography } from '@mui/material';
// AdSense types are defined in src/types/adsense.d.ts

interface AdvertisementProps {
  slot: string;
  format?: 'auto' | 'horizontal' | 'vertical' | 'rectangle';
  position?: 'top' | 'bottom' | 'sidebar';
  className?: string;
}

/**
 * Advertisement component that displays Google AdSense ads only for free users
 * 
 * @param slot - The AdSense ad slot ID
 * @param format - The ad format (auto, horizontal, vertical, rectangle)
 * @param position - The position of the ad (top, bottom, sidebar)
 * @param className - Additional CSS class name
 */
export default function Advertisement({ 
  slot, 
  format = 'auto', 
  position = 'top',
  className 
}: AdvertisementProps) {
  const { canUserAccessFeature } = useSubscriptionStore();
  const adRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [adLoaded, setAdLoaded] = useState(false);
  
  // Check if user has ad-free feature
  const isAdFree = canUserAccessFeature('adFree');
  
  // Set up intersection observer for lazy loading
  useEffect(() => {
    if (!isAdFree && adRef.current && !adLoaded) {
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
  }, [isAdFree, adLoaded]);
  
  // Load the ad when it becomes visible
  useEffect(() => {
    // Only load ads when they're visible and for users without ad-free feature
    if (isVisible && !isAdFree && adRef.current && !adLoaded) {
      try {
        // Create a new ad unit
        const adsbygoogle = window.adsbygoogle || [];
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - AdSense API doesn't match our type definitions perfectly
        adsbygoogle.push({});
        
        console.log('Ad loaded for slot:', slot);
        setAdLoaded(true);
      } catch (error) {
        console.error('Error loading advertisement:', error);
      }
    }
  }, [isVisible, isAdFree, slot, adLoaded]);
  
  // Don't render anything for users with ad-free feature
  if (isAdFree) {
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
    }
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
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </Box>
  );
}

// AdSense types are defined in src/types/adsense.d.ts