// @ts-strict-ignore
import type { AIProvider } from '../../../types/models/ai-chat';

import {
  BaseAIProvider,
  type ProviderMessage,
  type ProviderResponse,
} from './base';

export class OpenAIProvider extends BaseAIProvider {
  name: AIProvider = 'openai';
  private defaultModel = 'gpt-4o';

  async sendMessage(
    messages: ProviderMessage[],
    options?: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
    },
  ): Promise<ProviderResponse> {
    const apiUrl = this.baseUrl || 'https://api.openai.com/v1/chat/completions';

    const formattedMessages = messages.map(m => {
      if (typeof m.content === 'string') {
        return {
          role: m.role,
          content: m.content,
        };
      }
      // Handle multimodal content
      return {
        role: m.role,
        content: m.content.map(part => {
          if (part.type === 'image' && part.source) {
            return {
              type: 'image_url',
              image_url: {
                url: `data:${part.source.media_type};base64,${part.source.data}`,
              },
            };
          }
          return {
            type: 'text',
            text: part.text || '',
          };
        }),
      };
    });

    const requestBody = {
      model: options?.model || this.defaultModel,
      messages: formattedMessages,
      max_tokens: options?.maxTokens || 4096,
      temperature: options?.temperature !== undefined ? options.temperature : 1.0,
    };

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${error}`);
      }

      const data = await response.json();

      return {
        content: data.choices[0]?.message?.content || '',
        tokens: {
          input: data.usage?.prompt_tokens || 0,
          output: data.usage?.completion_tokens || 0,
        },
        model: data.model,
      };
    } catch (error) {
      throw new Error(`Failed to send message to OpenAI: ${error.message}`);
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
