// @ts-strict-ignore
// Node.js implementation (for sync-server) - uses environment variables
import * as T from './index-types';

// In-memory store for credentials (not persisted)
const credentials: Map<string, string> = new Map();

export const init: T.Init = async function () {
  // Load credentials from environment variables on startup
  // Format: AI_CHAT_<PROVIDER>_KEY=xxx
  if (process.env.AI_CHAT_ANTHROPIC_KEY) {
    credentials.set('anthropic', process.env.AI_CHAT_ANTHROPIC_KEY);
  }
  if (process.env.AI_CHAT_OPENAI_KEY) {
    credentials.set('openai', process.env.AI_CHAT_OPENAI_KEY);
  }
  if (process.env.AI_CHAT_LOCAL_KEY) {
    credentials.set('local', process.env.AI_CHAT_LOCAL_KEY);
  }
};

export const setCredential: T.SetCredential = async function (key, value) {
  console.warn(
    'Credential storage in sync-server: Credentials are only stored for the current session.',
    'Set environment variables (AI_CHAT_<PROVIDER>_KEY) for persistent storage.',
  );
  credentials.set(key, value);
};

export const getCredential: T.GetCredential = async function (key) {
  return credentials.get(key) || null;
};

export const deleteCredential: T.DeleteCredential = async function (key) {
  credentials.delete(key);
};

export const hasCredential: T.HasCredential = async function (key) {
  return credentials.has(key);
};
