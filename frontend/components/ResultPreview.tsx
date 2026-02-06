import { useState, useEffect } from 'react';
import { Copy, Check, Home } from 'lucide-react';
import { TagSelector } from './TagSelector';
import { saveDraftTags } from '../lib/api';

interface ResultPreviewProps {
  markdown: string;
  draftId: string;
  onReset: () => void;
  onGoHome: () => void;
}

export function ResultPreview({ markdown, draftId, onReset, onGoHome }: ResultPreviewProps) {
  const [copied, setCopied] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [isSavingTags, setIsSavingTags] = useState(false);

  // タグが変更されたら自動保存
  useEffect(() => {
    if (draftId && selectedTagIds.length >= 0) {
      const saveTagsDebounced = setTimeout(async () => {
        try {
          setIsSavingTags(true);
          await saveDraftTags(draftId, selectedTagIds);
        } catch (err) {
          console.error('Failed to save tags:', err);
        } finally {
          setIsSavingTags(false);
        }
      }, 500);

      return () => clearTimeout(saveTagsDebounced);
    }
  }, [selectedTagIds, draftId]);

  const handleCopy = async () => {
    try {
      // Modern Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(markdown);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement('textarea');
        textArea.value = markdown;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          document.execCommand('copy');
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (err) {
          console.error('Fallback copy failed:', err);
          alert('コピーに失敗しました。ブラウザが対応していない可能性があります。');
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (err) {
      console.error('Failed to copy:', err);
      // Additional fallback
      const textArea = document.createElement('textarea');
      textArea.value = markdown;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        console.error('All copy methods failed:', fallbackErr);
        alert('コピーに失敗しました。テキストを手動で選択してコピーしてください。');
      } finally {
        document.body.removeChild(textArea);
      }
    }
  };

  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, index) => {
      // H1
      if (line.startsWith('# ')) {
        return <h1 key={index} className="text-3xl font-bold text-theme-foreground mb-4">{line.slice(2)}</h1>;
      }
      // H2
      if (line.startsWith('## ')) {
        return <h2 key={index} className="text-xl font-semibold text-theme-foreground mt-8 mb-3">{line.slice(3)}</h2>;
      }
      // Italic
      if (line.startsWith('*') && line.endsWith('*') && !line.startsWith('**')) {
        return <p key={index} className="text-theme-foreground-muted italic mb-4">{line.slice(1, -1)}</p>;
      }
      // Horizontal Rule
      if (line.startsWith('---')) {
        return <hr key={index} className="my-8 border-theme-border" />;
      }
      // Empty line
      if (line.trim() === '') {
        return <div key={index} className="h-2" />;
      }
      // Regular paragraph
      return <p key={index} className="text-theme-foreground leading-relaxed mb-4">{line}</p>;
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-theme-bg">
      {/* Header */}
      <header className="bg-theme-surface border-b border-theme-border px-8 py-6 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-semibold text-theme-foreground">構造化された洞察</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={onGoHome}
              className="flex items-center gap-2 px-4 py-2 text-theme-foreground-muted hover:text-theme-foreground transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>ホームに戻る</span>
            </button>
            <button
              onClick={handleCopy}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${copied
                ? 'bg-[#7C9885] text-white'
                : 'bg-theme-primary text-theme-primary-foreground hover:opacity-90'
                }`}
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>コピーしました！</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  <span>Markdownをコピー</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Tag Selector */}
      <div className="bg-theme-surface border-b border-theme-border px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <TagSelector
            selectedTagIds={selectedTagIds}
            onTagsChange={setSelectedTagIds}
          />
          {isSavingTags && (
            <span className="text-xs text-theme-foreground-muted">保存中...</span>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full max-w-7xl mx-auto px-8 py-8">
          <div className="h-full grid md:grid-cols-2 gap-6">
            {/* Rendered Preview */}
            <div className="bg-theme-surface rounded-2xl border border-theme-border p-8 overflow-y-auto">
              <div className="prose prose-sm max-w-none text-theme-foreground">
                {renderMarkdown(markdown)}
              </div>
            </div>

            {/* Markdown Code View */}
            <div className="bg-[#2D2D2D] rounded-2xl p-8 overflow-y-auto">
              <div className="mb-4 text-[#A8A8A8] text-sm font-mono">Markdownソース</div>
              <pre className="text-[#E8E6E3] font-mono text-sm leading-relaxed whitespace-pre-wrap">
                {markdown}
              </pre>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}