import OpenAI from 'openai';
import { config } from '../config.js';

const openAiClient = new OpenAI({
  apiKey: config.openAIApiKey,
});

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openAiClient.embeddings.create({
    model: config.openAIEmbeddingModel,
    input: text,
  });

  return response.data[0]?.embedding ?? [];
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const response = await openAiClient.embeddings.create({
    model: config.openAIEmbeddingModel,
    input: texts,
  });

  return response.data.map((item) => item.embedding);
}
