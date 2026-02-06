import { useState, useEffect } from 'react';
import { BookOpen, Code, Lightbulb, Settings, Folder } from 'lucide-react';
import { ThemeSelector } from './ThemeSelector';
import { fetchTemplates, Category } from '../lib/api';

interface HomePageProps {
  onSelectCategory: (category: string) => void;
  onCustomize: () => void;
}

// デフォルトカテゴリのアイコンマッピング
const categoryIcons: Record<string, typeof BookOpen> = {
  academic: BookOpen,
  technical: Code,
  custom: Lightbulb,
};

export function HomePage({ onSelectCategory, onCustomize }: HomePageProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setIsLoading(true);
        const response = await fetchTemplates();
        setCategories(response.categories);
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadCategories();
  }, []);

  const getIcon = (categoryId: string) => categoryIcons[categoryId] || Folder;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="py-6 px-8 border-b border-theme-border bg-theme-surface flex items-center justify-between">
        <h1 className="text-xl font-semibold text-theme-foreground">Socratic Drafting Wizard</h1>
        <ThemeSelector />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-8 py-16">
        <div className="max-w-5xl w-full">
          <h2 className="text-4xl font-bold text-center text-theme-foreground mb-4">
            今日は何を探求しますか？
          </h2>
          <p className="text-center text-theme-foreground-muted mb-12 text-lg">
            カテゴリーを選んで構造的な探求を始めましょう
          </p>

          {isLoading ? (
            <div className="text-center text-theme-foreground-muted">読み込み中...</div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {categories.map((category) => {
                const Icon = getIcon(category.id);
                const hasNoQuestions = !category.question_count || category.question_count === 0;
                return (
                  <button
                    key={category.id}
                    onClick={() => onSelectCategory(category.id)}
                    className={`bg-theme-surface rounded-2xl p-8 shadow-sm border transition-all duration-200 text-left group relative ${hasNoQuestions
                      ? 'border-orange-300 opacity-75'
                      : 'border-theme-border hover:shadow-md hover:border-theme-border-hover'
                      }`}
                  >
                    {/* 質問なし警告バッジ */}
                    {hasNoQuestions && (
                      <div className="absolute top-4 right-4 px-2 py-1 bg-orange-100 text-orange-600 text-xs font-medium rounded-full">
                        質問なし
                      </div>
                    )}
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-colors ${hasNoQuestions
                      ? 'bg-orange-100'
                      : 'bg-theme-muted group-hover:bg-theme-primary'
                      }`}>
                      <Icon className={`w-7 h-7 transition-colors ${hasNoQuestions
                        ? 'text-orange-400'
                        : 'text-theme-primary group-hover:text-theme-primary-foreground'
                        }`} />
                    </div>
                    <h3 className="text-xl font-semibold text-theme-foreground mb-2">
                      {category.name}
                    </h3>
                    <p className="text-theme-foreground-muted leading-relaxed">
                      {category.description || 'カスタムカテゴリ'}
                    </p>
                    {!hasNoQuestions && (
                      <p className="text-xs text-theme-foreground-muted mt-2">
                        {category.question_count}個の質問
                      </p>
                    )}
                    {/* タグ表示 */}
                    {category.tags && category.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {category.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag.id}
                            className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: `${tag.color}20`,
                              color: tag.color,
                            }}
                          >
                            {tag.name}
                          </span>
                        ))}
                        {category.tags.length > 3 && (
                          <span className="text-xs text-theme-foreground-muted">
                            +{category.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Customize Button */}
          <div className="flex justify-center">
            <button
              onClick={onCustomize}
              className="flex items-center gap-3 px-8 py-4 bg-theme-surface border-2 border-theme-primary text-theme-primary rounded-xl hover:bg-theme-primary hover:text-theme-primary-foreground transition-all duration-200 font-medium shadow-sm hover:shadow-md"
            >
              <Settings className="w-5 h-5" />
              <span>質問をカスタマイズする</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}