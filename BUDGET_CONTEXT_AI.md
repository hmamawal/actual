# Budget Context Aware AI Chat

## 🎯 New Feature: AI Understands Your Budget Data

Your AI chatbot now has access to your current budget file data! The AI can understand and answer questions about:

- **Your accounts** - names, balances, budget/off-budget status, closed accounts
- **Your categories** - category names organized by groups (Housing, Utilities, etc.)
- **Your payees** - merchant names in your budget
- **General structure** - account counts, category organization

## 💡 What You Can Now Ask

### Examples of Budget-Aware Questions

```
"What's my total balance across all accounts?"
"How many categories do I have in the Groceries group?"
"Tell me about my savings account"
"Which accounts are marked as off-budget?"
"Summarize my account structure"
"What are all my expense categories?"
```

## 🔌 How It Works

### Architecture

```
User Types Message
    ↓
ChatWidget Component
    ↓
useBudgetContext Hook fetches data
    ├─ Accounts (names, balances, status)
    ├─ Categories (organized by group)
    └─ Payees (merchant names)
    ↓
budgetContextService formats data
    ├─ Creates readable summary
    ├─ Organizes by category groups
    └─ Includes account information
    ↓
Budget context added to system message
    ↓
OpenAI API receives enhanced context
    ↓
AI understands the budget and answers accordingly
```

### Data Flow

1. **Hook**: `useBudgetContext` reads from Redux
   - Uses existing Redux selectors (`useAccounts`, `useCategories`, `usePayees`)
   - Organizes data into structured format
   - Accessible in any React component

2. **Service**: `budgetContextService` formats for AI
   - Converts cents to dollars for readability
   - Groups categories by category group
   - Creates human-readable summary
   - Injects as system message

3. **Widget**: `ChatWidget` integrates context
   - Gets budget context on each message
   - Adds context to messages before sending to OpenAI
   - Context updates automatically when budget changes

## 📊 What Data is Shared with AI

The AI receives a system message like this:

```
Current Budget Context:
=======================

Accounts (2 on-budget, 1 off-budget, 0 closed):
  • Checking (ON-BUDGET): $1,250.00
  • Savings (ON-BUDGET): $5,000.00
  • Credit Card (OFF-BUDGET): $-250.00

Budget Categories:
  Housing:
    Rent, Home Insurance, Utilities
  Groceries:
    Food, Groceries
  Transportation:
    Gas, Car Payment, Insurance

You are helping the user manage their personal finances with this budget data...
```

## 🔒 Privacy & Security

✅ **Budget data stays secure:**

- Data is never stored - only sent in your current conversation
- All communication is encrypted to OpenAI servers
- Data is not used to train models (if using standard API)
- You control what's in your environment file (API key)
- Clear the conversation to clear history

## 📁 Files Added/Modified

### New Files

- [packages/desktop-client/src/hooks/useBudgetContext.ts](packages/desktop-client/src/hooks/useBudgetContext.ts)
  - React hook to extract budget data from Redux
  - Returns structured BudgetContext type
  - ~85 lines

- [packages/desktop-client/src/services/budgetContextService.ts](packages/desktop-client/src/services/budgetContextService.ts)
  - Formats budget context for AI
  - Builds messages with context injected
  - ~75 lines

### Modified Files

- [packages/desktop-client/src/components/ChatWidget.tsx](packages/desktop-client/src/components/ChatWidget.tsx)
  - Integrated `useBudgetContext` hook
  - Added budget context to messages
  - Updated welcome message

## 🚀 Usage

Everything works automatically! Just:

1. ✅ Start the app normally (`yarn start`)
2. ✅ Click the 💬 chat icon
3. ✅ Ask questions about your budget

**No configuration needed** - the AI has access to your budget data by default.

## 🛠️ Advanced: Customizing AI Behavior

You can modify what data is shared by editing `useBudgetContext.ts`:

```typescript
// Show/hide specific data types
// Current: accounts, categories, payees, counts

// Example: Remove payees from context
export function useBudgetContext(): BudgetContext {
  // ... remove payees: formattedPayees,
}
```

Or customize the AI's instructions in `budgetContextService.ts`:

```typescript
// Modify the system message
export function formatBudgetContextForAI(budgetContext: BudgetContext): string {
  // Update instructions here
  return `
Current Budget Context:
...your custom message...
`;
}
```

## 📈 Future Enhancements

The architecture supports:

- 📝 Recent transaction summaries
- 💰 Category spending analytics
- 📊 Budget vs. actual comparisons
- 🎯 Goal progress tracking
- 💡 Spending insights and recommendations
- 🔔 Alert understanding (about overspending, etc.)

## ❓ FAQ

**Q: Does this send all my financial data to OpenAI?**
A: Only the data you currently have in the chat and your budget structure (accounts, categories, payees). Not your full transaction history.

**Q: Can the AI remember my conversations?**
A: Only within the current chat session. Clear the chat to clear the history.

**Q: What if I don't want the AI to have budget context?**
A: The feature is always on by default, but you could modify `ChatWidget.tsx` to make it optional.

**Q: Is this real-time?**
A: Yes! The budget context is fetched fresh with each message, so it always reflects your current budget data.

**Q: Can the AI modify my budget?**
A: No. The AI has read-only access to your data and cannot make changes.

## 📞 Troubleshooting

**Budget context not showing up?**

- Check browser console for errors (F12)
- Verify budget file is loaded
- Try refreshing the page

**AI doesn't mention budget data?**

- Make sure you're asking budget-related questions
- Try: "Tell me about my accounts"
- Check that accounts/categories are set up in your budget

**Want to disable it?**

- Temporarily comment out the `buildChatMessagesWithBudgetContext` call in ChatWidget
- Or set budget context to empty in the hook

## 🎓 Learn More

- [ChatWidget Component](packages/desktop-client/src/components/ChatWidget.tsx)
- [useBudgetContext Hook](packages/desktop-client/src/hooks/useBudgetContext.ts)
- [Budget Context Service](packages/desktop-client/src/services/budgetContextService.ts)
- [Main Setup Guide](AI_CHAT_SETUP.md)
