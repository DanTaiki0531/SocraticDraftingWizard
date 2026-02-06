import { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Trash2, ArrowLeft, BookOpen, Code, Lightbulb, Settings, Home, Folder, X, Tag, GripVertical, ArrowDownAZ, ArrowUpAZ, Calendar, List } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { fetchTemplates, createCategory, deleteCategory, reorderCategories, Category } from '../lib/api';

type SortKey = 'custom' | 'name' | 'created_at';
type SortDirection = 'asc' | 'desc';

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



// Sortable Category Item Component
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SortableCategoryEditItem({ category, onSelect, onEditTags, onDelete, getIcon }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
    position: 'relative' as const,
  };

  const Icon = getIcon(category.id);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-theme-surface rounded-2xl p-6 shadow-sm border border-theme-border relative group"
    >
      {/* Drag Handle - Only show in custom sort mode when dragging is possible, but we don't have sortKey prop here. 
          Ideally we should pass isDragEnabled props or similar. 
          Actually, if SortableContext is disabled, the listeners won't work, but the handle visual remains.
          Let's just keep it visible but maybe indicate strict state if we want perfection. 
          For now, just keeping it is fine, it just won't drag if disabled. */
      }
      <div {...attributes} {...listeners} className="absolute top-4 left-4 p-2 cursor-grab active:cursor-grabbing text-theme-foreground-muted hover:text-theme-foreground bg-theme-bg/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-theme-muted">
        <GripVertical className="w-5 h-5" />
      </div>

      {/* 削除ボタン */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDelete(category.id, e);
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute top-4 right-4 p-2 text-theme-foreground-muted hover:text-theme-error transition-colors rounded-lg hover:bg-theme-muted z-10 cursor-pointer"
        title="カテゴリを削除"
      >
        <Trash2 className="w-4 h-4 pointer-events-none" />
      </button>

      <div className="flex items-center gap-3 mb-4 pl-8"> {/* Added padding for handle */}
        <div className="w-12 h-12 rounded-xl bg-theme-muted flex items-center justify-center">
          <Icon className="w-6 h-6 text-theme-primary" />
        </div>
      </div>
      <h3 className="text-lg font-semibold text-theme-foreground mb-1">
        {category.name}
      </h3>
      <p className="text-sm text-theme-foreground-muted mb-4">
        {category.description || 'カスタムカテゴリ'}
      </p>

      {/* タグ表示 */}
      {category.tags && category.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {category.tags.slice(0, 3).map((tag: any) => (
            <span
              key={tag.id}
              className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium dark:brightness-200 dark:saturate-200 transition-all border border-transparent dark:border-opacity-50 dark:bg-opacity-30"
              style={{
                backgroundColor: `${tag.color}25`,
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

      {/* アクションボタン */}
      <div className="flex gap-2">
        <button
          onClick={() => onSelect(category.id)}
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
}

export function CustomizeQuestions({ onSelectCategory, onEditTags, onBack, onGoHome }: CustomizeQuestionsProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');

  const [isCreating, setIsCreating] = useState(false);

  // Sort state
  const [sortKey, setSortKey] = useState<SortKey>('custom');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const categoryInputRef = useRef<HTMLInputElement>(null);

  // Auto focus on category name input when modal opens
  useEffect(() => {
    if (showCreateModal) {
      setTimeout(() => {
        categoryInputRef.current?.focus();
      }, 0);
    }
  }, [showCreateModal]);

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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setCategories((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);

        // API呼び出しで順序を保存 (非同期)
        const updates = newItems.map((item, index) => ({
          id: item.id,
          order_index: index,
        }));
        reorderCategories(updates).catch(console.error);

        return newItems;
      });
    }
  };

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
    }
  };


  // カテゴリ削除確認
  const handleDeleteClick = (categoryId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteTargetId(categoryId);
  };

  // 実際の削除処理
  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;

    try {
      await deleteCategory(deleteTargetId);
      setDeleteTargetId(null);
      await loadCategories();
    } catch (err: any) {
      setError(err.message || 'カテゴリの削除に失敗しました');
      console.error(err);
    }
  };

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
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        comparison = dateA - dateB;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [categories, sortKey, sortDirection]);

  const getIcon = (categoryId: string) => categoryIcons[categoryId] || Folder;


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
      <header className="bg-theme-surface border-b border-theme-border px-8 py-6 sticky top-0 z-30 shadow-sm">
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
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-theme-foreground-muted hover:text-theme-foreground transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>新規カテゴリ</span>
            </button>
            <button
              onClick={onGoHome}
              className="flex items-center gap-2 px-4 py-2 text-theme-foreground-muted hover:text-theme-foreground transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>ホーム</span>
            </button>
          </div>
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

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={displayedCategories.map(c => c.id)} strategy={rectSortingStrategy} disabled={sortKey !== 'custom'}>
                  <div className="grid md:grid-cols-3 gap-6">
                    {displayedCategories.map((category) => (
                      <SortableCategoryEditItem
                        key={category.id}
                        category={category}
                        onSelect={onSelectCategory}
                        onEditTags={onEditTags}
                        onDelete={handleDeleteClick}
                        getIcon={getIcon}
                      />
                    ))}


                  </div>
                </SortableContext>
              </DndContext>
            </>
          )}

          {/* Info Box */}
          <div className="mt-12 bg-theme-muted rounded-xl p-6 max-w-2xl mx-auto">
            <h3 className="font-semibold text-theme-foreground mb-2">💡 カスタマイズについて</h3>
            <ul className="text-sm text-theme-foreground-muted space-y-1">
              <li>• 各カテゴリーの質問を自由に編集できます</li>
              <li>• 質問の追加、削除、順序変更が可能です</li>
              <li>• 新しいカテゴリを作成して独自の質問セットを構築できます</li>
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
                  ref={categoryInputRef}
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

      {/* 削除確認モーダル */}
      {deleteTargetId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-theme-surface rounded-2xl p-8 max-w-sm w-full mx-4 shadow-xl border border-theme-border">
            <h3 className="text-xl font-semibold text-theme-foreground mb-4">カテゴリの削除</h3>
            <p className="text-theme-foreground-muted mb-6">
              このカテゴリを削除してもよろしいですか？<br />
              <span className="text-theme-error text-sm mt-2 block">※含まれる質問も全て削除されます。この操作は取り消せません。</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="flex-1 px-4 py-2 rounded-lg border border-theme-border text-theme-foreground hover:bg-theme-muted transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2 rounded-lg bg-theme-error text-white hover:bg-red-600 transition-colors"
              >
                削除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}