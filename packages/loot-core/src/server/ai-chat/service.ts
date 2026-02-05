// @ts-strict-ignore
import { v4 as uuidv4 } from 'uuid';

import type {
  ChatMessage,
  ChatPreferences,
  ChatSession,
  MessageAttachment,
  ScreenContext,
  Visualization,
} from '../../types/models/ai-chat';
import * as credentials from '../../platform/server/credentials';
import * as prefs from '../prefs';

import { CodeExecutor } from './code-executor';
import { BudgetDataContextProvider } from './data-context';
import type { IAIProvider, ProviderMessage } from './providers/base';
import { ProviderFactory } from './providers/factory';

// Custom diagnostic logger
class DiagnosticLogger {
  private prefix = '[AI-Chat-Debug]';

  logOperation(op: string, details: Record<string, unknown>) {
    console.log(`${this.prefix} ${op}:`, JSON.stringify(details, null, 2));
  }

  logError(op: string, err: Error | unknown) {
    console.error(`${this.prefix} ERROR in ${op}:`, {
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
  }
}

const diagnostics = new DiagnosticLogger();

export class AIChatService {
  private sessions: Map<string, ChatSession> = new Map();
  private dataProvider: BudgetDataContextProvider;
  private codeExecutor: CodeExecutor;
  private currentScreenContext: ScreenContext | null = null;

  constructor() {
    this.dataProvider = new BudgetDataContextProvider();
    this.codeExecutor = new CodeExecutor();

    // Initialize secure credential storage
    credentials.init().catch(err => {
      console.error('Failed to initialize credential storage:', err);
    });
  }

  async createSession(title?: string): Promise<string> {
    const sessionId = uuidv4();
    const session: ChatSession = {
      id: sessionId,
      title: title || `Chat ${new Date().toLocaleString()}`,
      messages: [],
      context: null,
      budgetContext: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.sessions.set(sessionId, session);
    await this.saveSessions();

    return sessionId;
  }

  async getSession(sessionId: string): Promise<ChatSession | null> {
    return this.sessions.get(sessionId) || null;
  }

  async listSessions(): Promise<ChatSession[]> {
    return Array.from(this.sessions.values()).sort(
      (a, b) => b.updatedAt - a.updatedAt,
    );
  }

  async deleteSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
    await this.saveSessions();
  }

  async sendMessage(
    sessionId: string,
    message: string,
    attachments?: MessageAttachment[],
    includeScreenContext = true,
  ): Promise<{ messageId: string; response: ChatMessage }> {
    diagnostics.logOperation('sendMessage.start', {
      sessionId: sessionId.substring(0, 8),
      msgLen: message.length,
      hasAttach: !!attachments?.length,
    });

    const session = this.sessions.get(sessionId);
    if (!session) {
      diagnostics.logError('sendMessage', new Error('Session lookup failed'));
      throw new Error('Session not found');
    }

    // Create user message
    const userMessageId = uuidv4();
    const userMessage: ChatMessage = {
      id: userMessageId,
      role: 'user',
      content: message,
      timestamp: Date.now(),
      attachments,
    };

    session.messages.push(userMessage);

    try {
      // Get preferences and provider
      const preferences = await this.getPreferences();
      diagnostics.logOperation('preferences.loaded', {
        defaultProv: preferences.defaultProvider,
        provCount: preferences.providers.length,
      });

      const providerConfig = preferences.providers.find(
        p => p.provider === preferences.defaultProvider,
      );

      if (!providerConfig || !providerConfig.enabled) {
        diagnostics.logError(
          'provider.config',
          new Error(
            providerConfig ? 'Provider disabled' : 'Provider not found',
          ),
        );
        throw new Error('No AI provider configured');
      }

      diagnostics.logOperation('provider.check', {
        name: providerConfig.provider,
        hasKey: !!providerConfig.apiKey,
        keyLen: providerConfig.apiKey?.length || 0,
        modelSet: providerConfig.defaultModel || 'default',
      });

      const provider = ProviderFactory.createProvider(providerConfig);

      if (!provider) {
        diagnostics.logError(
          'provider.factory',
          new Error('Factory returned null'),
        );
        throw new Error('Missing or invalid API key for provider');
      }

      // Build context
      const context = await this.buildContext(
        session,
        includeScreenContext,
        preferences,
      );

      // Convert messages to provider format
      const providerMessages = this.convertMessagesToProviderFormat(
        session.messages,
        context,
        attachments,
      );

      diagnostics.logOperation('api.call', {
        provider: providerConfig.provider,
        msgCount: providerMessages.length,
        model: providerConfig.defaultModel,
      });

      // Send to AI provider
      const startTime = Date.now();
      const providerResponse = await provider.sendMessage(providerMessages, {
        model: providerConfig.defaultModel || undefined,
        maxTokens: 4096,
        temperature: 0.7,
      });
      const executionTime = Date.now() - startTime;

      diagnostics.logOperation('api.response', {
        responseLen: providerResponse.content.length,
        timeMs: executionTime,
        modelUsed: providerResponse.model,
      });

      // Check if response contains code to execute
      const codeMatch = providerResponse.content.match(
        /```(?:javascript|js|code)\n([\s\S]*?)```/,
      );

      let visualizations: Visualization[] | undefined;
      if (codeMatch && codeMatch[1]) {
        try {
          const budgetContext = await this.dataProvider.getBudgetContext();
          const execResult = await this.codeExecutor.executeVisualizationCode(
            codeMatch[1],
            budgetContext,
          );

          if (execResult.visualization) {
            visualizations = [execResult.visualization];
          }
        } catch (error) {
          diagnostics.logError('visualization.exec', error);
        }
      }

      // Create assistant message
      const assistantMessageId = uuidv4();
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: providerResponse.content,
        timestamp: Date.now(),
        visualizations,
        metadata: {
          model: providerResponse.model,
          tokens:
            providerResponse.tokens &&
            providerResponse.tokens.input + providerResponse.tokens.output,
          executionTime,
        },
      };

      session.messages.push(assistantMessage);
      session.updatedAt = Date.now();

      await this.saveSessions();

      diagnostics.logOperation('sendMessage.complete', {
        success: true,
      });

      return {
        messageId: assistantMessageId,
        response: assistantMessage,
      };
    } catch (err) {
      diagnostics.logError('sendMessage', err);
      throw err;
    }
  }

  private getProvider(preferences: ChatPreferences): IAIProvider | null {
    const providerConfig = preferences.providers.find(
      p => p.provider === preferences.defaultProvider,
    );

    if (!providerConfig) {
      return null;
    }

    return ProviderFactory.createProvider(providerConfig);
  }

  private async buildContext(
    session: ChatSession,
    includeScreenContext: boolean,
    preferences: ChatPreferences,
  ): Promise<string> {
    const contextParts: string[] = [];

    // System context
    contextParts.push(
      'You are an AI assistant integrated into Actual Budget, a personal finance application.',
      "You have access to the user's budget data and can help with financial analysis, budgeting advice, and data visualization.",
      'When asked to create visualizations, generate JavaScript code using the createChart() or createTable() functions.',
    );

    // Budget data context
    if (preferences.includeTransactionData) {
      const budgetContext = await this.dataProvider.getBudgetContext();
      contextParts.push(
        '\n## Budget Context',
        `Accounts: ${budgetContext.accounts.length} accounts`,
        `Categories: ${budgetContext.categories.length} categories`,
        `Recent transactions: ${budgetContext.recentTransactions.length} transactions`,
        '\nMonthly Summary (last 6 months):',
        budgetContext.stats
          .map(
            s =>
              `- ${s.month}: Income $${s.income.toFixed(2)}, Expenses $${s.expenses.toFixed(2)}, Balance $${s.balance.toFixed(2)}`,
          )
          .join('\n'),
      );
    }

    // Screen context
    if (includeScreenContext && this.currentScreenContext) {
      contextParts.push(
        '\n## Current Screen',
        `Type: ${this.currentScreenContext.type}`,
        `Route: ${this.currentScreenContext.route}`,
      );

      if (this.currentScreenContext.data.currentMonth) {
        contextParts.push(
          `Current Month: ${this.currentScreenContext.data.currentMonth}`,
        );
      }
    }

    return contextParts.join('\n');
  }

  private convertMessagesToProviderFormat(
    messages: ChatMessage[],
    context: string,
    attachments?: MessageAttachment[],
  ): ProviderMessage[] {
    const providerMessages: ProviderMessage[] = [];

    // Add system context
    providerMessages.push({
      role: 'system',
      content: context,
    });

    // Add conversation history (limit to recent messages)
    const recentMessages = messages.slice(-10);

    recentMessages.forEach(msg => {
      if (msg.role === 'system') return;

      if (msg.attachments && msg.attachments.length > 0) {
        // Multimodal message
        const content: Array<{
          type: 'text' | 'image';
          text?: string;
          source?: unknown;
        }> = [{ type: 'text', text: msg.content }];

        msg.attachments.forEach(att => {
          if (att.type === 'image') {
            content.push({
              type: 'image',
              source: {
                type: 'base64',
                media_type: att.mimeType,
                data: att.data,
              },
            });
          }
        });

        providerMessages.push({
          role: msg.role as 'user' | 'assistant',
          content,
        });
      } else {
        providerMessages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        });
      }
    });

