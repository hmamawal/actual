// @ts-strict-ignore
import React from 'react';

import { theme } from '@actual-app/components/theme';
import type { ChatSession } from 'loot-core/src/types/models/ai-chat';

import { Button } from '@desktop-client/components/common/Button2';
import { View } from '@desktop-client/components/common/View';
import { Text } from '@desktop-client/components/common/Text';

type ChatSessionListProps = {
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
};

export function ChatSessionList({
  sessions,
  currentSession,
  onSelectSession,
  onDeleteSession,
}: ChatSessionListProps) {
  return (
    <View
      style={{
        flex: 1,
        overflowY: 'auto',
      }}
    >
      {sessions.map(session => (
        <View
          key={session.id}
          style={{
            padding: 10,
            cursor: 'pointer',
            backgroundColor:
              session.id === currentSession?.id
                ? theme.pillBackgroundSelected
                : 'transparent',
            borderBottom: `1px solid ${theme.pillBorder}`,
            ':hover': {
              backgroundColor: theme.pillBackground,
            },
          }}
          onClick={() => onSelectSession(session.id)}
        >
          <View
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: session.id === currentSession?.id ? 600 : 400,
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {session.title}
            </Text>
            <Button
              variant="bare"
              onClick={e => {
                e.stopPropagation();
                if (confirm('Delete this chat session?')) {
                  onDeleteSession(session.id);
                }
              }}
              style={{ padding: 5 }}
            >
              🗑️
            </Button>
          </View>
          <Text
            style={{
              fontSize: 11,
              color: theme.pageTextSubdued,
              marginTop: 3,
            }}
          >
            {session.messages.length} messages •{' '}
            {new Date(session.updatedAt).toLocaleDateString()}
          </Text>
        </View>
      ))}

      {sessions.length === 0 && (
        <View
          style={{
            padding: 20,
            textAlign: 'center',
          }}
        >
          <Text style={{ color: theme.pageTextSubdued }}>
            No chat sessions yet
          </Text>
        </View>
      )}
    </View>
  );
}
