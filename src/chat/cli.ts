import * as readline from 'readline';
import { DOCUMENTATION_ASSISTANT_PROMPT } from '../llm/prompts.js';
import { Conversation } from './conversation.js';
import { TOOL_DEFINITIONS } from '../tools/definitions.js';
import { runWithTools } from '../tools/agent-loop.js';

export async function startCLI(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const conversation = new Conversation(DOCUMENTATION_ASSISTANT_PROMPT);

  console.log('');
  console.log('💬 Ask your question and press Enter.');
  console.log(
    `   I have access to ${TOOL_DEFINITIONS.length} tools: ${TOOL_DEFINITIONS.map((t) => t.name).join(', ')}`,
  );
  console.log('   Commands: /clear, /stats, /tools, /exit');
  console.log('');

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

      if (userInput === '/tools') {
        console.log(`\n Available tools (${TOOL_DEFINITIONS.length}):`);
        for (const tool of TOOL_DEFINITIONS) {
          const params = Object.keys(tool.input_schema.properties).join(', ');
          console.log(`   • ${tool.name}(${params})`);
          console.log(`     ${tool.description.split('.')[0]}.`);
        }
        console.log('');
        promptUser();
        return;
      }

      try {
        conversation.addUserMessage(userInput);
        const response = await runWithTools(
          userInput,
          DOCUMENTATION_ASSISTANT_PROMPT,
          TOOL_DEFINITIONS,
        );
        process.stdout.write(`\nClaude: ${response}\n\n`);
        conversation.addAssistantMessage(response);
      } catch (error) {
        console.error(`Error adding user message: ${(error as Error).message}`);
      }
      promptUser();
    });
  };
  promptUser();
}
