import { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../../store/chatStore.js';
import { useAuth } from '../../store/authStore.js';
import { chatApi } from '../../api/index.js';
import { toast } from '../../store/toastStore.js';
import Icon from '../common/Icon.jsx';
import Button from '../common/Button.jsx';
import { cn } from '../../utils/cn.js';
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
    addMessage,
    updateLastMessage,
    appendToLastMessage,
    setStreaming,
    toggleOpen,
    setOpen,
    toggleMinimize
  } = useChatStore();

  const [input, setInput] = useState('');
  const [showQuickActions, setShowQuickActions] = useState(true);
  const scrollRef = useRef(null);

  const conv = currentConversationId ? conversations[currentConversationId] : null;
  const messages = conv?.messages || [];

  useEffect(() => {
    if (isOpen && !currentConversationId && user) {
      createConversation(user.role);
    }
  }, [isOpen, currentConversationId, user, createConversation]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  const handleSend = async (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || streaming || !currentConversationId) return;

    setInput('');
    setShowQuickActions(false);
    addMessage(currentConversationId, { role: 'user', content: text });

    try {
      setStreaming(true);
      await sendMessageStream(currentConversationId, text);
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
    const history = (conv?.messages || []).slice(-10).map((m) => ({ role: m.role, content: m.content }));
    const response = await chatApi.stream([...history, { role: 'user', content: userMessage }]);

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let isFirstChunk = true;

    addMessage(conversationId, { role: 'assistant', content: '' });

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6);
        if (data === '[DONE]') continue;

        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch {
          continue;
        }

        if (parsed.type === 'content') {
          if (isFirstChunk) {
            updateLastMessage(conversationId, parsed.content);
            isFirstChunk = false;
          } else {
            appendToLastMessage(conversationId, parsed.content);
          }
        } else if (parsed.type === 'error') {
          throw new Error(parsed.error);
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
    { label: 'Book AC repair', action: 'I need AC repair in Dhanmondi tomorrow morning' },
    { label: 'Plumbing issue', action: 'I have a leak in my bathroom, need a plumber urgently' },
    { label: 'Track my request', action: 'Where is my technician? Show my latest request status' },
    { label: 'View services', action: 'What services do you offer?' },
    { label: 'Pricing', action: 'How much does deep cleaning cost in Gulshan?' }
  ];

  const quickActionsProvider = [
    { label: 'Incoming jobs', action: 'Show me new job requests' },
    { label: 'My schedule', action: "What's my schedule for tomorrow?" },
    { label: 'Update availability', action: 'I want to block Friday 2-6pm' },
    { label: 'Earnings', action: 'How much did I earn this week?' }
  ];

  const quickActions = user.role === 'provider' ? quickActionsProvider : quickActionsCustomer;

  return (
    <div className="fixed bottom-0 right-0 z-50 flex flex-col items-end sm:bottom-4 sm:right-4">
      {isOpen && !isMinimized && (
        <div className="flex h-[min(38rem,calc(100dvh-2rem))] w-full animate-pop-in flex-col overflow-hidden border border-line bg-surface shadow-pop sm:w-[26rem] sm:rounded-2xl">
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line bg-surface px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white">
                <Icon name="bot" size={20} aria-hidden="true" />
              </span>
              <div>
                <div className="font-heading text-sm font-bold text-fg">Servio AI</div>
                <div className="flex items-center gap-1.5 text-xs text-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
                  {user.role} assistant
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <IconButton label="Minimise chat" icon="minimize" onClick={toggleMinimize} />
              <IconButton label="Close chat" icon="x" onClick={() => setOpen(false)} />
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4" aria-live="polite">
            {messages.map((msg, i) => (
              <MessageBubble key={i} message={msg} />
            ))}
            {streaming && (
              <div className="flex items-center gap-2 pl-1 text-xs text-faint" aria-hidden="true">
                <Icon name="loader" size={14} className="animate-spin" />
                Thinking…
              </div>
            )}
            <div ref={scrollRef} className="h-px" aria-hidden="true" />
          </div>

          {/* Quick actions */}
          {showQuickActions && messages.length <= 1 && (
            <div className="shrink-0 border-t border-line px-4 py-3">
              <p className="mb-2 px-1 text-xs font-semibold text-faint">Quick start</p>
              <div className="flex flex-wrap gap-2">
                {quickActions.map((q, i) => (
                  <Button
                    key={q.label + i}
                    variant="outline"
                    size="sm"
                    className="min-w-[8.5rem] flex-1 justify-start"
                    onClick={() => handleQuickAction(q.action)}
                  >
                    {q.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="shrink-0 border-t border-line bg-surface px-3 py-3">
            <form onSubmit={handleSend} className="flex items-end gap-2">
              <label htmlFor="servio-chat-input" className="sr-only">
                Message Servio AI
              </label>
              <input
                id="servio-chat-input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message… (English or Bangla)"
                className="h-10 min-w-0 flex-1 rounded-lg border border-line bg-surface px-3.5 text-sm text-fg placeholder:text-faint transition-shadow focus:border-brand focus:shadow-glow focus:outline-none"
                disabled={streaming}
                maxLength={2000}
              />
              <Button
                type="submit"
                size="md"
                loading={streaming}
                disabled={!input.trim() || streaming}
                icon="send"
                aria-label="Send message"
              />
            </form>
            <p className="mt-2 text-center text-[11px] text-faint">Powered by DeepSeek</p>
          </div>
        </div>
      )}

      {(!isOpen || isMinimized) && (
        <Button
          onClick={toggleOpen}
          className="m-3 h-14 w-14 rounded-full p-0 shadow-pop sm:m-0"
          aria-label={isMinimized ? 'Open Servio AI chat' : 'Open Servio AI chat'}
        >
          <Icon name={isMinimized ? 'bot' : 'messagesquare'} size={24} aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}

function IconButton({ label, icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-faint transition-colors hover:bg-inset hover:text-fg"
    >
      <Icon name={icon} size={18} aria-hidden="true" />
    </button>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  if (!['user', 'assistant'].includes(message.role)) return null;

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-3.5 py-2.5',
          isUser ? 'rounded-br-md bg-brand text-white' : 'rounded-bl-md bg-inset text-fg'
        )}
      >
        <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>
        <div
          className={cn(
            'mt-1 text-right text-[10px]',
            isUser ? 'text-white/70' : 'text-faint'
          )}
        >
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
}
