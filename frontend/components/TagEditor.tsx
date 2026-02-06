import { useState, useEffect } from 'react';
import { Plus, ArrowLeft, Home, Tag as TagIcon, Check, X } from 'lucide-react';
import { fetchTags, createTag, fetchCategoryTags, saveCategoryTags, Tag } from '../lib/api';

interface TagEditorProps {
    categoryId: string;
    categoryName: string;
    onBack: () => void;
    onGoHome: () => void;
}

const colorOptions = [
    { name: '赤', value: '#ef4444' },
    { name: 'オレンジ', value: '#f59e0b' },
    { name: '緑', value: '#22c55e' },
    { name: '青', value: '#3b82f6' },
    { name: '紫', value: '#a855f7' },
    { name: 'ピンク', value: '#ec4899' },
    { name: 'グレー', value: '#6b7280' },
    { name: 'ブラウン', value: '#8B8680' },
];

const RECOMMENDED_TAGS = [
    { name: '研究', color: '#3b82f6' },
    { name: 'webアプリ開発', color: '#22c55e' },
    { name: 'バックエンド', color: '#6b7280' },
    { name: 'フロントエンド', color: '#ec4899' },
    { name: 'AI', color: '#a855f7' },
    { name: 'ツール', color: '#f59e0b' },
];

