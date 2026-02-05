// @ts-strict-ignore
// Electron implementation using safeStorage API
import { safeStorage } from 'electron';
import * as fs from 'fs';
import { join } from 'path';

import * as lootFs from '../fs';

import * as T from './index-types';

const CREDENTIALS_DIR = 'credentials';

function getCredentialsDir(): string {
  return join(lootFs.getDataDir(), CREDENTIALS_DIR);
}

function getCredentialPath(key: string): string {
  // Sanitize key to prevent path traversal and unsafe filenames
  let sanitizedKey = key.replace(/[^a-zA-Z0-9_]/g, '_');

  // Avoid empty filenames
  if (sanitizedKey.length === 0) {
    sanitizedKey = 'credential';
  }

  // Avoid filenames starting with dots (hidden/special files)
  if (sanitizedKey[0] === '.') {
    sanitizedKey = '_' + sanitizedKey;
  }
  return join(getCredentialsDir(), sanitizedKey);
}

export const init: T.Init = async function () {
  const credentialsDir = getCredentialsDir();
  
  // Create credentials directory if it doesn't exist
  if (!fs.existsSync(credentialsDir)) {
    fs.mkdirSync(credentialsDir, { recursive: true, mode: 0o700 });
  }
};

export const setCredential: T.SetCredential = async function (key, value) {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error(
      'Secure storage is not available on this system. Please ensure your OS keychain is configured.',
    );
  }

  const encrypted = safeStorage.encryptString(value);
  const credentialPath = getCredentialPath(key);

  return new Promise((resolve, reject) => {
    fs.writeFile(credentialPath, encrypted, { mode: 0o600 }, err => {
      if (err) reject(err);
      else resolve();
    });
  });
};

export const getCredential: T.GetCredential = async function (key) {
  const credentialPath = getCredentialPath(key);

  if (!fs.existsSync(credentialPath)) {
    return null;
  }

  return new Promise((resolve, reject) => {
    fs.readFile(credentialPath, (err, data) => {
      if (err) {
        if (err.code === 'ENOENT') {
          resolve(null);
        } else {
          reject(err);
        }
        return;
      }

      try {
        const decrypted = safeStorage.decryptString(data);
        resolve(decrypted);
      } catch (e) {
        console.error('Failed to decrypt credential:', e);
        resolve(null);
      }
    });
  });
};

export const deleteCredential: T.DeleteCredential = async function (key) {
  const credentialPath = getCredentialPath(key);

  return new Promise((resolve, reject) => {
    fs.unlink(credentialPath, err => {
      if (err && err.code !== 'ENOENT') {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

export const hasCredential: T.HasCredential = async function (key) {
  const credentialPath = getCredentialPath(key);
  return fs.existsSync(credentialPath);
};
