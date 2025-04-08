'use client';

import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import { useOnboardingStore, OnboardingStep } from '@/store/onboardingStore';

const OnboardingWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation('common');
  const { steps, isActive, currentStep, setStepTranslations } = useOnboardingStore();

  // Update translations whenever the language changes
  useEffect(() => {
    // Only update if the onboarding is active
    if (isActive && currentStep) {
      // Create translated steps
      const translatedSteps = {
        [OnboardingStep.WELCOME]: {
          ...steps[OnboardingStep.WELCOME],
          title: t('onboarding.welcome.title'),
          description: t('onboarding.welcome.description'),
        },
        [OnboardingStep.CREATE_ROOM]: {
          ...steps[OnboardingStep.CREATE_ROOM],
          title: t('onboarding.createRoom.title'),
          description: t('onboarding.createRoom.description'),
        },
        [OnboardingStep.JOIN_ROOM]: {
          ...steps[OnboardingStep.JOIN_ROOM],
          title: t('onboarding.joinRoom.title'),
          description: t('onboarding.joinRoom.description'),
        },
        [OnboardingStep.SELECT_CARD]: {
          ...steps[OnboardingStep.SELECT_CARD],
          title: t('onboarding.selectCard.title'),
          description: t('onboarding.selectCard.description'),
        },
        [OnboardingStep.REVEAL_CARDS]: {
          ...steps[OnboardingStep.REVEAL_CARDS],
          title: t('onboarding.revealCards.title'),
          description: t('onboarding.revealCards.description'),
        },
        [OnboardingStep.MANAGE_ISSUES]: {
          ...steps[OnboardingStep.MANAGE_ISSUES],
          title: t('onboarding.manageIssues.title'),
          description: t('onboarding.manageIssues.description'),
        },
        [OnboardingStep.COMPLETED]: {
          ...steps[OnboardingStep.COMPLETED],
          title: t('onboarding.completed.title'),
          description: t('onboarding.completed.description'),
        },
      };

      // Update the store with translated steps, but only if the language has changed
      // This prevents an infinite loop of updates
      const currentLang = i18next.language;
      if (currentLang !== steps[OnboardingStep.WELCOME].lang) {
        setStepTranslations({
          ...translatedSteps,
          // Add a language marker to prevent unnecessary updates
          [OnboardingStep.WELCOME]: {
            ...translatedSteps[OnboardingStep.WELCOME],
            lang: currentLang
          }
        });
      }
    }
  }, [t, isActive, currentStep]); // Remove steps and setStepTranslations from dependencies

  return <>{children}</>;
};

export default OnboardingWrapper;