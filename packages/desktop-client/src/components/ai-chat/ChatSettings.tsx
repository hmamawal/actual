// @ts-strict-ignore
import React, { useState, useEffect } from 'react';

import { theme } from '@actual-app/components/theme';
import { send } from 'loot-core/platform/client/fetch';
import type {
  ChatPreferences,
  AIProvider,
  AIProviderConfig,
} from 'loot-core/types/models';

import { Button } from '@actual-app/components/button';
import { Input } from '@actual-app/components/input';
import { View } from '@actual-app/components/view';
import { Text } from '@actual-app/components/text';

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

  const modelOptions: Record<
    AIProvider,
    Array<{ id: string; label: string }>
  > = {
    anthropic: [
      { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
      { id: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku' },
    ],
    openai: [
      { id: 'gpt-4o', label: 'GPT-4o' },
      { id: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    ],
    local: [],
  };

  const fallbackModelFor = (provider: AIProvider) =>
    provider === 'anthropic' ? 'claude-3-5-sonnet-20241022' : 'gpt-4o';

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
        defaultModel:
          provider === 'anthropic' ? 'claude-3-5-sonnet-20241022' : 'gpt-4o',
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
        maxWidth: 800,
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <View
        style={{
          display: 'flex',
          flexDirection: 'row',
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
          backgroundColor: securityStatus?.isSecure
            ? 'rgba(76, 175, 80, 0.1)'
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
          {securityStatus?.isSecure
            ? '🔒 Secure Storage'
            : '⚠️ Warning: Plain Text Storage'}
        </Text>
        <Text
          style={{
            fontSize: 13,
            lineHeight: 1.5,
            display: 'block',
            wordWrap: 'break-word',
          }}
        >
          {securityStatus?.isSecure
            ? `API keys are securely encrypted using ${securityStatus.platform} credential storage.`
            : `API keys are stored in browser preferences without encryption. For secure encrypted storage, use the desktop application. The web environment does not support secure credential storage at this time.`}
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
              width: '100%',
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

        <View
          style={{
            marginBottom: 15,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}
        >
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
          <Text style={{ flexShrink: 1 }}>Auto-capture screen context</Text>
        </View>

        <View
          style={{
            marginBottom: 15,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}
        >
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
          <Text style={{ flexShrink: 1 }}>
            Include transaction data in context
          </Text>
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

          const providerId = provider as AIProvider;
          const availableModels = modelOptions[providerId] || [];
          const fallbackModel = fallbackModelFor(providerId);
          const selectedModel = config.defaultModel || fallbackModel;

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
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 10,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: 600 }}>
                  {provider === 'anthropic'
                    ? 'Anthropic (Claude)'
                    : 'OpenAI (GPT)'}
                </Text>
                <View
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={config.enabled}
                    onChange={e =>
                      updateProvider(providerId, {
                        enabled: e.target.checked,
                      })
                    }
                  />
                  <Text>Enabled</Text>
                </View>
              </View>

              <View
                style={{
                  marginBottom: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <Text style={{ fontSize: 12, display: 'block' }}>API Key</Text>
                <Input
                  type="password"
                  value={config.apiKey}
                  onChange={e =>
                    updateProvider(providerId, {
                      apiKey: e.target.value,
                    })
                  }
                  placeholder="Enter API key"
                  style={{ width: '100%' }}
                />
              </View>

              <View
                style={{
                  marginBottom: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <Text style={{ fontSize: 12, display: 'block' }}>Model</Text>
                <View style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {availableModels.map(model => (
                    <Button
                      key={model.id}
                      variant={
                        selectedModel === model.id ? 'menuSelected' : 'menu'
                      }
                      onClick={() =>
                        updateProvider(providerId, { defaultModel: model.id })
                      }
                    >
                      {model.label}
                    </Button>
                  ))}
                </View>
                <Input
                  value={config.defaultModel}
                  onChange={e =>
                    updateProvider(providerId, {
                      defaultModel: e.target.value,
                    })
                  }
                  placeholder={`Custom model ID (${fallbackModel})`}
                  style={{ width: '100%' }}
                />
              </View>

              <View
                style={{
                  marginBottom: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <Text style={{ fontSize: 12, display: 'block' }}>
                  Base URL (optional)
                </Text>
                <Input
                  value={config.baseUrl || ''}
                  onChange={e =>
                    updateProvider(providerId, {
                      baseUrl: e.target.value,
                    })
                  }
                  placeholder="Leave empty for default"
                  style={{ width: '100%' }}
                />
              </View>

              <Button
                onClick={() => testProvider(providerId)}
                disabled={!config.apiKey || testingProvider === provider}
                variant="normal"
              >
                {testingProvider === provider
                  ? 'Testing...'
                  : 'Test Connection'}
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
