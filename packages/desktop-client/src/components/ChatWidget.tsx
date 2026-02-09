import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { MarkdownMessage } from './MarkdownMessage';

import { useBudgetContext } from '@desktop-client/hooks/useBudgetContext';
import { buildChatMessagesWithBudgetContext } from '@desktop-client/services/budgetContextService';
import {
  createConversation,
  deleteConversation,
  generateConversationTitle,
  loadConversations,
  saveConversations,
  sortConversationsByRecent,
  updateConversation,
  type ChatConversation,
} from '@desktop-client/services/chatHistoryService';
import {
  formatSearchResultsForAI,
  formatSearchResultsForChat,
  isSearchConfigured,
  searchWeb,
} from '@desktop-client/services/googleSearchService';
import {
  sendChatMessage,
  type ChatMessage,
} from '@desktop-client/services/openaiService';

type Message = {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
};

type ContextMenuState = {
  x: number;
  y: number;
} | null;

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [currentConversation, setCurrentConversation] =
    useState<ChatConversation | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatBoxRef = useRef<HTMLDivElement>(null);

  // Get current budget context for AI awareness
  const budgetContext = useBudgetContext();
  const { t } = useTranslation();

  // Load conversations on mount
  useEffect(() => {
    const loaded = loadConversations();
    setConversations(sortConversationsByRecent(loaded));

    // Start with a new conversation if none exist
    if (loaded.length === 0) {
      const newConv = createConversation();
      setCurrentConversation(newConv);
    } else {
      // Load the most recent conversation
      setCurrentConversation(loaded[0]);
    }
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation?.messages]);

  // Save conversations whenever they change
  useEffect(() => {
    if (conversations.length > 0) {
      saveConversations(conversations);
    }
  }, [conversations]);

  const handleStartNewChat = () => {
    const newConv = createConversation();
    setCurrentConversation(newConv);
    setConversations(prev => [newConv, ...prev]);
    setShowHistory(false);
  };

  const handleSelectConversation = (conv: ChatConversation) => {
    setCurrentConversation(conv);
    setShowHistory(false);
  };

  const handleDeleteConversation = (convId: string) => {
    const updated = deleteConversation(conversations, convId);
    setConversations(updated);

    if (currentConversation?.id === convId) {
      // Create a new conversation if we deleted the current one
      const newConv = createConversation();
      setCurrentConversation(newConv);
      setConversations(prev => [newConv, ...prev]);
    }
  };

  const handleSendMessage = async () => {
    if (inputValue.trim() === '' || !currentConversation) return;

    const userInputContent = inputValue.trim();

    // Add user message
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      content: userInputContent,
      sender: 'user',
      timestamp: new Date(),
    };

    const newMessages = [...currentConversation.messages, userMessage];

    // Update conversation title if this is the first message
    let updatedTitle = currentConversation.title;
    if (currentConversation.messages.length === 0) {
      updatedTitle = generateConversationTitle(userInputContent);
    }

    const updatedConv = updateConversation(currentConversation, {
      messages: newMessages,
      title: updatedTitle,
    });

    setCurrentConversation(updatedConv);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      // Check for /search command
      const searchMatch = userInputContent.match(/^\/search\s+(.+)$/i);
      
      if (searchMatch) {
        // Handle web search
        if (!isSearchConfigured()) {
          throw new Error(
            'Web search is not configured. Please add VITE_GOOGLE_API_KEY and VITE_GOOGLE_SEARCH_ENGINE_ID to your .env.local file.',
          );
        }

        const searchQuery = searchMatch[1];
        const searchResults = await searchWeb(searchQuery, 5);
        
        // Format results for chat display
        const searchResultsText = formatSearchResultsForChat(
          searchResults,
          searchQuery,
        );

        const botMessage: Message = {
          id: `msg-${Date.now()}-bot`,
          content: searchResultsText,
          sender: 'bot',
          timestamp: new Date(),
        };

        const finalConv = updateConversation(updatedConv, {
          messages: [...newMessages, botMessage],
        });

        setCurrentConversation(finalConv);

        // Update in conversations list
        setConversations(prev => {
          const filtered = prev.filter(c => c.id !== finalConv.id);
          return sortConversationsByRecent([finalConv, ...filtered]);
        });
      } else {
        // Normal AI chat flow
        // Convert messages to OpenAI format
        const chatMessages: ChatMessage[] = newMessages.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.content,
        }));

        // Add budget context only if not already sent (saves tokens!)
        const messagesWithContext = buildChatMessagesWithBudgetContext(
          chatMessages,
          budgetContext,
          updatedConv.budgetContextSent,
        );

        // Get response from OpenAI
        const response = await sendChatMessage(messagesWithContext);

        const botMessage: Message = {
          id: `msg-${Date.now()}-bot`,
          content: response,
          sender: 'bot',
          timestamp: new Date(),
        };

        const finalConv = updateConversation(updatedConv, {
          messages: [...newMessages, botMessage],
          budgetContextSent: true, // Mark context as sent
        });

        setCurrentConversation(finalConv);

        // Update in conversations list
        setConversations(prev => {
          const filtered = prev.filter(c => c.id !== finalConv.id);
          return sortConversationsByRecent([finalConv, ...filtered]);
        });
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to get response from AI';
      setError(errorMessage);
      console.error('Chat error:', err);

      // Add error message to chat
      const errorBot: Message = {
        id: `msg-${Date.now()}-error`,
        content: `Error: ${errorMessage}`,
        sender: 'bot',
        timestamp: new Date(),
      };

      const errorConv = updateConversation(updatedConv, {
        messages: [...newMessages, errorBot],
      });
      setCurrentConversation(errorConv);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyAllMessages = () => {
    if (!currentConversation?.messages) return;

    const allMessages = currentConversation.messages
      .map(msg => {
        const senderLabel = msg.sender === 'user' ? 'You' : 'AI Assistant';
        return `${senderLabel}: ${msg.content}`;
      })
      .join('\n\n');

    navigator.clipboard.writeText(allMessages).then(() => {
      setContextMenu(null);
      console.log('All messages copied to clipboard');
    });
  };

  const handleMessagesContextMenu = (e: any) => {
    e.preventDefault();
    if (
      currentConversation?.messages &&
      currentConversation.messages.length > 0
    ) {
      setContextMenu({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (chatBoxRef.current && chatBoxRef.current.contains(e.target as Node)) {
      const header = chatBoxRef.current.querySelector('div');
      // Only allow dragging from the header
      if (header && header.contains(e.target as Node)) {
        const rect = chatBoxRef.current.getBoundingClientRect();
        setIsDragging(true);
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: globalThis.MouseEvent) => {
      if (isDragging && chatBoxRef.current) {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const boxWidth = chatBoxRef.current.offsetWidth;
        const boxHeight = chatBoxRef.current.offsetHeight;

        const newX = Math.max(
          0,
          Math.min(viewportWidth - boxWidth, e.clientX - dragOffset.x),
        );
        const newY = Math.max(
          0,
          Math.min(viewportHeight - boxHeight, e.clientY - dragOffset.y),
        );

        setPosition({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // Close context menu on outside click
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(null);
    };

    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [contextMenu]);

  return (
    <>
      {/* Floating Chat Icon */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          type="button"
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: '#2563eb',
            border: 'none',
            color: 'white',
            fontSize: '24px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            zIndex: 999,
          }}
          onMouseEnter={e => {
            const btn = e.currentTarget;
            btn.style.transform = 'scale(1.1)';
            btn.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
          }}
          onMouseLeave={e => {
            const btn = e.currentTarget;
            btn.style.transform = 'scale(1)';
            btn.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
          }}
        >
          💬
        </button>
      )}

      {/* Floating Chat Box */}
      {isOpen && (
        <>
          <div
            ref={chatBoxRef}
            onMouseDown={handleMouseDown}
            style={{
              position: 'fixed',
              left: position ? `${position.x}px` : 'auto',
              top: position ? `${position.y}px` : 'auto',
              right: !position ? '20px' : 'auto',
              bottom: !position ? '80px' : 'auto',
              width: '360px',
              height: '500px',
              backgroundColor: 'white',
              borderRadius: '16px',
              boxShadow: '0 5px 40px rgba(0, 0, 0, 0.16)',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 999,
              cursor: isDragging ? 'grabbing' : 'grab',
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: '#2563eb',
                color: 'white',
                borderTopLeftRadius: '16px',
                borderTopRightRadius: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'grab',
                gap: '8px',
                userSelect: 'none',
              }}
              onMouseDown={e => {
                handleMouseDown(e);
              }}
            >
              <button
                onClick={() => setShowHistory(!showHistory)}
                type="button"
                title={t('Chat History')}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: 'white',
                  fontSize: '18px',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                ☰
              </button>
              <h3
                style={{
                  margin: 0,
                  fontSize: '14px',
                  fontWeight: 600,
                  flex: 1,
                  textAlign: 'center',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {currentConversation?.title || 'AI Assistant'}
              </h3>
              <button
                onClick={handleStartNewChat}
                type="button"
                title={t('New Chat')}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: 'white',
                  fontSize: '18px',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                +
              </button>
              <button
                onClick={() => setIsOpen(false)}
                type="button"
                title={t('Close')}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: 'white',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '0',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>

            {/* Main Content Area */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              {/* History Sidebar */}
              {showHistory && (
                <div
                  style={{
                    width: '200px',
                    borderRight: '1px solid #e5e7eb',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: '#ffffff',
                  }}
                >
                  <div
                    style={{
                      padding: '12px',
                      borderBottom: '1px solid #e5e7eb',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#6b7280',
                    }}
                  >
                    <Trans>Chat History</Trans>
                  </div>
                  <div
                    style={{
                      flex: 1,
                      overflowY: 'auto',
                      padding: '8px',
                    }}
                  >
                    {conversations.map(conv => (
                      <div
                        key={conv.id}
                        onClick={() => handleSelectConversation(conv)}
                        style={{
                          padding: '8px',
                          marginBottom: '4px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          backgroundColor:
                            currentConversation?.id === conv.id
                              ? '#dbeafe'
                              : 'transparent',
                          border:
                            currentConversation?.id === conv.id
                              ? '1px solid #2563eb'
                              : '1px solid transparent',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                        onMouseEnter={e => {
                          if (currentConversation?.id !== conv.id) {
                            e.currentTarget.style.backgroundColor = '#f3f4f6';
                          }
                        }}
                        onMouseLeave={e => {
                          if (currentConversation?.id !== conv.id) {
                            e.currentTarget.style.backgroundColor =
                              'transparent';
                          }
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: '12px',
                              fontWeight: 500,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              color: '#1f2937',
                            }}
                          >
                            {conv.title}
                          </div>
                          <div
                            style={{
                              fontSize: '10px',
                              color: '#9ca3af',
                              marginTop: '2px',
                            }}
                          >
                            {new Date(conv.updatedAt).toLocaleDateString()}
                          </div>
                        </div>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleDeleteConversation(conv.id);
                          }}
                          type="button"
                          style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            fontSize: '14px',
                            padding: '4px',
                          }}
                          title={t('Delete')}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages Container */}
              <div
                onContextMenu={handleMessagesContextMenu}
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  backgroundColor: '#f9fafb',
                  userSelect: 'text',
                  position: 'relative',
                }}
              >
                {currentConversation?.messages.length === 0 && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      color: '#9ca3af',
                      fontSize: '14px',
                      textAlign: 'center',
                      padding: '20px',
                    }}
                  >
                    Hi! 👋 I have access to your budget data.
                    <br />
                    Ask me questions about your accounts, categories, or
                    finances!
                    <br />
                    <br />
                    {isSearchConfigured() && (
                      <>
                        💡 Use <strong>/search [query]</strong> to search the web
                        <br />
                      </>
                    )}
                  </div>
                )}

                {currentConversation?.messages.map(message => (
                  <div
                    key={message.id}
                    style={{
                      display: 'flex',
                      justifyContent:
                        message.sender === 'user' ? 'flex-end' : 'flex-start',
                      marginBottom: '4px',
                      userSelect: 'text',
                    }}
                  >
                    <MarkdownMessage
                      content={message.content}
                      sender={message.sender}
                    />
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Area */}
            <div
              style={{
                padding: '12px',
                borderTop: '1px solid #e5e7eb',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                backgroundColor: 'white',
                borderBottomLeftRadius: '16px',
                borderBottomRightRadius: '16px',
                userSelect: 'none',
              }}
            >
              {error && (
                <div
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#fee2e2',
                    color: '#991b1b',
                    borderRadius: '6px',
                    fontSize: '12px',
                    lineHeight: '1.4',
                  }}
                >
                  {error}
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px' }}>
                <textarea
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    isLoading
                      ? 'Waiting for response...'
                      : 'Type your message...'
                  }
                  disabled={isLoading}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily:
                      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    resize: 'none',
                    maxHeight: '80px',
                    opacity: isLoading ? 0.6 : 1,
                    cursor: isLoading ? 'not-allowed' : 'text',
                  }}
                  rows={1}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading}
                  type="button"
                  style={{
                    padding: '10px 16px',
                    backgroundColor: isLoading ? '#9ca3af' : '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    transition: 'background-color 0.2s',
                    flexShrink: 0,
                    opacity: isLoading ? 0.7 : 1,
                  }}
                  onMouseEnter={e => {
                    if (!isLoading) {
                      e.currentTarget.style.backgroundColor = '#1d4ed8';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isLoading) {
                      e.currentTarget.style.backgroundColor = '#2563eb';
                    }
                  }}
                >
                  {isLoading ? '...' : <Trans>Send</Trans>}
                </button>
              </div>
            </div>
          </div>

          {/* Context Menu */}
          {contextMenu && (
            <div
              style={{
                position: 'fixed',
                left: `${contextMenu.x}px`,
                top: `${contextMenu.y}px`,
                backgroundColor: 'white',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                zIndex: 1000,
                minWidth: '180px',
                userSelect: 'none',
              }}
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={handleCopyAllMessages}
                type="button"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#1f2937',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                📋 Copy All Messages
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
