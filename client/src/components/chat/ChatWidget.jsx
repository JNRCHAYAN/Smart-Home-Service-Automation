import { useState, useRef, useEffect, useCallback } from 'react';
import { useChatStore } from '../../store/chatStore.js';
import { useAuth } from '../../store/authStore.js';
import { chatApi } from '../../api/index.js';
import { toast } from '../../store/toastStore.js';
import Icon from '../common/Icon.jsx';
import Button from '../common/Button.jsx';
import Card from '../common/Card.jsx';
import { formatTime } from '../../utils/format.js';

export default function ChatWidget() {
  const { user, token } = useAuth();
  const { 
    conversations, 
    currentConversationId, 
    isOpen, 
    isMinimized, 
    streaming,
    createConversation,
    setCurrentConversation,
    addMessage,
    updateLastMessage,
    appendToLastMessage,
    setStreaming,
    toggleOpen,
    setOpen,
    toggleMinimize,
    clearConversation,
    getCurrentConversation
  } = useChatStore();

  const [input, setInput] = useState('');
  const [showQuickActions, setShowQuickActions] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const conv = getCurrentConversation();
  const messages = conv?.messages || [];

  useEffect(() => {
    if (isOpen && !currentConversationId && user) {
      createConversation(user.role);
    }
  }, [isOpen, currentConversationId, user, createConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || streaming || !currentConversationId) return;

    const userMessage = input.trim();
    setInput('');
    setShowQuickActions(false);

    addMessage(currentConversationId, { role: 'user', content: userMessage });

    try {
      setStreaming(true);
      await sendMessageStream(currentConversationId, userMessage);
    } catch (error) {
      console.error('Chat error:', error);
      updateLastMessage(currentConversationId, 'Sorry, something went wrong. Please try again.');
      toast.error('Failed to send message');
    } finally {
      setStreaming(false);
    }
  };

  const sendMessageStream = async (conversationId, userMessage) => {
    const conv = conversations[conversationId];
    const history = conv?.messages.slice(-10).map(m => ({
      role: m.role,
      content: m.content
    })) || [];

    const response = await chatApi.stream([
      ...history,
      { role: 'user', content: userMessage }
    ]);

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let assistantContent = '';
    let isFirstChunk = true;

    addMessage(conversationId, { role: 'assistant', content: '' });

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            
            if (parsed.type === 'content') {
              assistantContent += parsed.content;
              if (isFirstChunk) {
                updateLastMessage(conversationId, parsed.content);
                isFirstChunk = false;
              } else {
                appendToLastMessage(conversationId, parsed.content);
              }
            } else if (parsed.type === 'tool_call') {
              // Optional: show tool call indicator
            } else if (parsed.type === 'tool_result') {
              // Optional: show tool result
            } else if (parsed.type === 'done') {
              // Final message already streamed
            } else if (parsed.type === 'error') {
              throw new Error(parsed.error);
            }
          } catch (e) {
            // Ignore parse errors for non-JSON lines
          }
        }
      }
    }
  };

  const handleQuickAction = (action) => {
    setInput(action);
    handleSend(new Event('submit'));
  };

  if (!user || !token) return null;

  const quickActionsCustomer = [
    { label: 'Book AC Repair', action: 'I need AC repair in Dhanmondi tomorrow morning' },
    { label: 'Plumbing Issue', action: 'I have a leak in my bathroom, need a plumber urgently' },
    { label: 'Track My Request', action: 'Where is my technician? Show my latest request status' },
    { label: 'View Services', action: 'What services do you offer?' },
    { label: 'Pricing', action: 'How much does deep cleaning cost in Gulshan?' }
  ];

  const quickActionsProvider = [
    { label: 'Incoming Jobs', action: 'Show me new job requests' },
    { label: 'My Schedule', action: 'What\'s my schedule for tomorrow?' },
    { label: 'Update Availability', action: 'I want to block Friday 2-6pm' },
    { label: 'Earnings', action: 'How much did I earn this week?' }
  ];

  const quickActions = user.role === 'provider' ? quickActionsProvider : quickActionsCustomer;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && !isMinimized && (
        <Card className="w-[380px] h-[550px] max-h-[80vh] flex flex-col overflow-hidden shadow-xl animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-ink-100 bg-white">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
                <Icon name="bot" size={20} />
              </div>
              <div>
                <div className="font-bold text-ink-900">Servio AI</div>
                <div className="text-xs text-ink-400 capitalize">{user.role} assistant</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={toggleMinimize} icon="minimize" />
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)} icon="x" />
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={messagesEndRef}>
            {messages.map((msg, i) => (
              <MessageBubble key={i} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {showQuickActions && messages.length <= 1 && (
            <div className="px-4 pb-3 space-y-2 border-t border-ink-100">
              <p className="text-xs text-ink-400 px-2">Quick start:</p>
              <div className="flex flex-wrap gap-2">
                {quickActions.map((q, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="flex-1 min-w-[120px] justify-start text-left"
                    onClick={() => handleQuickAction(q.action)}
                  >
                    {q.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-ink-100 bg-white">
            <form onSubmit={handleSend} className="flex items-end gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message... (English or বাংলা)"
                className="flex-1 rounded-xl border border-ink-200 bg-ink-50 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                disabled={streaming}
                maxLength={2000}
              />
              <Button
                type="submit"
                loading={streaming}
                disabled={!input.trim() || streaming}
                icon="send"
                className="h-10"
              />
            </form>
            <p className="mt-2 text-xs text-ink-400 text-center">
              Powered by GitHub Models • Data stays local
            </p>
          </div>
        </Card>
      )}

      {/* Floating Button */}
      {!isOpen || isMinimized ? (
        <Button
          onClick={toggleOpen}
          className="h-14 w-14 rounded-full p-0 shadow-xl hover:scale-105 transition-transform"
          aria-label={isMinimized ? 'Open chat' : 'Open Servio AI'}
        >
          <Icon name={isMinimized ? 'bot' : 'message-square'} size={24} className="text-white" />
        </Button>
      ) : null}

      <style jsx>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
      `}</style>
    </div>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  const isTool = message.role === 'tool';
  
  if (isTool) return null; // Hide tool messages from UI

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
        isUser 
          ? 'bg-brand-600 text-white rounded-tr-sm' 
          : 'bg-ink-100 text-ink-900 rounded-tl-sm'
      }`}>
        <div className="whitespace-pre-wrap text-sm leading-relaxed">
          {message.content}
        </div>
        <div className={`mt-1 text-xs ${isUser ? 'text-brand-100' : 'text-ink-400'} text-right`}>
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
}