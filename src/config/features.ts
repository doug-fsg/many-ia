/**
 * Configuração centralizada de todas as features disponíveis no sistema
 * Para adicionar uma nova feature, basta adicionar uma entrada aqui
 */
export const AVAILABLE_FEATURES = {
  googleCalendar: {
    name: 'Google Calendar',
    description: 'Integração com Google Calendar para agendamento automático',
    category: 'integrations',
  },
  // Futuras features podem ser adicionadas aqui facilmente
  // exemplo:
  // whatsappIntegration: {
  //   name: 'WhatsApp Integration',
  //   description: 'Integração com WhatsApp Business API',
  //   category: 'integrations',
  // },
} as const;

export type FeatureName = keyof typeof AVAILABLE_FEATURES;

/**
 * Valida se um nome de feature é válido
 */
export function isValidFeatureName(featureName: string): featureName is FeatureName {
  return featureName in AVAILABLE_FEATURES;
}

/**
 * Retorna metadados de uma feature
 */
export function getFeatureMetadata(featureName: FeatureName) {
  return AVAILABLE_FEATURES[featureName];
}

/**
 * Retorna todas as features disponíveis
 */
export function getAllFeatures() {
  return Object.keys(AVAILABLE_FEATURES) as FeatureName[];
}

