import { useState, useRef, useEffect } from 'react';
import { Send, Home } from 'lucide-react';

interface Message {
  type: 'system' | 'user';
  content: string;
}

interface ChatInterfaceProps {
  messages: Message[];
  currentQuestion: number;
  totalQuestions: number;
  onSendMessage: (message: string) => void;
  category: string;
  categoryName?: string;
  onGoHome: () => void;
}

export function ChatInterface({
  messages,
  currentQuestion,
  totalQuestions,
  onSendMessage,
  category,
  categoryName,
  onGoHome
}: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [inputValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const progress = (currentQuestion / totalQuestions) * 100;

  const categoryTitles = {
    academic: '学術論文',
    technical: '技術書',
    custom: categoryName || 'カスタムノート'
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-theme-bg">
      {/* Header */}
      <header className="bg-theme-surface border-b border-theme-border sticky top-0 z-30 shadow-sm">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-theme-foreground">
              Socratic Drafting Wizard
            </h1>
            <div className="flex items-center gap-4">

              <button
                onClick={onGoHome}
                className="flex items-center gap-2 px-4 py-2 text-theme-foreground-muted hover:text-theme-foreground transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>ホーム</span>
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-theme-foreground-muted">
                ステップ {currentQuestion + 1} / {totalQuestions}
              </span>
              <span className="text-theme-primary font-medium">{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-1.5 bg-theme-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-theme-primary transition-all duration-300 ease-out rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Chat Messages */}
      <main className="flex-1 overflow-y-auto px-8 py-8 bg-theme-bg">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-6 py-4 ${message.type === 'system'
                  ? 'bg-theme-muted text-theme-foreground'
                  : 'bg-theme-surface border border-theme-border text-theme-foreground'
                  }`}
              >
                <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <div className="bg-theme-surface border-t border-theme-border px-8 py-8">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="flex items-end gap-4">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => setIsComposing(false)}
                placeholder="ここにあなたの考えを入力してください..."
                className="w-full px-4 py-3 bg-theme-bg border border-theme-border rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-transparent resize-none min-h-[52px] max-h-[200px] text-theme-foreground placeholder:text-theme-muted-foreground"
                rows={1}
                maxLength={3000}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              <div className="absolute bottom-2 right-2 text-xs text-theme-muted-foreground">
                <span className={inputValue.length > 2700 ? "text-theme-error font-medium" : ""}>
                  {inputValue.length}
                </span>
                <span className="opacity-70"> / 3000</span>
              </div>
            </div>
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="px-6 py-3 bg-theme-primary text-theme-primary-foreground rounded-xl hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
            >
              <span>送信</span>
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs font-medium text-theme-foreground-muted bg-theme-muted px-2 py-1 rounded">
              {categoryTitles[category as keyof typeof categoryTitles]}
            </span>
            <p className="text-xs text-theme-muted-foreground">
              Enterで送信、Shift+Enterで改行
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}