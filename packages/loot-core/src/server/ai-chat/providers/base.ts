// @ts-strict-ignore
import type {
  AIProvider,
  ChatMessage,
  MessageAttachment,
} from '../../../types/models/ai-chat';

export type ProviderMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string | Array<{ type: 'text' | 'image'; text?: string; source?: unknown }>;
};

export type ProviderResponse = {
  content: string;
  tokens?: {
    input: number;
    output: number;
  };
  model: string;
};

export interface IAIProvider {
  name: AIProvider;
  sendMessage(
    messages: ProviderMessage[],
    options?: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
    },
  ): Promise<ProviderResponse>;
  
  supportsVision(): boolean;
  
  testConnection(): Promise<{ success: boolean; error?: string }>;
}

export abstract class BaseAIProvider implements IAIProvider {
  protected apiKey: string;
  protected baseUrl?: string;

  constructor(apiKey: string, baseUrl?: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  abstract name: AIProvider;
  abstract sendMessage(
    messages: ProviderMessage[],
    options?: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
    },
  ): Promise<ProviderResponse>;
  
  abstract supportsVision(): boolean;
  abstract testConnection(): Promise<{ success: boolean; error?: string }>;

  protected formatAttachments(attachments: MessageAttachment[]): Array<{
    type: 'text' | 'image';
    text?: string;
    source?: unknown;
  }> {
    return attachments.map(att => {
      if (att.type === 'image') {
        return {
          type: 'image' as const,
          source: {
            type: 'base64',
            media_type: att.mimeType,
            data: att.data,
          },
        };
      }
      return {
        type: 'text' as const,
        text: `[Attachment: ${att.name}]`,
      };
    });
  }
}
