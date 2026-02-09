# API Examples

This directory contains example scripts demonstrating how to use the Actual Budget API.

## Export for AI (`export-for-ai.js`)

This example shows how to use the `getBudgetSummary()` API to export comprehensive budget data for use with AI assistants.

### What it does

- Exports accounts with current balances
- Exports recent transactions (configurable days)
- Exports categories and category groups
- Exports payees
- Exports budget months
- Formats data in AI-friendly JSON

### Usage

The `getBudgetSummary()` API is perfect for:

1. **AI Chat Integration**: Export your budget data to provide context to AI assistants like ChatGPT, Claude, or others
2. **External Analytics**: Feed data to analytics tools
3. **Reporting**: Generate comprehensive budget reports
4. **Integrations**: Build custom integrations with other financial tools

### API Signature

```typescript
await api.getBudgetSummary(options?: {
  transactionDays?: number;        // Default: 90
  includeBalances?: boolean;       // Default: true
  includeTransactions?: boolean;   // Default: true
  includeCategories?: boolean;     // Default: true
  includePayees?: boolean;         // Default: true
  includeBudgetMonths?: boolean;   // Default: false
})
```

### Example Output

```json
{
  "accounts": [
    {
      "id": "account-id",
      "name": "Bank of America",
      "offbudget": false,
      "closed": false,
      "balance": 150000,
      "transactionCount": 42
    }
  ],
  "transactions": [
    {
      "id": "trans-id",
      "account": "account-id",
      "date": "2024-02-09",
      "amount": -5000,
      "payee": "payee-id",
      "category": "category-id"
    }
  ],
  "categories": [...],
  "categoryGroups": [...],
  "payees": [...]
}
```

### Solving the AI Indexing Problem

If you previously had issues where your AI assistant could see accounts but not balances or transactions, this API solves that by:

1. **Including calculated balances** - Each account includes its current balance
2. **Providing transaction history** - Recent transactions are included in the export
3. **Structured JSON format** - Easy for AI to parse and understand
4. **Comprehensive data** - All relevant budget information in one call

### Running the Example

```bash
# Install dependencies
cd packages/api
yarn install

# Run the example (modify the script first with your budget name)
node examples/export-for-ai.js
```

## Using with AI Assistants

### Step 1: Export Your Data

```javascript
import * as api from '@actual-app/api';

await api.init({ dataDir: './my-budget-data' });
await api.loadBudget('My Budget');

const summary = await api.getBudgetSummary();
console.log(JSON.stringify(summary, null, 2));
```

### Step 2: Provide to AI

Copy the JSON output and provide it to your AI assistant with a prompt like:

```
Here is my budget data in JSON format:

{
  "accounts": [...],
  "transactions": [...],
  ...
}

Now please answer these questions:
- What is my total account value?
- What was my latest transaction?
- How much do I spend on groceries per month?
- What is my mortgage balance?
```

### Step 3: Ask Questions

The AI can now answer questions like:

- "What is my total account value?"
- "Show me my recent transactions"
- "How much is in my savings account?"
- "What was my biggest expense last month?"
- "Which account has the highest balance?"

## Additional Resources

- [Actual Budget API Documentation](https://actualbudget.org/docs/api/)
- [GitHub Repository](https://github.com/actualbudget/actual)
