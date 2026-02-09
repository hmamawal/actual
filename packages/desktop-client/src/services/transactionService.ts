import { send } from 'loot-core/platform/client/fetch';
import { type TransactionEntity } from 'loot-core/types/models';

/**
 * Query transactions with filters
 * This is called on-demand when user asks about transactions
 * to avoid sending all transaction data upfront
 */
export async function queryTransactions(params: {
  startDate?: string;
  endDate?: string;
  accountId?: string;
  categoryId?: string;
  limit?: number;
}): Promise<TransactionEntity[]> {
  const { startDate, endDate, accountId, categoryId, limit = 100 } = params;

  // Build query
  let query = `SELECT * FROM v_transactions WHERE 1=1`;
  const queryParams: any[] = [];

  if (startDate) {
    query += ` AND date >= ?`;
    queryParams.push(startDate);
  }

  if (endDate) {
    query += ` AND date <= ?`;
    queryParams.push(endDate);
  }

  if (accountId) {
    query += ` AND account = ?`;
    queryParams.push(accountId);
  }

  if (categoryId) {
    query += ` AND category = ?`;
    queryParams.push(categoryId);
  }

  query += ` ORDER BY date DESC LIMIT ?`;
  queryParams.push(limit);

  const result = await send('query', { query, params: queryParams });
  return result.data || [];
}

/**
 * Get transaction summary for a date range
 * Provides aggregated data instead of individual transactions
 */
export async function getTransactionSummary(params: {
  startDate: string;
  endDate: string;
  categoryId?: string;
}): Promise<{
  totalIncome: number;
  totalExpense: number;
  transactionCount: number;
  topCategories: Array<{ categoryId: string; categoryName: string; amount: number }>;
}> {
  const { startDate, endDate, categoryId } = params;

  let query = `
    SELECT 
      SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as totalIncome,
      SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as totalExpense,
      COUNT(*) as transactionCount
    FROM v_transactions 
    WHERE date >= ? AND date <= ?
  `;
  const queryParams: any[] = [startDate, endDate];

  if (categoryId) {
    query += ` AND category = ?`;
    queryParams.push(categoryId);
  }

  const result = await send('query', { query, params: queryParams });
  const summary = result.data?.[0] || {
    totalIncome: 0,
    totalExpense: 0,
    transactionCount: 0,
  };

  // Get top categories
  let catQuery = `
    SELECT category as categoryId, category as categoryName, SUM(ABS(amount)) as amount
    FROM v_transactions
    WHERE date >= ? AND date <= ? AND amount < 0
    GROUP BY category
    ORDER BY amount DESC
    LIMIT 5
  `;
  const catResult = await send('query', { query: catQuery, params: [startDate, endDate] });

  return {
    ...summary,
    topCategories: catResult.data || [],
  };
}

/**
 * Search transactions by description or payee
 * Used for finding specific transactions
 */
export async function searchTransactions(params: {
  searchTerm: string;
  limit?: number;
}): Promise<TransactionEntity[]> {
  const { searchTerm, limit = 50 } = params;

  const query = `
    SELECT * FROM v_transactions 
    WHERE notes LIKE ? OR payee_name LIKE ?
    ORDER BY date DESC 
    LIMIT ?
  `;

  const result = await send('query', {
    query,
    params: [`%${searchTerm}%`, `%${searchTerm}%`, limit],
  });

  return result.data || [];
}

/**
 * Format transactions for AI readability
 * Converts transaction data to a concise format
 */
export function formatTransactionsForAI(
  transactions: TransactionEntity[],
  maxTransactions: number = 20,
): string {
  if (!transactions || transactions.length === 0) {
    return 'No transactions found.';
  }

  const limited = transactions.slice(0, maxTransactions);
  const formatted = limited.map(t => {
    const amount = ((t.amount || 0) / 100).toFixed(2);
    const sign = t.amount && t.amount > 0 ? '+' : '';
    return `${t.date}: ${t.payee?.name || 'Unknown'} - ${sign}$${amount} [${t.category?.name || 'Uncategorized'}]`;
  }).join('\n');

  if (transactions.length > maxTransactions) {
    return `${formatted}\n\n... and ${transactions.length - maxTransactions} more transactions`;
  }

  return formatted;
}

/**
 * Format transaction summary for AI
 */
export function formatTransactionSummaryForAI(summary: {
  totalIncome: number;
  totalExpense: number;
  transactionCount: number;
  topCategories: Array<{ categoryName: string; amount: number }>;
}): string {
  const income = (summary.totalIncome / 100).toFixed(2);
  const expense = (summary.totalExpense / 100).toFixed(2);

  const topCats = summary.topCategories
    .map(c => `  • ${c.categoryName}: $${(c.amount / 100).toFixed(2)}`)
    .join('\n');

  return `
Transaction Summary:
- Total Income: $${income}
- Total Expenses: $${expense}
- Transaction Count: ${summary.transactionCount}

Top Spending Categories:
${topCats}
`;
}
