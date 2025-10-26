## 1. プロジェクト概要

- **目的**: 設定可能なLLMチャットフロントエンドの構築。  
- **特徴**: ユーザーがAPIサーバーURL、システムプロンプト、APIキーをUIから設定可能。設定は localStorage に永続化される。ビルド時の環境変数により、これらの設定UIの表示/非表示を切り替え可能。([README.md](README_ja.md)参照)

## 2\. コア技術スタック

- **フレームワーク**: Next.js (App Router, TypeScript有効)  
- **UIライブラリ**: React (React Compiler を有効化)  
- **状態管理 (LLM)**: Vercel AI SDK (ai/react) の useChat フックを使用する。  
- **状態管理 (設定)**: React Context \+ localStorage  
- **UIコンポーネント**: shadcn/ui を全面的に採用する。インストール必須コンポーネント: button, input, textarea, dialog, scroll-area, sonner (トースト通知用), lucide-react (アイコン用)。  
- **ビルドツール**: Turbopack  
- **リンター/フォーマッター**: Biome

## **3\. ディレクトリ構造と主要ファイル**

.  
├── app/  
│   ├── layout.js       # ルートレイアウト (ThemeProvider, SettingsProvider を配置)  
│   └── page.js         # メインのチャットページ (Chatコンポーネントを呼び出す)  
├── components/  
│   ├── chat.js         # メインのチャットUI (useChat フックのロジックを実装)  
│   ├── chat-layout.js  # ヘッダーやフッターを含むチャット画面のレイアウト  
│   ├── header.js       # アプリヘッダー (設定ボタン, 終了ボタンを配置)  
│   ├── settings-modal.js # 設定用ダイアログ (shadcn/ui Dialog を使用)  
│   └── ui/             # shadcn/ui が生成するコンポーネント  
├── contexts/  
│   └── SettingsContext.js # 設定用の React Context  
├── lib/  
│   └── utils.js        # shadcn/ui 用のユーティリティ (cn 関数)  
├── .env.local          # 開発用の環境変数  
├── next.config.mjs  
└── package.json

## **4 実装ガイドライン**

### **4.1. 設定管理 (SettingsContext.js)**

- 'use client' ディレクティブを使用する。  
- createContext で SettingsContext を作成する。  
- localStorage のキー名として chatUiSettings を使用する。  
- 管理する状態オブジェクト settings のデフォルト値:  
  {  
    apiServerUrl: '',  
    systemPrompt: '',  
    apiKey: ''  
  }

- SettingsProvider コンポーネントを作成する。  
  - useEffect (空の依存配列 `[]`) で、コンポーネントのマウント時に localStorage.getItem から設定を読み込み、setSettings で復元する。  
  - useEffect (依存配列 `[settings]`) で、settings ステートが変更されるたびに localStorage.setItem でJSON文字列化して保存する。  
- useSettings カスタムフックを提供する。  
- app/layout.js で SettingsProvider を ThemeProvider の内側に配置し、children をラップする。

### **4.2. 環境変数による機能切り替え**

* コンポーネント内で process.env.変数名 を使って値を取得する。  
* **components/settings-modal.js**:  
  * const allowApiServerConfig \= process.env.NEXT_PUBLIC_ALLOW_USER_API_SERVER === 'true';  
  * const allowSystemPromptConfig \= process.env.NEXT_PUBLIC_ALLOW_USER_SYSTEM_PROMPT \=== 'true';  
  * {allowApiServerConfig && \<Input ... /\>} のように、対応するUIを条件付きで描画する。  
  * APIキーの入力欄は常に表示する。  
* **components/header.js**:  
  * const redirectUrl \= process.env.NEXT_PUBLIC_REDIRECT_URL_ON_EXIT;  
  * {redirectUrl && \<Link href={redirectUrl}\>\<Button\>終了\</Button\>\</Link\>} のように、URLが空でない場合のみ終了ボタンを描画する。  
* .env.local には開発用のデフォルト値（すべて true、MAX_CHAT_TURNS=0 など）を定義しておく。

### **4.3. メインチャットUI (chat.js)**

* 'use client' ディレクティブを使用する。  
* useSettings() フックから settings を取得する。  
* useChat フックを初期化する。  
  import { useChat } from 'ai/react';  
  import { useSettings } from '@/contexts/SettingsContext';

  // ...  
  const { settings } \= useSettings();  
  const { messages, input, handleInputChange, handleSubmit, isLoading }_ \= useChat({  
    // Vercel AI SDKが \`body\` をJSONとして扱うため、  
    // APIサーバーURLが \`/api/chat\` のような相対パスの場合のみ機能する。  
    // もしユーザーが外部URLを指定する場合、この \`api\` オプションは使えない可能性がある。  
    //  
    // \*\*重要\*\*: Vercel AI SDK の \`api\` オプションは、Next.jsのAPI Routesを前提としている。  
    // 外部APIを直接叩く場合、\`handleSubmit\` をオーバーライドして自前で \`fetch\` を実装する必要がある。  
    //  
    // \*\*実装方針\*\*: \`handleSubmit\` をカスタムする。  
    // 1\. \`useChat\` の \`handleSubmit\` は使わない。  
    // 2\. フォームの \`onSubmit\` で自前の \`handleSubmit\` 関数を呼ぶ。  
    // 3\. その中で \`fetch(settings.apiServerUrl, ...)\` を実行する。  
    //    \- \`headers\`: { 'Authorization': \`Bearer ${settings.apiKey}\` }  
    //    \- \`body\`: JSON.stringify({ messages, systemPrompt: settings.systemPrompt })  
    //    \- ストリーミングレスポンス (\`ReadableStream\`) を処理し、\`setMessages\` で手動で履歴を更新する。  
    //  
    // \*\*修正\*\*: 簡潔化のため、Vercel AI SDKの標準動作に合わせる。  
    // APIサーバーはVercel AI SDKの形式（入力: \`{ "messages": \[...\] }\`）に準拠していると仮定する。  
    // ただし、\`api\` オプションが外部URLを扱えるか要検証。  
    // \-\> Vercel AI SDK v3 は \`api\` に外部URLを指定可能。

    api: settings.apiServerUrl,  
    headers: {  
      'Authorization': \`Bearer ${settings.apiKey}\`  
    },  
    // Vercel AI SDK は \`body\` を使って追加情報を送れる  
    body: {  
      systemPrompt: settings.systemPrompt  
    },  
    // エラーハンドリング  
    onError: (error) \=\> {  
      // \`sonner\` を使ってトースト表示  
      // toast.error(\`エラーが発生しました: ${error.message}\`);  
    }  
  });

* **会話ターン数制限**:  
  * const maxTurns \= parseInt(process.env.NEXT_PUBLIC_MAX_CHAT_TURNS || "0", 10);  
  * const isInputDisabled \= isLoading || (maxTurns \> 0 && messages.length \>= maxTurns \* 2); (ユーザーとアシスタントのペアで2)  
  * Input と Button の disabled 属性に isInputDisabled を渡す。  
* **UI**:  
  * チャット履歴は shadcn/ui の ScrollArea を使用して表示する。  
  * メッセージは role \=== 'user' か role \=== 'assistant' で分岐してスタイルを変更する。

### **4.4. 履歴のエクスポート**

* messages（useChat から取得）を JSON.stringify する。  
* Blob を作成し、URL.createObjectURL を使ってダウンロードリンク (\<a\> タグ) を動的に生成し、クリックさせる。