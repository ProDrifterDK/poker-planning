"use client";

import { useEffect, useRef } from 'react';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { Box, Paper, Typography } from '@mui/material';
// AdSense types are defined in src/types/adsense.d.ts

interface SidebarAdvertisementProps {
  slot: string;
  className?: string;
}

/**
 * SidebarAdvertisement component that displays Google AdSense ads in the sidebar
 * only for free users
 *
 * @param slot - The AdSense ad slot ID
 * @param className - Additional CSS class name
 */
export default function SidebarAdvertisement({
  slot,
  className
}: SidebarAdvertisementProps) {
  const { canUserAccessFeature } = useSubscriptionStore();
  const adRef = useRef<HTMLDivElement>(null);
  
  // Check if user has ad-free feature
  const isAdFree = canUserAccessFeature('adFree');
  
  useEffect(() => {
    // Only load ads for users without ad-free feature
    if (!isAdFree && adRef.current) {
      try {
        // Create a new ad unit
        const adsbygoogle = window.adsbygoogle || [];
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - AdSense API doesn't match our type definitions perfectly
        adsbygoogle.push({});
        
        console.log('Sidebar ad loaded for slot:', slot);
      } catch (error) {
        console.error('Error loading sidebar advertisement:', error);
      }
    }
  }, [isAdFree, slot]);
  
  // Don't render anything for users with ad-free feature
  if (isAdFree) {
    return null;
  }
  
  return (
    <Paper
      elevation={0}
      ref={adRef}
      className={`sidebar-ad-container ${className || ''}`}
      sx={{
        width: { xs: '100%', md: '300px' },
        height: '600px',
        overflow: 'hidden',
        backgroundColor: 'background.paper',
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
        padding: 1,
        position: 'relative',
        display: { xs: 'none', md: 'block' }, // Hide on mobile
        marginBottom: 2
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