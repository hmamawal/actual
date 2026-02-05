import React, { useEffect, useRef, useState } from 'react';
import { Trans } from 'react-i18next';


import { styles } from '@actual-app/components/styles';
import { View } from '@actual-app/components/view';

type Message = {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
};

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatBoxRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (inputValue.trim() === '') return;

    // Add user message
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      content: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Simulate bot response after a short delay
    setTimeout(() => {
      const botMessage: Message = {
        id: `msg-${Date.now()}-bot`,
        content: 'test working',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
    }, 300);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
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
    const handleMouseMove = (e: MouseEvent) => {
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
            userSelect: 'none',
            cursor: isDragging ? 'grabbing' : 'grab',
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px',
              backgroundColor: '#2563eb',
              color: 'white',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'grab',
            }}
            onMouseDown={e => {
              handleMouseDown(e);
            }}
          >
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
              AI Assistant
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              type="button"
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

          {/* Messages Container */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              backgroundColor: '#f9fafb',
            }}
          >
            {messages.length === 0 && (
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
                Start a conversation! Ask me anything.
              </div>
            )}

            {messages.map(message => (
              <div
                key={message.id}
                style={{
                  display: 'flex',
                  justifyContent:
                    message.sender === 'user' ? 'flex-end' : 'flex-start',
                  marginBottom: '4px',
                }}
              >
                <div
                  style={{
                    maxWidth: '80%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    backgroundColor:
                      message.sender === 'user' ? '#2563eb' : '#e5e7eb',
                    color: message.sender === 'user' ? 'white' : '#1f2937',
                    fontSize: '14px',
                    wordWrap: 'break-word',
                    lineHeight: '1.4',
                  }}
                >
                  {message.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div
            style={{
              padding: '12px',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              gap: '8px',
              backgroundColor: 'white',
              borderBottomLeftRadius: '16px',
              borderBottomRightRadius: '16px',
            }}
          >
            <textarea
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
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
              }}
              rows={1}
            />
            <button
              onClick={handleSendMessage}
              type="button"
              style={{
                padding: '10px 16px',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                transition: 'background-color 0.2s',
                flexShrink: 0,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = '#1d4ed8';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = '#2563eb';
              }}
            ><Trans>
              Send
            </Trans></button>
          </div>
        </div>
      )}
    </>
  );
}
