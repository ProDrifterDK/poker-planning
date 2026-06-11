/**
 * Translations for the redesigned checkout UX flow
 * Covers plan comparison, interval toggle, provider choice,
 * checkout redirects, and all status states.
 */

export interface CheckoutTranslations {
  // Page titles and descriptions
  title: string;
  subtitle: string;

  // Interval toggle
  interval: {
    label: string;
    monthly: string;
    yearly: string;
    yearlySavings: string;
    bestValue: string;
  };

  // Plan comparison
  comparison: {
    title: string;
    feature: string;
    free: string;
    pro: string;
    enterprise: string;
    participants: string;
    maxParticipants: string;
    maxRooms: string;
    exportData: string;
    advancedStats: string;
    timer: string;
    fullHistory: string;
    integrations: string;
    branding: string;
    advancedRoles: string;
    prioritySupport: string;
    api: string;
    adFree: string;
    select: string;
    currentPlan: string;
    upgrade: string;
    downgrade: string;
    changePlan: string;
    perMonth: string;
    perYear: string;
    mostPopular: string;
  };

  // Provider selection
  provider: {
    title: string;
    subtitle: string;
    stripe: string;
    stripeDescription: string;
    paypal: string;
    paypalDescription: string;
    cardAccepted: string;
    proceedToCheckout: string;
    securePayment: string;
  };

  // Checkout states
  success: {
    title: string;
    message: string;
    welcomeMessage: string;
    goToDashboard: string;
    backToSubscription: string;
    planActivated: string;
  };

  pending: {
    title: string;
    message: string;
    processingMessage: string;
    expectedTime: string;
    checkEmail: string;
    backToSubscription: string;
  };

  failed: {
    title: string;
    message: string;
    retry: string;
    tryDifferentMethod: string;
    contactSupport: string;
    backToSubscription: string;
    commonReasons: string;
    insufficientFunds: string;
    cardDeclined: string;
    networkError: string;
  };

  canceled: {
    title: string;
    message: string;
    noCharge: string;
    tryAgain: string;
    backToSubscription: string;
    goToHome: string;
  };

  manage: {
    title: string;
    currentPlan: string;
    status: string;
    nextBilling: string;
    cancelSubscription: string;
    cancelReason: string;
    cancelConfirm: string;
    cancelAtPeriodEnd: string;
    cancelAtPeriodEndMessage: string;
    resumeSubscription: string;
    manageBilling: string;
    paymentHistory: string;
    changePlan: string;
    portalButton: string;
  };

  // Upgrade/limit messaging
  upgrade: {
    title: string;
    roomLimit: string;
    roomLimitMessage: string;
    participantLimit: string;
    participantLimitMessage: string;
    upgradeNow: string;
    learnMore: string;
  };

  // General
  general: {
    loading: string;
    error: string;
    retry: string;
    close: string;
    confirm: string;
    cancel: string;
    continue: string;
    back: string;
    yes: string;
    no: string;
    contactSupport: string;
    supportEmail: string;
  };
}