export function TagEditor({ categoryId, categoryName, onBack, onGoHome }: TagEditorProps) {
    const [allTags, setAllTags] = useState<Tag[]>([]);
    const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newTagName, setNewTagName] = useState('');
    const [newTagColor, setNewTagColor] = useState('#8B8680');
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        loadData();
    }, [categoryId]);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const [allTagsRes, categoryTagsRes] = await Promise.all([
                fetchTags(),
                fetchCategoryTags(categoryId)
            ]);
            setAllTags(allTagsRes.tags);
            setSelectedTagIds(categoryTagsRes.tags.map(t => t.id));
        } catch (err) {
            setError('タグの読み込みに失敗しました');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleTag = async (tagId: string) => {
        let newSelectedIds: string[];
        if (selectedTagIds.includes(tagId)) {
            newSelectedIds = selectedTagIds.filter(id => id !== tagId);
        } else {
            newSelectedIds = [...selectedTagIds, tagId];
        }
        setSelectedTagIds(newSelectedIds);

        // 自動保存
        try {
            setIsSaving(true);
            await saveCategoryTags(categoryId, newSelectedIds);
        } catch (err) {
            setError('タグの保存に失敗しました');
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreateTag = async (name?: string, color?: string) => {
        const tagName = name || newTagName;
        const tagColor = color || newTagColor;

        if (!tagName.trim()) return;

        try {
            setIsCreating(true);
            const newTag = await createTag({ name: tagName.trim(), color: tagColor });
            setAllTags([...allTags, newTag]);
            // 新しいタグを自動で選択
            const newSelectedIds = [...selectedTagIds, newTag.id];
            setSelectedTagIds(newSelectedIds);
            await saveCategoryTags(categoryId, newSelectedIds);

            if (!name) { // Reset form only if manual creation
                setNewTagName('');
                setNewTagColor('#8B8680');
                setShowCreateForm(false);
            }
        } catch (err: any) {
            setError(err.message || 'タグの作成に失敗しました');
            console.error(err);
        } finally {
            setIsCreating(false);
        }
    };

    const selectedTags = allTags.filter(t => selectedTagIds.includes(t.id));
    const availableTags = allTags.filter(t => !selectedTagIds.includes(t.id));

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
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <button
                            onClick={onBack}
                            className="flex items-center gap-2 text-theme-foreground-muted hover:text-theme-foreground transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span>戻る</span>
                        </button>
                        <div>
                            <h1 className="text-xl font-semibold text-theme-foreground flex items-center gap-2">
                                <TagIcon className="w-5 h-5" />
                                タグ設定
                            </h1>
                            <p className="text-sm text-theme-foreground-muted">{categoryName}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {isSaving && <span className="text-sm text-theme-foreground-muted">保存中...</span>}
                        <button
                            onClick={onGoHome}
                            className="flex items-center gap-2 text-theme-foreground-muted hover:text-theme-foreground transition-colors"
                        >
                            <Home className="w-4 h-4" />
                            <span>ホーム</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto px-8 py-8">
                    {isLoading ? (
                        <div className="text-center text-theme-foreground-muted py-12">読み込み中...</div>
                    ) : (
                        <div className="space-y-8">
                            {/* Selected Tags Section */}
                            <section className="bg-theme-surface rounded-xl border border-theme-border p-6">
                                <h2 className="text-lg font-semibold text-theme-foreground mb-4 flex items-center gap-2">
                                    <Check className="w-5 h-5 text-green-500" />
                                    設定中のタグ
                                </h2>
                                {selectedTags.length === 0 ? (
                                    <p className="text-theme-foreground-muted text-sm">
                                        タグが設定されていません。下のタグをクリックして追加してください。
                                    </p>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {selectedTags.map((tag) => (
                                            <button
                                                key={tag.id}
                                                onClick={() => handleToggleTag(tag.id)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all hover:opacity-80 dark:brightness-200 dark:saturate-200 border border-transparent dark:border-opacity-50"
                                                style={{
                                                    backgroundColor: `${tag.color}25`,
                                                    color: tag.color,
                                                    borderColor: tag.color,
                                                }}
                                            >
                                                {tag.name}
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </section>

                            {/* Available Tags Section */}
                            <section className="bg-theme-surface rounded-xl border border-theme-border p-6">
                                <h2 className="text-lg font-semibold text-theme-foreground mb-4">
                                    利用可能なタグ
                                </h2>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {/* Existing Available Tags */}
                                    {availableTags.map((tag) => (
                                        <button
                                            key={tag.id}
                                            onClick={() => handleToggleTag(tag.id)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all hover:opacity-80 border-2 border-dashed dark:brightness-200 dark:saturate-200 dark:border-opacity-50"
                                            style={{
                                                borderColor: tag.color,
                                                color: tag.color,
                                            }}
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            {tag.name}
                                        </button>
                                    ))}

                                    {/* Recommended Tags that don't exist yet */}
                                    {RECOMMENDED_TAGS.filter(rt => !allTags.some(t => t.name === rt.name)).map((rt) => (
                                        <button
                                            key={rt.name}
                                            onClick={() => handleCreateTag(rt.name, rt.color)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all hover:opacity-80 border-2 border-dashed opacity-70 hover:opacity-100 dark:brightness-200 dark:saturate-200 dark:border-opacity-50"
                                            style={{
                                                borderColor: rt.color,
                                                color: rt.color,
                                            }}
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            {rt.name}
                                        </button>
                                    ))}

                                    {/* Create New Tag Button */}
                                    <button
                                        onClick={() => setShowCreateForm(true)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-theme-foreground-muted border-2 border-dashed border-theme-border hover:border-theme-primary hover:text-theme-primary transition-colors"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        新規作成
                                    </button>
                                </div>

                                {availableTags.length === 0 && !showCreateForm && RECOMMENDED_TAGS.every(rt => allTags.some(t => t.name === rt.name)) && (
                                    <p className="text-theme-foreground-muted text-sm">
                                        すべてのタグが設定されています。
                                    </p>
                                )}
                            </section>

                            {/* Create Form */}
                            {showCreateForm && (
                                <section className="bg-theme-surface rounded-xl border border-theme-border p-6">
                                    <h3 className="font-semibold text-theme-foreground mb-4">新しいタグを作成</h3>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-theme-foreground mb-1">
                                                タグ名
                                            </label>
                                            <input
                                                type="text"
                                                value={newTagName}
                                                onChange={(e) => setNewTagName(e.target.value)}
                                                placeholder="例: 重要、復習、アイデア"
                                                className="w-full px-4 py-2 border border-theme-border rounded-lg bg-theme-bg text-theme-foreground focus:outline-none focus:ring-2 focus:ring-theme-primary"
                                                autoFocus
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-theme-foreground mb-2">
                                                色
                                            </label>
                                            <div className="flex flex-wrap gap-2">
                                                {colorOptions.map((color) => (
                                                    <button
                                                        key={color.value}
                                                        onClick={() => setNewTagColor(color.value)}
                                                        className={`w-10 h-10 rounded-full transition-all flex items-center justify-center ${newTagColor === color.value ? 'ring-2 ring-offset-2 ring-theme-primary' : ''
                                                            }`}
                                                        style={{ backgroundColor: color.value }}
                                                        title={color.name}
                                                    >
                                                        {newTagColor === color.value && (
                                                            <Check className="w-5 h-5 text-white" />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Preview */}
                                        <div>
                                            <label className="block text-sm font-medium text-theme-foreground mb-2">
                                                プレビュー
                                            </label>
                                            <span
                                                className="inline-flex px-3 py-1 rounded-full text-sm font-medium dark:brightness-200 dark:saturate-200 border border-transparent dark:border-opacity-50"
                                                style={{
                                                    backgroundColor: `${newTagColor}25`,
                                                    color: newTagColor,
                                                    borderColor: newTagColor,
                                                }}
                                            >
                                                {newTagName || 'タグ名'}
                                            </span>
                                        </div>

                                        <div className="flex gap-3 pt-2">
                                            <button
                                                onClick={() => {
                                                    setShowCreateForm(false);
                                                    setNewTagName('');
                                                    setNewTagColor('#8B8680');
                                                }}
                                                className="px-4 py-2 text-theme-foreground-muted hover:text-theme-foreground transition-colors"
                                            >
                                                キャンセル
                                            </button>
                                            <button
                                                onClick={() => handleCreateTag()}
                                                disabled={!newTagName.trim() || isCreating}
                                                className="px-6 py-2 bg-theme-primary text-theme-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity font-medium"
                                            >
                                                {isCreating ? '作成中...' : 'タグを作成して追加'}
                                            </button>
                                        </div>
                                    </div>
                                </section>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
