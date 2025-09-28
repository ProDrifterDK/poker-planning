'use client';

import React from 'react';
import { motion, useInView } from 'framer-motion';
import { Box } from '@mui/material';

// Animation variants for different styles
const animationVariants = {
  'fade-up': {
    hidden: {
      opacity: 0,
      y: 30
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut'
      }
    }
  },
  'fade-down': {
    hidden: {
      opacity: 0,
      y: -30
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut'
      }
    }
  },
  'fade-left': {
    hidden: {
      opacity: 0,
      x: -30
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut'
      }
    }
  },
  'fade-right': {
    hidden: {
      opacity: 0,
      x: 30
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut'
      }
    }
  },
  'fade': {
    hidden: {
      opacity: 0
    },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: 'easeOut'
      }
    }
  },
  'scale-up': {
    hidden: {
      opacity: 0,
      scale: 0.8
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: 'easeOut'
      }
    }
  },
  'slide-up': {
    hidden: {
      opacity: 0,
      y: 50
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: 'easeOut'
      }
    }
  }
};

export interface AnimatedSectionProps {
  children: React.ReactNode;
  animation?: keyof typeof animationVariants;
  delay?: number;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
  threshold?: number;
  triggerOnce?: boolean;
}

export const AnimatedSection: React.FC<AnimatedSectionProps> = ({
  children,
  animation = 'fade-up',
  delay = 0,
  duration,
  className,
  style,
  threshold = 0.1,
  triggerOnce = true
}) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, {
    amount: threshold,
    once: triggerOnce,
    margin: "-100px 0px -100px 0px"
  });

  const variant = animationVariants[animation];

  return (
    <Box
      ref={ref}
      className={className}
      style={style}
      component={motion.div}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variant}
      transition={{
        ...variant.visible.transition,
        delay,
        ...(duration && { duration })
      }}
    >
      {children}
    </Box>
  );
};

export default AnimatedSection;