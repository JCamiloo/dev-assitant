import { config, validateConfig } from './config.js';

function main(): void {
  validateConfig();

  console.info('DevAssistant configured correctly');
  console.info('Active Configuration:', {
    'LLM Provider': config.provider,
    'Anthropic Model': config.anthropicModel,
    'OpenAI Model': config.openAIModel,
    'Docs path': config.docsPath,
    'RAG top-K': config.ragTopK,
  });
}

main();
