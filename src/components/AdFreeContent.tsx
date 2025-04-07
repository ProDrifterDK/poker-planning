"use client";

import React, { ReactNode, useRef, useState, useEffect } from 'react';
import { Box } from '@mui/material';
import FeatureGuard from './FeatureGuard';
import Advertisement from './Advertisement';
import { MIN_CONTENT_HEIGHT_FOR_ADS } from '@/config/adConfig';

interface AdFreeContentProps {
  children: ReactNode;
  adSlot?: string;
  adFormat?: 'auto' | 'horizontal' | 'vertical' | 'rectangle';
  adPosition?: 'top' | 'bottom';
  className?: string;
  minContentHeight?: number;
}

/**
 * AdFreeContent component that wraps content and displays ads for free users
 * only when there is sufficient content
 *
 * @param children - The content to display
 * @param adSlot - The AdSense ad slot ID
 * @param adFormat - The ad format (auto, horizontal, vertical, rectangle)
 * @param adPosition - The position of the ad (top, bottom)
 * @param className - Additional CSS class name
 * @param minContentHeight - Minimum height of content required to show ads
 */
export default function AdFreeContent({
  children,
  adSlot = '1234567890',
  adFormat = 'auto',
  adPosition = 'top',
  className,
  minContentHeight = MIN_CONTENT_HEIGHT_FOR_ADS
}: AdFreeContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentLoaded, setContentLoaded] = useState(false);
  
  // Mark content as loaded after component mounts
  useEffect(() => {
    setContentLoaded(true);
  }, []);
  
  return (
    <FeatureGuard
      feature="adFree"
      fallback={
        <Box className={className} sx={{ width: '100%', overflow: 'hidden' }}>
          {adPosition === 'top' && contentLoaded && (
            <Advertisement
              slot={adSlot}
              format={adFormat}
              position="top"
              contentRef={contentRef}
              minContentHeight={minContentHeight}
            />
          )}
          
          <Box ref={contentRef}>
            {children}
          </Box>
          
          {adPosition === 'bottom' && contentLoaded && (
            <Advertisement
              slot={adSlot}
              format={adFormat}
              position="bottom"
              contentRef={contentRef}
              minContentHeight={minContentHeight}
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