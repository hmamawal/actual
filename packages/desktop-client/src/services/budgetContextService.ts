import { type BudgetContext } from '@desktop-client/hooks/useBudgetContext';

import { type ChatMessage } from './openaiService';

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
 * Builds chat messages with budget context included
 * Context is only added ONCE at the start of a conversation (when budgetContextSent is false)
 * This saves significant tokens on follow-up messages
 */
export function buildChatMessagesWithBudgetContext(
  messages: ChatMessage[],
  budgetContext: BudgetContext,
  budgetContextAlreadySent: boolean,
): ChatMessage[] {
  // If context was already sent in this conversation, don't send it again
  if (budgetContextAlreadySent) {
    return messages;
  }

  const budgetContextMessage = formatBudgetContextForAI(budgetContext);

  // If there's no budget context, return messages as-is
  if (!budgetContextMessage.trim()) {
    return messages;
  }

  // Check if we already have a budget context system message
  const hasContextMessage = messages.some(
    m => m.role === 'system' && m.content.includes('Budget:'),
  );

  if (hasContextMessage) {
    // Already in messages, no need to add again
    return messages;
  }

  // Add context as first system message if no system message exists
  if (messages.length > 0 && messages[0].role === 'system') {
    // Append to existing system message
    return [
      {
        role: 'system',
        content: messages[0].content + ' ' + budgetContextMessage,
      },
      ...messages.slice(1),
    ];
  }

  // Prepend as new system message
  return [{ role: 'system', content: budgetContextMessage }, ...messages];
}
