import { type BudgetContext } from '@desktop-client/hooks/useBudgetContext';

import { type ChatMessage } from './openaiService';

/**
 * Formats budget context into a CONCISE system message for the AI
 * This is sent ONCE per conversation to save tokens
 */
export function formatBudgetContextForAI(budgetContext: BudgetContext): string {
  if (!budgetContext.accounts || budgetContext.accounts.length === 0) {
    return '';
  }

  // Concise account summary - only names and balances
  const accountsSummary = budgetContext.accounts
    .filter(account => !account.closed) // Skip closed accounts to save tokens
    .map(account => {
      const type = account.offbudget ? 'OFF' : 'ON';
      const balance = (account.balance / 100).toFixed(2);
      return `${account.name}(${type}):$${balance}`;
    })
    .join(', ');

  // Concise categories - just the names grouped
  const categoriesByGroup = budgetContext.categories.reduce(
    (acc, cat) => {
      if (!acc[cat.group]) {
        acc[cat.group] = [];
      }
      acc[cat.group].push(cat.name);
      return acc;
    },
    {} as Record<string, string[]>,
  );

  const categoriesSummary = Object.entries(categoriesByGroup)
    .map(([group, cats]) => `${group}: ${cats.join(', ')}`)
    .join(' | ');

  // VERY concise system message - essential info only
  return `Budget: Accounts[${accountsSummary}]. Categories[${categoriesSummary}]. Answer financial questions using this data. For transactions, user will provide them when needed.`;
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
