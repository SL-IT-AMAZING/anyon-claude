import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minimize2, Send, Bot, User, AlertCircle, RefreshCw } from '@/lib/icons';
import { SUPPORT_CONFIG } from '@/constants/support';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useChatHistory, type Message } from '@/hooks/useChatHistory';
import { streamSupportMessage } from '@/lib/api/support-chat';

// 토큰 제한 에러 감지 함수
function isTokenLimitError(errorMessage: string): boolean {
  const msg = errorMessage.toLowerCase();
  return (msg.includes('exceeded') && (msg.includes('token') || msg.includes('output'))) ||
         msg.includes('max_tokens') ||
         msg.includes('token limit');
}

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AIChatModal({ isOpen, onClose }: AIChatModalProps) {
  const { messages, addMessage, updateMessage } = useChatHistory();
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenLimitError, setTokenLimitError] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // 자동 스크롤
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom();
    }
  }, [messages, isAtBottom, scrollToBottom]);

  // 스크롤 위치 추적
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setIsAtBottom(scrollHeight - scrollTop - clientHeight < 50);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // 모달 열릴 때 입력창 포커스
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // ESC로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSend = async (overrideContent?: string) => {
    const content = (overrideContent ?? inputValue).trim();
    if (!content || isLoading) return;

    if (!overrideContent) {
      setInputValue('');
    }
    setError(null);
    setTokenLimitError(false);
    setIsLoading(true);

    // 사용자 메시지 추가
    const userMessage = addMessage({ role: 'user', content });

    // 빈 어시스턴트 메시지 추가 (스트리밍용)
    const assistantMessage = addMessage({
      role: 'assistant',
      content: '',
      isStreaming: true,
    });

    try {
      const allMessages = [
        ...messages,
        userMessage,
      ].map((m) => ({ role: m.role, content: m.content }));

      let fullContent = '';
      for await (const chunk of streamSupportMessage(allMessages)) {
        fullContent += chunk;
        updateMessage(assistantMessage.id, { content: fullContent });
      }
      updateMessage(assistantMessage.id, { isStreaming: false });
    } catch (err) {
      console.error('[AIChatModal] Error:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      const isTokenError = isTokenLimitError(errorMessage);

      updateMessage(assistantMessage.id, {
        content: isTokenError
          ? '응답이 너무 길어 중단되었습니다.'
          : '죄송해요, 오류가 발생했어요. 다시 시도해주세요.',
        isStreaming: false,
        isError: true,
      });

      if (isTokenError) {
        setTokenLimitError(true);
        setError('출력 토큰 제한을 초과했습니다.');
      } else {
        setTokenLimitError(false);
        setError('메시지 전송에 실패했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // "이어서 하기" 버튼 클릭 핸들러
  const handleContinue = () => {
    handleSend('이어서 해줘');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="fixed z-50 flex flex-col overflow-hidden rounded-xl border border-border bg-background shadow-2xl"
        style={{
          width: SUPPORT_CONFIG.UI.MODAL_WIDTH,
          height: SUPPORT_CONFIG.UI.MODAL_HEIGHT,
          bottom: SUPPORT_CONFIG.UI.FLOATING_BUTTON_OFFSET + SUPPORT_CONFIG.UI.FLOATING_BUTTON_SIZE + 16,
          right: SUPPORT_CONFIG.UI.FLOATING_BUTTON_OFFSET,
        }}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-3">
          <div className="flex items-center gap-2">
            <Bot size={20} className="text-primary" />
            <span className="font-medium">AI 서포트</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onClose}
              className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="최소화"
            >
              <Minimize2 size={16} />
            </button>
            <button
              onClick={onClose}
              className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="닫기"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* 메시지 영역 */}
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto p-4"
        >
          {/* 웰컴 메시지 (대화가 없을 때) */}
          {messages.length === 0 && (
            <div className="mb-4 rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
              {SUPPORT_CONFIG.AI_CHAT.WELCOME_MESSAGE}
            </div>
          )}

          {/* 메시지 목록 */}
          <div className="space-y-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
          </div>

          {/* 새 메시지 스크롤 버튼 */}
          {!isAtBottom && messages.length > 0 && (
            <button
              onClick={scrollToBottom}
              className="sticky bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground shadow-lg"
            >
              ↓ 새 메시지
            </button>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 에러 메시지 */}
        {error && (
          tokenLimitError ? (
            <div className="flex items-center justify-between gap-2 border-t border-amber-500/20 bg-amber-500/10 px-4 py-2 text-sm text-amber-600 dark:text-amber-400">
              <div className="flex items-center gap-2">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleContinue}
                disabled={isLoading}
                className="h-7 border-amber-500/30 hover:bg-amber-500/10"
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                이어서 하기
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 border-t border-destructive/20 bg-destructive/10 px-4 py-2 text-sm text-destructive">
              <AlertCircle size={14} />
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-xs underline"
              >
                닫기
              </button>
            </div>
          )
        )}

        {/* 입력 영역 */}
        <div className="border-t border-border p-3">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="메시지를 입력하세요..."
              className="max-h-24 min-h-[40px] flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              rows={1}
              disabled={isLoading}
            />
            <button
              onClick={() => handleSend()}
              disabled={!inputValue.trim() || isLoading}
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
                inputValue.trim() && !isLoading
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-muted text-muted-foreground'
              )}
              aria-label="전송"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// 개별 메시지 컴포넌트
function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex gap-2',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      <div
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
        )}
      >
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>
      <div
        className={cn(
          'max-w-[80%] rounded-lg px-3 py-2 text-sm',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground',
          message.isError && 'bg-destructive/10 text-destructive'
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        {message.isStreaming && (
          <span className="ml-1 inline-block h-4 w-1 animate-pulse bg-current" />
        )}
      </div>
    </div>
  );
}
