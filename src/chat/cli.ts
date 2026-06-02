import * as readline from 'readline';
import { DOCUMENTATION_ASSISTANT_PROMPT } from '../llm/prompts.js';
import { Conversation } from './conversation.js';
import { client } from '../llm/anthropic-client.js';
import { config } from '../config.js';

export async function startCLI(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const conversation = new Conversation(DOCUMENTATION_ASSISTANT_PROMPT);

  const promptUser = () => {
    rl.question('You: ', async (input) => {
      const userInput = input.trim();

      if (!userInput) {
        promptUser();
        return;
      }

      if (userInput === '/stats') {
        const stats = conversation.getStats();
        console.log(`\n📊 Conversation statistics:`);
        console.log(`   • Turns: ${stats.turns}`);
        console.log(`   • Accumulated input tokens: ${stats.inputTokens}`);
        console.log(`   • Accumulated output tokens: ${stats.outputTokens}`);
        console.log(
          `   • Estimated tokens in current context: ${conversation.estimateCurrentTokens()}\n`,
        );
        promptUser();
        return;
      }

      if (userInput === '/clear') {
        conversation.clear();
        promptUser();
        return;
      }

      if (userInput === '/exit') {
        const stats = conversation.getStats();
        console.log(`\n👋 Ending conversation. Final statistics:`);
        console.log(`   • Turns: ${stats.turns}`);
        console.log(`   • Accumulated input tokens: ${stats.inputTokens}`);
        console.log(`   • Accumulated output tokens: ${stats.outputTokens}`);
        rl.close();
        return;
      }

      try {
        conversation.addUserMessage(userInput);
        process.stdout.write('Assistant is typing...');
        const record = conversation.getHistory();
        let fullMessage = '';

        const stream = client.messages.stream({
          model: config.anthropicModel,
          max_tokens: 1024,
          system: DOCUMENTATION_ASSISTANT_PROMPT,
          messages: record,
        });

        stream.on('text', (chunck) => {
          process.stdout.write(chunck);
          fullMessage += chunck;
        });

        const finalMessage = await stream.finalMessage();
        conversation.addUsage(
          finalMessage.usage.input_tokens,
          finalMessage.usage.output_tokens,
        );
        process.stdout.write('\n\n');
        conversation.addAssistantMessage(fullMessage);
      } catch (error) {
        console.error(`Error adding user message: ${(error as Error).message}`);
      }
      promptUser();
    });
  };
  promptUser();
}
