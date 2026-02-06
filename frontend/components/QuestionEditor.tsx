import { useState } from 'react';
import { Plus, Trash2, ArrowLeft, Save, GripVertical, Home } from 'lucide-react';

interface QuestionEditorProps {
  category: string;
  questions: string[];
  onSave: (questions: string[]) => void;
  onBack: () => void;
  onGoHome: () => void;
}

const categoryInfo: Record<string, { title: string; description: string; icon: string }> = {
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

const defaultInfo = {
  title: 'カスタムカテゴリ',
  description: 'カスタム質問セット',
  icon: '📁'
};

export function QuestionEditor({ category, questions: initialQuestions, onSave, onBack, onGoHome }: QuestionEditorProps) {
  const [questions, setQuestions] = useState<string[]>([...initialQuestions]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const info = categoryInfo[category] || defaultInfo;

  const handleAddQuestion = () => {
    setQuestions([...questions, '新しい質問を入力してください']);
    setHasChanges(true);
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
    setHasChanges(true);
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

  const isValid = questions.every(q => q.trim() !== '');

  return (
    <div className="min-h-screen flex flex-col bg-theme-bg">
      {/* Header */}
      <header className="bg-theme-surface border-b border-theme-border px-8 py-6 sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 text-theme-foreground-muted hover:text-theme-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>戻る</span>
              </button>
              <div>
                <h1 className="text-xl font-semibold text-theme-foreground flex items-center gap-2">
                  <span>{info.icon}</span>
                  <span>{info.title}の質問を編集</span>
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onGoHome}
                className="flex items-center gap-2 px-4 py-2 text-theme-foreground-muted hover:text-theme-foreground transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>ホーム</span>
              </button>
              {hasChanges && (
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-theme-foreground-muted hover:text-theme-foreground transition-colors"
                >
                  リセット
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={!isValid || !hasChanges}
                className="flex items-center gap-2 px-6 py-3 bg-theme-primary text-theme-primary-foreground rounded-xl hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                <Save className="w-4 h-4" />
                <span>保存</span>
              </button>
            </div>
          </div>
          <p className="text-sm text-theme-foreground-muted">{info.description}</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Questions List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-theme-foreground">
                質問リスト（{questions.length}個）
              </h2>
              <button
                onClick={handleAddQuestion}
                className="flex items-center gap-2 px-4 py-2 bg-theme-muted text-theme-muted-foreground rounded-lg hover:bg-theme-primary hover:text-theme-primary-foreground transition-colors font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>質問を追加</span>
              </button>
            </div>

            <div className="space-y-3">
              {questions.length === 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-8 text-center">
                  <p className="text-orange-600 font-medium mb-2">まだ質問がありません</p>
                  <p className="text-sm text-orange-500">上の「質問を追加」ボタンをクリックして最初の質問を追加してください</p>
                </div>
              )}
              {questions.map((question, index) => (
                <div
                  key={index}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`bg-theme-surface rounded-xl border border-theme-border p-4 transition-all ${draggedIndex === index ? 'opacity-50' : 'opacity-100'
                    }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Drag Handle */}
                    <div className="flex-shrink-0 mt-3 cursor-move text-theme-foreground-muted hover:text-theme-foreground">
                      <GripVertical className="w-5 h-5" />
                    </div>

                    {/* Question Number */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-theme-muted flex items-center justify-center text-theme-muted-foreground font-semibold mt-2">
                      {index + 1}
                    </div>

                    {/* Question Input */}
                    <textarea
                      value={question}
                      onChange={(e) => handleQuestionChange(index, e.target.value)}
                      className="flex-1 px-4 py-2 bg-theme-bg border border-theme-border rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-transparent resize-none min-h-[60px] text-theme-foreground placeholder:text-theme-muted-foreground"
                      placeholder="質問を入力してください"
                      rows={2}
                    />

                    {/* Delete Button */}
                    <button
                      onClick={() => handleRemoveQuestion(index)}
                      disabled={questions.length === 1}
                      className="flex-shrink-0 mt-2 p-2 text-theme-foreground-muted hover:text-theme-error transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
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
          <div className="bg-theme-muted rounded-xl p-6">
            <h3 className="font-semibold text-theme-foreground mb-2">💡 ヒント</h3>
            <ul className="text-sm text-theme-foreground-muted space-y-1">
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