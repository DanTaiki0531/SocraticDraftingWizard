import { useState, useEffect, useMemo } from 'react';
import { BookOpen, Code, Lightbulb, Settings, Folder, ArrowDownAZ, ArrowUpAZ, Calendar, List } from 'lucide-react';
import { ThemeSelector } from './ThemeSelector';
import { fetchTemplates, Category } from '../lib/api';

interface HomePageProps {
  onSelectCategory: (category: string) => void;
  onCustomize: () => void;
}

type SortKey = 'custom' | 'name' | 'created_at';
type SortDirection = 'asc' | 'desc';

// デフォルトカテゴリのアイコンマッピング
const categoryIcons: Record<string, typeof BookOpen> = {
  academic: BookOpen,
  technical: Code,
  custom: Lightbulb,
};

function CategoryItem({ category, onSelect, getIcon }: { category: Category; onSelect: (id: string) => void; getIcon: (id: string) => any }) {
  const Icon = getIcon(category.id);
  const hasNoQuestions = !category.question_count || category.question_count === 0;

  return (
    <button
      onClick={() => onSelect(category.id)}
      className={`w-full bg-theme-surface rounded-2xl p-6 shadow-sm border transition-all duration-200 text-left group relative ${hasNoQuestions
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
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-colors mx-auto md:mx-0 ${hasNoQuestions
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
              className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium dark:brightness-125 dark:saturate-150 transition-all border border-transparent dark:border-opacity-30"
              style={{
                backgroundColor: `${tag.color}20`,
                color: tag.color,
                borderColor: tag.color,
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
}

export function HomePage({ onSelectCategory, onCustomize }: HomePageProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Sort state
  const [sortKey, setSortKey] = useState<SortKey>('custom');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

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

  // Sorted categories for display
  const displayedCategories = useMemo(() => {
    if (sortKey === 'custom') {
      return categories;
    }
    return [...categories].sort((a, b) => {
      let comparison = 0;
      if (sortKey === 'name') {
        comparison = a.name.localeCompare(b.name, 'ja');
      } else if (sortKey === 'created_at') {
        // Handle potentially missing created_at for older records or defaults
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        comparison = dateA - dateB;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [categories, sortKey, sortDirection]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getIcon = (categoryId: string): any => categoryIcons[categoryId] || Folder;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="py-6 px-8 border-b border-theme-border bg-theme-surface flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <h1 className="text-xl font-semibold text-theme-foreground">Socratic Drafting Wizard</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={onCustomize}
            className="flex items-center gap-2 px-4 py-2 text-theme-foreground-muted hover:text-theme-foreground dark:text-theme-foreground transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>カスタマイズ</span>
          </button>
          <ThemeSelector />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-8 py-16">
        <div className="max-w-5xl w-full">
          <h2 className="text-4xl font-bold text-center text-theme-foreground mb-4">
            今日は何を探求しますか？
          </h2>
          <p className="text-center text-theme-foreground-muted mb-8 text-lg">
            カテゴリーを選んで構造的な探求を始めましょう
          </p>

          {/* Sort Controls */}
          <div className="flex justify-end mb-6 gap-2">
            <div className="flex items-center bg-theme-surface rounded-lg border border-theme-border p-1 shadow-sm">
              <button
                onClick={() => setSortKey('custom')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors ${sortKey === 'custom' ? 'bg-theme-primary text-theme-primary-foreground' : 'text-theme-foreground-muted hover:bg-theme-muted'}`}
              >
                <List className="w-4 h-4" />
                <span>カスタム</span>
              </button>
              <div className="w-px h-4 bg-theme-border mx-1"></div>
              <button
                onClick={() => setSortKey('created_at')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors ${sortKey === 'created_at' ? 'bg-theme-primary text-theme-primary-foreground' : 'text-theme-foreground-muted hover:bg-theme-muted'}`}
              >
                <Calendar className="w-4 h-4" />
                <span>作成日</span>
              </button>
              <button
                onClick={() => setSortKey('name')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors ${sortKey === 'name' ? 'bg-theme-primary text-theme-primary-foreground' : 'text-theme-foreground-muted hover:bg-theme-muted'}`}
              >
                <ArrowDownAZ className="w-4 h-4" />
                <span>名前</span>
              </button>
            </div>

            {sortKey !== 'custom' && (
              <button
                onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="flex items-center justify-center w-10 h-10 bg-theme-surface rounded-lg border border-theme-border text-theme-foreground hover:bg-theme-muted transition-colors shadow-sm"
                title={sortDirection === 'asc' ? '昇順' : '降順'}
              >
                {sortDirection === 'asc' ? <ArrowDownAZ className="w-5 h-5" /> : <ArrowUpAZ className="w-5 h-5" />}
              </button>
            )}
          </div>


          {isLoading ? (
            <div className="text-center text-theme-foreground-muted">読み込み中...</div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {displayedCategories.map((category) => (
                <CategoryItem
                  key={category.id}
                  category={category}
                  onSelect={onSelectCategory}
                  getIcon={getIcon}
                />
              ))}
            </div>
          )}


        </div>
      </main>
    </div>
  );
}