<h1><img src="https://github.com/kei-mag/human-chat-completions/blob/main/docs/icon.jpg?raw=true" height="50" style="vertical-align: bottom;"> Chat UI <div style="text-align: right;">(<b><u>日本語</u><b> | <a href="README_en.md">English</a>)</div></h1>

LLMなどの対話システムと対話するための、シンプルなフロントエンド・アプリケーションです。

接続先のAPIサーバーURL、APIキー、システムプロンプトをUI上から自由に設定できます。

ビルド時の環境変数を設定するだけで、以下のような多様なユースケースに合わせてアプリの動作をカスタマイズできます。

* クラウドソーシングでの対話実験用に、参加者共通のパスワードによる認証を必須にする。  
* 社内利用向けに、特定のAPIサーバーURLとシステムプロンプトで固定する。  
* デモ用に、会話のターン数に制限を設ける。

LLMの応答表示方法（ストリーミング、一括表示など）の選択や、会話履歴のエクスポート機能も備えており、静的ホスティング（PHPサーバーなど）からVercelでのホスティングまで、柔軟なデプロイが可能です。

## **主な機能 (Features)**

* **動的なUI設定:**  
  * 接続先の「APIサーバーURL」  
  * LLMの振ル舞いを定義する「システムプロンプト」  
  * 認証に必要な「APIキー」

これらすべてをWeb UIの設定画面から動的に変更できます。

* **設定の永続化:** 設定内容はブラウザの localStorage に安全に保存されるため、毎回再入力する必要はありません。  
* **柔軟な応答表示:**  
  * LLMからの応答メッセージの表示方法を、ビルド時設定（NEXT_PUBLIC_ASSISTANT_RESPONSE_MODE）で以下の4種類から選択できます。  
    1. **逐次表示 (Streaming):** AIの応答をリアルタイムで表示します。  
    2. **スピナー:** 生成中はスピナーを表示し、完了後に一括表示します。  
    3. **既読マーク:** 生成中は「既読」のような静的なマークを表示し、完了後に一括表示します。  
    4. **即時表示:** 生成中のインジケータを一切表示せず、完了後に一括表示します。  
* **履歴のエクスポート:** 現在の対話履歴をJSONファイルとして簡単にダウンロードできます。  
* **ビルド時カスタマイズ:**  
  * ビルド時の環境変数を設定することで、エンドユーザーに「APIサーバー設定を許可するか」「システムプロンプト設定を許可するか」といった機能のON/OFFを制御できます。  
  * 会話のターン数制限や、特定のURLへの離脱ボタンの設置など、ユースケースに応じたカスタマイズが可能です。  
* **柔軟なデプロイ:**  
  * **静的ホスティング:** output: 'export' でビルド可能。PHPサーバーやGitHub Pagesなど、任意の静的ホスティング環境で動作します。  
  * **ハイブリッド:** VercelやNetlifyなど、Next.jsに対応したプラットフォームにもデプロイ可能です。

## **技術スタック (Tech Stack)**

このプロジェクトは、以下のモダンなフロントエンド技術で構築されています。

