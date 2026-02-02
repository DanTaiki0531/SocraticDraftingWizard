import { BookOpen, Code, Lightbulb, Settings } from 'lucide-react';

interface HomePageProps {
  onSelectCategory: (category: 'academic' | 'technical' | 'custom') => void;
  onCustomize: () => void;
}

export function HomePage({ onSelectCategory, onCustomize }: HomePageProps) {
  const categories = [
    {
      id: 'academic' as const,
      icon: BookOpen,
      title: '学術論文',
      description: '構造化された学術的な質問で研究論文を分析'
    },
    {
      id: 'technical' as const,
      icon: Code,
      title: '技術書',
      description: '技術的な概念と方法論を分解して理解'
    },
    {
      id: 'custom' as const,
      icon: Lightbulb,
      title: 'カスタムノート',
      description: '柔軟な誘導質問であらゆるトピックを探求'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="py-6 px-8 border-b border-[#D4D1CC] bg-white">
        <h1 className="text-xl font-semibold text-[#2D2D2D]">Socratic Drafting Wizard</h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-8 py-16">
        <div className="max-w-5xl w-full">
          <h2 className="text-4xl font-bold text-center text-[#2D2D2D] mb-4">
            今日は何を探求しますか？
          </h2>
          <p className="text-center text-[#6B6560] mb-12 text-lg">
            カテゴリーを選んで構造的な探求を始めましょう
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => onSelectCategory(category.id)}
                className="bg-white rounded-2xl p-8 shadow-sm border border-[#D4D1CC] hover:shadow-md hover:border-[#8B8680] transition-all duration-200 text-left group"
              >
                <div className="w-14 h-14 rounded-xl bg-[#E8E6E3] flex items-center justify-center mb-4 group-hover:bg-[#8B8680] transition-colors">
                  <category.icon className="w-7 h-7 text-[#8B8680] group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-semibold text-[#2D2D2D] mb-2">
                  {category.title}
                </h3>
                <p className="text-[#6B6560] leading-relaxed">
                  {category.description}
                </p>
              </button>
            ))}
          </div>

          {/* Customize Button */}
          <div className="flex justify-center">
            <button
              onClick={onCustomize}
              className="flex items-center gap-3 px-8 py-4 bg-white border-2 border-[#8B8680] text-[#8B8680] rounded-xl hover:bg-[#8B8680] hover:text-white transition-all duration-200 font-medium shadow-sm hover:shadow-md"
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