# Socratic Drafting Wizard - 実装詳細設計書

本ドキュメントでは、プロジェクトの実装フェーズに向けた、フロントエンドおよびバックエンドの詳細な技術仕様と API エンドポイントの定義について記述します。

## 1. フロントエンド実装詳細 (React + TypeScript)

「脳の疲労を考慮した UX」を実現するため、フロントエンドでは状態管理と対話型インターフェースの滑らかさを重視します。

### 1.1 テクノロジースタック
- **Framework**: React + TypeScript
- **Styling**: Tailwind CSS (CSS Variables によるテーマ管理、Dark Mode 対応)
- **Icons**: Lucide React
- **State Management**: React `useState` (App.tsx による集中管理)

### 1.2 コンポーネント構造

`App.tsx` を中心とした集中管理型ルーティングを採用しています。

- **App.tsx**: アプリケーションのルートコンポーネント。
    - 画面遷移 (`home` | `chat` | `loading` | `result` | `customize` | `edit-questions`) を管理。
    - 全体のデータ状態（メッセージ履歴、回答、選択中のカテゴリ、カスタム質問セット）を保持。
    - バックエンド通信のモックロジック（`generateMarkdown`）を内包（将来的に API コールへ置換予定）。

- **components/HomePage.tsx**:
    - カテゴリ選択（学術論文、技術書、カスタム）のエントリーポイント。
    - シンプルなカードレイアウトによるメニュー表示。

- **components/ChatInterface.tsx**:
    - **UI**: プログレスバー付きのチャット画面。
    - **スクロール制御**: `useRef` と `scrollIntoView` を使用し、メッセージ追加時に自動で最下部へスムーズスクロール。
    - **入力**: `textarea` の内容量に応じた自動高さ調整。

- **components/QuestionEditor.tsx**:
    - **機能**: 質問の追加・削除・並び替え・編集。
    - **DnD 実装**: 外部ライブラリを使用せず、HTML5 Native Drag and Drop API (`draggable`, `onDragStart`, `onDragOver`, `onDragEnd`) を使用して軽量に実装。
    - **UX**: ドラッグ中の要素の透明度変更、保存前の変更検知（`hasChanges`フラグ）。

- **components/ResultPreview.tsx**:
    - **Markdown表示**: 軽量化のため `react-markdown` 等のライブラリは使用せず、独自のシンプルなレンダリング関数を実装。
        - 対応記法: `#` (H1), `##` (H2), `*italic*`, `---` (水平線), 改行。
    - **コピー機能**: `navigator.clipboard` API を使用。非対応ブラウザ向けに `document.execCommand('copy')` のフォールバックを実装。
    - **表示モード**: レンダリング結果と Markdown ソースコードの並列表示。

### 1.3 状態管理 (State Management - App.tsx)

```typescript
// 主要な State 定義
const [currentScreen, setCurrentScreen] = useState<Screen>('home'); // 画面遷移
const [selectedCategory, setSelectedCategory] = useState<Category>(null); // 選択中カテゴリ
const [messages, setMessages] = useState<Message[]>([]); // チャット履歴
const [answers, setAnswers] = useState<string[]>([]); // ユーザーの回答リスト
const [customizedQuestionSets, setCustomizedQuestionSets] = useState({...}); // 質問テンプレート（初期値あり）
```

## 2. バックエンド実装詳細 (FastAPI) - [Planned]

バックエンドは、データの永続化（Supabase 連携）と、ロジックベースの Markdown 生成を担当します。

### 2.1 実装方針
- **Framework**: FastAPI
- **Database**: Supabase (PostgreSQL)
- **ORM/Client**: supabase-py

### 2.2 Pydantic モデル (データバリデーション)

```python
class ResponseItem(BaseModel):
    question_id: str
    text: str # 質問文
    answer: str # ユーザーの回答

class GenerateRequest(BaseModel):
    category_id: str
    answers: List[ResponseItem]

class QuestionBase(BaseModel):
    id: str
    text: str
    order_index: int

class TemplateUpdate(BaseModel):
    questions: List[QuestionBase]
```

### 2.3 Markdown 生成ロジック
AI (LLM) は使用せず、決定論的なテンプレート処理を行います。
1. **Fetch**: カテゴリ ID に基づくテンプレート構造を取得。
2. **Map**: ユーザーの回答を該当するセクションに埋め込む。
3. **Build**: テンプレート文字列として結合し、Markdown を生成。
4. **Log**: 生成結果を `generation_logs` テーブルに保存。

## 3. API エンドポイント定義

フロントエンドとバックエンドの統合に向けた通信仕様です。

### 3.1 テンプレート管理 API

#### `GET /api/templates`
- **概要**: 利用可能なカテゴリ（論文、技術書、カスタム）の一覧を取得します。
- **用途**: Home 画面の初期表示用。

#### `GET /api/templates/{category_id}`
- **概要**: 指定したカテゴリに設定されている質問のリストを、表示順（order）を含めて取得します。
- **用途**: チャット開始時の質問セット読み込み、カスタマイズ画面での初期表示。

#### `PUT /api/templates/{category_id}`
- **概要**: 質問の追加・削除・並び替え結果を保存します。
- **Request Body**:
  ```json
  {
    "questions": [
      { "id": "uuid-1", "text": "この論文の核心は？", "order_index": 0 },
      { "id": "uuid-2", "text": "手法は？", "order_index": 1 }
    ]
  }
  ```

### 3.2 生成ロジック API

#### `POST /api/generate`
- **概要**: チャット完了時に全ての回答を送信し、整形された Markdown 文字列を受け取ります。
- **Request Body**:
  ```json
  {
    "category_id": "academic",
    "answers": [
      { "question_id": "uuid-1", "answer": "トランスフォーマー構造の最適化です。" },
      { "question_id": "uuid-2", "answer": "アテンション機構を用いました。" }
    ]
  }
  ```
- **Response**:
  ```json
  {
    "markdown": "# 学術論文の分析\n\n## この論文の核心は？\n\nトランスフォーマー構造の最適化です。\n...",
    "log_id": "log_uuid_12345"
  }
  ```

## 4. データベース連携 (Supabase)

### テーブル設計 (予定)

- **templates**: カテゴリごとの基本情報を格納。
- **questions**: 各テンプレートに紐づく質問項目。`order_index` で順序を管理。
- **generation_logs**: ユーザーが生成した履歴（分析結果）を保存。

## 5. 今後の実装ステップ

1.  **バックエンド構築**:
    - [ ] FastAPI プロジェクトのセットアップ
    - [ ] Supabase プロジェクト作成とテーブル定義
    - [ ] API エンドポイントの実装
2.  **フロントエンド統合**:
    - [ ] `App.tsx` 内のモックロジック (`customizedQuestionSets`, `generateMarkdown`) を API コールに置換
    - [ ] API クライアントの作成 (`src/api/client.ts` 等)
    - [ ] エラーハンドリングとローディング表示の連携