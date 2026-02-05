// @ts-strict-ignore
import React, { useState, useEffect } from 'react';

import { theme } from '@actual-app/components/theme';
import { send } from 'loot-core/src/platform/client/fetch';
import type {
  ChatPreferences,
  AIProvider,
  AIProviderConfig,
} from 'loot-core/src/types/models/ai-chat';

import { Button } from '@desktop-client/components/common/Button2';
import { Input } from '@desktop-client/components/common/Input';
import { View } from '@desktop-client/components/common/View';
import { Text } from '@desktop-client/components/common/Text';

type ChatSettingsProps = {
  onClose: () => void;
};

export function ChatSettings({ onClose }: ChatSettingsProps) {
  const [preferences, setPreferences] = useState<ChatPreferences | null>(null);
  const [testingProvider, setTestingProvider] = useState<AIProvider | null>(
    null,
  );
  const [securityStatus, setSecurityStatus] = useState<{
    platform: string;
    isSecure: boolean;
  } | null>(null);

  useEffect(() => {
    loadPreferences();
    checkSecurityStatus();
  }, []);

  const checkSecurityStatus = async () => {
    try {
      const status = await send('ai-chat-check-security');
      setSecurityStatus(status);
    } catch (error) {
      console.error('Failed to check security status:', error);
    }
  };

  const loadPreferences = async () => {
    const prefs = await send('ai-chat-get-preferences');
    setPreferences(prefs);
  };

  const savePreferences = async () => {
    if (!preferences) return;
    await send('ai-chat-set-preferences', { preferences });
    onClose();
  };

  const testProvider = async (provider: AIProvider) => {
    const providerConfig = preferences?.providers.find(
      p => p.provider === provider,
    );
    if (!providerConfig) return;

    setTestingProvider(provider);
    try {
      const result = await send('ai-chat-test-provider', {
        provider,
        apiKey: providerConfig.apiKey,
      });

      if (result.success) {
        alert('Connection successful!');
      } else {
        alert(`Connection failed: ${result.error}`);
      }
    } catch (error) {
      alert(`Connection failed: ${error.message}`);
    } finally {
      setTestingProvider(null);
    }
  };

  const updateProvider = (
    provider: AIProvider,
    updates: Partial<AIProviderConfig>,
  ) => {
    if (!preferences) return;

    const existingIndex = preferences.providers.findIndex(
      p => p.provider === provider,
    );

    if (existingIndex >= 0) {
      const updatedProviders = [...preferences.providers];
      updatedProviders[existingIndex] = {
        ...updatedProviders[existingIndex],
        ...updates,
      };
      setPreferences({ ...preferences, providers: updatedProviders });
    } else {
      const newProvider: AIProviderConfig = {
        provider,
        apiKey: '',
        enabled: false,
        defaultModel: provider === 'anthropic' ? 'claude-3-5-sonnet-20241022' : 'gpt-4o',
        ...updates,
      };
      setPreferences({
        ...preferences,
        providers: [...preferences.providers, newProvider],
      });
    }
  };

  if (!preferences) {
    return <View>Loading...</View>;
  }

  return (
    <View
      style={{
        padding: 20,
        height: '100%',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <View
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <Text style={{ fontSize: 20, fontWeight: 600 }}>AI Chat Settings</Text>
        <Button onClick={onClose} variant="bare">
          Close
        </Button>
      </View>

      {/* Security Status */}
      <View
        style={{
          padding: 15,
          marginBottom: 30,
          borderRadius: 6,
          backgroundColor:
            securityStatus?.isSecure ?
              'rgba(76, 175, 80, 0.1)'
            : 'rgba(244, 67, 54, 0.1)',
          border: `1px solid ${securityStatus?.isSecure ? '#4CAF50' : '#f44336'}`,
        }}
      >
        <Text
          style={{
            fontWeight: 600,
            color: securityStatus?.isSecure ? '#2e7d32' : '#c62828',
            marginBottom: 8,
          }}
        >
          {securityStatus?.isSecure ? '🔒 Secure Storage' : '⚠️ Warning: Plain Text Storage'}
        </Text>
        <Text style={{ fontSize: 13, lineHeight: 1.5 }}>
          {securityStatus?.isSecure ?
            `API keys are securely encrypted using ${securityStatus.platform} credential storage.`
          : `API keys are currently stored in plain text. This is a security risk. Your API keys should be re-entered to use secure storage.`}
        </Text>
      </View>

      {/* General Settings */}
      <View style={{ marginBottom: 30 }}>
        <Text style={{ fontSize: 16, fontWeight: 600, marginBottom: 10 }}>
          General
        </Text>

        <View style={{ marginBottom: 15 }}>
          <Text style={{ marginBottom: 5 }}>Default Provider</Text>
          <select
            value={preferences.defaultProvider}
            onChange={e =>
              setPreferences({
                ...preferences,
                defaultProvider: e.target.value as AIProvider,
              })
            }
            style={{
              padding: 8,
              borderRadius: 4,
              border: `1px solid ${theme.pillBorder}`,
              backgroundColor: theme.tableBackground,
              color: theme.pageText,
            }}
          >
            <option value="anthropic">Anthropic (Claude)</option>
            <option value="openai">OpenAI (GPT)</option>
            <option value="local">Local Model</option>
          </select>
        </View>

        <View style={{ marginBottom: 15 }}>
          <label>
            <input
              type="checkbox"
              checked={preferences.autoCapture}
              onChange={e =>
                setPreferences({
                  ...preferences,
                  autoCapture: e.target.checked,
                })
              }
            />
            <Text style={{ marginLeft: 8 }}>Auto-capture screen context</Text>
          </label>
        </View>

        <View style={{ marginBottom: 15 }}>
          <label>
            <input
              type="checkbox"
              checked={preferences.includeTransactionData}
              onChange={e =>
                setPreferences({
                  ...preferences,
                  includeTransactionData: e.target.checked,
                })
              }
            />
            <Text style={{ marginLeft: 8 }}>Include transaction data in context</Text>
          </label>
        </View>
      </View>

      {/* Provider Configurations */}
      <View style={{ marginBottom: 30 }}>
        <Text style={{ fontSize: 16, fontWeight: 600, marginBottom: 10 }}>
          AI Providers
        </Text>

        {['anthropic', 'openai'].map(provider => {
          const config =
            preferences.providers.find(p => p.provider === provider) ||
            ({
              provider,
              apiKey: '',
              enabled: false,
              defaultModel: '',
            } as AIProviderConfig);

          return (
            <View
              key={provider}
              style={{
                padding: 15,
                marginBottom: 15,
                border: `1px solid ${theme.pillBorder}`,
                borderRadius: 8,
                backgroundColor: theme.tableBackground,
              }}
            >
              <View
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 10,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: 600 }}>
                  {provider === 'anthropic' ? 'Anthropic (Claude)' : 'OpenAI (GPT)'}
                </Text>
                <label>
                  <input
                    type="checkbox"
                    checked={config.enabled}
                    onChange={e =>
                      updateProvider(provider as AIProvider, {
                        enabled: e.target.checked,
                      })
                    }
                  />
                  <Text style={{ marginLeft: 5 }}>Enabled</Text>
                </label>
              </View>

              <View style={{ marginBottom: 10 }}>
                <Text style={{ marginBottom: 5, fontSize: 12 }}>API Key</Text>
                <Input
                  type="password"
                  value={config.apiKey}
                  onChange={e =>
                    updateProvider(provider as AIProvider, {
                      apiKey: e.target.value,
                    })
                  }
                  placeholder="Enter API key"
                />
              </View>

              <View style={{ marginBottom: 10 }}>
                <Text style={{ marginBottom: 5, fontSize: 12 }}>
                  Base URL (optional)
                </Text>
                <Input
                  value={config.baseUrl || ''}
                  onChange={e =>
                    updateProvider(provider as AIProvider, {
                      baseUrl: e.target.value,
                    })
                  }
                  placeholder="Leave empty for default"
                />
              </View>

              <Button
                onClick={() => testProvider(provider as AIProvider)}
                disabled={!config.apiKey || testingProvider === provider}
                variant="normal"
              >
                {testingProvider === provider ? 'Testing...' : 'Test Connection'}
              </Button>
            </View>
          );
        })}
      </View>

      {/* Save Button */}
      <View style={{ display: 'flex', gap: 10 }}>
        <Button onClick={savePreferences} variant="primary">
          Save Settings
        </Button>
        <Button onClick={onClose} variant="normal">
          Cancel
        </Button>
      </View>
    </View>
  );
}
