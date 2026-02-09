import { useAccounts } from './useAccounts';
import { useCategories } from './useCategories';
import { useOffBudgetAccounts } from './useOffBudgetAccounts';
import { useOnBudgetAccounts } from './useOnBudgetAccounts';
import { usePayees } from './usePayees';

export type BudgetContext = {
  accounts: Array<{
    id: string;
    name: string;
    balance: number;
    offbudget: boolean;
    closed: boolean;
  }>;
  categories: Array<{
    id: string;
    name: string;
    group: string;
  }>;
  payees: Array<{
    id: string;
    name: string;
  }>;
  onBudgetCount: number;
  offBudgetCount: number;
  closedAccountCount: number;
};

/**
 * Hook to get the current budget's context data
 * This includes accounts, categories, and payees
 * Used for providing context to the AI assistant
 */
export function useBudgetContext(): BudgetContext {
  const accounts = useAccounts();
  const { list: categories, grouped: categoryGroups } = useCategories();
  const payees = usePayees() || [];
  const onBudgetAccounts = useOnBudgetAccounts();
  const offBudgetAccounts = useOffBudgetAccounts();

  // Build categories with group names
  const categoriesWithGroups = categories.map(category => {
    let groupName = 'Other';
    for (const group of categoryGroups) {
      if (group.categories?.some((c: any) => c.id === category.id)) {
        groupName = group.name;
        break;
      }
    }
    return {
      id: category.id,
      name: category.name,
      group: groupName,
    };
  });

  // Format account data
  const formattedAccounts = (accounts || []).map((account: any) => ({
    id: account.id,
    name: account.name,
    balance: account.balance || 0,
    offbudget: account.offbudget === 1,
    closed: account.closed === 1,
  }));

  // Format payee data
  const formattedPayees = (payees || []).map((payee: any) => ({
    id: payee.id,
    name: payee.name,
  }));

  const closedAccounts = (accounts || []).filter(
    (a: any) => a.closed === 1,
  ).length;

  return {
    accounts: formattedAccounts,
    categories: categoriesWithGroups,
    payees: formattedPayees,
    onBudgetCount: onBudgetAccounts.length,
    offBudgetCount: offBudgetAccounts.length,
    closedAccountCount: closedAccounts,
  };
}
