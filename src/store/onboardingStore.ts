"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// Definir los pasos del tutorial
export enum OnboardingStep {
    WELCOME = "welcome",
    CREATE_ROOM = "create_room",
    JOIN_ROOM = "join_room",
    SELECT_CARD = "select_card",
    REVEAL_CARDS = "reveal_cards",
    MANAGE_ISSUES = "manage_issues",
    COMPLETED = "completed",
}

// Definir el tipo para la configuración de cada paso
export interface StepConfig {
    title: string;
    description: string;
    element?: string; // Selector CSS del elemento a resaltar
    position?: "top" | "right" | "bottom" | "left";
    action?: string; // Acción que debe realizar el usuario para avanzar
}

// Definir el tipo para el estado del store
interface OnboardingState {
    // Estado
    isActive: boolean;
    currentStep: OnboardingStep | null;
    completedSteps: OnboardingStep[];
    hasCompletedOnboarding: boolean;

    // Configuración de los pasos
    steps: Record<OnboardingStep, StepConfig>;

    // Acciones
    startOnboarding: () => void;
    skipOnboarding: () => void;
    completeOnboarding: () => void;
    nextStep: () => void;
    previousStep: () => void;
    goToStep: (step: OnboardingStep) => void;
    markStepAsCompleted: (step: OnboardingStep) => void;
    resetOnboarding: (keepCompletionStatus?: boolean) => void;
}

// Crear el store con persistencia
export const useOnboardingStore = create<OnboardingState>()(
    persist(
        (set, get) => ({
            // Estado inicial
            isActive: false,
            currentStep: null,
            completedSteps: [],
            hasCompletedOnboarding: false,

            // Configuración de los pasos del tutorial
            steps: {
                [OnboardingStep.WELCOME]: {
                    title: "¡Bienvenido a Planning Poker Pro!",
                    description:
                        "Este tutorial te guiará a través de las principales funcionalidades de la aplicación. Puedes saltarlo en cualquier momento y retomarlo después desde el menú de ayuda.",
                    position: "bottom",
                },
                [OnboardingStep.CREATE_ROOM]: {
                    title: "Crear una sala",
                    description:
                        'Puedes crear una nueva sala de Planning Poker seleccionando una serie de estimación y haciendo clic en "Crear Sala".',
                    element: '[data-onboarding="create-room"]',
                    position: "bottom",
                    action: "click",
                },
                [OnboardingStep.JOIN_ROOM]: {
                    title: "Unirse a una sala",
                    description:
                        "También puedes unirte a una sala existente introduciendo el código de la sala y tu nombre.",
                    element: '[data-onboarding="join-room"]',
                    position: "bottom",
                    action: "click",
                },
                [OnboardingStep.SELECT_CARD]: {
                    title: "Seleccionar una carta",
                    description:
                        "Una vez en la sala, puedes seleccionar una carta para estimar la tarea actual. Haz clic en la carta que represente tu estimación.",
                    element: '[data-onboarding="card-deck"]',
                    position: "top",
                    action: "click",
                },
                [OnboardingStep.REVEAL_CARDS]: {
                    title: "Revelar cartas",
                    description:
                        "Cuando todos los participantes hayan votado, el moderador puede revelar las cartas para ver todas las estimaciones.",
                    element: '[data-onboarding="reveal-button"]',
                    position: "bottom",
                    action: "click",
                },
                [OnboardingStep.MANAGE_ISSUES]: {
                    title: "Gestionar issues",
                    description:
                        "Puedes gestionar los issues a estimar desde el panel lateral. Añade, edita o elimina issues según sea necesario.",
                    element: '[data-onboarding="issue-sidebar"]',
                    position: "left",
                    action: "click",
                },
                [OnboardingStep.COMPLETED]: {
                    title: "¡Tutorial completado!",
                    description:
                        "Has completado el tutorial básico. Ahora puedes comenzar a utilizar Planning Poker Pro para tus estimaciones ágiles. Si necesitas ayuda adicional, consulta la documentación o contacta con soporte.",
                    position: "bottom",
                },
            },

            // Acciones
            startOnboarding: () =>
                set({
                    isActive: true,
                    currentStep: OnboardingStep.WELCOME,
                    completedSteps: [],
                }),

            skipOnboarding: () =>
                set({
                    isActive: false,
                    currentStep: null,
                }),

            completeOnboarding: () =>
                set({
                    isActive: false,
                    currentStep: null,
                    hasCompletedOnboarding: true,
                }),

            nextStep: () => {
                const { currentStep, steps, markStepAsCompleted } = get();
                if (!currentStep) {
                    console.log('nextStep: No hay paso actual');
                    return;
                }

                console.log('nextStep: Paso actual', currentStep);

                // Marcar el paso actual como completado
                markStepAsCompleted(currentStep);

                // Determinar el siguiente paso
                const stepsOrder = Object.keys(steps) as OnboardingStep[];
                const currentIndex = stepsOrder.indexOf(currentStep);
                const nextIndex = currentIndex + 1;

                console.log('nextStep: Índices', { currentIndex, nextIndex, totalSteps: stepsOrder.length });

                if (nextIndex < stepsOrder.length) {
                    // Ir al siguiente paso
                    const nextStep = stepsOrder[nextIndex];
                    console.log('nextStep: Avanzando al paso', nextStep);
                    
                    // Usar setTimeout para asegurar que el cambio de estado se procese correctamente
                    setTimeout(() => {
                        set({ currentStep: nextStep });
                        console.log('nextStep: Estado actualizado', { nextStep, isActive: true });
                    }, 50);
                } else {
                    // Completar el tutorial si no hay más pasos
                    console.log('nextStep: Completando tutorial');
                    set({
                        isActive: false,
                        currentStep: null,
                        hasCompletedOnboarding: true,
                    });
                }
            },

            previousStep: () => {
                const { currentStep, steps } = get();
                if (!currentStep) return;

                // Determinar el paso anterior
                const stepsOrder = Object.keys(steps) as OnboardingStep[];
                const currentIndex = stepsOrder.indexOf(currentStep);
                const prevIndex = currentIndex - 1;

                if (prevIndex >= 0) {
                    // Ir al paso anterior
                    set({ currentStep: stepsOrder[prevIndex] });
                }
            },

            goToStep: (step: OnboardingStep) => set({ currentStep: step }),

            markStepAsCompleted: (step: OnboardingStep) => {
                const { completedSteps } = get();
                if (!completedSteps.includes(step)) {
                    set({ completedSteps: [...completedSteps, step] });
                }
            },

            resetOnboarding: (keepCompletionStatus = false) =>
                set({
                    isActive: false,
                    currentStep: null,
                    completedSteps: [],
                    hasCompletedOnboarding: keepCompletionStatus ? get().hasCompletedOnboarding : false,
                }),
        }),
        {
            name: "onboarding-storage", // Nombre para localStorage
            partialize: (state) => ({
                completedSteps: state.completedSteps,
                hasCompletedOnboarding: state.hasCompletedOnboarding,
            }), // Solo persistir estos campos
        }
    )
);
