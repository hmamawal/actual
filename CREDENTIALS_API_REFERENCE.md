# Quick Reference: Secure Credentials API

## For Backend Developers

### Using the Credentials Module

```typescript
import * as credentials from 'loot-core/src/platform/server/credentials';

// Initialize (called automatically by service)
await credentials.init();

// Store a credential
await credentials.setCredential('ai-chat-anthropic', apiKey);

// Retrieve a credential
const apiKey = await credentials.getCredential('ai-chat-anthropic');

// Check if credential exists
const exists = await credentials.hasCredential('ai-chat-anthropic');

// Delete a credential
await credentials.deleteCredential('ai-chat-anthropic');
```

### Credential Key Naming Convention

```
ai-chat-<provider>

Examples:
- ai-chat-anthropic
- ai-chat-openai
- ai-chat-local
```

### DO NOT Store Credentials in Preferences

```typescript
// ❌ BAD - Plain text!
await prefs.savePrefs({
  'ai-chat': {
    providers: [
      { apiKey: 'sk-ant-xxx' }  // EXPOSED
    ]
  }
});

// ✅ GOOD - Use credentials module
await credentials.setCredential('ai-chat-anthropic', 'sk-ant-xxx');
await prefs.savePrefs({
  'ai-chat': {
    providers: [
      { apiKey: '' }  // Empty, encrypted elsewhere
    ]
  }
});
```

## For Frontend Developers

### Checking Security Status

```tsx
import { send } from 'loot-core/src/platform/client/fetch';

// In component
const status = await send('ai-chat-check-security');
// Returns: { platform: 'Electron safeStorage' | 'Web Crypto with Master Password', isSecure: boolean }
```

### Displaying Security Status

```tsx
<View
  style={{
    backgroundColor: status.isSecure ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
  }}
>
  <Text>
    {status.isSecure ? '🔒 Secure' : '⚠️ Warning: Plain Text'}
  </Text>
</View>
```

## Platform-Specific Behaviors

### Desktop (Electron)
- ✅ Credentials encrypted with OS keychain
- ✅ No master password needed
- ✅ Files stored in `~/.actual/credentials/`
- ✅ Transparent to user

### Web (Browser)
- ⏳ Future: Master password setup required
- ⏳ Credentials encrypted with AES-256-GCM
- ⏳ Stored in IndexedDB (encrypted)
- ⏳ Session-cached for performance

### Server (Node.js)
- ✅ Load from environment variables
- ✅ In-memory only (no disk storage)
- ✅ Set at startup via `process.env`

## Environment Variables (Server)

```bash
# When deploying sync-server
export AI_CHAT_ANTHROPIC_KEY=sk-ant-xxxxx
export AI_CHAT_OPENAI_KEY=sk-gpt-xxxxx

# In Docker
docker run -e AI_CHAT_ANTHROPIC_KEY=sk-ant-xxxxx ...

# In kubernetes
apiVersion: v1
kind: Secret
metadata:
  name: ai-chat-keys
type: Opaque
stringData:
  anthropic: sk-ant-xxxxx
  openai: sk-gpt-xxxxx
```

## Error Handling

```typescript
try {
  await credentials.setCredential('ai-chat-anthropic', apiKey);
} catch (error) {
  if (error.message.includes('not available')) {
    // Electron: safeStorage not available
    // Web: Master password not set
    // Server: Environment variable not set
  }
  // Handle gracefully, show user-friendly message
}
```

## Testing

### Unit Tests
```typescript
// Test credential storage
it('should store and retrieve credentials', async () => {
  await credentials.setCredential('test-key', 'test-value');
  const value = await credentials.getCredential('test-key');
  expect(value).toBe('test-value');
});
```

### Integration Tests
```typescript
// Test with service
it('should load encrypted credentials in preferences', async () => {
  const prefs = await service.getPreferences();
  // Credentials should be loaded from secure storage
  expect(prefs.providers[0].apiKey).toBeTruthy();
});
```

## Troubleshooting

### "Secure storage is not available"
- **Desktop:** Check if Electron safeStorage is initialized
- **Web:** Master password not yet set (feature in progress)
- **Server:** Missing environment variable

### Keys not loading after upgrade
- Check that `credentials.init()` is called on startup
- Verify file permissions on credential files (should be 0o600)
- On web: Check IndexedDB has encryption keys

### Keys showing as empty in UI
- Confirm credentials module is initialized
- Check that `getPreferences()` is awaiting credential loading
- Verify platform-specific storage is accessible

## Best Practices

1. **Always initialize:** Call `credentials.init()` at service startup
2. **Never log keys:** Remove from error messages and logs
3. **Use consistent naming:** Follow `ai-chat-<provider>` convention
4. **Await operations:** All credential operations are async
5. **Validate input:** Sanitize keys before storing (no path traversal)
6. **Test both ways:** Verify credentials on client and server

## Architecture Decisions

### Why Platform-Specific?
- **Desktop:** Leverage OS keychain (better security, no master password)
- **Web:** Use Web Crypto API (standards-based, portable)
- **Server:** Environment variables (12-factor app compliance)

### Why Not a Unified Approach?
- Desktop users benefit from zero-configuration OS integration
- Web users don't need master password UI for initial implementation
- Server deployments follow industry best practices

### Why PBKDF2-100K + AES-256-GCM on Web?
- PBKDF2: Recommended by NIST, slow by design (resists brute force)
- 100,000 iterations: ~100ms derivation time per unlock
- AES-256-GCM: NIST standard, provides both confidentiality and authenticity

---

**Last Updated:** February 2026
**Version:** 1.0 - Initial Implementation
