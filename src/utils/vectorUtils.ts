import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function createEmbeddingFromAIConfig(config: {
  quemEhAtendente: string;
  oQueAtendenteFaz: string;
  objetivoAtendente: string;
  comoAtendenteDeve: string;
}) {
  try {
    console.log('Iniciando geração de embedding');

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY não configurada');
    }

    const combinedText = `
      Atendente: ${config.quemEhAtendente}
      Função: ${config.oQueAtendenteFaz}
      Objetivo: ${config.objetivoAtendente}
      Comportamento: ${config.comoAtendenteDeve}
    `.trim();

    console.log('Texto combinado:', combinedText);

    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: combinedText,
    });

    return {
      embedding: {
        vector: response.data[0].embedding,
        text: combinedText,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      },
    };
  } catch (error) {
    console.error('Erro detalhado na geração do embedding:', error);
    throw error;
  }
}
