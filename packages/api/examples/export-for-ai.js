/**
 * Example: Export Budget Data for AI Consumption
 *
 * This example demonstrates how to use the getBudgetSummary API
 * to export comprehensive budget data in a format optimized for
 * AI assistants and external integrations.
 */

import * as api from '@actual-app/api';

async function exportBudgetForAI() {
  try {
    // Initialize the API
    await api.init({
      // Specify your data directory
      dataDir: './actual-data',
      // Optional: server URL if using sync
      // serverURL: 'https://your-actual-server.com',
    });

    // Load your budget
    await api.loadBudget('My Budget');

    console.log('Exporting comprehensive budget summary...\n');

    // Get comprehensive budget summary
    const summary = await api.getBudgetSummary({
      transactionDays: 90, // Last 90 days of transactions
      includeBalances: true, // Include account balances
      includeTransactions: true, // Include transaction history
      includeCategories: true, // Include categories
      includePayees: true, // Include payees
      includeBudgetMonths: true, // Include budget months
    });

    // Display summary statistics
    console.log('=== Budget Summary ===');
    console.log(`Total Accounts: ${summary.accounts.length}`);
    console.log(
      `Total Transactions (last 90 days): ${summary.transactions?.length || 0}`,
    );
    console.log(`Total Categories: ${summary.categories?.length || 0}`);
    console.log(`Total Payees: ${summary.payees?.length || 0}`);
    console.log(`Budget Months: ${summary.budgetMonths?.length || 0}`);
    console.log('');

    // Display accounts with balances
    console.log('=== Accounts with Balances ===');
    const activeAccounts = summary.accounts.filter(acc => !acc.closed);
    const totalBalance = activeAccounts.reduce(
      (sum, acc) => sum + (acc.balance || 0),
      0,
    );

    for (const account of activeAccounts) {
      const balance = account.balance || 0;
      const formattedBalance = (balance / 100).toFixed(2);
      const status = account.offbudget ? '(Off-budget)' : '';
      console.log(`  ${account.name}: $${formattedBalance} ${status}`);
    }

    console.log(`\nTotal Account Value: $${(totalBalance / 100).toFixed(2)}`);
    console.log('');

    // Display recent transactions
    if (summary.transactions && summary.transactions.length > 0) {
      console.log('=== Recent Transactions (Last 5) ===');
      const recentTransactions = summary.transactions
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 5);

      for (const trans of recentTransactions) {
        const amount = (trans.amount / 100).toFixed(2);
        const accountName =
          summary.accounts.find(acc => acc.id === trans.account)?.name ||
          'Unknown';
        console.log(`  ${trans.date}: $${amount} - ${accountName}`);
      }
    }
    console.log('');

    // Export to JSON file for AI consumption
    const jsonOutput = JSON.stringify(summary, null, 2);

    // You can write this to a file or send it to an AI service
    console.log('Budget data exported successfully!');
    console.log('You can now provide this data to your AI assistant.');
    console.log('');

    // Example: Show how the data can be used
    console.log('=== Example AI Prompt ===');
    console.log('Here is my budget data in JSON format:');
    console.log('');
    console.log(jsonOutput.substring(0, 500) + '...');
    console.log('');
    console.log('You can ask the AI:');
    console.log('- "What is my total account value?"');
    console.log('- "What was my latest transaction?"');
    console.log('- "How much is my mortgage?"');
    console.log('- "Show me transactions for my checking account"');
  } catch (error) {
    console.error('Error exporting budget data:', error);
  } finally {
    // Clean up
    await api.shutdown();
  }
}

// Run the export
exportBudgetForAI().catch(console.error);
