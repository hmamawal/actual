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

## 📖 Full Documentation

See [packages/desktop-client/OPENAI_SETUP.md](packages/desktop-client/OPENAI_SETUP.md) for:

- Troubleshooting
- Advanced configuration
- Model selection
- Cost estimates
- Security best practices

## ⚠️ Important

- **NEVER** commit your `.env.local` file
- **NEVER** share your API key
- Keep your API key secure

## 🔧 Files Modified/Created

- ✅ `packages/desktop-client/src/services/openaiService.ts` - OpenAI integration
- ✅ `packages/desktop-client/src/components/ChatWidget.tsx` - Updated to use real API
- ✅ `packages/desktop-client/.env.local.example` - Environment template
- ✅ `packages/desktop-client/vite.config.mts` - Updated to expose env vars
- ✅ `packages/desktop-client/package.json` - Added `openai` dependency
