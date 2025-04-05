"use client";

import React, { ReactNode } from 'react';
import { Box } from '@mui/material';
import FeatureGuard from './FeatureGuard';
import Advertisement from './Advertisement';

interface AdFreeContentProps {
  children: ReactNode;
  adSlot?: string;
  adFormat?: 'auto' | 'horizontal' | 'vertical' | 'rectangle';
  adPosition?: 'top' | 'bottom';
  className?: string;
}

/**
 * AdFreeContent component that wraps content and displays ads for free users
 * 
 * @param children - The content to display
 * @param adSlot - The AdSense ad slot ID
 * @param adFormat - The ad format (auto, horizontal, vertical, rectangle)
 * @param adPosition - The position of the ad (top, bottom)
 * @param className - Additional CSS class name
 */
export default function AdFreeContent({
  children,
  adSlot = '1234567890',
  adFormat = 'auto',
  adPosition = 'top',
  className
}: AdFreeContentProps) {
  return (
    <FeatureGuard
      feature="adFree"
      fallback={
        <Box className={className} sx={{ width: '100%', overflow: 'hidden' }}>
          {adPosition === 'top' && (
            <Advertisement
              slot={adSlot}
              format={adFormat}
              position="top"
            />
          )}
          
          {children}
          
          {adPosition === 'bottom' && (
            <Advertisement
              slot={adSlot}
              format={adFormat}
              position="bottom"
            />
          )}
        </Box>
      }
    >
      {/* Ad-free content for paid users */}
      <Box className={className}>
        {children}
      </Box>
    </FeatureGuard>
  );
}