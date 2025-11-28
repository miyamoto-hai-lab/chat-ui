## 1. プロジェクト概要

- **目的**: 設定可能なLLMチャットフロントエンドの構築。  
- **特徴**: ユーザーがAPIサーバーURL、システムプロンプト、APIキーをUIから設定可能。設定は localStorage に永続化される。ビルド時の環境変数により、これらの設定UIの表示/非表示を切り替え可能。([README.md](README_ja.md)参照)
- **デプロイ**: 静的サイト生成（SSG）に完全対応。LAMP環境（PHPサーバー、共有ホスティング）でもホスティング可能。

## 2. コア技術スタック

- **フレームワーク**: Next.js (App Router, TypeScript有効)  
- **UIライブラリ**: React (React Compiler を有効化)  
- **状態管理 (LLM)**: Vercel AI SDK (ai/react) の useChat フックを使用する。  
- **状態管理 (設定)**: React Context + localStorage  
- **UIコンポーネント**: shadcn/ui を全面的に採用する。インストール必須コンポーネント: button, input, textarea, dialog, scroll-area, toast, label, select, switch, card。  
- **多言語対応**: react-i18next (クライアント側での言語切り替え、ブラウザ言語検出)
- **アイコン**: lucide-react
- **ビルドツール**: Turbopack  
- **リンター/フォーマッター**: Biome

## 3. アーキテクチャ設計（静的エクスポート対応）

### 3.1 静的サイト生成の制約と対応

Next.jsの`output: 'export'`モードでは以下の機能が使えない：
- API Routes（`/api/*`）
- サーバーサイドレンダリング（SSR）
- サーバーアクション

**対応方針**:
- すべてのページコンポーネントに`'use client'`を使用
- フロントエンドから直接ユーザー設定のAPIサーバーへ接続
- Vercel AI SDKのuseChatにカスタムフェッチ関数を設定
- localStorage を積極的に活用

### 3.2 APIリクエスト設計

#### チャット用APIリクエスト
**エンドポイント**: ユーザーが設定したURL（例: `https://api.openai.com/v1/chat/completions`）

**リクエスト**:
```http
POST {ユーザー設定のURL}
Content-Type: application/json
Authorization: Bearer {ユーザー設定のAPIキー}
chatui-password: {パスワード認証有効時}

{
  "model": "gpt-4",
  "messages": [
    {"role": "system", "content": "システムプロンプト"},
    {"role": "user", "content": "ユーザーメッセージ"}
  ],
  "stream": true
}
```

**想定される接続先**:
- OpenAI API
- Azure OpenAI
- ローカルLLM (Ollama, LM Studio等)
- カスタムLLM API

**重要**: 接続先APIサーバーがCORSを許可している必要がある。

#### イベントロギング用APIリクエスト（オプション）
**エンドポイント**: `NEXT_PUBLIC_EVENT_ENDPOINT_URL`

**イベント種類**:
- `KEY_INPUT`: 入力欄の変更時
- `CHAT_MESSAGE`: メッセージ送信時

### 3.3 多言語対応（react-i18next）

- クライアント側で言語切り替え
- ブラウザの言語設定を自動検出（i18next-browser-languagedetector）
- localStorage にユーザーの言語選択を保存
- 単一のHTMLファイル（`index.html`）のみ生成（LAMP環境に最適）

## 4. ディレクトリ構造と主要ファイル

```
src/
├── app/
│   ├── layout.tsx           # ルートレイアウト（'use client'、プロバイダー配置）
│   ├── page.tsx             # メインチャット画面（'use client'）
│   └── globals.css
├── components/
│   ├── chat/
│   │   ├── ChatContainer.tsx    # メインのチャットコンテナ
│   │   ├── ChatMessage.tsx      # メッセージ表示
│   │   ├── ChatInput.tsx        # 入力フォーム
│   │   ├── ChatHeader.tsx       # ヘッダー
│   │   └── ChatTurnCounter.tsx  # ターン数表示
│   ├── settings/
│   │   ├── SettingsDialog.tsx   # 設定ダイアログ
│   │   └── PasswordDialog.tsx   # パスワード入力
│   ├── providers/
│   │   ├── I18nProvider.tsx     # 多言語対応プロバイダー
│   │   └── SettingsProvider.tsx # 設定管理プロバイダー
│   └── ui/                      # shadcn/uiコンポーネント
├── lib/
│   ├── env.ts                   # 環境変数の型定義と検証（zod使用）
│   ├── storage.ts               # localStorage操作
│   ├── chat-client.ts           # カスタムチャットクライアント
│   ├── event-logger.ts          # イベントロギング
│   └── export.ts                # エクスポート機能
├── hooks/
│   ├── use-chat-config.ts       # チャット設定フック
│   ├── use-settings.ts          # 設定管理フック
│   └── use-password-auth.ts     # パスワード認証フック
├── types/
│   └── chat.ts                  # 型定義
└── locales/
    ├── en/
    │   └── translation.json
    └── ja/
        └── translation.json
```

