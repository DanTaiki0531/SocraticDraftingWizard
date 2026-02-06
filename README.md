
# Socratic Drafting Wizard

思考を構造化し、学術論文や技術書の執筆、アイデア出しを支援する「ソクラテス式」対話型ドラフティングツールです。

## 概要

Socratic Drafting Wizard は、ユーザーに対して段階的に質問を投げかけることで、漠然とした思考を明確な文章や構成案へと導きます。
「学術論文」「技術書」といったプリセットの質問テンプレートに加え、ユーザーが独自の目的（カスタムノート）に合わせて質問セットを自由に作成・カスタマイズできる機能を提供します。

### 主な特徴

- **ソクラテス式対話インターフェース**: ステップバイステップの質問回答形式で、思考を深堀りします。
- **カテゴリ管理**: 用途に合わせたカテゴリ（質問セット）の作成、編集、並び替え、削除が可能です。
- **柔軟なカスタマイズ**:
  - ドラッグ＆ドロップによる質問の並び替え
  - カテゴリの並び替え（ドラッグ＆ドロップ）
  - タグによるカテゴリの分類・管理
- **タグ管理機能**: 色分けされたタグの作成、推奨タグのワンクリック追加。
- **ダークモード対応**: OS設定または手動切り替えによる、目に優しいダークテーマを完備。
- **レスポンシブデザイン**: PC/タブレット/スマートフォンでの利用を想定したUI。

## 技術スタック

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Animation**: Motion (Framer Motion)
- **Utilities**: @dnd-kit (Drag and Drop)

### Backend
- **Framework**: FastAPI (Python)
- **Server**: Uvicorn
- **Validation**: Pydantic

### Database
- **Platform**: Supabase (PostgreSQL)
- **Client**: Supabase Python Client

### Infrastructure
- **Containerization**: Docker, Docker Compose
- **Orchestration**: Make (Makefile provided for convenience)

## セットアップと実行方法

### 前提条件
- Docker および Docker Compose がインストールされていること
- Supabase プロジェクトが作成されており、API URL と Anon Key が取得済みであること

### 環境変数の設定

プロジェクトルートに `.env` ファイルを作成し、以下の情報を記述してください。

```env
# Backend & Frontend (shared)
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 起動方法

**Makefile を使用する場合 (推奨)**

```bash
# アプリケーションのビルドと起動
make up

# バックグラウンドで起動
make up-d

# 停止
make down

# ログの確認
make logs
```

**Docker Compose を直接使用する場合**

```bash
docker-compose up --build
```

### アクセス

起動後、ブラウザで以下のURLにアクセスしてください。

- **Frontend**: http://localhost:5173
- **Backend API Docs**: http://localhost:8000/docs