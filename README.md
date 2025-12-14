# <img src="https://github.com/miyamoto-hai-lab/chat-ui/blob/main/docs/icon.jpg?raw=true" height="50" style="vertical-align: bottom;"> Chat UI &nbsp; (<b><u>日本語</u></b> | <a href="README_en.md">English</a>)
<p>
<img width="45%" alt="チャット画面" src="https://github.com/user-attachments/assets/98095304-9971-45c8-8562-03679db7506a" />
<img width="45%" alt="設定画面" src="https://github.com/user-attachments/assets/5bb2a856-3280-4e5f-9f26-442312221a7e" />
</p>
[![サンプルWebサイトをGitHub Pagesで公開中です](https://github.com/miyamoto-hai-lab/chat-ui/actions/workflows/nextjs.yml/badge.svg)](http://miyamoto-hai-lab.github.io/chat-ui/)

LLMなどの対話システムと対話するための、シンプルなフロントエンド・アプリケーションです。

接続先のAPIサーバーURL、APIキー、システムプロンプトをUI上から自由に設定できます。

`config.yml`ファイルを編集するだけで、以下のような多様なユースケースに合わせてアプリの動作をカスタマイズできます。

* クラウドソーシングでの対話実験用に、参加者共通のパスワードによる認証を必須にする。  
* 社内利用向けに、特定のAPIサーバーURLとシステムプロンプトで固定する。  
* デモ用に、会話のターン数に制限を設ける。

LLMの応答表示方法（ストリーミング、一括表示など）の選択や、会話履歴のエクスポート機能も備えており、静的ホスティング可能なアプリケーションのため、GitHub PagesやWebサーバーなど、任意のホスティング環境で動作します。

## **主な機能**

* **動的なUI設定:**  
  * 接続先の「APIサーバーURL」  
  * LLMの振ル舞いを定義する「システムプロンプト」  
  * 認証に必要な「APIキー」

これらすべてをWeb UIの設定画面から動的に変更できます。

* **設定の永続化:** 設定内容はブラウザの localStorage に安全に保存されるため、ユーザは毎回再入力する必要はありません。  
* **柔軟な応答表示:**  
  * LLMからの応答メッセージの表示方法を、ビルド時設定で以下の4種類から選択できます。  
    1. **逐次表示 (Streaming):** AIの応答をリアルタイムで表示します。  
    2. **スピナー:** 生成中はスピナーを表示し、完了後に一括表示します。  
    3. **既読マーク:** 生成中は「既読」のような静的なマークを表示し、完了後に一括表示します。  
    4. **即時表示:** 生成中のインジケータを一切表示せず、完了後に一括表示します。  
* **チャット履歴のエクスポート:** 現在の対話履歴をJSONファイルとして簡単にダウンロードできます。  
* **ビルド時カスタマイズ:**  
  * ビルド時の環境変数を設定することで、エンドユーザーに「APIサーバー設定を許可するか」「システムプロンプト設定を許可するか」といった機能のON/OFFを制御できます。  
  * 会話のターン数制限や、特定のURLへの離脱ボタンの設置など、ユースケースに応じたカスタマイズが可能です。  
* **静的ホスティング:** output: 'export' でビルド可能。PHPサーバーやGitHub Pagesなど、任意の静的ホスティング環境で動作します。  

## **使い方・デプロイ**

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

## **設定**
プロジェクトのルートディレクトリにある`config.yml`ファイルを編集することで、設定を変更できます。

### **基本仕様**

* **ファイル読み込み:** 値の先頭に `file::` を付けることで、指定したファイルの内容を値として読み込むことができます（例: `NEXT_PUBLIC_LLM_SYSTEM_PROMPT=file::prompts/system.txt`）。
* **真偽値:** `true`/`false` だけでなく、`yes`/`no`, `on`/`off`, `enable`/`disable` (大文字小文字区別なし) も使用可能です。

### **LLMの設定**

APIエンドポイントやモデル、APIキーなどを固定したい場合に使用します。
これらの値が設定されると、UI上の設定項目は非表示になり、ユーザーは変更できなくなります。
逆に、ユーザーに自由に設定させたい場合は、これらの変数を空（または未定義）にしてください。

| 変数名 | 説明 |
| :--- | :--- |
| `NEXT_PUBLIC_LLM_API_PROVIDER` | APIプロバイダー（`openai`, `gemini`, `anthropic`, `grok`, `deepseek`）。 |
| `NEXT_PUBLIC_LLM_API_ENDPOINT` | APIサーバーのURL（例: `https://api.openai.com/v1`）。 |
| `NEXT_PUBLIC_LLM_MODEL` | 使用するモデル名（例: `gpt-4o`）。 |
| `NEXT_PUBLIC_LLM_API_KEY` | APIキー。 |
| `NEXT_PUBLIC_LLM_SYSTEM_PROMPT` | システムプロンプト。改行コード(`\n`)も使用可能です。 |
| `NEXT_PUBLIC_LLM_SHOW_THINKING` | Thinking（思考プロセス）の表示設定。`true`で表示、`false`で非表示。設定するとUI上の切り替えスイッチが非表示になります。 |

### **機能の許可設定**

特定の機能の有効/無効を切り替えます。

| 変数名 | デフォルト | 説明 |
| :--- | :---: | :--- |
| `NEXT_PUBLIC_ALLOW_IMPORT` | `true` | 会話履歴のインポート機能を有効にするか。 |
| `NEXT_PUBLIC_ALLOW_EXPORT` | `true` | 会話履歴のエクスポート機能を有効にするか。 |

### **チャット動作の制御**

| 変数名 | デフォルト | 説明 |
| :--- | :---: | :--- |
| `NEXT_PUBLIC_STARTING_ROLE` | `assistant` | 最初の発言者。`user` または `assistant`。 |
| `NEXT_PUBLIC_MAX_CHAT_TURNS` | `0` | 最大会話ターン数。`0` で無制限。 |
| `NEXT_PUBLIC_ON_MAX_CHAT_TURNS` | `nothing` | 最大ターン数到達時の動作。<br>`exit`: チャットを終了し、指定URLへリダイレクト。<br>`message`: 終了メッセージを表示。<br>`nothing`: 入力を無効化するのみ。 |
| `NEXT_PUBLIC_ALLOW_USER_EXIT` | `always` | 「チャットを終了」ボタンの表示制御。<br>`always`: 常に表示。<br>`max`: 最大ターン数到達時のみ表示。<br>`never`: 表示しない。 |
| `NEXT_PUBLIC_DISPLAY_CHAT_TURNS` | `OFF` | ターン数の表示。<br>`OFF`: 表示しない。<br>`MAX`: `n / N` 形式。<br>任意の文字列: `n / 文字列` 形式。 |

### **レスポンス・表示設定**

| 変数名 | デフォルト | 説明 |
| :--- | :---: | :--- |
| `NEXT_PUBLIC_ASSISTANT_PROCESSING_STYLE` | `streaming` | 応答生成中の表示。<br>`streaming`: 逐次表示。<br>`spinner`: 完了までスピナーを表示。<br>`read`: 完了まで「既読」を表示。<br>`instant`: 何も表示せず完了後に一括表示。 |
| `NEXT_PUBLIC_ASSISTANT_RESPONSE_STYLE` | `bubble` | 応答メッセージのスタイル。<br>`bubble`: 吹き出し形式。<br>`flat`: フラット形式（将来の実装用）。 |

### **その他・実験用**

| 変数名 | デフォルト | 説明 |
| :--- | :---: | :--- |
| `NEXT_PUBLIC_AUTH_PASSWORD` | - | 設定すると、利用開始時にパスワード認証を要求します。 |
| `NEXT_PUBLIC_ENABLED_EVENTS` | - | ログ送信するイベント（カンマ区切り）。例: `KEY_INPUT,CHAT_MESSAGE` |
| `NEXT_PUBLIC_EVENT_ENDPOINT_URL` | - | イベントログの送信先URL。 |
| `NEXT_PUBLIC_APP_TITLE` | `Chat UI` | アプリのタイトル。 |
| `NEXT_PUBLIC_APP_DESCRIPTION` | - | アプリの説明文（HTML可）。 |
| `NEXT_PUBLIC_REDIRECT_URL_ON_EXIT` | - | 終了時にリダイレクトするURL。 |
| `NEXT_PUBLIC_EXPORT_FILENAME_STRATEGY` | `chat_{YYYYMMDDHHmmss}.json` | エクスポート時のファイル名形式。 |
| `NEXT_PUBLIC_ASSISTANT_DISPLAY_NAME` | `Assistant` | アシスタントの表示名。 |

