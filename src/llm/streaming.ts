import { config } from '../config.js';
import { client } from './anthropic-client.js';

export async function streamClaude(
  prompt: string,
  systemPrompt?: string,
): Promise<string> {
  let fullResponse = '';
  const streamResponse = await client.messages.stream({
    model: config.anthropicModel,
    max_tokens: 1024,
    ...(systemPrompt && { system: systemPrompt }),
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  streamResponse.on('text', (chunk) => {
    process.stdout.write(chunk);
    fullResponse += chunk;
  });

  await streamResponse.finalMessage();
  process.stdout.write('\n');
  return fullResponse;
}