export const checkoutTranslations: Record<string, CheckoutTranslations> = {
  en: {
    title: 'Choose Your Plan',
    subtitle: 'Select the plan that fits your team. Upgrade or change at any time.',

    interval: {
      label: 'Billing interval',
      monthly: 'Monthly',
      yearly: 'Yearly',
      yearlySavings: 'Save over 15%',
      bestValue: 'Best Value',
    },

    comparison: {
      title: 'Compare Plans',
      feature: 'Feature',
      free: 'Free',
      pro: 'Pro',
      enterprise: 'Enterprise',
      participants: 'Max Participants',
      maxParticipants: '{count} participants',
      maxRooms: '{count} active room(s)',
      exportData: 'Export Data',
      advancedStats: 'Advanced Statistics',
      timer: 'Timer',
      fullHistory: 'Full History',
      integrations: 'Integrations (Jira, GitHub, Trello)',
      branding: 'Custom Branding',
      advancedRoles: 'Advanced Roles',
      prioritySupport: 'Priority Support',
      api: 'API Access',
      adFree: 'Ad-Free Experience',
      select: 'Select Plan',
      currentPlan: 'Current Plan',
      upgrade: 'Upgrade',
      downgrade: 'Downgrade',
      changePlan: 'Change Plan',
      perMonth: '/month',
      perYear: '/year',
      mostPopular: 'Most Popular',
    },

    provider: {
      title: 'Choose Payment Method',
      subtitle: 'Select how you want to pay. Both options are secure and processed by our backend.',
      stripe: 'Pay with Card (Stripe)',
      stripeDescription: 'Credit, debit, or prepaid card. Secure checkout powered by Stripe.',
      paypal: 'Pay with PayPal',
      paypalDescription: 'Pay using your PayPal account or linked payment methods.',
      cardAccepted: 'Visa, Mastercard, Amex, and more',
      proceedToCheckout: 'Proceed to Checkout',
      securePayment: 'Secure payment — encrypted by Stripe',
    },

    success: {
      title: 'Subscription Activated!',
      message: 'Your subscription has been confirmed and is now active.',
      welcomeMessage: 'Welcome to {plan}! You now have access to all premium features.',
      goToDashboard: 'Go to Dashboard',
      backToSubscription: 'Manage Subscription',
      planActivated: '{plan} plan activated successfully',
    },

    pending: {
      title: 'Payment Pending',
      message: 'Your payment is being processed.',
      processingMessage: 'This may take a few minutes. We\'ll notify you once complete.',
      expectedTime: 'Expected processing time: 1-5 minutes',
      checkEmail: 'Check your email for a confirmation when processing completes.',
      backToSubscription: 'Back to Subscription',
    },

    failed: {
      title: 'Payment Failed',
      message: 'We couldn\'t process your payment.',
      retry: 'Try Again',
      tryDifferentMethod: 'Try a Different Payment Method',
      contactSupport: 'Contact Support',
      backToSubscription: 'Back to Subscription',
      commonReasons: 'Common reasons for payment failure:',
      insufficientFunds: 'Insufficient funds in your account',
      cardDeclined: 'Your card was declined by the issuer',
      networkError: 'Network error during processing',
    },

    canceled: {
      title: 'Subscription Canceled',
      message: 'You canceled the subscription process.',
      noCharge: 'No charge was made to your account.',
      tryAgain: 'Try Again',
      backToSubscription: 'Back to Subscription',
      goToHome: 'Go to Home',
    },

    manage: {
      title: 'Manage Your Subscription',
      currentPlan: 'Current Plan',
      status: 'Status',
      nextBilling: 'Next Billing Date',
      cancelSubscription: 'Cancel Subscription',
      cancelReason: 'Why are you canceling?',
      cancelConfirm: 'Are you sure you want to cancel? You\'ll retain access until the end of your billing period.',
      cancelAtPeriodEnd: 'Cancellation Scheduled',
      cancelAtPeriodEndMessage: 'Your subscription will end at the close of your current billing period.',
      resumeSubscription: 'Resume Subscription',
      manageBilling: 'Manage Billing',
      paymentHistory: 'Payment History',
      changePlan: 'Change Plan',
      portalButton: 'Open Customer Portal',
    },

    upgrade: {
      title: 'Upgrade Your Plan',
      roomLimit: 'Room Limit Reached',
      roomLimitMessage: 'You\'ve reached the maximum number of active rooms for your plan. Upgrade to create more.',
      participantLimit: 'Participant Limit Reached',
      participantLimitMessage: 'This room has reached the maximum number of participants for your plan. Upgrade to add more.',
      upgradeNow: 'Upgrade Now',
      learnMore: 'Learn More',
    },

    general: {
      loading: 'Loading...',
      error: 'An error occurred',
      retry: 'Retry',
      close: 'Close',
      confirm: 'Confirm',
      cancel: 'Cancel',
      continue: 'Continue',
      back: 'Back',
      yes: 'Yes',
      no: 'No',
      contactSupport: 'Contact Support',
      supportEmail: 'support@planningpokerpro.com',
    },
  },

  es: {
    title: 'Elige Tu Plan',
    subtitle: 'Selecciona el plan que se ajuste a tu equipo. Actualiza o cambia en cualquier momento.',

    interval: {
      label: 'Intervalo de facturación',
      monthly: 'Mensual',
      yearly: 'Anual',
      yearlySavings: 'Ahorra más de 15%',
      bestValue: 'Mejor Valor',
    },

    comparison: {
      title: 'Comparar Planes',
      feature: 'Característica',
      free: 'Free',
      pro: 'Pro',
      enterprise: 'Enterprise',
      participants: 'Máx. Participantes',
      maxParticipants: '{count} participantes',
      maxRooms: '{count} sala(s) activa(s)',
      exportData: 'Exportar Datos',
      advancedStats: 'Estadísticas Avanzadas',
      timer: 'Temporizador',
      fullHistory: 'Historial Completo',
      integrations: 'Integraciones (Jira, GitHub, Trello)',
      branding: 'Marca Personalizada',
      advancedRoles: 'Roles Avanzados',
      prioritySupport: 'Soporte Prioritario',
      api: 'Acceso API',
      adFree: 'Sin Anuncios',
      select: 'Seleccionar Plan',
      currentPlan: 'Plan Actual',
      upgrade: 'Mejorar',
      downgrade: 'Reducir',
      changePlan: 'Cambiar Plan',
      perMonth: '/mes',
      perYear: '/año',
      mostPopular: 'Más Popular',
    },

    provider: {
      title: 'Elige Método de Pago',
      subtitle: 'Selecciona cómo quieres pagar. Ambas opciones son seguras y procesadas por nuestro backend.',
      stripe: 'Pagar con Tarjeta (Stripe)',
      stripeDescription: 'Tarjeta de crédito, débito o prepago. Checkout seguro con Stripe.',
      paypal: 'Pagar con PayPal',
      paypalDescription: 'Paga usando tu cuenta PayPal o métodos de pago vinculados.',
      cardAccepted: 'Visa, Mastercard, Amex y más',
      proceedToCheckout: 'Proceder al Pago',
      securePayment: 'Pago seguro — cifrado por Stripe',
    },

    success: {
      title: '¡Suscripción Activada!',
      message: 'Tu suscripción ha sido confirmada y ya está activa.',
      welcomeMessage: '¡Bienvenido a {plan}! Ahora tienes acceso a todas las funciones premium.',
      goToDashboard: 'Ir al Panel',
      backToSubscription: 'Gestionar Suscripción',
      planActivated: 'Plan {plan} activado exitosamente',
    },

    pending: {
      title: 'Pago Pendiente',
      message: 'Tu pago está siendo procesado.',
      processingMessage: 'Esto puede tomar unos minutos. Te notificaremos cuando esté completo.',
      expectedTime: 'Tiempo estimado de procesamiento: 1-5 minutos',
      checkEmail: 'Revisa tu correo para una confirmación cuando el procesamiento se complete.',
      backToSubscription: 'Volver a Suscripción',
    },

    failed: {
      title: 'Pago Fallido',
      message: 'No pudimos procesar tu pago.',
      retry: 'Intentar de Nuevo',
      tryDifferentMethod: 'Probar Otro Método de Pago',
      contactSupport: 'Contactar Soporte',
      backToSubscription: 'Volver a Suscripción',
      commonReasons: 'Razones comunes de fallo de pago:',
      insufficientFunds: 'Fondos insuficientes en tu cuenta',
      cardDeclined: 'Tu tarjeta fue rechazada por el emisor',
      networkError: 'Error de red durante el procesamiento',
    },

    canceled: {
      title: 'Suscripción Cancelada',
      message: 'Has cancelado el proceso de suscripción.',
      noCharge: 'No se ha realizado ningún cargo a tu cuenta.',
      tryAgain: 'Intentar de Nuevo',
      backToSubscription: 'Volver a Suscripción',
      goToHome: 'Ir al Inicio',
    },

    manage: {
      title: 'Gestionar Tu Suscripción',
      currentPlan: 'Plan Actual',
      status: 'Estado',
      nextBilling: 'Próxima Facturación',
      cancelSubscription: 'Cancelar Suscripción',
      cancelReason: '¿Por qué cancelas?',
      cancelConfirm: '¿Estás seguro de que quieres cancelar? Mantendrás el acceso hasta el final de tu período de facturación.',
      cancelAtPeriodEnd: 'Cancelación Programada',
      cancelAtPeriodEndMessage: 'Tu suscripción finalizará al cierre de tu período de facturación actual.',
      resumeSubscription: 'Reanudar Suscripción',
      manageBilling: 'Gestionar Facturación',
      paymentHistory: 'Historial de Pagos',
      changePlan: 'Cambiar Plan',
      portalButton: 'Abrir Portal de Cliente',
    },

    upgrade: {
      title: 'Mejorar Tu Plan',
      roomLimit: 'Límite de Salas Alcanzado',
      roomLimitMessage: 'Has alcanzado el número máximo de salas activas para tu plan. Mejora para crear más.',
      participantLimit: 'Límite de Participantes Alcanzado',
      participantLimitMessage: 'Esta sala ha alcanzado el número máximo de participantes para tu plan. Mejora para agregar más.',
      upgradeNow: 'Mejorar Ahora',
      learnMore: 'Más Información',
    },

    general: {
      loading: 'Cargando...',
      error: 'Ocurrió un error',
      retry: 'Reintentar',
      close: 'Cerrar',
      confirm: 'Confirmar',
      cancel: 'Cancelar',
      continue: 'Continuar',
      back: 'Volver',
      yes: 'Sí',
      no: 'No',
      contactSupport: 'Contactar Soporte',
      supportEmail: 'support@planningpokerpro.com',
    },
  },
};

/**
 * Get checkout translations for a specific language
 */
export function getCheckoutTranslations(lang: string): CheckoutTranslations {
  return checkoutTranslations[lang as keyof typeof checkoutTranslations] || checkoutTranslations.en;
}
