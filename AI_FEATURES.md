# AI Chat Features - Complete Guide

Welcome to the comprehensive guide for Actual Budget's AI Chat features! This document combines all the AI chat capabilities and provides complete setup and usage instructions.

## 📋 Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Core Features](#core-features)
  - [Budget Context Awareness](#budget-context-awareness)
  - [Markdown Rendering](#markdown-rendering)
  - [Web Search (/search)](#web-search-search)
  - [Documentation Search (/docs)](#documentation-search-docs)
  - [Text Selection & Copy](#text-selection--copy)
- [Setup Instructions](#setup-instructions)
- [Usage Examples](#usage-examples)
- [Advanced Configuration](#advanced-configuration)
- [Troubleshooting](#troubleshooting)
- [Privacy & Security](#privacy--security)

## Overview

The AI Chat widget provides an intelligent assistant to help you manage your finances in Actual Budget. It combines OpenAI's GPT models with your budget data, web search, and documentation access to provide contextual help and insights.

**Key Capabilities:**
- 💰 Budget-aware conversations (accounts, categories, payees)
- 📝 Full markdown rendering with syntax highlighting
- 🔍 Web search integration via Google Custom Search API
- 📚 Built-in documentation search
- 📋 Text selection and message copying
- 💬 Conversation history management

## Quick Start

### Minimum Setup (Basic AI Chat)

1. **Create Environment File**
   ```bash
   cd packages/desktop-client
   cp .env.local.example .env.local
   ```

2. **Add OpenAI API Key**
   
   Edit `packages/desktop-client/.env.local`:
   ```
   VITE_OPENAI_API_KEY=sk-proj-YOUR-ACTUAL-API-KEY-HERE
   ```
   
   Get your API key from: https://platform.openai.com/account/api-keys

3. **Start the App**
   ```bash
   yarn start
   ```

4. **Open Chat**
   
   Click the 💬 icon in the bottom-right corner

### Full Setup (All Features)

For web search functionality, also add:

```
VITE_GOOGLE_API_KEY=your-google-api-key-here
VITE_GOOGLE_SEARCH_ENGINE_ID=your-search-engine-id-here
```

- Google API Key: https://console.cloud.google.com/apis/credentials
- Search Engine ID: https://programmablesearchengine.google.com/

## Core Features

### Budget Context Awareness

The AI automatically has access to your budget data, including:

- **Accounts**: Names, balances, on/off-budget status, closed accounts
- **Categories**: All category names organized by groups
- **Payees**: All payee/merchant names in your budget

**What This Means:**

You can ask questions like:
- "What's my total balance across all accounts?"
- "How many categories do I have?"
- "Tell me about my savings account"
- "Which accounts are off-budget?"
- "List all my expense categories"

**Implementation:**

The budget context is automatically loaded from your current budget file using the `useBudgetContext` hook and is sent to the AI as a system message on the first interaction of each conversation.

**Files:**
- `packages/desktop-client/src/hooks/useBudgetContext.ts` - Extracts budget data from Redux
- `packages/desktop-client/src/services/budgetContextService.ts` - Formats data for AI

**Privacy Note:** Budget context is only sent in your current conversation and is not stored permanently. Clear the conversation to clear the context.

---

### Markdown Rendering

All AI responses support full markdown formatting, making responses easier to read and more informative.

**Supported Markdown:**

- **Headers** (H1, H2, H3)
- **Bold**, *italic*, and ~~strikethrough~~ text
- `Inline code` and code blocks with syntax highlighting
- [Links](https://actualbudget.org)
- Tables with borders
- Ordered and unordered lists
- > Blockquotes
- Horizontal rules

**Example Response:**

The AI can format complex financial information:

```markdown
## Your Account Summary

| Account | Type | Balance |
|---------|------|---------|
| Checking | On-Budget | $1,250.00 |
| Savings | On-Budget | $5,000.00 |
| Credit Card | Off-Budget | -$250.00 |

**Total On-Budget:** $6,250.00
```

**Implementation:**

- Uses `react-markdown` with GitHub Flavored Markdown (GFM)
- Syntax highlighting via `rehype-highlight` and `highlight.js`
- Custom styling for tables, code blocks, and other elements

**Files:**
- `packages/desktop-client/src/components/MarkdownMessage.tsx` - Markdown renderer component

---

### Web Search (/search)

Search the web directly from the chat using the `/search` command.

**Usage:**

```
/search how to create a monthly budget
/search best budgeting strategies 2024
/search envelope budgeting method
```

**What You Get:**

- Top 5 search results from Google
- Clickable links to sources
- Snippets/descriptions
- Source domain displayed

**Requirements:**

- Google API Key (free tier: 100 searches/day)
- Custom Search Engine ID

**Setup:**

1. **Create a Google Cloud Project**
   - Go to https://console.cloud.google.com
   - Create a new project or select existing
   
2. **Enable Custom Search API**
   - Navigate to "APIs & Services" > "Library"
   - Search for "Custom Search API"
   - Click "Enable"
   
3. **Create API Key**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the key
   
4. **Create Custom Search Engine**
   - Go to https://programmablesearchengine.google.com/
   - Click "Add" to create a new search engine
   - For "Sites to search", enter `www.google.com`
   - Create the engine and copy the "Search engine ID"
   
5. **Add to .env.local**
   ```
   VITE_GOOGLE_API_KEY=your-api-key-here
   VITE_GOOGLE_SEARCH_ENGINE_ID=your-cx-id-here
   ```

**Files:**
- `packages/desktop-client/src/services/googleSearchService.ts` - Web search implementation

**Cost:** Google Custom Search is free for up to 100 queries per day. Pricing: https://developers.google.com/custom-search/v1/overview

---

### Documentation Search (/docs)

Search the Actual Budget documentation without leaving the app.

**Usage:**

```
/docs bank sync
/docs reports
/docs budgeting basics
/docs API
/docs reconciliation
```

**What You Get:**

- Top 5 relevant documentation pages
- Direct links to https://actualbudget.org/docs
- Descriptions of each topic
- Organized by category

**Coverage:**

The documentation index includes 20+ key topics:

- **Basics**: Getting Started, Budgeting
- **Tour**: User Interface, Budget View, Accounts, Reports, Rules, Schedules
- **Accounts**: Reconciliation
- **Reports**: Custom Reports
- **Transactions**: Managing Transactions
- **Settings**: Configuration
- **Advanced**: Bank Sync (GoCardless, SimpleFIN)
- **API**: API Reference, ActualQL
- **Migration**: Importing from other apps
- **Troubleshooting**: Common issues
- **Contributing**: Development guide

**No Configuration Required:** Works out of the box with no API keys needed.

**Implementation:**

Uses an in-memory keyword index with relevance scoring. Searches across titles, descriptions, categories, and keywords.

**Files:**
- `packages/desktop-client/src/services/docsSearchService.ts` - Documentation search implementation

---

### Text Selection & Copy

Select and copy text from chat messages for use elsewhere.

**Features:**

1. **Manual Selection**
   - Click and drag to select any text in the chat
   - Press Ctrl+C (Windows/Linux) or Cmd+C (Mac) to copy
   - Works across multiple messages

2. **Copy All Messages**
   - Right-click anywhere in the message area
   - Select "📋 Copy All Messages"
   - All messages are copied in readable format:
     ```
     You: What's my checking balance?
     
     AI Assistant: Your checking account has a balance of $1,250.00
     
     You: Thanks!
     ```

**Implementation:**

Chat messages have `userSelect: 'text'` enabled, allowing standard browser text selection. The context menu provides a convenient "copy all" option.

**Files:**
- Implementation in `packages/desktop-client/src/components/ChatWidget.tsx`

**Documentation:**
- Detailed guide in `CHAT_TEXT_SELECTION_FEATURE.md`

---

## Setup Instructions

### Prerequisites

- **Node.js**: >=20
- **Yarn**: ^4.9.1
- **OpenAI Account**: For API access

### Step-by-Step Setup

1. **Install Dependencies**
   
   From the project root:
   ```bash
   yarn install
   ```

2. **Create Environment File**
   
   ```bash
   cd packages/desktop-client
   cp .env.local.example .env.local
   ```

3. **Configure OpenAI (Required)**
   
   Edit `.env.local`:
   ```
   VITE_OPENAI_API_KEY=sk-proj-YOUR-KEY-HERE
   ```

4. **Configure Google Search (Optional)**
   
   If you want web search:
   ```
   VITE_GOOGLE_API_KEY=your-google-api-key
   VITE_GOOGLE_SEARCH_ENGINE_ID=your-search-engine-id
   ```

5. **Start Development Server**
   
   ```bash
   yarn start
   ```

6. **Access Chat**
   
   Click the 💬 floating button in the bottom-right corner

## Usage Examples

### Basic Budget Questions

```
You: What accounts do I have?
AI: You have 3 accounts: Checking ($1,250), Savings ($5,000), and Credit Card (-$250).

You: What are my expense categories?
AI: Your expense categories include: Housing (Rent, Home Insurance), 
    Transportation (Gas, Car Payment), Groceries (Food), and Entertainment.
```

### Using Commands

```
You: /search best practices for zero-based budgeting
AI: **Web Search Results for:** "best practices for zero-based budgeting"

    1. [Zero-Based Budgeting: What It Is and How to Use It](https://example.com)
       Learn about zero-based budgeting methodology...
```

```
You: /docs bank sync
AI: **📚 Documentation for:** "bank sync"

    1. [Bank Sync](https://actualbudget.org/docs/advanced/bank-sync)
       *Advanced*
       Setting up automatic bank synchronization
```

### Combining Context

```
You: I see my checking account balance is low. /search ways to reduce monthly expenses

AI: [Shows web search results about expense reduction strategies]

You: Based on my categories, which ones should I focus on?

AI: Based on your budget, I recommend focusing on your largest categories: 
    Housing and Transportation. Here are some specific tips...
```

## Advanced Configuration

### Customizing Budget Context

Edit `packages/desktop-client/src/hooks/useBudgetContext.ts` to modify what data is shared:

```typescript
export function useBudgetContext(): BudgetContext {
  // Add or remove data types
  return {
    accounts: formattedAccounts,
    categories: formattedCategories,
    // payees: formattedPayees,  // Comment out to exclude payees
  };
}
```

### Customizing AI Instructions

Edit `packages/desktop-client/src/services/budgetContextService.ts` to change how the AI is instructed:

```typescript
export function formatBudgetContextForAI(budgetContext: BudgetContext): string {
  return `
Current Budget Context:
[Your custom instructions here]
  `;
}
```

### Extending Documentation Index

Edit `packages/desktop-client/src/services/docsSearchService.ts` to add more documentation topics:

```typescript
const DOCS_INDEX: DocEntry[] = [
  // Add your custom doc entries
  {
    title: 'New Feature Guide',
    category: 'Features',
    url: 'https://actualbudget.org/docs/new-feature',
    description: 'Guide for using the new feature',
    keywords: ['new', 'feature', 'guide'],
  },
  // ... existing entries
];
```

## Troubleshooting

### "API key not found" Error

**Solution:**
1. Verify `.env.local` exists in `packages/desktop-client/`
2. Check that the file contains `VITE_OPENAI_API_KEY=sk-proj-...`
3. Restart the development server (`yarn start`)

### Web Search Not Working

**Solution:**
1. Verify both `VITE_GOOGLE_API_KEY` and `VITE_GOOGLE_SEARCH_ENGINE_ID` are set
2. Check that API key is valid and Search API is enabled in Google Cloud Console
3. Ensure Custom Search Engine is configured to search "the entire web"

### Budget Context Not Showing

**Solution:**
1. Make sure a budget file is loaded
2. Try asking a specific question: "Tell me about my accounts"
3. Check browser console (F12) for errors
4. Clear the conversation and start fresh

### Markdown Not Rendering

**Solution:**
1. Verify `react-markdown` and related packages are installed
2. Run `yarn install` from project root
3. Check that you're viewing bot responses (user messages are plain text)

### Chat Widget Not Appearing

**Solution:**
1. Make sure you're running the development server (`yarn start`)
2. Check browser console for errors
3. Verify `ChatWidget` component is imported in the app

## Privacy & Security

### What Data is Shared?

**With OpenAI:**
- Your chat messages
- Budget context (accounts, categories, payees - structure only, not transactions)
- No transaction details or amounts unless explicitly mentioned in your questions

**With Google (if configured):**
- Search queries when using `/search` command
- No budget data is sent to Google

**Nowhere:**
- Your API keys are stored locally only (`.env.local`)
- Chat history is stored in browser localStorage
- No data is sent to Actual Budget servers

### Best Practices

1. **Protect Your API Keys**
   - Never commit `.env.local` to version control
   - Don't share your API keys
   - Rotate keys if exposed

2. **Review Data Sent**
   - Budget context is readable in the code
   - Only structural data, not full transaction history
   - You can modify `useBudgetContext.ts` to limit data

3. **Clear Conversations**
   - Delete conversations you don't need
   - Clear browser localStorage to remove all history
   - Each conversation is independent

4. **Use OpenAI's Data Policies**
   - OpenAI's standard API doesn't use your data for training
   - Review: https://openai.com/policies/usage-policies

### Cost Considerations

**OpenAI API:**
- GPT-3.5-turbo: ~$0.002 per 1K tokens
- GPT-4: ~$0.03 per 1K tokens
- Set usage limits in OpenAI dashboard

**Google Search:**
- Free tier: 100 searches/day
- Paid: $5 per 1,000 queries

**Recommendation:** Start with GPT-3.5-turbo and free Google search tier.

## File Reference

All AI chat features are contained in these files:

### Components
- `packages/desktop-client/src/components/ChatWidget.tsx` - Main chat interface
- `packages/desktop-client/src/components/MarkdownMessage.tsx` - Markdown renderer

### Services
- `packages/desktop-client/src/services/openaiService.ts` - OpenAI integration
- `packages/desktop-client/src/services/budgetContextService.ts` - Budget data formatting
- `packages/desktop-client/src/services/googleSearchService.ts` - Web search
- `packages/desktop-client/src/services/docsSearchService.ts` - Documentation search
- `packages/desktop-client/src/services/chatHistoryService.ts` - Conversation management

### Hooks
- `packages/desktop-client/src/hooks/useBudgetContext.ts` - Budget data access

### Configuration
- `packages/desktop-client/.env.local.example` - Environment template
- `packages/desktop-client/.env.local` - Your local config (not committed)

### Documentation
- `AI_CHAT_SETUP.md` - Quick setup guide
- `BUDGET_CONTEXT_AI.md` - Budget context feature guide
- `CHAT_TEXT_SELECTION_FEATURE.md` - Text selection feature guide
- `AI_FEATURES.md` - This comprehensive guide

## Contributing

To contribute to AI chat features:

1. Follow the code style in `AGENTS.md`
2. Add tests for new features
3. Update documentation
4. Run `yarn typecheck` and `yarn lint:fix` before committing

## Support

- **Documentation**: https://actualbudget.org/docs
- **Discord**: https://discord.gg/pRYNYr4W5A
- **GitHub Issues**: https://github.com/actualbudget/actual/issues

## Future Enhancements

Potential features being considered:

- Report viewing and custom report generation
- Screen context awareness (AI sees current view)
- Enhanced report flexibility (transaction filtering)
- Python code execution for calculations and visualizations
- Voice input support
- Multi-language support
- Export conversations
- Scheduled budget insights

---

**Happy budgeting with AI assistance! 🎉**
