// @ts-strict-ignore
export type AIProvider = 'anthropic' | 'openai' | 'local';

export type AIModel = {
  provider: AIProvider;
  modelId: string;
  displayName: string;
  supportsVision: boolean;
  supportsCodeExecution: boolean;
  maxTokens: number;
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  attachments?: MessageAttachment[];
  visualizations?: Visualization[];
  metadata?: {
    model?: string;
    tokens?: number;
    executionTime?: number;
  };
};

export type MessageAttachment = {
  id: string;
  type: 'image' | 'file';
  name: string;
  mimeType: string;
  data: string; // base64 encoded
  size: number;
};

export type Visualization = {
  id: string;
  type: 'chart' | 'table' | 'custom';
  title: string;
  code: string;
  data: unknown;
  config?: unknown;
  savedAt?: number;
};

export type ScreenContext = {
  route: string;
  type: 'budget' | 'transactions' | 'reports' | 'accounts' | 'settings' | 'dashboard';
  data: {
    currentMonth?: string;
    accountId?: string;
    categoryId?: string;
    filters?: unknown[];
    visibleTransactions?: unknown[];
    budgetData?: unknown;
    reportData?: unknown;
  };
  timestamp: number;
};

export type BudgetDataContext = {
  budgetId: string;
  accounts: Array<{ id: string; name: string; balance: number; type: string }>;
  categories: Array<{ id: string; name: string; groupName: string }>;
  monthlyStats: {
    month: string;
    income: number;
    expenses: number;
    balance: number;
  }[];
  recentTransactions: Array<{
    id: string;
    date: string;
    amount: number;
    payee: string;
    category: string;
    account: string;
  }>;
};

export type ChatSession = {
  id: string;
  title: string;
  messages: ChatMessage[];
  context: ScreenContext | null;
  budgetContext: BudgetDataContext | null;
  createdAt: number;
  updatedAt: number;
};

export type AIProviderConfig = {
  provider: AIProvider;
  apiKey: string;
  baseUrl?: string;
  defaultModel: string;
  enabled: boolean;
};

export type ChatPreferences = {
  defaultProvider: AIProvider;
  autoCapture: boolean; // Auto-capture screen context
  includeTransactionData: boolean;
  maxContextMessages: number;
  providers: AIProviderConfig[];
};