* **Framework:** [Next.js](https://nextjs.org/) (App Router)  
* **UI Library:** [React](https://react.dev/)  
* **UI Components:** [shadcn/ui](https://ui.shadcn.com/)  
* **LLM UI/State:** [Vercel AI SDK](https://sdk.vercel.ai/) (useChat フック)  
* **Compiler:** [React Compiler](https://react.dev/learn/react-compiler) (Experimental)  
* **Build Tool:** [Turbopack](https://turbo.build/pack)  
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)  
* **Linter / Formatter:** [Biome](https://biomejs.dev/)

## **使い方・デプロイ (Usage & Deployment)**

デプロイ方法は、環境に応じて2つのオプションがあります。

### **オプション1: 静的ホスティング (PHPサーバー, GitHub Pagesなど)**

Node.jsサーバーが使えない環境向けの標準的な方法です。

1. next.config.mjs の設定:  
   output: 'export' を追記します。  
   ```typescript
   /\*\* @type {import('next').NextConfig} \*/  
   const nextConfig \= {  
     output: 'export', // この行を追加  
   };  
   export default nextConfig;
   ```

2. ビルド:  
   必要に応じて、以下の「ビルド時カスタマイズ」で説明する環境変数を設定した上で、ビルドコマンドを実行します。  
   ```shell
   # 依存関係をインストール  
   pnpm install

   # 静的ファイルをビルド  
   pnpm build
   ```

   ビルドが完了すると、out/ ディレクトリが生成されます。  
3. デプロイ:  
   out/ ディレクトリの中身すべてを、Webサーバーの公開ディレクトリ（public_html や www など）にアップロードします。

### **オプション2: Next.js ホスティング (Vercel, Netlifyなど)**

Vercelなどのプラットフォームにデプロイする場合、output: 'export' の設定は不要です。環境変数の設定は、各プラットフォームのダッシュボードから行います。

1. リポジトリをGitHubにプッシュします。  
2. VercelやNetlifyのダッシュボードから、そのリポジトリをインポートしてデプロイします。

## **ビルド時カスタマイズ (環境変数)**

.env.local ファイルを作成するか、ビルドコマンドの実行時に環境変数を指定することで、アプリの機能を制御できます。

### **UI設定の制御**

| 変数名 | デフォルト | 説明 |
| :---- | :----: | :---- |
| NEXT_PUBLIC_ALLOW_USER_API_SERVER | `"true"` | false にすると、APIサーバーURLおよびAPIキーの設定UIを非表示にします。 |
| NEXT_PUBLIC_ALLOW_USER_SYSTEM_PROMPT | `"true"` | false にすると、システムプロンプトの設定UIを非表示にします。 |
| NEXT_PUBLIC_ALLOW_EXPORT | `"true"` | false にすると、会話履歴のエクスポートボタンを非表示にします。 |
| NEXT_PUBLIC_ALLOW_USER_SHOW_THINKING | `"true"` | false にすると、ユーザーがUI上で「Thinking（中間ステップ）を表示する」設定を変更するUI（チェックボックス等）を非表示にします。 |

### **デフォルト値と固定値**

| 変数名 | デフォルト | 説明 |
| :---- | :----: | :---- |
| NEXT_PUBLIC_DEFAULT_API_SERVER | `""` | ALLOW_USER_API_SERVER=false の時に使用される固定APIサーバーURL。 |
| NEXT_PUBLIC_DEFAULT_API_KEY | `""` | ALLOW_USER_API_SERVER=false の時に使用される固定APIキー。 |
| NEXT_PUBLIC_SYSTEM_PROMPT | `""` | デフォルトのシステムプロンプト。ALLOW_USER_SYSTEM_PROMPT=false の場合は固定値として、true の場合はユーザーが変更可能な初期値として使われます。 |

### **チャット動作の制御**

| 変数名 | デフォルト | 説明 |
| :---- | :----: | :---- |
| NEXT_PUBLIC_STARTING_ROLE | `"assistant"` | チャットの最初の発言者。"user"（ユーザーが最初に入力する）または "assistant"（AIが最初の発話を行う）を指定。 |
| NEXT_PUBLIC_MAX_CHAT_TURNS | `0` | 最大会話ターン数（ユーザーとアシスタントの往復）。0 は無制限。この値に達すると入力不可になります。 |
| NEXT_PUBLIC_DISPLAY_CHAT_TURNS | `"OFF"` | チャットターン数の表示方法。 **"OFF"**: ターン数を表示しない。 **"MAX"**: n / N 形式で表示 (N は MAX_CHAT_TURNS の値)。N=0 の場合は n のみ表示。 **{Any String}**: n / {指定文字列} 形式で表示（例: NEXT_PUBLIC_DISPLAY_CHAT_TURNS="目安10回"）。 |
| NEXT_PUBLIC_ASSISTANT_RESPONSE_MODE | `"streaming"` | アシスタント（LLM）の応答メッセージの表示方法。 **"streaming"**: 逐次表示（デフォルト）。 **"spinner"**: 生成中はローディングスピナーを表示し、完了後に一括表示。 **"read"**: スピナー等は表示せず、「既読」のような静的なマークを表示し、完了後に一括表示。 **"instant"**: 生成中のインジケータを一切表示せず、完了後に一括表示。 |

### 研究・実験用設定
| 変数名 | デフォルト | 説明 |
| :---- | :----: | :---- |
| NEXT_PUBLIC_ENABLE_PASSWORD_AUTH | `false` | `true` にすると、UI利用前に簡易的なパスワード入力を要求します。入力されたパスワードは `chatui-password: <パスワード>` ヘッダーとしてAPIサーバーに送信されます。
| NEXT_PUBLIC_ENABLED_EVENTS | `""` | ログとして送信するイベントをカンマ区切りで指定します（例: "KEY_INPUT,CHAT_MESSAGE"）。デフォルトは空（何も送信しない）。<br>- **"KEY_INPUT"**: 入力欄の状態が変化するたび（onChange）に、その内容とタイムスタンプを送信します。<br>- **"CHAT_MESSAGE"**: ユーザーまたはアシスタントがメッセージを送信した際に、その内容とタイムスタンプを送信します。
| NEXT_PUBLIC_EVENT_ENDPOINT_URL | `""` | NEXT_PUBLIC_ENABLED_EVENTS で指定されたイベントデータの送信先となるAPIエンドポイントのURL。

### UI・その他

| 変数名 | デフォルト | 説明 |
| :---- | :----: | :---- |
| NEXT_PUBLIC_APP_TITLE | `"Chat UI"` | アプリのヘッダーやブラウザのタブに表示されるタイトル。 |
| NEXT_PUBLIC_APP_DESCRIPTION | `""` | アプリのチャットUI上部（ヘッダー直下など）に表示される説明文。**HTMLタグが利用可能**です。（例: `"\<h1\>会話のシチュエーション\</h1\>\<p\>ユーザはassistantと3年間友達のように毎日話してきた。"`） |
| NEXT_PUBLIC_REDIRECT_URL_ON_EXIT | `""` | URL（例: https://example.com）を指定すると、そのURLへの「終了」ボタンがヘッダーなどに表示されます。空の場合は非表示。 |
| NEXT_PUBLIC_EXPORT_FILENAME_STRATEGY | `"chat_{YYYYMMDDHHmmss}.json"` | 会話エクスポート時のJSONファイル名。<br>**プレースホルダ:**<br>{YYYYMMDDHHmmss}: 現在のタイムスタンプ<br>{FIRST_PROMPT}: 最初のユーザープロンプト（先頭30文字） |
| NEXT_PUBLIC_ASSISTANT_DISPLAY_NAME | `"Assistant"` | チャットUI上でアシスタント（LLM）の発言者として表示される名前。 |

