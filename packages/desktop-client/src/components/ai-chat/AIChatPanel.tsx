// @ts-strict-ignore
import React, { useState, useEffect, useRef } from 'react';

import { css } from '@emotion/css';

import { theme } from '@actual-app/components/theme';
import { send } from 'loot-core/platform/client/fetch';
import type {
  ChatPreferences,
  ChatSession,
  ChatMessage,
  MessageAttachment,
} from 'loot-core/types/models';

import { Button } from '@actual-app/components/button';
import { Input } from '@actual-app/components/input';
import { View } from '@actual-app/components/view';
import { Text } from '@actual-app/components/text';

import { ChatMessageComponent } from './ChatMessage';
import { ChatSessionList } from './ChatSessionList';
import { ChatSettings } from './ChatSettings';
import { PasswordManager } from './PasswordManager';

export function AIChatPanel() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(
    null,
  );
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [preferences, setPreferences] = useState<ChatPreferences | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [needsUnlock, setNeedsUnlock] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSessions();
    loadPreferences();
    checkPasswordNeeded();
  }, []);

  useEffect(() => {
    if (!showSettings) {
      loadPreferences();
    }
  }, [showSettings]);

  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages]);

  const loadSessions = async () => {
    const loadedSessions = await send('ai-chat-list-sessions');
    setSessions(loadedSessions);

    if (loadedSessions.length > 0 && !currentSession) {
      const session = await send('ai-chat-get-session', {
        sessionId: loadedSessions[0].id,
      });
      setCurrentSession(session);
    }
  };

  const checkPasswordNeeded = async () => {
    try {
      const status = await send('ai-chat-check-master-password');
      if (status.needed && status.hasPassword) {
        setNeedsUnlock(true);
      }
    } catch {
      // Ignore errors
    }
  };

  const loadPreferences = async () => {
    const prefs = await send('ai-chat-get-preferences');
    setPreferences(prefs);
    return prefs as ChatPreferences;
  };

  const createNewSession = async () => {
    const { sessionId } = await send('ai-chat-create-session', {
      title: `Chat ${new Date().toLocaleString()}`,
    });

    const session = await send('ai-chat-get-session', { sessionId });
    setCurrentSession(session);
    await loadSessions();
  };

  const sendMessage = async () => {
    if (!message.trim() || !currentSession || isLoading) return;

    setErrorMessage(null);

    const latestPrefs = preferences || (await loadPreferences());
    const providerConfig = latestPrefs?.providers.find(
      p => p.provider === latestPrefs.defaultProvider,
    );

    if (!providerConfig || !providerConfig.enabled) {
      setErrorMessage('Enable an AI provider in Settings to send messages.');
      return;
    }

    if (!providerConfig.apiKey) {
      setErrorMessage('Add an API key for the selected provider in Settings.');
      return;
    }

    setIsLoading(true);
    const userMessage = message;
    setMessage('');

    try {
      const { response } = await send('ai-chat-send-message', {
        sessionId: currentSession.id,
        message: userMessage,
        attachments: attachments.length > 0 ? attachments : undefined,
        includeScreenContext: true,
      });

      // Reload current session to get updated messages
      const updatedSession = await send('ai-chat-get-session', {
        sessionId: currentSession.id,
      });
      setCurrentSession(updatedSession);
      setAttachments([]);
    } catch (error) {
      const messageText =
        error instanceof Error ? error.message : 'Failed to send message.';
      console.error('Failed to send message:', error);
      setErrorMessage(messageText);
      setMessage(userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: MessageAttachment[] = [];

    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/')) {
        const base64 = await fileToBase64(file);
        newAttachments.push({
          id: `att_${Date.now()}_${Math.random()}`,
          type: 'image',
          name: file.name,
          mimeType: file.type,
          data: base64,
          size: file.size,
        });
      }
    }

    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (needsUnlock) {
    return (
      <View
        style={{
          height: '100%',
          backgroundColor: theme.pageBackground,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <PasswordManager
          mode="unlock"
          onComplete={() => {
            setNeedsUnlock(false);
            loadPreferences();
          }}
        />
      </View>
    );
  }

  if (showSettings) {
    return (
      <View
        style={{
          height: '100%',
          backgroundColor: theme.pageBackground,
        }}
      >
        <ChatSettings onClose={() => setShowSettings(false)} />
      </View>
    );
  }

  return (
    <View
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'row',
        backgroundColor: theme.pageBackground,
      }}
    >
      {/* Session List Sidebar */}
      <View
        style={{
          width: 250,
          borderRight: `1px solid ${theme.pillBorder}`,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <View
          style={{
            padding: 10,
            borderBottom: `1px solid ${theme.pillBorder}`,
          }}
        >
          <Button onClick={createNewSession} variant="primary">
            New Chat
          </Button>
          <Button
            onClick={() => setShowSettings(true)}
            variant="bare"
            style={{ marginTop: 5 }}
          >
            Settings
          </Button>
        </View>
        <ChatSessionList
          sessions={sessions}
          currentSession={currentSession}
          onSelectSession={async sessionId => {
            const session = await send('ai-chat-get-session', { sessionId });
            setCurrentSession(session);
          }}
          onDeleteSession={async sessionId => {
            await send('ai-chat-delete-session', { sessionId });
            await loadSessions();
            if (currentSession?.id === sessionId) {
              setCurrentSession(null);
            }
          }}
        />
      </View>

      {/* Chat Area */}
      <View
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {currentSession ? (
          <>
            {/* Messages */}
            <View
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: 20,
              }}
            >
              {currentSession.messages.length === 0 ? (
                <View
                  style={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 18, color: theme.pageTextSubdued }}>
                    Start a conversation about your budget
                  </Text>
                </View>
              ) : (
                currentSession.messages.map(msg => (
                  <ChatMessageComponent key={msg.id} message={msg} />
                ))
              )}
              <div ref={messagesEndRef} />
            </View>

            {/* Input Area */}
            <View
              style={{
                padding: 20,
                borderTop: `1px solid ${theme.pillBorder}`,
              }}
            >
              {errorMessage && (
                <View
                  style={{
                    marginBottom: 10,
                    padding: 10,
                    borderRadius: 6,
                    backgroundColor: 'rgba(244, 67, 54, 0.08)',
                    border: '1px solid #f44336',
                  }}
                >
                  <Text style={{ color: '#c62828', fontSize: 13 }}>
                    {errorMessage}
                  </Text>
                  <Button
                    variant="bare"
                    onClick={() => setShowSettings(true)}
                    style={{ marginTop: 6 }}
                  >
                    Open settings
                  </Button>
                </View>
              )}
              {attachments.length > 0 && (
                <View style={{ marginBottom: 10 }}>
                  {attachments.map(att => (
                    <View
                      key={att.id}
                      style={{
                        display: 'inline-block',
                        marginRight: 10,
                        padding: '5px 10px',
                        backgroundColor: theme.pillBackground,
                        borderRadius: 4,
                      }}
                    >
                      <Text>{att.name}</Text>
                      <Button
                        variant="bare"
                        onClick={() =>
                          setAttachments(prev =>
                            prev.filter(a => a.id !== att.id),
                          )
                        }
                      >
                        ×
                      </Button>
                    </View>
                  ))}
                </View>
              )}
              <View style={{ display: 'flex', gap: 10 }}>
                <Input
                  placeholder="Ask about your budget..."
                  value={message}
                  onChange={e => {
                    setMessage(e.target.value);
                    if (errorMessage) {
                      setErrorMessage(null);
                    }
                  }}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  style={{ flex: 1 }}
                />
                <Button
                  variant="bare"
                  disabled={isLoading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  📎
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                  disabled={isLoading}
                />
                <Button
                  onClick={sendMessage}
                  variant="primary"
                  disabled={!message.trim() || isLoading}
                >
                  {isLoading ? 'Sending...' : 'Send'}
                </Button>
              </View>
            </View>
          </>
        ) : (
          <View
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 18, color: theme.pageTextSubdued }}>
              Select or create a chat session
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
