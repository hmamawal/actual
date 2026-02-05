// @ts-strict-ignore
// Web implementation using Web Crypto API with master password
import * as asyncStorage from '../asyncStorage';

import * as T from './index-types';

// In-memory cache of decrypted credentials for the session
let credentialCache: Map<string, string> = new Map();
let masterKey: CryptoKey | null = null;
let isInitialized = false;

async function deriveMasterKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey'],
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

async function encryptValue(value: string, key: CryptoKey): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data,
  );

  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);

  // Convert to base64
  return btoa(String.fromCharCode(...combined));
}

async function decryptValue(encrypted: string, key: CryptoKey): Promise<string> {
  // Decode from base64
  const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));

  // Extract IV and encrypted data
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data,
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

export const init: T.Init = async function () {
  if (isInitialized) return;

  // Check if we have a master password set
  const hasPassword = await asyncStorage.getItem('ai-chat-secure-storage-enabled');
  
  if (!hasPassword) {
    console.warn(
      'Secure credential storage not initialized. API keys will not be saved securely.',
    );
  }

  isInitialized = true;
};

export const setCredential: T.SetCredential = async function (key, value) {
  if (!masterKey) {
    throw new Error(
      'Master password not set. Please set a master password first.',
    );
  }

  // Encrypt and store
  const encrypted = await encryptValue(value, masterKey);
  const credentials = JSON.parse(
    (await asyncStorage.getItem('ai-chat-credentials')) || '{}',
  );
  credentials[key] = encrypted;
  await asyncStorage.setItem('ai-chat-credentials', JSON.stringify(credentials));

  // Cache in memory
  credentialCache.set(key, value);
};

export const getCredential: T.GetCredential = async function (key) {
  // Check cache first
  if (credentialCache.has(key)) {
    return credentialCache.get(key) || null;
  }

  if (!masterKey) {
    return null;
  }

  const credentials = JSON.parse(
    (await asyncStorage.getItem('ai-chat-credentials')) || '{}',
  );
  const encrypted = credentials[key];

  if (!encrypted) {
    return null;
  }

  try {
    const decrypted = await decryptValue(encrypted, masterKey);
    credentialCache.set(key, decrypted);
    return decrypted;
  } catch (e) {
    console.error('Failed to decrypt credential:', e);
    return null;
  }
};

export const deleteCredential: T.DeleteCredential = async function (key) {
  const credentials = JSON.parse(
    (await asyncStorage.getItem('ai-chat-credentials')) || '{}',
  );
  delete credentials[key];
  await asyncStorage.setItem('ai-chat-credentials', JSON.stringify(credentials));

  credentialCache.delete(key);
};

export const hasCredential: T.HasCredential = async function (key) {
  const credentials = JSON.parse(
    (await asyncStorage.getItem('ai-chat-credentials')) || '{}',
  );
  return key in credentials;
};

// Web-specific functions for master password management
export async function setMasterPassword(password: string): Promise<void> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  masterKey = await deriveMasterKey(password, salt);

  // Store salt for future use
  await asyncStorage.setItem('ai-chat-storage-salt', btoa(String.fromCharCode(...salt)));
  await asyncStorage.setItem('ai-chat-secure-storage-enabled', 'true');
}

export async function unlockWithMasterPassword(password: string): Promise<boolean> {
  const saltStr = await asyncStorage.getItem('ai-chat-storage-salt');
  if (!saltStr) {
    return false;
  }

  const salt = Uint8Array.from(atob(saltStr), c => c.charCodeAt(0));
  
  try {
    const key = await deriveMasterKey(password, salt);
    
    // Verify password by trying to decrypt a test credential
    const credentials = JSON.parse(
      (await asyncStorage.getItem('ai-chat-credentials')) || '{}',
    );
    
    if (Object.keys(credentials).length > 0) {
      const firstKey = Object.keys(credentials)[0];
      await decryptValue(credentials[firstKey], key);
    }
    
    masterKey = key;
    return true;
  } catch (e) {
    return false;
  }
}

export function clearMasterKey(): void {
  masterKey = null;
  credentialCache.clear();
}
