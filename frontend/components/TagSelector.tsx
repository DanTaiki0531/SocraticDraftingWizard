import { useState, useEffect } from 'react';
import { Plus, X, Tag as TagIcon } from 'lucide-react';
import { fetchTags, createTag, Tag } from '../lib/api';

interface TagSelectorProps {
    selectedTagIds: string[];
    onTagsChange: (tagIds: string[]) => void;
}

export function TagSelector({ selectedTagIds, onTagsChange }: TagSelectorProps) {
    const [tags, setTags] = useState<Tag[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newTagName, setNewTagName] = useState('');
    const [newTagColor, setNewTagColor] = useState('#8B8680');
    const [isCreating, setIsCreating] = useState(false);

    const colorOptions = [
        '#ef4444', // red
        '#f59e0b', // amber
        '#22c55e', // green
        '#3b82f6', // blue
        '#a855f7', // purple
        '#ec4899', // pink
        '#6b7280', // gray
        '#8B8680', // default
    ];

    useEffect(() => {
        loadTags();
    }, []);

    const loadTags = async () => {
        try {
            setIsLoading(true);
            const response = await fetchTags();
            setTags(response.tags);
        } catch (err) {
            console.error('Failed to load tags:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleTag = (tagId: string) => {
        if (selectedTagIds.includes(tagId)) {
            onTagsChange(selectedTagIds.filter(id => id !== tagId));
        } else {
            onTagsChange([...selectedTagIds, tagId]);
        }
    };

    const handleCreateTag = async () => {
        if (!newTagName.trim()) return;

        try {
            setIsCreating(true);
            const newTag = await createTag({ name: newTagName.trim(), color: newTagColor });
            setTags([...tags, newTag]);
            onTagsChange([...selectedTagIds, newTag.id]);
            setNewTagName('');
            setShowCreateForm(false);
        } catch (err: any) {
            console.error('Failed to create tag:', err);
            alert(err.message || 'タグの作成に失敗しました');
        } finally {
            setIsCreating(false);
        }
    };

    if (isLoading) {
        return <div className="text-sm text-gray-500">タグを読み込み中...</div>;
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
                <TagIcon className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">タグ:</span>

                {tags.map(tag => {
                    const isSelected = selectedTagIds.includes(tag.id);
                    return (
                        <button
                            key={tag.id}
                            onClick={() => handleToggleTag(tag.id)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${isSelected
                                    ? 'ring-2 ring-offset-1 ring-gray-400'
                                    : 'opacity-60 hover:opacity-100'
                                }`}
                            style={{
                                backgroundColor: `${tag.color}20`,
                                color: tag.color,
                                borderColor: tag.color,
                            }}
                        >
                            {tag.name}
                            {isSelected && <X className="w-3 h-3 inline ml-1" />}
                        </button>
                    );
                })}

                <button
                    onClick={() => setShowCreateForm(true)}
                    className="px-2 py-1 rounded-full text-xs font-medium text-gray-500 border border-dashed border-gray-300 hover:border-gray-400 hover:text-gray-700 transition-colors flex items-center gap-1"
                >
                    <Plus className="w-3 h-3" />
                    新規
                </button>
            </div>

            {/* Create new tag form */}
            {showCreateForm && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={newTagName}
                            onChange={(e) => setNewTagName(e.target.value)}
                            placeholder="タグ名"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                            autoFocus
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">色:</span>
                        {colorOptions.map(color => (
                            <button
                                key={color}
                                onClick={() => setNewTagColor(color)}
                                className={`w-6 h-6 rounded-full transition-all ${newTagColor === color ? 'ring-2 ring-offset-1 ring-gray-400' : ''
                                    }`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowCreateForm(false)}
                            className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700"
                        >
                            キャンセル
                        </button>
                        <button
                            onClick={handleCreateTag}
                            disabled={!newTagName.trim() || isCreating}
                            className="px-3 py-1 bg-gray-700 text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50"
                        >
                            {isCreating ? '作成中...' : '作成'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
