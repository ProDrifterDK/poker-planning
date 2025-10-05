import React, { useRef, useLayoutEffect, useState, useEffect } from 'react';
import { Box, Typography, useTheme, Avatar, IconButton, useMediaQuery } from '@mui/material';
import Card from '@/components/core/Card';
import { Participant } from '@/types/room';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import { AuthContextType } from '@/context/authContext';

interface PokerTableProps {
  participants: Participant[];
  reveal: boolean;
  isCurrentUserAdminOrModerator: boolean;
  currentUserParticipantId: string | null;
  handleRemoveParticipant: (participantId: string) => void;
  t: (key: string) => string;
  currentUser: AuthContextType['currentUser'];
}

const PokerTable: React.FC<PokerTableProps> = ({
  participants,
  reveal,
  isCurrentUserAdminOrModerator,
  currentUserParticipantId,
  handleRemoveParticipant,
  t,
  currentUser,
}) => {
  const theme = useTheme();
  const tableRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  // Media queries for responsive design
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  useLayoutEffect(() => {
    const updateDimensions = () => {
      if (tableRef.current) {
        setDimensions({
          width: tableRef.current.offsetWidth,
          height: tableRef.current.offsetHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const { width, height } = dimensions;
  const horizontalRadius = width / 2;
  const verticalRadius = height / 2.3;

  // Responsive scaling based on screen size and number of participants
  const baseScale = isMobile ? 0.6 : isTablet ? 0.8 : 1;
  const participantScale = Math.min(1, Math.max(0.5, 1 - (participants.length - 8) * 0.04));
  const cardScale = baseScale * participantScale;
  
  // Responsive card dimensions
  const baseCardWidth = isMobile ? 50 : isTablet ? 60 : 70;
  const baseCardHeight = isMobile ? 70 : isTablet ? 85 : 100;
  const baseAvatarSize = isMobile ? 30 : isTablet ? 35 : 40;

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        maxWidth: '900px',
        margin: isMobile ? '20px auto' : '40px auto',
        padding: isMobile ? '50px 30px' : '80px 60px',
        perspective: '1000px',
        boxSizing: 'border-box',
      }}
    >
      <Box 
        ref={tableRef}
        sx={{
          position: 'relative',
          width: '100%',
          aspectRatio: isMobile ? '2 / 1' : '2.5 / 1.5',
          transformStyle: 'preserve-3d',
          transform: isMobile ? 'rotateX(2deg)' : 'rotateX(5deg)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '-15px',
            left: '-15px',
            right: '-15px',
            bottom: '-15px',
            borderRadius: '200px / 100px',
            background: `linear-gradient(145deg, ${theme.palette.grey[900]}, ${theme.palette.grey[800]})`,
            boxShadow: '0 20px 40px rgba(0,0,0,0.6), inset 0 -5px 10px rgba(0,0,0,0.3)',
            zIndex: -2,
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            borderRadius: '180px / 90px',
            background: `
              radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.2) 100%),
              radial-gradient(ellipse at 30% 30%, rgba(255,255,255,0.05) 0%, transparent 40%),
              radial-gradient(ellipse at 70% 70%, rgba(255,255,255,0.03) 0%, transparent 40%),
              linear-gradient(135deg, #0a4f2c 0%, #0d6637 50%, #0a4f2c 100%)
            `,
            boxShadow: 'inset 0 0 30px rgba(0,0,0,0.5), inset 0 0 60px rgba(0,0,0,0.3)',
            zIndex: -1,
          }
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            right: '20px',
            bottom: '20px',
            borderRadius: '160px / 80px',
            border: '2px dashed rgba(255,255,255,0.1)',
            pointerEvents: 'none',
          }}
        />
        
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '120px',
            height: '60px',
            borderRadius: '60px / 30px',
            background: 'radial-gradient(ellipse, rgba(255,255,255,0.05) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {participants.filter(p => p.active !== false).map((participant, index) => {
          const angle = (index / participants.filter(p => p.active !== false).length) * 2 * Math.PI - Math.PI / 2;
          const cardWidth = baseCardWidth * cardScale;
          const cardHeight = baseCardHeight * cardScale;
          const avatarSize = baseAvatarSize * cardScale;
          
          // Adjust radius for responsive design - ensure content stays within bounds
          // Use different multipliers for x and y to create better positioning
          const xRadiusMultiplier = isMobile ? 0.65 : isTablet ? 0.75 : 0.85;
          const yRadiusMultiplier = isMobile ? 0.55 : isTablet ? 0.65 : 0.75;
          const xRadius = horizontalRadius * xRadiusMultiplier;
          const yRadius = verticalRadius * yRadiusMultiplier;
          
          const centerX = horizontalRadius + xRadius * Math.cos(angle);
          const centerY = verticalRadius + yRadius * Math.sin(angle);

          const participantVote = participant.estimation;
          const noSelection = participantVote === null || participantVote === undefined;
          const rotation = (angle * 180 / Math.PI) + 90;

          return (
            <Box
              key={participant.id}
              sx={{
                position: 'absolute',
                left: `${centerX}px`,
                top: `${centerY}px`,
                transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                transition: 'all 0.3s ease',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  transform: `rotate(${-rotation}deg) scale(${cardScale})`,
                }}
              >
                <Avatar
                  src={participant.photoURL || (participant.id === currentUserParticipantId ? currentUser?.photoURL || undefined : undefined)}
                  sx={{
                    width: avatarSize,
                    height: avatarSize,
                    bgcolor: theme.palette.primary.main,
                    fontSize: `${avatarSize * 0.4}px`,
                    boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                    border: `2px solid ${theme.palette.background.paper}`,
                  }}
                >
                  {participant.name.charAt(0).toUpperCase()}
                </Avatar>
                
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: 'white', 
                      fontWeight: 'bold', 
                      textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                      fontSize: `${Math.max(10, 12 * cardScale)}px`,
                      maxWidth: isMobile ? '60px' : '80px',
                      textAlign: 'center',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {participant.role === 'moderator' ? (
                      <>
                        {participant.name === 'Moderador' ? currentUser?.displayName || 'Moderador' : participant.name}
                        <span style={{
                            fontSize: '0.8em',
                            opacity: 0.8,
                            display: 'block'
                        }}>
                            ({t('room.moderator')})
                        </span>
                      </>
                    ) : (
                      participant.name
                    )}
                  </Typography>
                  {isCurrentUserAdminOrModerator && currentUserParticipantId !== participant.id && (
                    <IconButton
                        size="small"
                        onClick={() => handleRemoveParticipant(participant.id)}
                        aria-label={`Remove ${participant.name}`}
                        sx={{
                            color: 'white',
                            padding: '2px',
                            marginLeft: '4px',
                            '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' }
                        }}
                    >
                        <PersonRemoveIcon sx={{ fontSize: `${Math.max(12, 14 * cardScale)}px` }} />
                    </IconButton>
                  )}
                </Box>

                <Box
                  sx={{
                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))',
                    transition: 'transform 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                    }
                  }}
                >
                  <Card
                    value={participantVote}
                    selected={!noSelection}
                    flipped={!reveal && !noSelection}
                    onClick={() => {}}
                    noSelection={noSelection}
                    reveal={reveal}
                    sx={{
                      width: `${cardWidth}px`,
                      height: `${cardHeight}px`,
                    }}
                  />
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default PokerTable;