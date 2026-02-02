import { useState } from 'react';
import { Plus, Trash2, ArrowLeft, Save, GripVertical, Home } from 'lucide-react';

interface QuestionEditorProps {
  category: 'academic' | 'technical' | 'custom';
  questions: string[];
  onSave: (questions: string[]) => void;
  onBack: () => void;
  onGoHome: () => void;
}

const categoryInfo = {
  academic: {
    title: '学術論文',
    description: '研究論文を分析するための質問セット',
    icon: '📚'
  },
  technical: {
    title: '技術書',
    description: '技術的な概念を理解するための質問セット',
    icon: '💻'
  },
  custom: {
    title: 'カスタムノート',
    description: '自由な探求のための質問セット',
    icon: '💡'
  }
};

export function QuestionEditor({ category, questions: initialQuestions, onSave, onBack, onGoHome }: QuestionEditorProps) {
  const [questions, setQuestions] = useState<string[]>([...initialQuestions]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const info = categoryInfo[category];

  const handleAddQuestion = () => {
    setQuestions([...questions, '新しい質問を入力してください']);
    setHasChanges(true);
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
      setHasChanges(true);
    }
  };

  const handleQuestionChange = (index: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index] = value;
    setQuestions(newQuestions);
    setHasChanges(true);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newQuestions = [...questions];
    const draggedQuestion = newQuestions[draggedIndex];
    newQuestions.splice(draggedIndex, 1);
    newQuestions.splice(index, 0, draggedQuestion);
    
    setQuestions(newQuestions);
    setDraggedIndex(index);
    setHasChanges(true);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSave = () => {
    if (questions.length > 0 && questions.every(q => q.trim() !== '')) {
      onSave(questions);
      setHasChanges(false);
    }
  };

  const handleReset = () => {
    setQuestions([...initialQuestions]);
    setHasChanges(false);
  };

  const isValid = questions.length > 0 && questions.every(q => q.trim() !== '');

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-[#D4D1CC] px-8 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 text-[#6B6560] hover:text-[#2D2D2D] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>戻る</span>
              </button>
              <div>
                <h1 className="text-xl font-semibold text-[#2D2D2D] flex items-center gap-2">
                  <span>{info.icon}</span>
                  <span>{info.title}の質問を編集</span>
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onGoHome}
                className="flex items-center gap-2 px-4 py-2 text-[#6B6560] hover:text-[#2D2D2D] transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>ホーム</span>
              </button>
              {hasChanges && (
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-[#6B6560] hover:text-[#2D2D2D] transition-colors"
                >
                  リセット
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={!isValid || !hasChanges}
                className="flex items-center gap-2 px-6 py-3 bg-[#8B8680] text-white rounded-xl hover:bg-[#6B6560] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                <Save className="w-4 h-4" />
                <span>保存</span>
              </button>
            </div>
          </div>
          <p className="text-sm text-[#6B6560]">{info.description}</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Questions List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#2D2D2D]">
                質問リスト（{questions.length}個）
              </h2>
              <button
                onClick={handleAddQuestion}
                className="flex items-center gap-2 px-4 py-2 bg-[#E8E6E3] text-[#8B8680] rounded-lg hover:bg-[#8B8680] hover:text-white transition-colors font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>質問を追加</span>
              </button>
            </div>

            <div className="space-y-3">
              {questions.map((question, index) => (
                <div
                  key={index}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`bg-white rounded-xl border border-[#D4D1CC] p-4 transition-all ${
                    draggedIndex === index ? 'opacity-50' : 'opacity-100'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Drag Handle */}
                    <div className="flex-shrink-0 mt-3 cursor-move text-[#A8A8A8] hover:text-[#6B6560]">
                      <GripVertical className="w-5 h-5" />
                    </div>

                    {/* Question Number */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#E8E6E3] flex items-center justify-center text-[#8B8680] font-semibold mt-2">
                      {index + 1}
                    </div>

                    {/* Question Input */}
                    <textarea
                      value={question}
                      onChange={(e) => handleQuestionChange(index, e.target.value)}
                      className="flex-1 px-4 py-2 border border-[#D4D1CC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B8680] focus:border-transparent resize-none min-h-[60px]"
                      placeholder="質問を入力してください"
                      rows={2}
                    />

                    {/* Delete Button */}
                    <button
                      onClick={() => handleRemoveQuestion(index)}
                      disabled={questions.length === 1}
                      className="flex-shrink-0 mt-2 p-2 text-[#A8A8A8] hover:text-red-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title={questions.length === 1 ? '最低1つの質問が必要です' : '削除'}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="bg-[#E8E6E3] rounded-xl p-6">
            <h3 className="font-semibold text-[#2D2D2D] mb-2">💡 ヒント</h3>
            <ul className="text-sm text-[#6B6560] space-y-1">
              <li>• 質問はドラッグして順序を変更できます</li>
              <li>• 具体的で明確な質問を設定すると、より良い結果が得られます</li>
              <li>• 3〜8個の質問が最適です</li>
              <li>• 変更は「保存」ボタンを押すまで反映されません</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}