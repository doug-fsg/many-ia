export async function createEmbeddingFromAIConfig(config: {
  quemEhAtendente: string
  oQueAtendenteFaz: string
  objetivoAtendente: string
  comoAtendenteDeve: string
}) {
  // Retorna um embedding vazio para manter a estrutura
  return {
    embedding: {
      vector: [],
      text: '',
      metadata: {
        timestamp: new Date().toISOString(),
        disabled: true
      },
    },
  }
}
