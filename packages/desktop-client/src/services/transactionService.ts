import { send } from 'loot-core/platform/client/fetch';
import { q } from 'loot-core/shared/query';
import { type TransactionEntity } from 'loot-core/types/models';

type TransactionWithNames = TransactionEntity & {
  payee_name?: string | null;
  category_name?: string | null;
  payee?: { name?: string | null } | string | null;
  category?: { name?: string | null } | string | null;
};

type NamedEntity = {
  name?: string | null;
};

type DateRange = {
  startDate: string;
  endDate: string;
};

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getDefaultDateRange(): DateRange {
  const today = new Date();
  const start = new Date();
  start.setMonth(today.getMonth() - 3);
  return {
    startDate: formatDate(start),
    endDate: formatDate(today),
  };
}

function formatAmount(amount: number | undefined | null): string {
  if (amount == null) {
    return 'N/A';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount / 100);
}

function isNamedEntity(value: unknown): value is NamedEntity {
  return typeof value === 'object' && value !== null && 'name' in value;
}

function getPayeeName(transaction: TransactionWithNames): string {
  if (transaction.payee_name) {
    return transaction.payee_name;
  }

  const payee = transaction.payee;
  if (isNamedEntity(payee)) {
    return payee.name || 'Unknown';
  }

  return 'Unknown';
}

function getCategoryName(transaction: TransactionWithNames): string {
  if (transaction.category_name) {
    return transaction.category_name;
  }

  const category = transaction.category;
  if (isNamedEntity(category)) {
    return category.name || 'Uncategorized';
  }

  return 'Uncategorized';
}

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
}): Promise<TransactionWithNames[]> {
  const defaults = getDefaultDateRange();
  const {
    startDate = defaults.startDate,
    endDate = defaults.endDate,
    accountId,
    categoryId,
    limit = 100,
  } = params;

  let query = q('transactions')
    .options({ splits: 'grouped' })
    .filter({ date: { $gte: startDate, $lte: endDate } });

  if (accountId) {
    query = query.filter({ account: accountId });
  }

  if (categoryId) {
    query = query.filter({ category: categoryId });
  }

  query = query
    .orderBy({ date: 'desc' })
    .limit(limit)
    .select('*');

  const { data } = await send('query', query.serialize());
  return (data || []) as TransactionWithNames[];
}

/**
 * Get transaction summary for a date range
 * Provides aggregated data instead of individual transactions
 */
export async function getTransactionSummary(params: {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
}): Promise<{
  totalIncome: number;
  totalExpense: number;
  transactionCount: number;
  topCategories: Array<{ categoryId: string; categoryName: string; amount: number }>;
}> {
  const defaults = getDefaultDateRange();
  const {
    startDate = defaults.startDate,
    endDate = defaults.endDate,
    categoryId,
  } = params;

  let baseQuery = q('transactions').filter({
    date: { $gte: startDate, $lte: endDate },
  });

  if (categoryId) {
    baseQuery = baseQuery.filter({ category: categoryId });
  }

  const incomeQuery = baseQuery
    .filter({ amount: { $gt: 0 } })
    .calculate({ $sum: '$amount' });
  const expenseQuery = baseQuery
    .filter({ amount: { $lt: 0 } })
    .calculate({ $sum: '$amount' });
  const countQuery = baseQuery.calculate({ $count: '*' });

  const [incomeResult, expenseResult, countResult] = await Promise.all([
    send('query', incomeQuery.serialize()),
    send('query', expenseQuery.serialize()),
    send('query', countQuery.serialize()),
  ]);

  const totalIncome = (incomeResult as { data?: number }).data || 0;
  const rawExpense = (expenseResult as { data?: number }).data || 0;
  const transactionCount = (countResult as { data?: number }).data || 0;

  const topCategoriesQuery = baseQuery
    .filter({ amount: { $lt: 0 } })
    .groupBy(['category', 'category.name'])
    .select([
      { categoryId: 'category' },
      { categoryName: 'category.name' },
      { amount: { $sum: '$amount' } },
    ]);

  const { data: topCategoriesData } = await send(
    'query',
    topCategoriesQuery.serialize(),
  );

  const topCategories = ((topCategoriesData as Array<{
    categoryId: string;
    categoryName: string;
    amount: number;
  }>) || [])
    .map(row => ({
      categoryId: row.categoryId,
      categoryName: row.categoryName || 'Uncategorized',
      amount: Math.abs(row.amount || 0),
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  return {
    totalIncome,
    totalExpense: Math.abs(rawExpense),
    transactionCount,
    topCategories,
  };
}

/**
 * Search transactions by description or payee
 * Used for finding specific transactions
 */
export async function searchTransactions(params: {
  searchTerm: string;
  limit?: number;
}): Promise<TransactionWithNames[]> {
  const { searchTerm, limit = 50 } = params;

  const query = q('transactions')
    .options({ splits: 'grouped' })
    .filter({
      $or: {
        notes: { $like: `%${searchTerm}%` },
        'payee.name': { $like: `%${searchTerm}%` },
        'category.name': { $like: `%${searchTerm}%` },
      },
    })
    .orderBy({ date: 'desc' })
    .limit(limit)
    .select('*');

  const { data } = await send('query', query.serialize());
  return (data || []) as TransactionWithNames[];
}

/**
 * Format transactions for AI readability
 * Converts transaction data to a concise format
 */
export function formatTransactionsForAI(
  transactions: TransactionWithNames[],
  maxTransactions: number = 20,
): string {
  if (!transactions || transactions.length === 0) {
    return 'No transactions found.';
  }

  const limited = transactions.slice(0, maxTransactions);
  const header =
    '| ID | Date | Payee | Category | Amount | Cleared | Notes |\n| ---- | ----- | ----- | -------- | ------ | ------- | ----- |';
  const rows = limited
    .map(t => {
      const payee = getPayeeName(t);
      const category = getCategoryName(t);
      const amount = formatAmount(t.amount);
      const cleared = t.cleared ? 'Yes' : 'No';
      const notes = t.notes || '';
      return `| ${t.id} | ${t.date} | ${payee} | ${category} | ${amount} | ${cleared} | ${notes} |`;
    })
    .join('\n');

  const suffix =
    transactions.length > maxTransactions
      ? `\n\n... and ${transactions.length - maxTransactions} more transactions`
      : '';

  return `# Transactions\n\nTotal: ${transactions.length}\n\n${header}\n${rows}${suffix}`;
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
  const income = formatAmount(summary.totalIncome);
  const expense = formatAmount(summary.totalExpense);

  const topCats = summary.topCategories
    .map(c => `  - ${c.categoryName || 'Uncategorized'}: ${formatAmount(c.amount)}`)
    .join('\n');

  return `# Transaction Summary\n\n- Total Income: ${income}\n- Total Expenses: ${expense}\n- Transaction Count: ${summary.transactionCount}\n\n## Top Spending Categories\n${topCats}`;
}