    return providerMessages;
  }

  setScreenContext(context: ScreenContext): void {
    this.currentScreenContext = context;
  }

  getScreenContext(): ScreenContext | null {
    return this.currentScreenContext;
  }

  async getBudgetContext() {
    return this.dataProvider.getBudgetContext();
  }

  async queryData(query: string, context?: string) {
    return this.dataProvider.queryDataByIntent(query, context);
  }

  async executeCode(code: string, type: 'chart' | 'query') {
    const budgetContext = await this.dataProvider.getBudgetContext();
    return this.codeExecutor.executeVisualizationCode(code, budgetContext);
  }

  async saveVisualization(
    sessionId: string,
    messageId: string,
    visualization: Visualization,
  ): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    const message = session.messages.find(m => m.id === messageId);
    if (!message) return false;

    visualization.savedAt = Date.now();

    if (!message.visualizations) {
      message.visualizations = [];
    }

    message.visualizations.push(visualization);
    await this.saveSessions();

    return true;
  }

  async getPreferences(): Promise<ChatPreferences> {
    const savedPrefs = await prefs.getPrefs();
    const aiChatPrefs = savedPrefs['ai-chat'] as ChatPreferences | undefined;

    const basePrefs = aiChatPrefs || {
      defaultProvider: 'anthropic',
      autoCapture: true,
      includeTransactionData: true,
      maxContextMessages: 10,
      providers: [],
    };

    // Load API keys from secure storage
    const providersWithKeys = await Promise.all(
      basePrefs.providers.map(async provider => {
        const apiKey = await credentials.getCredential(
          `ai-chat-${provider.provider}`,
        );
        return {
          ...provider,
          apiKey: apiKey || provider.apiKey || '', // Fallback to stored key for migration
        };
      }),
    );

    return {
      ...basePrefs,
      providers: providersWithKeys,
    };
  }

  async setPreferences(preferences: Partial<ChatPreferences>): Promise<void> {
    const currentPrefs = await this.getPreferences();
    const updatedPrefs = { ...currentPrefs, ...preferences };

    // Extract and store API keys securely when possible.
    if (updatedPrefs.providers) {
      const providersWithStorage = [] as ChatPreferences['providers'];

      for (const provider of updatedPrefs.providers) {
        const nextProvider = { ...provider };

        if (provider.apiKey) {
          try {
            await credentials.setCredential(
              `ai-chat-${provider.provider}`,
              provider.apiKey,
            );
            // Remove from preferences object (don't store in plain text)
            nextProvider.apiKey = '';
          } catch (error) {
            console.warn(
              'Secure credential storage unavailable; storing API key in preferences.',
              error,
            );
            // Keep the API key in preferences as fallback when secure storage fails
            // This ensures the key is not lost and can still be used
          }
        }

        providersWithStorage.push(nextProvider);
      }

      updatedPrefs.providers = providersWithStorage;
    }

    await prefs.savePrefs({ 'ai-chat': updatedPrefs } as any);
  }

  async testProvider(
    provider: string,
    apiKey: string,
  ): Promise<{ success: boolean; error?: string }> {
    const providerInstance = ProviderFactory.createProvider({
      provider: provider as any,
      apiKey,
      enabled: true,
      defaultModel: '',
    });

    if (!providerInstance) {
      return { success: false, error: 'Invalid provider' };
    }

    return providerInstance.testConnection();
  }

  private async saveSessions(): Promise<void> {
    // Save sessions to preferences
    const sessions = Array.from(this.sessions.values());
    await (prefs.savePrefs as any)({ 'ai-chat-sessions': sessions });
  }

  async loadSessions(): Promise<void> {
    const savedPrefs = await prefs.getPrefs();
    const sessions =
      ((savedPrefs as any)['ai-chat-sessions'] as ChatSession[]) || [];

    this.sessions.clear();
    sessions.forEach(session => {
      this.sessions.set(session.id, session);
    });
  }
}

// Singleton instance
let aiChatService: AIChatService | null = null;

export function getAIChatService(): AIChatService {
  if (!aiChatService) {
    aiChatService = new AIChatService();
  }
  return aiChatService;
}
