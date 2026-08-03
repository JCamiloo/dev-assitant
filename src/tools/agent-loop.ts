import Anthropic from '@anthropic-ai/sdk';
import { ToolDefinition } from '../types.js';
import { TOOL_DEFINITIONS } from './definitions.js';
import { client } from '../llm/anthropic-client.js';
import { config } from '../config.js';
import { executeTool } from './executor.js';

const MAX_ITERATIONS = 10;

export async function runWithTools(
  prompt: string,
  systemPrompt?: string,
  tools?: ToolDefinition[],
): Promise<string> {
  const messages: Anthropic.Messages.MessageParam[] = [
    { role: 'user', content: prompt },
  ];

  const sdkTools = (tools ?? TOOL_DEFINITIONS) as Anthropic.Messages.Tool[];

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    console.log(`\nThinking... Iteration ${i + 1} of ${MAX_ITERATIONS}`);

    const response = await client.messages.create({
      model: config.anthropicModel,
      max_tokens: 4096,
      ...(systemPrompt && { system: systemPrompt }),
      tools: sdkTools,
      messages,
    });

    if (response.stop_reason === 'end_turn') {
      const finalText = response.content.reduce((acc, block) => {
        if (block.type === 'text') {
          return acc + block.text;
        }
        return acc;
      }, '');

      console.log(`\nFinal response:\n${finalText}`);
      return finalText;
    }

    if (response.stop_reason === 'tool_use') {
      messages.push({
        role: 'assistant',
        content: response.content,
      });

      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.Messages.ToolUseBlock =>
          block.type === 'tool_use',
      );

      const results = await Promise.all(
        toolUseBlocks.map(async (block) => {
          console.log(`Executing tool: ${block.name} (${block.input})`);

          const toolOutput = await executeTool(
            block.name,
            block.input as Record<string, unknown>,
          );

          console.log(`Tool completed: ${block.name}`);
          return toolOutput;
        }),
      );

      const toolResultContent: Anthropic.Messages.ToolResultBlockParam[] =
        toolUseBlocks.map((block, i) => ({
          type: 'tool_result',
          tool_use_id: block.id,
          content: results[i] ?? 'Error: empty result',
        }));

      messages.push({
        role: 'user',
        content: toolResultContent,
      });

      continue;
    }

    console.warn(
      `Unexpected stop reason: ${response.stop_reason ?? 'unknown'}`,
    );

    const consolidateMessageText = response.content
      .filter(
        (block): block is Anthropic.Messages.TextBlock => block.type === 'text',
      )
      .map((block) => block.text)
      .join('\n');

    return (
      consolidateMessageText ||
      `Session finished: ${response.stop_reason ?? 'Unknown reason'}`
    );
  }

  console.warn(`iteration limit reached ${MAX_ITERATIONS}`);
  return `Task could not be completed in ${MAX_ITERATIONS} iterations`;
}
