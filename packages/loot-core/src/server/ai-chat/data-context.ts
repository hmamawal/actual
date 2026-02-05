// @ts-strict-ignore
import { runQuery as aqlQuery } from '../aql';
import * as db from '../db';
import { getCategories } from '../budget/categories';
import { getPayees } from '../payees/app';
import * as monthUtils from '../../shared/months';

export class BudgetDataContextProvider {
  async getBudgetContext() {
    const accounts = await this.getAccounts();
    const categories = await this.getCategories();
    const stats = await this.getMonthlyStats();
    const recentTransactions = await this.getRecentTransactions(50);

    return {
      accounts,
      categories,
      stats,
      recentTransactions,
    };
  }

  private async getAccounts() {
    const accounts = await aqlQuery(
      db
        .select('*')
        .from('accounts')
        .where({ closed: 0, tombstone: 0 })
        .serialize(),
    );

    return accounts.data.map(acc => ({
      id: acc.id,
      name: acc.name,
      type: acc.type,
      offbudget: acc.offbudget,
      balance: acc.balance || 0,
    }));
  }

  private async getCategories() {
    const categories = await getCategories();
    const groups = categories.grouped || [];

    return groups.flatMap(group =>
      group.categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        groupId: group.id,
        groupName: group.name,
        isIncome: cat.is_income,
        hidden: cat.hidden,
      })),
    );
  }

  private async getMonthlyStats(months = 6) {
    const currentMonth = monthUtils.currentMonth();
    const monthList = [];
    
    for (let i = 0; i < months; i++) {
      monthList.push(monthUtils.subMonths(currentMonth, i));
    }

    const stats = await Promise.all(
      monthList.map(async month => {
        const query = db
          .select('*')
          .from('transactions')
          .where({
            date: { $gte: month, $lt: monthUtils.addMonths(month, 1) },
            tombstone: 0,
          });

        const result = await aqlQuery(query.serialize());
        const transactions = result.data;

        let income = 0;
        let expenses = 0;

        transactions.forEach(t => {
          if (t.amount > 0) {
            income += t.amount;
          } else {
            expenses += Math.abs(t.amount);
          }
        });

        return {
          month,
          income: income / 100, // Convert from cents
          expenses: expenses / 100,
          balance: (income - expenses) / 100,
        };
      }),
    );

    return stats;
  }

  private async getRecentTransactions(limit = 50) {
    const query = db
      .select('*')
      .from('v_transactions')
      .where({ tombstone: 0 })
      .orderBy({ date: 'desc' })
      .limit(limit);

    const result = await aqlQuery(query.serialize());

    return result.data.map(t => ({
      id: t.id,
      date: t.date,
      amount: t.amount / 100,
      payee: t.payee_name || t.payee,
      category: t.category_name || t.category,
      account: t.account_name || t.account,
      notes: t.notes,
      cleared: t.cleared,
    }));
  }

  async queryDataByIntent(intent: string, context?: string) {
    // Smart data fetching based on the query intent
    const lowerIntent = intent.toLowerCase();
    
    if (lowerIntent.includes('spending') || lowerIntent.includes('expense')) {
      return this.getSpendingData(context);
    }
    
    if (lowerIntent.includes('income')) {
      return this.getIncomeData(context);
    }
    
    if (lowerIntent.includes('account') || lowerIntent.includes('balance')) {
      return this.getAccountData(context);
    }
    
    if (lowerIntent.includes('category') || lowerIntent.includes('budget')) {
      return this.getCategoryData(context);
    }
    
    if (lowerIntent.includes('trend') || lowerIntent.includes('month')) {
      return this.getTrendData(context);
    }

    // Default: return general summary
    return this.getBudgetContext();
  }

  private async getSpendingData(context?: string) {
    const currentMonth = monthUtils.currentMonth();
    const query = db
      .select('*')
      .from('v_transactions')
      .where({
        date: { $gte: monthUtils.subMonths(currentMonth, 3) },
        amount: { $lt: 0 },
        tombstone: 0,
      });

    const result = await aqlQuery(query.serialize());
    
    return {
      transactions: result.data.map(t => ({
        date: t.date,
        amount: Math.abs(t.amount) / 100,
        payee: t.payee_name,
        category: t.category_name,
      })),
      summary: `${result.data.length} expense transactions in the last 3 months`,
    };
  }

  private async getIncomeData(context?: string) {
    const currentMonth = monthUtils.currentMonth();
    const query = db
      .select('*')
      .from('v_transactions')
      .where({
        date: { $gte: monthUtils.subMonths(currentMonth, 3) },
        amount: { $gt: 0 },
        tombstone: 0,
      });

    const result = await aqlQuery(query.serialize());
    
    return {
      transactions: result.data.map(t => ({
        date: t.date,
        amount: t.amount / 100,
        payee: t.payee_name,
        category: t.category_name,
      })),
      summary: `${result.data.length} income transactions in the last 3 months`,
    };
  }

  private async getAccountData(context?: string) {
    return {
      accounts: await this.getAccounts(),
      summary: 'All account balances and details',
    };
  }

  private async getCategoryData(context?: string) {
    return {
      categories: await this.getCategories(),
      summary: 'All budget categories and groups',
    };
  }

  private async getTrendData(context?: string) {
    return {
      stats: await this.getMonthlyStats(12),
      summary: 'Monthly income and expense trends for the past year',
    };
  }
}
