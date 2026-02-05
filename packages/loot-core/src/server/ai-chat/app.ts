// @ts-strict-ignore
import { isElectron } from '../../shared/environment';
import type { AIChatHandlers } from '../../types/handlers/ai-chat-handlers';
import { createApp } from '../app';

import { getAIChatService } from './service';

export const app = createApp<AIChatHandlers>();

const service = getAIChatService();

// Initialize sessions on startup
service.loadSessions().catch(console.error);

app.method('ai-chat-send-message', async function ({ sessionId, message, attachments, includeScreenContext }) {
  return service.sendMessage(
    sessionId,
    message,
    attachments,
    includeScreenContext !== false,
  );
});

app.method('ai-chat-create-session', async function ({ title }) {
  const sessionId = await service.createSession(title);
  return { sessionId };
});

app.method('ai-chat-get-session', async function ({ sessionId }) {
  return service.getSession(sessionId);
});

app.method('ai-chat-list-sessions', async function () {
  return service.listSessions();
});

app.method('ai-chat-delete-session', async function ({ sessionId }) {
  await service.deleteSession(sessionId);
});

app.method('ai-chat-get-screen-context', async function () {
  return service.getScreenContext();
});

app.method('ai-chat-execute-code', async function ({ code, type }) {
  return service.executeCode(code, type);
});

app.method('ai-chat-save-visualization', async function ({
  sessionId,
  messageId,
  visualization,
}) {
  const saved = await service.saveVisualization(
    sessionId,
    messageId,
    visualization,
  );
  return { saved };
});

app.method('ai-chat-get-budget-context', async function () {
  return service.getBudgetContext();
});

app.method('ai-chat-query-data', async function ({ query, context }) {
  return service.queryData(query, context);
});

app.method('ai-chat-get-preferences', async function () {
  return service.getPreferences();
});

app.method('ai-chat-set-preferences', async function ({ preferences }) {
  await service.setPreferences(preferences);
});

app.method('ai-chat-test-provider', async function ({ provider, apiKey }) {
  return service.testProvider(provider, apiKey);
});

app.method('ai-chat-check-security', async function () {
  // Check if we're running in Electron (desktop) or web
  const platform = isElectron() ? 'desktop' : 'web';
  
  // On desktop, safeStorage provides secure encryption
  // On web, credentials are encrypted with master password
  const isSecure = platform === 'desktop'; // Desktop always has secure storage via Electron safeStorage
  
  return {
    platform: isSecure ? 'Electron safeStorage' : 'Web Crypto with Master Password',
    isSecure,
  };
});

export type { AIChatHandlers };
