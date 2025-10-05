import React, { useState, useRef, useEffect } from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import Card from '@/components/core/Card';
import { motion } from 'framer-motion';

interface EstimationDeckProps {
  estimationOptions: (number | string)[];
  selectedEstimation: number | string | null;
  onSelectEstimation: (value: number | string) => void;
}

const EstimationDeck: React.FC<EstimationDeckProps> = ({
  estimationOptions,
  selectedEstimation,
  onSelectEstimation,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery('(max-width:800px)');
  const deckRef = useRef<HTMLDivElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    // Reset scroll position on mount
    if (deckRef.current && isMobile) {
      deckRef.current.scrollLeft = 0;
    }
  }, [isMobile]);

  // Check if we need multiple rows on mobile
  const needsMultipleRows = isMobile && estimationOptions.length > 6;

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        zIndex: 1,
        background: 'transparent',
        paddingTop: isMobile ? 2 : 6,
        paddingBottom: isMobile ? 3 : 4,
        marginTop: isMobile ? 3 : 4,
        marginBottom: isMobile ? 2 : 0,
        borderRadius: isMobile ? 2 : 0,
        boxShadow: isMobile
          ? `0 2px 8px rgba(0,0,0,0.1)`
          : 'none',
      }}
    >
      {/* Desktop wood texture background */}
      {!isMobile && (
        <Box
          sx={{
            position: 'absolute',
            top: -40,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '140%',
            height: '200px',
            borderRadius: '100px / 20px',
            zIndex: -1,
            opacity: 0.3,
          }}
        />
      )}

      {/* Mobile layout - Grid for many cards, horizontal scroll for few */}
      {isMobile ? (
        needsMultipleRows ? (
          // Grid layout for many cards on mobile
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(75px, 1fr))',
              gap: 1.5,
              padding: '16px',
              width: '100%',
              maxWidth: '100%',
            }}
          >
            {estimationOptions.map((value, index) => (
              <motion.div
                key={String(value)}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03 }}
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <Card
                  value={value}
                  selected={selectedEstimation === value}
                  onClick={() => onSelectEstimation(value)}
                  flipped={false}
                  noSelection={false}
                  reveal={true}
                  sx={{
                    width: '70px',
                    height: '100px',
                    transition: 'all 0.2s ease',
                    transform: selectedEstimation === value ? 'scale(1.1)' : 'scale(1)',
                    boxShadow: selectedEstimation === value 
                      ? '0 8px 16px rgba(0,0,0,0.3)' 
                      : '0 2px 4px rgba(0,0,0,0.1)',
                  }}
                />
              </motion.div>
            ))}
          </Box>
        ) : (
          // Horizontal scroll for fewer cards
          <Box
            ref={deckRef}
            data-onboarding="card-deck"
            sx={{
              display: 'flex',
              position: 'relative',
              width: '100%',
              padding: '8px 16px',
              paddingBottom: '16px',
              overflowX: 'auto',
              overflowY: 'hidden',
              scrollSnapType: 'x mandatory',
              scrollbarWidth: 'thin',
              '&::-webkit-scrollbar': { 
                height: '4px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                background: theme.palette.divider,
                borderRadius: '2px',
              },
              WebkitOverflowScrolling: 'touch',
              '&::after': {
                content: '""',
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: '20px',
                background: `linear-gradient(to right, transparent, ${theme.palette.background.paper})`,
                pointerEvents: 'none',
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: '20px',
                background: `linear-gradient(to left, transparent, ${theme.palette.background.paper})`,
                pointerEvents: 'none',
                zIndex: 1,
              },
            }}
          >
            {estimationOptions.map((value, index) => (
              <motion.div
                key={String(value)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                style={{
                  flexShrink: 0,
                  scrollSnapAlign: 'center',
                  paddingLeft: index === 0 ? '0' : '8px',
                  paddingRight: index === estimationOptions.length - 1 ? '20px' : '0',
                }}
              >
                <Card
                  value={value}
                  selected={selectedEstimation === value}
                  onClick={() => onSelectEstimation(value)}
                  flipped={false}
                  noSelection={false}
                  reveal={true}
                  sx={{
                    width: '75px',
                    height: '105px',
                    transition: 'all 0.2s ease',
                    transform: selectedEstimation === value ? 'translateY(-8px) scale(1.05)' : 'scale(1)',
                    boxShadow: selectedEstimation === value 
                      ? '0 12px 24px rgba(0,0,0,0.25)' 
                      : '0 4px 8px rgba(0,0,0,0.1)',
                  }}
                />
              </motion.div>
            ))}
          </Box>
        )
      ) : (
        /* Desktop and tablet layout - fan arrangement */
        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end',
            transform: 'translateY(20px)',
            minHeight: '180px',
          }}
        >
          {estimationOptions.map((value, index, arr) => {
            const total = arr.length;
            const centerIndex = (total - 1) / 2;
            const offset = index - centerIndex;
            const rotation = offset * 2.5; // degrees
            const translateX = offset * 65; // pixels
            const translateY = Math.abs(offset) * Math.abs(offset) * 1.2; // parabolic curve
            
            const isSelected = selectedEstimation === value;
            const isHovered = hoveredIndex === index;
            
            return (
              <Box
                key={String(value)}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                sx={{
                  position: 'absolute',
                  transform: `
                    translateX(${translateX}px)
                    translateY(${isSelected ? translateY - 40 : isHovered ? translateY - 20 : translateY}px)
                    rotate(${isHovered ? 0 : rotation}deg)
                  `,
                  transformOrigin: 'bottom center',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  zIndex: isSelected ? 30 : isHovered ? 25 : total - Math.abs(offset),
                  cursor: 'pointer',
                  '&:hover': {
                    transform: `
                      translateX(${translateX + (translateX > 0 ? 15 : translateX < 0 ? -15 : 0)}px)
                      translateY(${translateY - 20}px)
                      rotate(0deg)
                    `,
                  },
                }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ 
                    delay: index * 0.03,
                    type: 'spring',
                    stiffness: 300,
                    damping: 25,
                  }}
                >
                  <Card
                    value={value}
                    selected={isSelected}
                    onClick={() => onSelectEstimation(value)}
                    flipped={false}
                    noSelection={false}
                    reveal={true}
                    sx={{
                      filter: isSelected
                        ? `
                          drop-shadow(0 15px 25px rgba(0,0,0,0.4))
                          drop-shadow(0 10px 10px rgba(0,0,0,0.2))
                          brightness(1.1)
                        `
                        : isHovered
                        ? `
                          drop-shadow(0 10px 20px rgba(0,0,0,0.3))
                          drop-shadow(0 5px 5px rgba(0,0,0,0.15))
                          brightness(1.05)
                        `
                        : 'drop-shadow(0 5px 10px rgba(0,0,0,0.2))',
                      transition: 'filter 0.3s ease',
                    }}
                  />
                </motion.div>
              </Box>
            );
          })}
        </Box>
      )}

      {/* Subtle reflection effect for desktop */}
      {!isMobile && (
        <Box
          sx={{
            position: 'absolute',
            bottom: -20,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100%',
            height: '40px',
            background: `linear-gradient(to bottom, 
              ${theme.palette.background.default}00 0%, 
              ${theme.palette.background.default}40 50%, 
              ${theme.palette.background.default}00 100%
            )`,
            pointerEvents: 'none',
            opacity: 0.3,
          }}
        />
      )}
    </Box>
  );
};

export default EstimationDeck;