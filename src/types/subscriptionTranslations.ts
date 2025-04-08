/**
 * Translations for subscription-related content
 */

export const subscriptionTranslations = {
  en: {
    // Comments
    types: "Types for the subscription system",
    availablePlans: "Available plans",
    billingIntervals: "Billing intervals",
    planFeatures: "Features for each plan",
    planDetails: "Details for each plan",
    subscriptionStatus: "Subscription status",
    paymentMethod: "Payment method",
    userSubscription: "User subscription information",
    paymentHistory: "Payment history",
    availablePlansDefinition: "Definition of available plans",
    
    // Plan names and descriptions
    free: {
      name: "Free",
      description: "For small teams and personal use"
    },
    proMonthly: {
      name: "Pro (Monthly)",
      description: "For professional teams"
    },
    enterpriseMonthly: {
      name: "Enterprise (Monthly)",
      description: "For large organizations"
    },
    proYearly: {
      name: "Pro (Yearly)",
      description: "For professional teams - Save over 15%"
    },
    enterpriseYearly: {
      name: "Enterprise (Yearly)",
      description: "For large organizations - Save over 15%"
    },
    
    // Feature comments
    adFreeFeature: "Feature to indicate if the plan shows no ads",
    freeAds: "Free users see ads",
    proAds: "Pro users don't see ads",
    enterpriseAds: "Enterprise users don't see ads",
    
    // Other comments
    paymentIdComment: "Payment ID in PayPal",
    subscriptionIdComment: "Subscription ID in PayPal",
    transactionIdComment: "Transaction ID in PayPal"
  },
  es: {
    // Comments
    types: "Tipos para el sistema de suscripciones",
    availablePlans: "Planes disponibles",
    billingIntervals: "Intervalos de facturación",
    planFeatures: "Características de cada plan",
    planDetails: "Detalles de cada plan",
    subscriptionStatus: "Estado de la suscripción",
    paymentMethod: "Método de pago",
    userSubscription: "Información de la suscripción del usuario",
    paymentHistory: "Historial de pagos",
    availablePlansDefinition: "Definición de los planes disponibles",
    
    // Plan names and descriptions
    free: {
      name: "Free",
      description: "Para equipos pequeños y uso personal"
    },
    proMonthly: {
      name: "Pro (Mensual)",
      description: "Para equipos profesionales"
    },
    enterpriseMonthly: {
      name: "Enterprise (Mensual)",
      description: "Para grandes organizaciones"
    },
    proYearly: {
      name: "Pro (Anual)",
      description: "Para equipos profesionales - Ahorra más de 15%"
    },
    enterpriseYearly: {
      name: "Enterprise (Anual)",
      description: "Para grandes organizaciones - Ahorra más de 15%"
    },
    
    // Feature comments
    adFreeFeature: "Característica para indicar si el plan no muestra anuncios",
    freeAds: "Los usuarios Free ven anuncios",
    proAds: "Los usuarios Pro no ven anuncios",
    enterpriseAds: "Los usuarios Enterprise no ven anuncios",
    
    // Other comments
    paymentIdComment: "ID de la transacción en PayPal",
    subscriptionIdComment: "ID de la suscripción en PayPal",
    transactionIdComment: "ID de la transacción en PayPal"
  }
};

/**
 * Get translations for a specific language
 * @param lang Language code ('en' or 'es')
 * @returns Translations object for the specified language
 */
export function getSubscriptionTranslations(lang: string) {
  return subscriptionTranslations[lang as keyof typeof subscriptionTranslations] || subscriptionTranslations.en;
}