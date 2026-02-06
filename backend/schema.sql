-- Socratic Drafting Wizard - Database Schema
-- Run this in Supabase SQL Editor

-- Templates table: stores category information
CREATE TABLE IF NOT EXISTS templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Questions table: stores questions for each template
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generation logs table: stores generated markdown results
CREATE TABLE IF NOT EXISTS generation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id TEXT NOT NULL,
    markdown TEXT NOT NULL,
    answers JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default templates
INSERT INTO templates (category_id, name, description) VALUES
    ('academic', '学術論文', '研究論文を分析するための質問セット'),
    ('technical', '技術書', '技術的な概念を理解するための質問セット'),
    ('custom', 'カスタムノート', '自由な探求のための質問セット')
ON CONFLICT (category_id) DO NOTHING;

-- Insert default questions for academic template
INSERT INTO questions (template_id, text, order_index)
SELECT id, '論文が取り組んでいる核心的な問題は何ですか？', 0 FROM templates WHERE category_id = 'academic'
ON CONFLICT DO NOTHING;
INSERT INTO questions (template_id, text, order_index)
SELECT id, '主な仮説または研究課題は何ですか？', 1 FROM templates WHERE category_id = 'academic'
ON CONFLICT DO NOTHING;
INSERT INTO questions (template_id, text, order_index)
SELECT id, 'この研究で使用された方法論は何ですか？', 2 FROM templates WHERE category_id = 'academic'
ON CONFLICT DO NOTHING;
INSERT INTO questions (template_id, text, order_index)
SELECT id, '主要な発見や結果は何ですか？', 3 FROM templates WHERE category_id = 'academic'
ON CONFLICT DO NOTHING;
INSERT INTO questions (template_id, text, order_index)
SELECT id, 'その意義と限界は何ですか？', 4 FROM templates WHERE category_id = 'academic'
ON CONFLICT DO NOTHING;
INSERT INTO questions (template_id, text, order_index)
SELECT id, '既存の文献とどのように関連していますか？', 5 FROM templates WHERE category_id = 'academic'
ON CONFLICT DO NOTHING;

-- Insert default questions for technical template
INSERT INTO questions (template_id, text, order_index)
SELECT id, '説明されている主なトピックや技術は何ですか？', 0 FROM templates WHERE category_id = 'technical'
ON CONFLICT DO NOTHING;
INSERT INTO questions (template_id, text, order_index)
SELECT id, 'この技術はどのような問題を解決しますか？', 1 FROM templates WHERE category_id = 'technical'
ON CONFLICT DO NOTHING;
INSERT INTO questions (template_id, text, order_index)
SELECT id, '基本的にどのように機能しますか？', 2 FROM templates WHERE category_id = 'technical'
ON CONFLICT DO NOTHING;
INSERT INTO questions (template_id, text, order_index)
SELECT id, '重要な概念やコンポーネントは何ですか？', 3 FROM templates WHERE category_id = 'technical'
ON CONFLICT DO NOTHING;
INSERT INTO questions (template_id, text, order_index)
SELECT id, '実用的な応用例やユースケースは何ですか？', 4 FROM templates WHERE category_id = 'technical'
ON CONFLICT DO NOTHING;
INSERT INTO questions (template_id, text, order_index)
SELECT id, 'その利点とトレードオフは何ですか？', 5 FROM templates WHERE category_id = 'technical'
ON CONFLICT DO NOTHING;

-- Insert default questions for custom template
INSERT INTO questions (template_id, text, order_index)
SELECT id, '探求したい主な主題は何ですか？', 0 FROM templates WHERE category_id = 'custom'
ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_questions_template_id ON questions(template_id);
CREATE INDEX IF NOT EXISTS idx_questions_order ON questions(order_index);
CREATE INDEX IF NOT EXISTS idx_generation_logs_category ON generation_logs(category_id);

-- Tags table: stores available tags for drafts
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    color TEXT DEFAULT '#8B8680',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Draft tags junction table: many-to-many relationship between drafts and tags
CREATE TABLE IF NOT EXISTS draft_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    draft_id UUID REFERENCES generation_logs(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(draft_id, tag_id)
);

-- Insert default tags
INSERT INTO tags (name, color) VALUES
    ('重要', '#ef4444'),
    ('復習', '#f59e0b'),
    ('完了', '#22c55e'),
    ('進行中', '#3b82f6'),
    ('アイデア', '#a855f7'),
    ('参考資料', '#6b7280')
ON CONFLICT (name) DO NOTHING;

-- Create indexes for tags
CREATE INDEX IF NOT EXISTS idx_draft_tags_draft_id ON draft_tags(draft_id);
CREATE INDEX IF NOT EXISTS idx_draft_tags_tag_id ON draft_tags(tag_id);

-- Category tags junction table: associate tags with categories
CREATE TABLE IF NOT EXISTS category_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id TEXT NOT NULL,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(category_id, tag_id)
);

-- Create index for category_tags
CREATE INDEX IF NOT EXISTS idx_category_tags_category_id ON category_tags(category_id);
CREATE INDEX IF NOT EXISTS idx_category_tags_tag_id ON category_tags(tag_id);
