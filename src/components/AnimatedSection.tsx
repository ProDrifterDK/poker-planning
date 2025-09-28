'use client';

import React from 'react';
import { Box } from '@mui/material';

export interface AnimatedSectionProps {
  children: React.ReactNode;
  animation?: string;
  delay?: number;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const AnimatedSection: React.FC<AnimatedSectionProps> = ({
  children,
  animation = 'fade-up',
  delay = 0,
  duration,
  className,
  style
}) => {
  // Create data attributes for AOS
  const dataAttributes: Record<string, string | number> = {
    'data-aos': animation,
  };

  if (delay > 0) {
    dataAttributes['data-aos-delay'] = delay;
  }

  if (duration && duration > 0) {
    dataAttributes['data-aos-duration'] = duration;
  }

  return (
    <Box
      className={className}
      style={style}
      {...dataAttributes}
    >
      {children}
    </Box>
  );
};

export default AnimatedSection;