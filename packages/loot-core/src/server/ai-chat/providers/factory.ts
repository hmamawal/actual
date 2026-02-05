// @ts-strict-ignore
import type { AIProvider, AIProviderConfig } from '../../../types/models/ai-chat';

import { AnthropicProvider } from './anthropic';
import type { IAIProvider } from './base';
import { OpenAIProvider } from './openai';

export class ProviderFactory {
  static createProvider(
    config: AIProviderConfig,
  ): IAIProvider | null {
    if (!config.enabled || !config.apiKey) {
      return null;
    }

    switch (config.provider) {
      case 'anthropic':
        return new AnthropicProvider(config.apiKey, config.baseUrl);
      case 'openai':
        return new OpenAIProvider(config.apiKey, config.baseUrl);
      case 'local':
        // TODO: Implement local provider (e.g., ollama)
        return null;
      default:
        return null;
    }
  }

  static getSupportedProviders(): AIProvider[] {
    return ['anthropic', 'openai', 'local'];
  }
}
