# OpenAI Integration Setup Guide

This document explains how to set up and use the OpenAI multimodal chat integration in Actual Budget.

## Prerequisites

- An OpenAI API account with credits
- API key from https://platform.openai.com/account/api-keys
- Node.js and Yarn installed

## Setup Instructions

### 1. Copy the Environment Template

Create a `.env.local` file in the `packages/desktop-client/` directory by copying the example:

```bash
cp packages/desktop-client/.env.local.example packages/desktop-client/.env.local
```

### 2. Add Your API Key

Edit `packages/desktop-client/.env.local` and replace the placeholder with your actual OpenAI API key:

```
VITE_OPENAI_API_KEY=sk-proj-your-actual-api-key-here
```

⚠️ **SECURITY WARNING**:

- **NEVER** commit the `.env.local` file to version control
- **NEVER** share your API key publicly
- This file is ignored by git (see `.gitignore`)

### 3. Start the Development Server

```bash
yarn start
```

## Features

The AI Chat Widget supports:

- **Real-time Chat**: Powered by OpenAI's GPT-4o models
- **Conversation History**: The AI maintains context within a chat session
- **Error Handling**: Clear error messages if the API fails
- **Loading States**: Visual feedback while the AI processes your message
- **Draggable Interface**: Move the chat box around the screen
- **Multimodal Support**: Ready for image inputs (prepare for future implementation)

## How to Use

1. Click the 💬 chat icon in the bottom-right corner
2. Type your message in the input box
3. Press Enter or click "Send"
4. Wait for the AI to respond
5. Drag the header to move the chat window around

## Models Used

The integration uses OpenAI's models:

- **gpt-4o-mini**: Default for general chat (cost-effective)
- **gpt-4o**: Premium model with better multimodal capabilities (can be enabled in code)

To switch models, edit `packages/desktop-client/src/services/openaiService.ts`:

```typescript
model: 'gpt-4o', // Change from 'gpt-4o-mini' to 'gpt-4o'
```

## Configuration

All OpenAI settings are in `packages/desktop-client/src/services/openaiService.ts`:

```typescript
// Model selection
model: 'gpt-4o-mini',

// Temperature (0-2): Controls randomness
temperature: 0.7,

// Max tokens: Maximum response length
max_tokens: 1000,
```

## Troubleshooting

### "API key is not configured" Error

- Check that `.env.local` exists in `packages/desktop-client/`
- Verify the API key is set correctly
- Ensure the variable name is `VITE_OPENAI_API_KEY`
- Restart the development server after changing `.env.local`

### "OpenAI API Error" Messages

- Verify your API key is valid and active
- Check your OpenAI account has credits available
- Ensure you have the correct permissions for the API key
- Check the console for detailed error messages

### Chat not responding

- Check browser console (F12) for errors
- Verify internet connection
- Confirm API key is correct
- Check OpenAI's status page for service issues

## Cost Considerations

OpenAI API usage is metered based on:

- **Tokens used**: Input and output tokens both count
- **Model selected**: gpt-4o-mini is cheaper than gpt-4o
- **Response length**: Longer responses cost more

Estimate costs:

- **gpt-4o-mini**: ~$0.00015 per 1K tokens
- **gpt-4o**: ~$0.015 per 1K input tokens

## Future Enhancements

The service is architected to support:

- Image analysis (vision capabilities)
- File uploads
- Streaming responses
- Custom system prompts
- Conversation management
- Usage analytics

## API Reference

### `sendChatMessage(messages: ChatMessage[]): Promise<string>`

Send a text message to the AI.

```typescript
const response = await sendChatMessage([
  { role: 'user', content: 'What is 2+2?' },
]);
```

### `sendMultimodalMessage(userMessage: string, imageUrl?: string, conversationHistory?: ChatMessage[]): Promise<string>`

Send a message with optional image for vision capabilities.

```typescript
const response = await sendMultimodalMessage(
  'What is in this image?',
  'https://example.com/image.jpg',
  previousMessages,
);
```

## Security Best Practices

1. **Don't log the API key** - The service never logs sensitive data
2. **Use browser-safe configuration** - `dangerouslyAllowBrowser: true` required for client-side usage
3. **Environment variables only** - Never hardcode API keys in source
4. **Limited scope** - The API is only used for chat, not other OpenAI services

## Support

For issues with the OpenAI integration:

1. Check the troubleshooting section above
2. Review OpenAI documentation: https://platform.openai.com/docs
3. Check API status: https://status.openai.com
4. Report bugs in the Actual Budget repository

## Files Modified/Created

- `packages/desktop-client/src/services/openaiService.ts` - OpenAI integration service
- `packages/desktop-client/src/components/ChatWidget.tsx` - Chat UI component
- `packages/desktop-client/.env.local.example` - Environment configuration template
- `packages/desktop-client/vite.config.mts` - Vite config to expose environment variables

## See Also

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [ChatWidget Component](../src/components/ChatWidget.tsx)
- [OpenAI Service](../src/services/openaiService.ts)
