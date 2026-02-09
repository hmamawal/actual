import { type BudgetContext } from '@desktop-client/hooks/useBudgetContext';

import { type ChatMessage } from './openaiService';

/**
 * Formats budget context into a system message for the AI
 * This provides the AI with information about the current budget
 */
export function formatBudgetContextForAI(budgetContext: BudgetContext): string {
  if (!budgetContext.accounts || budgetContext.accounts.length === 0) {
    return '';
  }

  const accountsSummary = budgetContext.accounts
    .map(account => {
      const type = account.closed
        ? '[CLOSED]'
        : account.offbudget
          ? '[OFF-BUDGET]'
          : '[ON-BUDGET]';
      const balance = (account.balance / 100).toFixed(2); // Convert from cents
      return `  • ${account.name} (${type}): $${balance}`;
    })
    .join('\n');

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
    .map(([group, cats]) => `  ${group}:\n    ${cats.join(', ')}`)
    .join('\n');

  return `
Current Budget Context:
=======================

Accounts (${budgetContext.onBudgetCount} on-budget, ${budgetContext.offBudgetCount} off-budget, ${budgetContext.closedAccountCount} closed):
${accountsSummary}

Budget Categories:
${categoriesSummary}

You are helping the user manage their personal finances with this budget data. Answer questions about their accounts, categories, and financial situation based on the data shown above.
`;
}

/**
 * Builds chat messages with budget context included
 * The context is added as a system message at the beginning
 */
export function buildChatMessagesWithBudgetContext(
  messages: ChatMessage[],
  budgetContext: BudgetContext,
): ChatMessage[] {
  const budgetContextMessage = formatBudgetContextForAI(budgetContext);

  // If there's no budget context, return messages as-is
  if (!budgetContextMessage.trim()) {
    return messages;
  }

  // Check if we already have a budget context system message
  const hasContextMessage = messages.some(
    m => m.role === 'system' && m.content.includes('Current Budget Context'),
  );

  if (hasContextMessage) {
    // Replace the existing context message
    return messages.map(m =>
      m.role === 'system' && m.content.includes('Current Budget Context')
        ? { ...m, content: budgetContextMessage }
        : m,
    );
  }

  // Add context as first system message if no system message exists
  if (messages.length > 0 && messages[0].role === 'system') {
    // Append to existing system message
    return [
      {
        role: 'system',
        content: messages[0].content + '\n' + budgetContextMessage,
      },
      ...messages.slice(1),
    ];
  }

  // Prepend as new system message
  return [{ role: 'system', content: budgetContextMessage }, ...messages];
}
