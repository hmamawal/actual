export type ChatConversation = {
  id: string;
  title: string;
  messages: Array<{
    id: string;
    content: string;
    sender: 'user' | 'bot';
    timestamp: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
  budgetContextSent: boolean; // Track if context was sent for this conversation
};

const STORAGE_KEY = 'actual_ai_chat_history';
const MAX_CONVERSATIONS = 50;

/**
 * Load all conversations from localStorage
 */
export function loadConversations(): ChatConversation[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return parsed.map((c: any) => ({
      ...c,
      createdAt: new Date(c.createdAt),
      updatedAt: new Date(c.updatedAt),
      messages: c.messages.map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp),
      })),
    }));
  } catch (error) {
    console.error('Failed to load chat history:', error);
    return [];
  }
}

/**
 * Save conversations to localStorage
 */
export function saveConversations(conversations: ChatConversation[]): void {
  try {
    // Limit the number of stored conversations
    const limited = conversations.slice(0, MAX_CONVERSATIONS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
  } catch (error) {
    console.error('Failed to save chat history:', error);
  }
}

/**
 * Create a new conversation
 */
export function createConversation(): ChatConversation {
  return {
    id: `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: 'New Chat',
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    budgetContextSent: false,
  };
}

/**
 * Update conversation title based on first user message
 */
export function generateConversationTitle(firstMessage: string): string {
  // Truncate and clean up the first message to use as title
  const cleaned = firstMessage.trim().replace(/\n/g, ' ');
  return cleaned.length > 50 ? cleaned.substring(0, 47) + '...' : cleaned;
}

/**
 * Update a conversation
 */
export function updateConversation(
  conversation: ChatConversation,
  updates: Partial<ChatConversation>,
): ChatConversation {
  return {
    ...conversation,
    ...updates,
    updatedAt: new Date(),
  };
}

/**
 * Delete a conversation
 */
export function deleteConversation(
  conversations: ChatConversation[],
  conversationId: string,
): ChatConversation[] {
  return conversations.filter(c => c.id !== conversationId);
}

/**
 * Get conversation by ID
 */
export function getConversation(
  conversations: ChatConversation[],
  conversationId: string,
): ChatConversation | undefined {
  return conversations.find(c => c.id === conversationId);
}

/**
 * Sort conversations by most recent first
 */
export function sortConversationsByRecent(
  conversations: ChatConversation[],
): ChatConversation[] {
  return [...conversations].sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
  );
}

/**
 * Clear all conversations (useful for privacy)
 */
export function clearAllConversations(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear chat history:', error);
  }
}
