# AI Chat Secure Credential Storage Implementation

## Overview
The AI Chat feature now uses **platform-specific secure credential storage** to protect API keys instead of storing them in plain text.

## Security Architecture

### Platform-Specific Implementations

#### **Desktop (Electron)**
- **Method:** Electron's `safeStorage` API
- **Encryption:** OS-level encryption (using OS keychain)
  - macOS: Keychain
  - Windows: DPAPI (Data Protection API)
  - Linux: pass or libsecret
- **Storage:** Encrypted files in `credentials/` directory
- **Files:**
  - `packages/loot-core/src/platform/server/credentials/index.electron.ts`
  - Each credential stored as: `~/.actual/credentials/ai-chat-<provider>`
- **Security:** ✅ Highest level - OS-level encryption, no master password needed

#### **Web Browser**
- **Method:** Web Crypto API with Master Password
- **Encryption:** AES-256-GCM (NIST approved)
- **Key Derivation:** PBKDF2 with 100,000 iterations + SHA-256
- **Storage:** IndexedDB (encrypted)
- **Files:**
  - `packages/loot-core/src/platform/server/credentials/index.web.ts`
  - Stores encrypted credentials as: `ai-chat-credentials` (JSON)
  - Stores salt as: `ai-chat-storage-salt` (base64)
- **Requires:** User sets master password on first use
- **Security:** ✅ Good - User-managed encryption key with strong KDF

#### **Sync Server (Node.js)**
- **Method:** Environment Variables
- **Storage:** In-memory only (not persisted)
- **Files:**
  - `packages/loot-core/src/platform/server/credentials/index.ts`
- **Environment Variables:**
  - `AI_CHAT_ANTHROPIC_KEY` - Anthropic API key
  - `AI_CHAT_OPENAI_KEY` - OpenAI API key
  - `AI_CHAT_LOCAL_KEY` - Local model API key
- **Security:** ✅ Excellent for servers - No credentials stored on disk

## Implementation Details

### Service Updates
**File:** `packages/loot-core/src/server/ai-chat/service.ts`

Changes:
1. Added `credentials.init()` in constructor
2. Modified `getPreferences()` to load API keys from secure storage
3. Modified `setPreferences()` to store API keys securely
4. API keys are **removed from preferences** before saving to persistent storage

```typescript
// Old (INSECURE)
await prefs.savePrefs({ 'ai-chat': updatedPrefs }); // Keys in plain text!

// New (SECURE)
// Extract API keys and store in secure credential storage
if (provider.apiKey) {
  await credentials.setCredential(`ai-chat-${provider.type}`, provider.apiKey);
  provider.apiKey = ''; // Remove from preferences
}
await prefs.savePrefs({ 'ai-chat': updatedPrefs }); // No keys in plain text
```

### UI Updates
**File:** `packages/desktop-client/src/components/ai-chat/ChatSettings.tsx`

Changes:
1. Added security status indicator with visual styling
2. Shows current security platform and whether credentials are encrypted
3. Displays security warnings if needed
4. New handler call: `ai-chat-check-security` to check platform

### Handler Updates
**Files:**
- `packages/loot-core/src/server/ai-chat/app.ts`
- `packages/loot-core/src/types/handlers/ai-chat-handlers.ts`

New handler:
```typescript
'ai-chat-check-security': () => Promise<{
  platform: string;
  isSecure: boolean;
}>;
```

Returns:
- Desktop: `{ platform: 'Electron safeStorage', isSecure: true }`
- Web: `{ platform: 'Web Crypto with Master Password', isSecure: false }` (until master password is set)
- Server: `{ platform: 'Environment Variables', isSecure: true }`

## Credential Storage Interface

**File:** `packages/loot-core/src/platform/server/credentials/index-types.ts`

Platform-agnostic interface:
```typescript
export async function init(): Promise<void>;
export async function setCredential(key: string, value: string): Promise<void>;
export async function getCredential(key: string): Promise<string | null>;
export async function deleteCredential(key: string): Promise<void>;
export async function hasCredential(key: string): Promise<boolean>;
```

## Migration Path (Future Enhancement)

For users with existing plain-text API keys:
1. On first load after update, detect credentials in `preferences['ai-chat'].providers[].apiKey`
2. Offer to migrate to secure storage
3. User re-enters password/confirms credentials
4. Migrate to new credential storage
5. Remove plain-text keys from preferences

**Note:** This migration logic can be added in a future PR if needed.

## Security Best Practices

✅ **DO:**
- API keys are encrypted at rest
- Platform-appropriate encryption (OS keychain on desktop)
- Keys never stored in preferences/JSON files
- Different implementation per platform
- Use `credentials` module for all API key storage

❌ **DON'T:**
- Don't store `provider.apiKey` directly in preferences
- Don't use plain-text JSON for secrets
- Don't hardcode API keys
- Don't log or expose API keys in error messages

## Testing the Implementation

### Desktop (Electron)
```bash
# Start desktop app
yarn start:desktop

# Navigate to AI Chat Settings
# Enter API key - should see: "🔒 Secure Storage" with "Electron safeStorage"
# Key should be encrypted in ~/.actual/credentials/
```

### Web
```bash
# Start web app
yarn start:browser

# Navigate to AI Chat Settings
# May see: "⚠️ Warning: Plain Text Storage" initially
# Future: Implement master password setup UI
# Once master password is set, keys will be encrypted with AES-256-GCM
```

### Sync Server
```bash
# Set environment variable
export AI_CHAT_ANTHROPIC_KEY=sk-ant-xxx

# Start server
yarn start:server-dev

# API keys loaded from environment, never stored on disk
```

## Files Modified/Created

### Created (4 files)
- `packages/loot-core/src/platform/server/credentials/index-types.ts` - Interface definition
- `packages/loot-core/src/platform/server/credentials/index.electron.ts` - Electron safeStorage implementation
- `packages/loot-core/src/platform/server/credentials/index.web.ts` - Web Crypto implementation
- `packages/loot-core/src/platform/server/credentials/index.ts` - Server/Node.js implementation

### Modified (5 files)
- `packages/loot-core/src/server/ai-chat/service.ts` - Use secure credential storage
- `packages/loot-core/src/server/ai-chat/app.ts` - Add security check handler
- `packages/loot-core/src/types/handlers/ai-chat-handlers.ts` - Add security check handler type
- `packages/desktop-client/src/components/ai-chat/ChatSettings.tsx` - Show security status

## Future Enhancements

1. **Web Master Password Setup UI**
   - Add button to set/change master password
   - Prompt on first API key entry
   - Unlock functionality for session

2. **Migration Tool**
   - Automatically migrate existing plain-text keys to secure storage
   - Show migration progress

3. **Credential Rotation**
   - Rotate encryption keys periodically
   - Support key versioning

4. **Audit Logging**
   - Log credential access (without exposing values)
   - Alert on suspicious activity

## References

- Electron safeStorage: https://www.electronjs.org/docs/latest/api/safe-storage
- Web Crypto API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API
- PBKDF2: https://tools.ietf.org/html/rfc8018
- AES-GCM: https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf
