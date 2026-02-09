# Quick Start: AI Chat Integration

## 🚀 Setup in 3 Steps

### 1. Create Your Environment File

```bash
cd packages/desktop-client
cp .env.local.example .env.local
```

### 2. Add Your OpenAI API Key

Edit `packages/desktop-client/.env.local`:

```
VITE_OPENAI_API_KEY=sk-proj-YOUR-ACTUAL-API-KEY-HERE
```

Get your API key from: https://platform.openai.com/account/api-keys

### 3. Start the App

```bash
yarn start
```

## ✨ That's It!

Click the 💬 icon in the bottom-right corner to start chatting with AI!

## 🎯 What Can You Do?

### Core Features

1. **Budget-Aware Chat** - AI knows your accounts, categories, and payees
   - "What's my checking account balance?"
   - "How many categories do I have?"
   - "Tell me about my savings account"

2. **Documentation Search** - Find help instantly with `/docs`
   - `/docs bank sync`
   - `/docs reports`
   - `/docs budgeting basics`

3. **Web Search** - Search the internet with `/search` (requires Google API setup)
   - `/search best budgeting strategies`
   - `/search how to save money`

4. **Markdown Formatting** - AI responses support full markdown
   - Tables, code blocks, lists, links
   - Syntax highlighting
   - Professional formatting

5. **Text Selection** - Copy messages for reference
   - Select any text
   - Right-click to copy all messages

## 📖 Full Documentation

See **[AI_FEATURES.md](AI_FEATURES.md)** for complete guide including:

- All features explained in detail
- Advanced configuration
- Usage examples
- Troubleshooting
- Privacy & security information

## 🔧 Optional: Web Search Setup

For web search functionality (`/search` command):

1. Get Google API credentials:
   - API Key: https://console.cloud.google.com/apis/credentials
   - Search Engine ID: https://programmablesearchengine.google.com/

2. Add to `.env.local`:
   ```
   VITE_GOOGLE_API_KEY=your-api-key
   VITE_GOOGLE_SEARCH_ENGINE_ID=your-search-engine-id
   ```

See [AI_FEATURES.md - Web Search Setup](AI_FEATURES.md#web-search-search) for detailed instructions.

## ⚠️ Important

- **NEVER** commit your `.env.local` file
- **NEVER** share your API keys
- Keep your API keys secure

## 🔧 Files Modified/Created

### Core Features
- ✅ `packages/desktop-client/src/services/openaiService.ts` - OpenAI integration
- ✅ `packages/desktop-client/src/components/ChatWidget.tsx` - Main chat interface
- ✅ `packages/desktop-client/src/components/MarkdownMessage.tsx` - Markdown rendering
- ✅ `packages/desktop-client/.env.local.example` - Environment template
- ✅ `packages/desktop-client/vite.config.mts` - Updated to expose env vars
- ✅ `packages/desktop-client/package.json` - Added dependencies

### Budget Context
- ✅ `packages/desktop-client/src/hooks/useBudgetContext.ts` - Budget data access
- ✅ `packages/desktop-client/src/services/budgetContextService.ts` - Data formatting

### Search Features
- ✅ `packages/desktop-client/src/services/googleSearchService.ts` - Web search
- ✅ `packages/desktop-client/src/services/docsSearchService.ts` - Documentation search

### History & Storage
- ✅ `packages/desktop-client/src/services/chatHistoryService.ts` - Conversation management

## 📚 Additional Documentation

- [AI_FEATURES.md](AI_FEATURES.md) - Complete feature guide
- [BUDGET_CONTEXT_AI.md](BUDGET_CONTEXT_AI.md) - Budget context feature details
- [CHAT_TEXT_SELECTION_FEATURE.md](CHAT_TEXT_SELECTION_FEATURE.md) - Text selection guide
- [AGENTS.md](AGENTS.md) - Development guidelines
