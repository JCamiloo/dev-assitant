import { config } from '../config.js';
import { client } from '../llm/anthropic-client.js';
import { Message } from '../types.js';

const CHARS_PER_TOKEN = 4;

export class Conversation {
  private messages: Message[] = [];
  private totalInputsTokens: number = 0;
  private totalOutputsTokens: number = 0;

  constructor(private systemPrompt: string) {}

  addUserMessage(content: string): void {
    this.messages.push({ role: 'user', content });
  }

  addAssistantMessage(content: string): void {
    this.messages.push({ role: 'assistant', content });
  }

  async send(): Promise<string> {
    const response = await client.messages.create({
      model: config.anthropicModel,
      max_tokens: 1024,
      ...(this.systemPrompt && { system: this.systemPrompt }),
      messages: this.messages,
    });

    this.addUsage(response.usage.input_tokens, response.usage.output_tokens);

    const textBlock = response.content.find((block) => block.type === 'text');

    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text content found in response');
    }

    const responseText = textBlock.text;
    this.addAssistantMessage(responseText);

    return responseText;
  }

  addUsage(inputTokens: number, outputTokens: number): void {
    this.totalInputsTokens += inputTokens;
    this.totalOutputsTokens += outputTokens;
  }

  clear(): void {
    this.messages = [];
    this.totalInputsTokens = 0;
    this.totalOutputsTokens = 0;
  }

  getTurnCount(): number {
    return Math.floor(this.messages.length / 2);
  }

  estimateCurrentTokens(): number {
    const totalChars = this.messages.reduce(
      (sum, msg) => sum + msg.content.length,
      0,
    );

    return Math.floor(totalChars / CHARS_PER_TOKEN);
  }

  getStats(): { inputTokens: number; outputTokens: number; turns: number } {
    return {
      inputTokens: this.totalInputsTokens,
      outputTokens: this.totalOutputsTokens,
      turns: this.getTurnCount(),
    };
  }

  getHistory(): Message[] {
    return this.messages;
  }
}
