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
  categoryName: string;
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

  const progress = ((currentQuestion + 1) / totalQuestions) * 100;

  const categoryTitles = {
    academic: '学術論文',
    technical: '技術書',
    custom: categoryName || 'カスタムノート'
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-[#D4D1CC]">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-[#2D2D2D]">
              Socratic Drafting Wizard
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-[#6B6560]">
                {categoryTitles[category as keyof typeof categoryTitles]}
              </span>
              <button
                onClick={onGoHome}
                className="flex items-center gap-2 px-4 py-2 text-[#6B6560] hover:text-[#2D2D2D] transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>ホーム</span>
              </button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#6B6560]">
                ステップ {currentQuestion + 1} / {totalQuestions}
              </span>
              <span className="text-[#8B8680] font-medium">{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-1.5 bg-[#E8E6E3] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#8B8680] transition-all duration-300 ease-out rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Chat Messages */}
      <main className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-6 py-4 ${
                  message.type === 'system'
                    ? 'bg-[#E8E6E3] text-[#2D2D2D]'
                    : 'bg-white border border-[#D4D1CC] text-[#2D2D2D]'
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
      <div className="bg-white border-t border-[#D4D1CC] px-8 py-6">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => setIsComposing(false)}
                placeholder="ここにあなたの考えを入力してください..."
                className="w-full px-4 py-3 border border-[#D4D1CC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B8680] focus:border-transparent resize-none min-h-[52px] max-h-[200px]"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              <div className="absolute bottom-2 right-2 text-xs text-[#A8A8A8]">
                {inputValue.length} 文字
              </div>
            </div>
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="px-6 py-3 bg-[#8B8680] text-white rounded-xl hover:bg-[#6B6560] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
            >
              <span>送信</span>
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-[#A8A8A8] mt-2">
            Enterで送信、Shift+Enterで改行
          </p>
        </form>
      </div>
    </div>
  );
}