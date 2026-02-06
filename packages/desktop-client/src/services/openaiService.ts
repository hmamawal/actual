import OpenAI from 'openai';

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error(
        'OpenAI API key is not configured. Please add VITE_OPENAI_API_KEY to your .env.local file',
      );
    }

    openaiClient = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true, // Required for browser usage
    });
  }

  return openaiClient;
}

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

/**
 * Send a message to OpenAI's GPT-4o model with multimodal support
 * @param messages - Array of messages with role and content
 * @returns The assistant's response
 */
export async function sendChatMessage(
  messages: ChatMessage[],
): Promise<string> {
  try {
    const client = getOpenAIClient();

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini', // Using GPT-4o mini for cost efficiency; change to 'gpt-4o' for better performance
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: 0.7,
      max_tokens: 1000,
    });

    const assistantMessage = response.choices[0]?.message?.content;

    if (!assistantMessage) {
      throw new Error('No response received from OpenAI');
    }

    return assistantMessage;
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      throw new Error(`OpenAI API Error: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Send a multimodal message with text and image support
 * @param userMessage - User's text message
 * @param imageUrl - Optional image URL for vision capabilities
 * @param conversationHistory - Previous messages for context
 * @returns The assistant's response
 */
export async function sendMultimodalMessage(
  userMessage: string,
  imageUrl?: string,
  conversationHistory: ChatMessage[] = [],
): Promise<string> {
  try {
    const client = getOpenAIClient();

    const contentArray: Array<
      | { type: 'text'; text: string }
      | { type: 'image_url'; image_url: { url: string } }
    > = [{ type: 'text', text: userMessage }];

    if (imageUrl) {
      contentArray.push({
        type: 'image_url',
        image_url: { url: imageUrl },
      });
    }

    const messages = [
      ...conversationHistory,
      {
        role: 'user' as const,
        content: contentArray,
      },
    ];

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: messages as Parameters<
        typeof client.chat.completions.create
      >[0]['messages'],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const assistantMessage = response.choices[0]?.message?.content;

    if (!assistantMessage) {
      throw new Error('No response received from OpenAI');
    }

    return assistantMessage;
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      throw new Error(`OpenAI API Error: ${error.message}`);
    }
    throw error;
  }
}
