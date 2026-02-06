import { useState, useEffect } from 'react';
import { Plus, Trash2, ArrowLeft, BookOpen, Code, Lightbulb, Settings, Home, Folder, X, Tag } from 'lucide-react';
import { fetchTemplates, createCategory, deleteCategory, Category } from '../lib/api';

interface CustomizeQuestionsProps {
  onSelectCategory: (category: string) => void;
  onEditTags: (categoryId: string, categoryName: string) => void;
  onBack: () => void;
  onGoHome: () => void;
}

// デフォルトカテゴリのアイコンマッピング
const categoryIcons: Record<string, typeof BookOpen> = {
  academic: BookOpen,
  technical: Code,
  custom: Lightbulb,
};

const categoryEmojis: Record<string, string> = {
  academic: '📚',
  technical: '💻',
  custom: '💡',
};

export function CustomizeQuestions({ onSelectCategory, onEditTags, onBack, onGoHome }: CustomizeQuestionsProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // カテゴリを読み込む
  const loadCategories = async () => {
    try {
      setIsLoading(true);
      const response = await fetchTemplates();
      setCategories(response.categories);
    } catch (err) {
      setError('カテゴリの読み込みに失敗しました');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // 新規カテゴリ作成
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      setIsCreating(true);
      await createCategory({
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim() || undefined,
      });
      setShowCreateModal(false);
      setNewCategoryName('');
      setNewCategoryDescription('');
      await loadCategories();
    } catch (err) {
      setError('カテゴリの作成に失敗しました');
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  // カテゴリ削除
  const handleDeleteCategory = async (categoryId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm('このカテゴリを削除しますか？質問も全て削除されます。')) {
      return;
    }

    try {
      await deleteCategory(categoryId);
      await loadCategories();
    } catch (err: any) {
      setError(err.message || 'カテゴリの削除に失敗しました');
      console.error(err);
    }
  };

  const getIcon = (categoryId: string) => categoryIcons[categoryId] || Folder;
  const getEmoji = (categoryId: string) => categoryEmojis[categoryId] || '📁';

  return (
    <div className="min-h-screen flex flex-col bg-theme-bg">
      {/* Error Toast */}
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-theme-error text-theme-error-foreground px-6 py-3 rounded-lg shadow-lg z-50">
          {error}
          <button onClick={() => setError(null)} className="ml-4 font-bold">×</button>
        </div>
      )}

      {/* Header */}
      <header className="bg-theme-surface border-b border-theme-border px-8 py-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 text-theme-foreground-muted hover:text-theme-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>戻る</span>
            </button>
            <h1 className="text-xl font-semibold text-theme-foreground">質問セットをカスタマイズ</h1>
          </div>
          <button
            onClick={onGoHome}
            className="flex items-center gap-2 px-4 py-2 text-theme-foreground-muted hover:text-theme-foreground transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>ホーム</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-8 py-16">
        <div className="max-w-5xl w-full">
          <h2 className="text-3xl font-bold text-center text-theme-foreground mb-4">
            編集するカテゴリーを選択
          </h2>
          <p className="text-center text-theme-foreground-muted mb-12 text-lg">
            各カテゴリーの質問内容をカスタマイズできます
          </p>

          {isLoading ? (
            <div className="text-center text-theme-foreground-muted">読み込み中...</div>
          ) : (
            <>
              <div className="grid md:grid-cols-3 gap-6">
                {categories.map((category) => {
                  const Icon = getIcon(category.id);
                  return (
                    <div
                      key={category.id}
                      className="bg-theme-surface rounded-2xl p-6 shadow-sm border border-theme-border relative"
                    >
                      {/* 削除ボタン */}
                      <button
                        onClick={(e) => handleDeleteCategory(category.id, e)}
                        className="absolute top-4 right-4 p-2 text-theme-foreground-muted hover:text-theme-error transition-colors rounded-lg hover:bg-theme-muted"
                        title="カテゴリを削除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-theme-muted flex items-center justify-center">
                          <Icon className="w-6 h-6 text-theme-primary" />
                        </div>
                        <span className="text-2xl">{getEmoji(category.id)}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-theme-foreground mb-1">
                        {category.name}
                      </h3>
                      <p className="text-sm text-theme-foreground-muted mb-4">
                        {category.description || 'カスタムカテゴリ'}
                      </p>

                      {/* アクションボタン */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => onSelectCategory(category.id)}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-theme-primary text-theme-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
                        >
                          <Settings className="w-4 h-4" />
                          <span>質問編集</span>
                        </button>
                        <button
                          onClick={() => onEditTags(category.id, category.name)}
                          className="flex items-center justify-center gap-2 px-3 py-2 bg-theme-muted text-theme-foreground rounded-lg hover:bg-theme-border transition-colors text-sm font-medium"
                        >
                          <Tag className="w-4 h-4" />
                          <span>タグ</span>
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* 新規カテゴリ追加ボタン */}
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-theme-surface rounded-2xl p-8 shadow-sm border-2 border-dashed border-theme-border hover:border-theme-primary transition-all duration-200 text-center group"
                >
                  <div className="w-14 h-14 rounded-xl bg-theme-muted flex items-center justify-center mx-auto mb-4 group-hover:bg-theme-primary transition-colors">
                    <Plus className="w-7 h-7 text-theme-primary group-hover:text-theme-primary-foreground transition-colors" />
                  </div>
                  <h3 className="text-xl font-semibold text-theme-foreground mb-2">
                    新規カテゴリ
                  </h3>
                  <p className="text-theme-foreground-muted leading-relaxed">
                    独自のカテゴリを作成
                  </p>
                </button>
              </div>
            </>
          )}

          {/* Info Box */}
          <div className="mt-12 bg-theme-muted rounded-xl p-6 max-w-2xl mx-auto">
            <h3 className="font-semibold text-theme-foreground mb-2">💡 カスタマイズについて</h3>
            <ul className="text-sm text-theme-foreground-muted space-y-1">
              <li>• 各カテゴリーの質問を自由に編集できます</li>
              <li>• 質問の追加、削除、順序変更が可能です</li>
              <li>• 新しいカテゴリを作成して独自の質問セットを構築できます</li>
              <li>• デフォルトカテゴリ（学術論文・技術書・カスタムノート）は削除できません</li>
            </ul>
          </div>
        </div>
      </main>

      {/* 新規カテゴリ作成モーダル */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-theme-surface rounded-2xl p-8 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-theme-foreground">新規カテゴリを作成</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-theme-foreground-muted hover:text-theme-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-theme-foreground mb-2">
                  カテゴリ名 *
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="例: プロジェクト企画"
                  className="w-full px-4 py-3 rounded-xl border border-theme-border bg-theme-bg text-theme-foreground placeholder:text-theme-foreground-muted focus:outline-none focus:border-theme-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-theme-foreground mb-2">
                  説明（任意）
                </label>
                <input
                  type="text"
                  value={newCategoryDescription}
                  onChange={(e) => setNewCategoryDescription(e.target.value)}
                  placeholder="例: プロジェクトの企画書を作成するための質問"
                  className="w-full px-4 py-3 rounded-xl border border-theme-border bg-theme-bg text-theme-foreground placeholder:text-theme-foreground-muted focus:outline-none focus:border-theme-primary"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-theme-border text-theme-foreground hover:bg-theme-muted transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleCreateCategory}
                  disabled={!newCategoryName.trim() || isCreating}
                  className="flex-1 px-4 py-3 rounded-xl bg-theme-primary text-theme-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? '作成中...' : '作成'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}