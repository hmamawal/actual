// @ts-strict-ignore
import React from 'react';

import { css } from '@emotion/css';

import { theme } from '@actual-app/components/theme';
import type { ChatMessage } from 'loot-core/src/types/models/ai-chat';

import { View } from '@desktop-client/components/common/View';
import { Text } from '@desktop-client/components/common/Text';

import { VisualizationDisplay } from './VisualizationDisplay';

type ChatMessageProps = {
  message: ChatMessage;
};

export function ChatMessageComponent({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <View
      style={{
        marginBottom: 20,
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
      }}
    >
      <View
        style={{
          maxWidth: '70%',
          padding: 15,
          borderRadius: 8,
          backgroundColor: isUser
            ? theme.pillBackgroundSelected
            : theme.tableBackground,
          border: `1px solid ${theme.pillBorder}`,
        }}
      >
        <View
          style={{
            marginBottom: 5,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontWeight: 600,
              color: isUser ? theme.pillTextHighlighted : theme.pageText,
            }}
          >
            {isUser ? 'You' : 'AI Assistant'}
          </Text>
          <Text
            style={{
              fontSize: 11,
              color: theme.pageTextSubdued,
              marginLeft: 10,
            }}
          >
            {new Date(message.timestamp).toLocaleTimeString()}
          </Text>
        </View>

        {/* Message attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <View style={{ marginBottom: 10 }}>
            {message.attachments.map(att => (
              <View key={att.id} style={{ marginBottom: 5 }}>
                {att.type === 'image' ? (
                  <img
                    src={`data:${att.mimeType};base64,${att.data}`}
                    alt={att.name}
                    style={{
                      maxWidth: '100%',
                      maxHeight: 300,
                      borderRadius: 4,
                    }}
                  />
                ) : (
                  <Text style={{ fontSize: 12, color: theme.pageTextSubdued }}>
                    📎 {att.name}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Message content */}
        <View>
          <Text
            style={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              color: theme.pageText,
            }}
          >
            {formatMessageContent(message.content)}
          </Text>
        </View>

        {/* Metadata */}
        {message.metadata && (
          <View style={{ marginTop: 10 }}>
            <Text
              style={{
                fontSize: 11,
                color: theme.pageTextSubdued,
              }}
            >
              {message.metadata.model && `Model: ${message.metadata.model}`}
              {message.metadata.tokens && ` • Tokens: ${message.metadata.tokens}`}
              {message.metadata.executionTime &&
                ` • Time: ${(message.metadata.executionTime / 1000).toFixed(2)}s`}
            </Text>
          </View>
        )}
      </View>

      {/* Visualizations */}
      {message.visualizations && message.visualizations.length > 0 && (
        <View style={{ marginTop: 10, width: '70%' }}>
          {message.visualizations.map(viz => (
            <VisualizationDisplay key={viz.id} visualization={viz} />
          ))}
        </View>
      )}
    </View>
  );
}

function formatMessageContent(content: string): React.ReactNode {
  // Basic markdown-like formatting
  // Code blocks
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      parts.push(content.substring(lastIndex, match.index));
    }

    // Add code block
    const language = match[1] || 'code';
    const code = match[2];
    parts.push(
      <View
        key={match.index}
        style={{
          marginTop: 10,
          marginBottom: 10,
          padding: 10,
          backgroundColor: theme.pillBackground,
          borderRadius: 4,
          fontFamily: 'monospace',
          fontSize: 13,
          overflowX: 'auto',
        }}
      >
        <Text style={{ color: theme.pageTextSubdued, fontSize: 11 }}>
          {language}
        </Text>
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{code}</pre>
      </View>,
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex));
  }

  return parts.length > 1 ? parts : content;
}
