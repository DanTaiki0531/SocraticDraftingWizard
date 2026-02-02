import { useState } from 'react';
import { Plus, Trash2, ArrowLeft, Play, GripVertical, BookOpen, Code, Lightbulb, Settings, Home } from 'lucide-react';

interface CustomizeQuestionsProps {
  onSelectCategory: (category: 'academic' | 'technical' | 'custom') => void;
  onBack: () => void;
  onGoHome: () => void;
}

export function CustomizeQuestions({ onSelectCategory, onBack, onGoHome }: CustomizeQuestionsProps) {
  const categories = [
    {
      id: 'academic' as const,
      icon: BookOpen,
      title: '学術論文',
      description: '研究論文を分析するための質問セット',
      emoji: '📚'
    },
    {
      id: 'technical' as const,
      icon: Code,
      title: '技術書',
      description: '技術的な概念を理解するための質問セット',
      emoji: '💻'
    },
    {
      id: 'custom' as const,
      icon: Lightbulb,
      title: 'カスタムノート',
      description: '自由な探求のための質問セット',
      emoji: '💡'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-[#D4D1CC] px-8 py-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 text-[#6B6560] hover:text-[#2D2D2D] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>戻る</span>
            </button>
            <h1 className="text-xl font-semibold text-[#2D2D2D]">質問セットをカスタマイズ</h1>
          </div>
          <button
            onClick={onGoHome}
            className="flex items-center gap-2 px-4 py-2 text-[#6B6560] hover:text-[#2D2D2D] transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>ホーム</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-8 py-16">
        <div className="max-w-5xl w-full">
          <h2 className="text-3xl font-bold text-center text-[#2D2D2D] mb-4">
            編集するカテゴリーを選択
          </h2>
          <p className="text-center text-[#6B6560] mb-12 text-lg">
            各カテゴリーの質問内容をカスタマイズできます
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => onSelectCategory(category.id)}
                className="bg-white rounded-2xl p-8 shadow-sm border border-[#D4D1CC] hover:shadow-md hover:border-[#8B8680] transition-all duration-200 text-left group"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-[#E8E6E3] flex items-center justify-center group-hover:bg-[#8B8680] transition-colors">
                    <category.icon className="w-7 h-7 text-[#8B8680] group-hover:text-white transition-colors" />
                  </div>
                  <span className="text-3xl">{category.emoji}</span>
                </div>
                <h3 className="text-xl font-semibold text-[#2D2D2D] mb-2">
                  {category.title}
                </h3>
                <p className="text-[#6B6560] leading-relaxed mb-4">
                  {category.description}
                </p>
                <div className="flex items-center gap-2 text-[#8B8680] font-medium">
                  <Settings className="w-4 h-4" />
                  <span>質問を編集</span>
                </div>
              </button>
            ))}
          </div>

          {/* Info Box */}
          <div className="mt-12 bg-[#E8E6E3] rounded-xl p-6 max-w-2xl mx-auto">
            <h3 className="font-semibold text-[#2D2D2D] mb-2">💡 カスタマイズについて</h3>
            <ul className="text-sm text-[#6B6560] space-y-1">
              <li>• 各カテゴリーの質問を自由に編集できます</li>
              <li>• 質問の追加、削除、順序変更が可能です</li>
              <li>• カスタマイズした内容は保存され、次回から使用できます</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}