## 5. 実装ガイドライン

### 5.1. 環境変数システム（lib/env.ts）

- zodを使用してすべての`NEXT_PUBLIC_*`変数を検証
- 型安全な環境変数アクセスを提供
- ビルド時とランタイムの両方で検証

### 5.2. 設定管理（SettingsProvider.tsx）

- React Context + localStorage
- 管理する設定:
  - `apiServerUrl`: APIサーバーURL
  - `apiKey`: APIキー
  - `systemPrompt`: システムプロンプト
  - `showThinking`: Thinking表示設定
  - `language`: 言語設定

### 5.3. チャット機能（ChatContainer.tsx）

```typescript
import { useChat } from 'ai/react';

const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
  api: settings.apiServerUrl,  // ユーザー設定のURL
  headers: {
    'Authorization': `Bearer ${settings.apiKey}`,
    'chatui-password': password,  // パスワード認証時
  },
  body: {
    systemPrompt: settings.systemPrompt,
  },
  streamMode: responseMode === 'streaming' ? 'text' : undefined,
});
```

### 5.4. 応答表示モード

- **streaming**: リアルタイム逐次表示（デフォルト）
- **spinner**: ローディングスピナー + 完了後一括表示
- **read**: 既読マーク + 完了後一括表示
- **instant**: インジケータなし、完了後一括表示

### 5.5. ターン数制御

```typescript
const maxTurns = parseInt(process.env.NEXT_PUBLIC_MAX_CHAT_TURNS || "0", 10);
const currentTurns = Math.floor(messages.filter(m => m.role !== 'system').length / 2);
const isLimitReached = maxTurns > 0 && currentTurns >= maxTurns;
```

### 5.6. 多言語対応（I18nProvider.tsx）

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslation },
      ja: { translation: jaTranslation },
    },
    fallbackLng: 'ja',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });
```

### 5.7. エクスポート機能

- 会話履歴をJSON形式でダウンロード
- ファイル名は`NEXT_PUBLIC_EXPORT_FILENAME_STRATEGY`に従う
- プレースホルダ: `{YYYYMMDDHHmmss}`, `{FIRST_PROMPT}`

### 5.8. イベントロギング

```typescript
const logEvent = async (eventType: string, data: any) => {
  if (!enabledEvents.includes(eventType)) return;
  
  await fetch(eventEndpointUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventType,
      timestamp: new Date().toISOString(),
      data,
    }),
  });
};
```

## 6. ビルドとデプロイ

### 6.1. next.config.ts設定

```typescript
const nextConfig: NextConfig = {
  output: 'export',          // 静的エクスポート
  reactCompiler: true,
  trailingSlash: true,       // LAMP環境での互換性
  images: {
    unoptimized: true,       // 画像最適化を無効化
  },
};
```

### 6.2. ビルドコマンド

```bash
pnpm install
pnpm build
```

ビルド成果物は`out/`ディレクトリに生成される。

### 6.3. LAMP環境へのデプロイ

1. `out/`ディレクトリの内容をすべて`public_html/`にアップロード
2. オプション: `.htaccess`でSPAルーティングを設定

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [L]
```

## 7. 開発時の注意事項

- すべてのページコンポーネントに`'use client'`を使用
- 環境変数は`NEXT_PUBLIC_*`のみ使用可能
- localStorage操作はクライアント側でのみ実行
- CORSの考慮が必須（接続先APIサーバー側で設定）
- ビルド前に静的エクスポートの制約を確認
