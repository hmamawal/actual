// @ts-strict-ignore
import type { AIProvider } from '../../../types/models/ai-chat';

import {
  BaseAIProvider,
  type ProviderMessage,
  type ProviderResponse,
} from './base';

export class AnthropicProvider extends BaseAIProvider {
  name: AIProvider = 'anthropic';
  private defaultModel = 'claude-3-5-sonnet-20241022';

  async sendMessage(
    messages: ProviderMessage[],
    options?: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
    },
  ): Promise<ProviderResponse> {
    const apiUrl = this.baseUrl || 'https://api.anthropic.com/v1/messages';
    
    // Separate system messages from conversation
    const systemMessages = messages
      .filter(m => m.role === 'system')
      .map(m => (typeof m.content === 'string' ? m.content : ''))
      .join('\n\n');
    
    const conversationMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role,
        content: m.content,
      }));

    const requestBody = {
      model: options?.model || this.defaultModel,
      max_tokens: options?.maxTokens || 4096,
      temperature: options?.temperature || 1.0,
      system: systemMessages || undefined,
      messages: conversationMessages,
    };

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Anthropic API error: ${response.status} - ${error}`);
      }

      const data = await response.json();

      return {
        content:
          data.content[0]?.type === 'text'
            ? data.content[0].text
            : JSON.stringify(data.content),
        tokens: {
          input: data.usage?.input_tokens || 0,
          output: data.usage?.output_tokens || 0,
        },
        model: data.model,
      };
    } catch (error) {
      throw new Error(`Failed to send message to Anthropic: ${error.message}`);
    }
  }

  supportsVision(): boolean {
    return true;
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.sendMessage(
        [{ role: 'user', content: 'Hello' }],
        { maxTokens: 10 },
      );
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
