import { type ChatMessage } from './openaiService';

import { type BudgetContext } from '@desktop-client/hooks/useBudgetContext';
import { type ScreenContext } from '@desktop-client/hooks/useScreenContext';

/**
 * Formats budget context into a minimal system message for the AI
 * This is sent ONCE per conversation to save tokens
 */
export function formatBudgetContextForAI(budgetContext: BudgetContext): string {
  if (!budgetContext.accounts || budgetContext.accounts.length === 0) {
    return '';
  }

  const accountSummaries = budgetContext.accounts
    .filter(account => !account.closed)
    .map(account => {
      const type = account.offbudget ? 'OFF' : 'ON';
      return `${account.name}(${type})[${account.id}]`;
    })
    .join(', ');

  const categoryCount = budgetContext.categories.length;
  const payeeCount = budgetContext.payees.length;

  return `Budget metadata: Accounts[${accountSummaries}]. Counts[accounts:${budgetContext.accounts.length}, on:${budgetContext.onBudgetCount}, off:${budgetContext.offBudgetCount}, closed:${budgetContext.closedAccountCount}, categories:${categoryCount}, payees:${payeeCount}]. Fetch transaction or category details only when needed.`;
}

/**
 * Formats screen context for AI
 * This is sent with each message as it changes frequently
 */
export function formatScreenContextForAI(screenContext: ScreenContext): string {
  return `User viewing: ${screenContext.screenName} (${screenContext.currentRoute})`;
}

/**
 * Builds chat messages with budget and screen context included
 * Budget context is only added ONCE at the start of a conversation (when budgetContextSent is false)
 * Screen context is added with each message as it may change
 * This saves significant tokens on follow-up messages
 */
export function buildChatMessagesWithBudgetContext(
  messages: ChatMessage[],
  budgetContext: BudgetContext,
  screenContext: ScreenContext,
  budgetContextAlreadySent: boolean,
): ChatMessage[] {
  const budgetContextMessage = formatBudgetContextForAI(budgetContext);
  const screenContextMessage = formatScreenContextForAI(screenContext);

  // Build the context message
  let contextMessage = '';
  
  // Add budget context if not already sent
  if (!budgetContextAlreadySent && budgetContextMessage.trim()) {
    contextMessage += budgetContextMessage;
  }
  
  // Always add screen context (it changes frequently)
  if (screenContextMessage.trim()) {
    if (contextMessage) {
      contextMessage += ' ';
    }
    contextMessage += screenContextMessage;
  }

  // If there's no context to add, return messages as-is
  if (!contextMessage.trim()) {
    return messages;
  }

  // Check if we already have a context system message
  const hasContextMessage = messages.some(
    m => m.role === 'system' && m.content.includes('Budget:'),
  );

  if (hasContextMessage && budgetContextAlreadySent) {
    // Budget context already in messages, just prepend screen context to first user message
    const firstUserIndex = messages.findIndex(m => m.role === 'user');
    if (firstUserIndex !== -1 && screenContextMessage.trim()) {
      const updatedMessages = [...messages];
      updatedMessages[firstUserIndex] = {
        ...updatedMessages[firstUserIndex],
        content: `[${screenContextMessage}] ${updatedMessages[firstUserIndex].content}`,
      };
      return updatedMessages;
    }
    return messages;
  }

  // Add context as first system message if no system message exists
  if (messages.length > 0 && messages[0].role === 'system') {
    // Append to existing system message
    return [
      {
        role: 'system',
        content: messages[0].content + ' ' + contextMessage,
      },
      ...messages.slice(1),
    ];
  }

  // Prepend as new system message
  return [{ role: 'system', content: contextMessage }, ...messages];
}
