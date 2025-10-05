import React from 'react';
import { Card, CardContent, Typography, CardActions, Button } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const MotionCard = motion(Card);

interface TooltipProps {
  title: string;
  description: string;
  onNext?: () => void;
  onPrevious?: () => void;
  onSkip?: () => void;
  isFirstStep?: boolean;
  isLastStep?: boolean;
  isVisible: boolean;
}

const Tooltip: React.FC<TooltipProps> = ({
  title,
  description,
  onNext,
  onPrevious,
  onSkip,
  isFirstStep,
  isLastStep,
  isVisible,
}) => {
  const { t } = useTranslation('common');

  return (
    <AnimatePresence>
      {isVisible && (
        <MotionCard
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          sx={{
            position: 'absolute',
            zIndex: 1500,
            width: 320,
            maxWidth: '90vw',
            boxShadow: 3,
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 2 }}>
              {title}
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
              {description}
            </Typography>
          </CardContent>
          <CardActions sx={{ justifyContent: 'space-between', p: 2, pt: 0 }}>
            <Button onClick={onSkip} size="small">
                {t('onboarding.buttons.skip', 'Skip')}
            </Button>
            <div>
              <Button onClick={onPrevious} disabled={isFirstStep}>
                {t('onboarding.buttons.previous', 'Anterior')}
              </Button>
              {isLastStep ? (
                <Button variant="contained" color="primary" onClick={onNext}>
                  {t('onboarding.buttons.finish', 'Finalizar')}
                </Button>
              ) : (
                <Button variant="contained" color="primary" onClick={onNext}>
                  {t('onboarding.buttons.next', 'Siguiente')}
                </Button>
              )}
            </div>
          </CardActions>
        </MotionCard>
      )}
    </AnimatePresence>
  );
};

export default Tooltip;