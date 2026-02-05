// @ts-strict-ignore
import type {
  AIProvider,
  ChatMessage,
  ChatSession,
  ScreenContext,
  Visualization,
  MessageAttachment,
  ChatPreferences,
} from '../types/models/ai-chat';

export interface AIChatHandlers {
  'ai-chat-send-message': (args: {
    sessionId: string;
    message: string;
    attachments?: MessageAttachment[];
    includeScreenContext?: boolean;
  }) => Promise<{ messageId: string; response: ChatMessage }>;

  'ai-chat-create-session': (args: {
    title?: string;
  }) => Promise<{ sessionId: string }>;

  'ai-chat-get-session': (args: {
    sessionId: string;
  }) => Promise<ChatSession | null>;

  'ai-chat-list-sessions': () => Promise<ChatSession[]>;

  'ai-chat-delete-session': (args: { sessionId: string }) => Promise<void>;

  'ai-chat-get-screen-context': () => Promise<ScreenContext>;

  'ai-chat-execute-code': (args: {
    code: string;
    type: 'chart' | 'query';
  }) => Promise<{ result: unknown; visualization?: Visualization }>;

  'ai-chat-save-visualization': (args: {
    sessionId: string;
    messageId: string;
    visualization: Visualization;
  }) => Promise<{ saved: boolean }>;

  'ai-chat-get-budget-context': () => Promise<{
    accounts: unknown[];
    categories: unknown[];
    stats: unknown;
    recentTransactions: unknown[];
  }>;

  'ai-chat-query-data': (args: {
    query: string;
    context?: string;
  }) => Promise<{ data: unknown; summary: string }>;

  'ai-chat-get-preferences': () => Promise<ChatPreferences>;

  'ai-chat-set-preferences': (args: {
    preferences: Partial<ChatPreferences>;
  }) => Promise<void>;

  'ai-chat-test-provider': (args: {
    provider: AIProvider;
    apiKey: string;
  }) => Promise<{ success: boolean; error?: string }>;

  'ai-chat-check-security': () => Promise<{
    platform: string;
    isSecure: boolean;
  }>;
}
